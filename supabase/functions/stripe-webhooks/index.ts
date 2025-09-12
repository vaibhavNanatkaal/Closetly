// Add Deno type declarations at the top
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
};

serve(async (req) => {
    if (req?.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client
        const supabaseUrl = Deno?.env?.get('SUPABASE_URL');
        const supabaseKey = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Create Stripe client
        const stripeKey = Deno?.env?.get('STRIPE_SECRET_KEY');
        const webhookSecret = Deno?.env?.get('STRIPE_WEBHOOK_SECRET');
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
        });

        if (req?.method === 'POST') {
            const body = await req?.text();
            const signature = req?.headers?.get('stripe-signature');

            let event;
            try {
                event = stripe?.webhooks?.constructEvent(body, signature, webhookSecret);
            } catch (err) {
                console.error('Webhook signature verification failed:', err?.message);
                return new Response('Webhook signature verification failed', { status: 400 });
            }

            console.log('Processing webhook event:', event?.type);

            switch (event?.type) {
                case 'checkout.session.completed': {
                    const session = event?.data?.object;
                    await handleCheckoutCompleted(supabase, stripe, session);
                    break;
                }
                
                case 'customer.subscription.created': {
                    const subscription = event?.data?.object;
                    await handleSubscriptionCreated(supabase, subscription);
                    break;
                }

                case 'customer.subscription.updated': {
                    const subscription = event?.data?.object;
                    await handleSubscriptionUpdated(supabase, subscription);
                    break;
                }

                case 'customer.subscription.deleted': {
                    const subscription = event?.data?.object;
                    await handleSubscriptionDeleted(supabase, subscription);
                    break;
                }

                case 'invoice.payment_succeeded': {
                    const invoice = event?.data?.object;
                    await handlePaymentSucceeded(supabase, invoice);
                    break;
                }

                case 'invoice.payment_failed': {
                    const invoice = event?.data?.object;
                    await handlePaymentFailed(supabase, invoice);
                    break;
                }

                default:
                    console.log(`Unhandled event type: ${event?.type}`);
            }

            return new Response('Webhook processed successfully', {
                status: 200,
                headers: corsHeaders
            });
        }

        return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response('Webhook processing failed', {
            status: 500,
            headers: corsHeaders
        });
    }
});

async function handleCheckoutCompleted(supabase, stripe, session) {
    try {
        const userId = session?.metadata?.user_id;
        const billingInterval = session?.metadata?.billing_interval;

        if (session?.mode === 'subscription' && session?.subscription) {
            // Get subscription details from Stripe
            const subscription = await stripe?.subscriptions?.retrieve(session?.subscription);
            // Create or update subscription record
                const { error: subError } = await supabase?.from('user_subscriptions')?.upsert({
                        user_id: userId,
                        stripe_subscription_id: subscription?.id,
                        stripe_customer_id: session?.customer,
                        status: 'active',
                        billing_interval: billingInterval,
                        current_period_start: new Date(subscription.current_period_start * 1000)?.toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000)?.toISOString()
                    }, { 
                        onConflict: 'stripe_subscription_id' 
                    });

                if (subError) {
                    console.error('Error upserting subscription:', subError);
                }

            // Grant plan credits based on price
            const priceId = subscription?.items?.data?.[0]?.price?.id as string | undefined;
            const credits = creditsForPriceId(priceId);
            if (credits > 0 && userId) {
                await supabase.rpc('adjust_credits', { p_user_id: userId, p_delta: credits, p_reason: 'plan_grant' });
            }
        }

        // One-time top-ups via Checkout (payment mode)
        if (session?.mode === 'payment') {
            // Fetch line items to identify price IDs
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
            const priceId = lineItems?.data?.[0]?.price?.id as string | undefined;
            const credits = creditsForPriceId(priceId);
            if (credits > 0 && userId) {
                await supabase.rpc('adjust_credits', { p_user_id: userId, p_delta: credits, p_reason: 'topup' });
            }
        }
    } catch (error) {
        console.error('Error handling checkout completed:', error);
    }
}

async function handleSubscriptionCreated(supabase, subscription) {
    try {
        const userId = subscription?.metadata?.user_id;
        
        if (!userId) {
            console.error('No user_id in subscription metadata');
            return;
        }

        // Update subscription status
        await supabase?.from('user_subscriptions')?.update({
                status: subscription?.status === 'active' ? 'active' : 'inactive',
                current_period_start: new Date(subscription.current_period_start * 1000)?.toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000)?.toISOString()
            })?.eq('stripe_subscription_id', subscription?.id);

    } catch (error) {
        console.error('Error handling subscription created:', error);
    }
}

