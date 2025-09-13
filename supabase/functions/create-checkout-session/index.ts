import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Add Deno type declaration for global access
declare const Deno: {
    env: {
        get: (key: string) => string | undefined;
    };
};

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
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
        });

        if (req?.method === 'POST') {
            const { priceId, mode = 'subscription' } = await req?.json();
            
            // Get JWT from Authorization header
            const authHeader = req?.headers?.get('Authorization');
            if (!authHeader) {
                throw new Error('No authorization header');
            }

            // Verify JWT and get user
            const token = authHeader?.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabase?.auth?.getUser(token);
            
            if (authError || !user) {
                throw new Error('Invalid authentication');
            }

            // Create or get Stripe customer using auth.users data
            let stripeCustomerId = null;
            
            // Try to find existing customer by email
            const existingCustomers = await stripe?.customers?.list({
                email: user?.email,
                limit: 1
            });
            
            if (existingCustomers?.data?.length > 0) {
                stripeCustomerId = existingCustomers.data[0].id;
            } else {
                // Create new Stripe customer
                const customer = await stripe?.customers?.create({
                    email: user?.email,
                    name: user?.user_metadata?.full_name || user?.email,
                    metadata: {
                        supabase_user_id: user?.id
                    }
                });
                
                stripeCustomerId = customer?.id;
            }

            // Create Stripe checkout session using direct price ID
            const session = await stripe?.checkout?.sessions?.create({
                customer: stripeCustomerId,
                payment_method_types: ['card'],
                mode,
                line_items: [{ price: priceId, quantity: 1 }],
                success_url: `${req?.headers?.get('origin')}/customer-portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req?.headers?.get('origin')}/customer-portal?canceled=true`,
                metadata: {
                    user_id: user?.id,
                    mode
                },
                subscription_data: mode === 'subscription' ? { metadata: { user_id: user?.id } } : undefined,
                customer_update: {
                    name: 'auto',
                    address: 'auto'
                },
                billing_address_collection: 'required',
                tax_id_collection: {
                    enabled: true
                }
            });

            return new Response(JSON.stringify({
                sessionId: session.id,
                url: session.url
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json' 
                }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Checkout session error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Failed to create checkout session'
        }), {
            status: 400,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
});