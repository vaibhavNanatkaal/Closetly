// Test webhook endpoint to verify basic functionality
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
};

serve(async (req) => {
    if (req?.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('Webhook test endpoint called');
        console.log('Method:', req.method);
        console.log('Headers:', Object.fromEntries(req.headers.entries()));
        
        if (req.method === 'POST') {
            const body = await req.text();
            console.log('Body:', body);
            
            return new Response(JSON.stringify({
                success: true,
                message: 'Webhook test endpoint working',
                received: {
                    method: req.method,
                    bodyLength: body.length,
                    hasStripeSignature: req.headers.get('stripe-signature') ? true : false
                }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response('Method not allowed', { 
            status: 405,
            headers: corsHeaders 
        });

    } catch (error) {
        console.error('Test webhook error:', error);
        return new Response('Test webhook failed', {
            status: 500,
            headers: corsHeaders
        });
    }
});
