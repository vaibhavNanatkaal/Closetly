import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Add Deno global declaration
declare const Deno: {
    env: {
        get(key: string): string | undefined;
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

        if (req?.method === 'POST') {
            const { 
                prompt, 
                generationStyle = 'realistic',
                creativity = 0.7,
                maxImages = 1 
            } = await req?.json();

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

            // Check if user can consume API credits
            const { data: canConsume, error: creditError } = await supabase?.rpc('consume_api_credits', {
                    user_uuid: user?.id,
                    credits_to_consume: maxImages,
                    operation_type: 'ai_fashion_generation'
                });

            if (creditError || !canConsume) {
                throw new Error('Insufficient API credits or inactive subscription. Please upgrade your plan or purchase more credits to continue generating AI fashion content.');
            }

            const startTime = Date.now();

            try {
                // In a real implementation, this would call Gemini API
                // For now, we'll simulate the AI generation process
                const analysisResult = {
                    type: 'fashion_analysis',
                    description: `AI-generated fashion analysis for: ${prompt}`,
                    style: generationStyle,
                    creativity: creativity,
                    timestamp: new Date()?.toISOString(),
                    recommendedStyles: [
                        `Modern ${generationStyle} outfit with contemporary cuts`,
                        `Color palette suggestions based on current trends`,
                        `Styling tips for ${generationStyle} aesthetic`,
                        `Accessory recommendations to complete the look`
                    ],
                    isImageData: false,
                    processingNote: 'This is a simulated response. In production, integrate with actual AI image generation service.'
                };

                const processingTime = Date.now() - startTime;

                // Save analysis result to database
                const { data: savedResult, error: saveError } = await supabase?.from('fashion_analysis_results')?.insert({
                        user_id: user?.id,
                        generation_style: generationStyle,
                        creativity_level: creativity,
                        max_images: maxImages,
                        original_prompt: prompt,
                        analysis_result: analysisResult,
                        generation_metadata: {
                            processingTimeMs: processingTime,
                            userAgent: req?.headers?.get('user-agent'),
                            timestamp: new Date()?.toISOString()
                        },
                        credits_consumed: maxImages,
                        processing_time_ms: processingTime,
                        success: true
                    })?.select()?.single();

                if (saveError) {
                    console.error('Error saving analysis result:', saveError);
                    throw new Error('Failed to save analysis result');
                }

                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        id: savedResult.id,
                        analysisResult: analysisResult,
                        creditsConsumed: maxImages,
                        processingTimeMs: processingTime,
                        expiresAt: savedResult.expires_at
                    }
                }), {
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'application/json' 
                    }
                });

            } catch (generationError) {
                // Log failed generation
                await supabase?.from('fashion_analysis_results')?.insert({
                        user_id: user?.id,
                        generation_style: generationStyle,
                        creativity_level: creativity,
                        max_images: maxImages,
                        original_prompt: prompt,
                        analysis_result: { error: generationError?.message },
                        credits_consumed: 0, // Don't charge for failed generations
                        processing_time_ms: Date.now() - startTime,
                        success: false,
                        error_details: generationError?.message
                    });

                throw generationError;
            }
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI generation error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Failed to process AI generation'
        }), {
            status: 400,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
});