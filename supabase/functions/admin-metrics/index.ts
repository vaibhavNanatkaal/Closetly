import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Deno env
declare const Deno: { env: { get: (k: string) => string | undefined } };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Time window for MRR: current month invoices with status 'paid'
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Total credits used (delta < 0)
    const { data: usedCreditsAgg, error: usedErr } = await supabase
      .from('credit_ledger')
      .select('delta', { count: 'exact', head: false })
      .lt('delta', 0);

    const totalCreditsUsed = (usedCreditsAgg || []).reduce((acc: number, row: any) => acc + Math.abs(row.delta || 0), 0);

    // Active users: users with active subscription OR positive credit balance
    const { data: activeSubs, error: subsErr } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('status', 'active');
    const activeSubUserIds = new Set((activeSubs || []).map((r: any) => r.user_id));

    const { data: creditsRows, error: creditsErr } = await supabase
      .from('user_credits')
      .select('user_id,balance')
      .gt('balance', 0);
    (creditsRows || []).forEach((r: any) => activeSubUserIds.add(r.user_id));
    const activeUsers = activeSubUserIds.size;

    // MRR: sum of paid invoice amounts for current month
    // Requires a billing_history table populated by webhooks
    const { data: invoices, error: invErr } = await supabase
      .from('billing_history')
      .select('amount,status,invoice_date')
      .eq('status', 'paid');

    const mrr = (invoices || [])
      .filter((inv: any) => inv.invoice_date && new Date(inv.invoice_date) >= startOfMonth)
      .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

    return new Response(
      JSON.stringify({ mrr, activeUsers, totalCreditsUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Failed to load metrics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


