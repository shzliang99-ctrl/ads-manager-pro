import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    
    // បង្កើត Supabase Client សម្រាប់ទាក់ទង Database
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 🌟 ទាញយកទិន្នន័យគណនី Facebook ចុងក្រោយបង្អស់ពីតារាង facebook_accounts
    // (បើថ្ងៃក្រោយមានប្រព័ន្ធ User Login ពេញលេញ យើងគ្រាន់តែបន្ថែម .eq('user_id', currentUser) ជាការស្រេច)
    const { data, error } = await supabaseAdmin
      .from('facebook_accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // បើរកមិនឃើញ ឬអត់ទាន់មានអ្នក Connect ទេ បោះសញ្ញាប្រាប់ថា False
    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    // បើមាន គឺបញ្ជូន Token មកឱ្យ Website វិញដើម្បីភ្ជាប់អូតូ
    return NextResponse.json({
      connected: true,
      accessToken: data.access_token,
      pageId: data.page_id,
      pageName: data.page_name,
      adAccountId: data.ad_account_id
    });

  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message });
  }
}