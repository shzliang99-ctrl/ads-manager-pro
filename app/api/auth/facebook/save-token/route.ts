import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 🌟 ត្រូវដាក់ (request: Request) ដើម្បីកុំឲ្យ Error TS7006
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, facebookUserId, accessToken, pageId, pageName, adAccountId } = body;

    if (!userId || !accessToken || !facebookUserId) {
      return NextResponse.json({ success: false, error: 'ទិន្នន័យមិនគ្រប់គ្រាន់ (Missing required fields)' }, { status: 400 });
    }

    // រក្សាទុក ឬ Update (Upsert) ចូលទៅក្នុង Supabase Database
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
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'facebook_user_id' });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Token saved to Supabase successfully!' });
    
  // 🌟 ត្រូវដាក់ (error: any) ដើម្បីកុំឲ្យ Error TS18046
  } catch (error: any) {
    console.error('Supabase Save Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}