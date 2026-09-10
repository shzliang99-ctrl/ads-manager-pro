import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const currentUserId = 1; 

    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', currentUserId)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      pageName: data.page_name,
      pageId: data.page_id,
      adAccountId: data.ad_account_id,
      accessToken: data.access_token
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}