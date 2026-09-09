import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // ហៅយក supabase client ដែលយើងទើបបង្កើត

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, facebookUserId, accessToken, pageId, pageName, adAccountId } = body;

    if (!userId || !accessToken || !facebookUserId) {
      return NextResponse.json({ success: false, error: ' thiếuទិន្នន័យចាំបាច់ (Missing required fields)' }, { status: 400 });
    }

    // រក្សាទុក ឬ Update (Upsert) ចូលទៅក្នុងតារាង facebook_accounts ក្នុង Supabase
    const { data, error } = await supabase
      .from('facebook_accounts')
      .upsert([
        {
          user_id: userId,
          facebook_user_id: facebookUserId,
          access_token: accessToken,
          page_id: pageId,
          page_name: pageName,
          ad_account_id: adAccountId,
          updated_at: new Date(),
        }
      ], { onConflict: 'facebook_user_id' });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Token saved to Supabase successfully!' });
  } catch (error) {
    console.error('Supabase Save Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}