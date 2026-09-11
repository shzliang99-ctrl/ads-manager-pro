import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 🌟 ទាញយកទិន្នន័យចុងក្រោយបង្អស់ពី Table facebook_accounts
    const { data, error } = await supabaseAdmin
      .from('facebook_accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ connected: false, error: "No account found in table" });
    }

    const account = data[0];

    // 🌟 ส่งទិន្នន័យត្រឡប់ទៅ Website វិញ
    return NextResponse.json({
      connected: true,
      accessToken: account.access_token,
      pageId: account.page_id,
      pageName: account.page_name,
      adAccountId: account.ad_account_id
    });

  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}