async function handleSubscriptionUpdated(supabase, subscription) {
    try {
        const status = subscription?.status === 'active' ? 'active' : 
                      subscription?.status === 'canceled' ? 'canceled' :
                      subscription?.status === 'past_due' ? 'past_due' : 'inactive';

        await supabase?.from('user_subscriptions')?.update({
                status: status,
                current_period_start: new Date(subscription.current_period_start * 1000)?.toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000)?.toISOString(),
                cancel_at_period_end: subscription?.cancel_at_period_end,
                canceled_at: subscription?.canceled_at ? new Date(subscription.canceled_at * 1000)?.toISOString() : null
            })?.eq('stripe_subscription_id', subscription?.id);

        console.log(`Subscription ${subscription?.id} updated with status: ${status}`);
        
    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
}

async function handleSubscriptionDeleted(supabase, subscription) {
    try {
        await supabase?.from('user_subscriptions')?.update({
                status: 'canceled',
                canceled_at: new Date()?.toISOString()
            })?.eq('stripe_subscription_id', subscription?.id);

        // Optionally set API credits to 0 or a free tier amount
        const { data: userSub } = await supabase?.from('user_subscriptions')?.select('user_id')?.eq('stripe_subscription_id', subscription?.id)?.single();

        if (userSub) {
            await supabase?.from('user_profiles')?.update({ current_api_credits: 0 })?.eq('id', userSub?.user_id);
        }

        console.log(`Subscription ${subscription?.id} canceled and credits revoked`);
        
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
    }
}

async function handlePaymentSucceeded(supabase, invoice) {
    try {
        // Log successful payment
        const { data: subscription } = await supabase?.from('user_subscriptions')?.select('user_id')?.eq('stripe_subscription_id', invoice?.subscription)?.single();

        if (subscription) {
            await supabase?.from('billing_history')?.insert({
                    user_id: subscription?.user_id,
                    stripe_invoice_id: invoice?.id,
                    amount: invoice?.amount_paid / 100,
                    currency: invoice?.currency,
                    status: 'paid',
                    invoice_date: new Date(invoice.created * 1000)?.toISOString(),
                    paid_date: new Date()?.toISOString(),
                    description: invoice?.description || 'Subscription payment',
                    invoice_url: invoice?.hosted_invoice_url
                });
        }

        // For subscription renewals, grant monthly plan credits
        if (invoice?.subscription && invoice?.billing_reason === 'subscription_cycle') {
            // Find the price from the invoice lines
            const invoiceLine = invoice?.lines?.data?.[0];
            const priceId = invoiceLine?.price?.id as string | undefined;
            const credits = creditsForPriceId(priceId);
            if (credits > 0 && subscription?.user_id) {
                await supabase.rpc('adjust_credits', { p_user_id: subscription.user_id, p_delta: credits, p_reason: 'plan_renewal' });
            }
        }

    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(supabase, invoice) {
    try {
        // Log failed payment
        const { data: subscription } = await supabase?.from('user_subscriptions')?.select('user_id')?.eq('stripe_subscription_id', invoice?.subscription)?.single();

        if (subscription) {
            await supabase?.from('billing_history')?.insert({
                    user_id: subscription?.user_id,
                    stripe_invoice_id: invoice?.id,
                    amount: invoice?.amount_due / 100,
                    currency: invoice?.currency,
                    status: 'failed',
                    invoice_date: new Date(invoice.created * 1000)?.toISOString(),
                    description: invoice?.description || 'Subscription payment failed',
                    invoice_url: invoice?.hosted_invoice_url
                });

            // Update subscription status if needed
            await supabase?.from('user_subscriptions')?.update({ status: 'past_due' })?.eq('stripe_subscription_id', invoice?.subscription);
        }

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

// Map Stripe price IDs from env to credit amounts
function creditsForPriceId(priceId?: string): number {
    if (!priceId) return 0;
    const map: Record<string, number> = {};
    const basic = Deno?.env?.get('STRIPE_PRICE_BASIC');
    const pro = Deno?.env?.get('STRIPE_PRICE_PRO');
    const max = Deno?.env?.get('STRIPE_PRICE_MAX');
    const topup = Deno?.env?.get('STRIPE_PRICE_TOPUP_100');
    if (basic) map[basic] = 100;
    if (pro) map[pro] = 250;
    if (max) map[max] = 500;
    if (topup) map[topup] = 100;
    return map[priceId] || 0;
}