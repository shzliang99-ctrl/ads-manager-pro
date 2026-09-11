import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const origin = url.origin;

    if (!code) {
      throw new Error("Missing authorization code from Facebook");
    }

    const currentUserId = 1;

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // 🌟 ការពារករណីភ្លេចដាក់ Key ក្នុង Vercel
    if (!clientId || !clientSecret) {
      throw new Error("Server Error: Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in Vercel.");
    }

    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក User Access Token ពី Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`FB Token Error: ${tokenData.error.message}`);
    }

    const userAccessToken = tokenData.access_token;

    // 2. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. ទាញយកបញ្ជី Facebook Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`);
    const pagesData = await pagesRes.json();
    
    const firstPage = pagesData.data && pagesData.data.length > 0 ? pagesData.data[0] : null;
    const pageId = firstPage ? firstPage.id : null;
    const pageName = firstPage ? firstPage.name : null;
    const pageAccessToken = firstPage ? firstPage.access_token : userAccessToken;

    // 4. ទាញយក Ad Account ID
    const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${userAccessToken}`);
    const adAccountsData = await adAccountsRes.json();
    const firstAdAccount = adAccountsData.data && adAccountsData.data.length > 0 ? adAccountsData.data[0] : null;
    const adAccountId = firstAdAccount ? firstAdAccount.id : null;

    // 🌟 5. សរសេរកូដ Save ចូល Database បែបថ្មី (ការពារ Error OnConflict 100%)
    
    // ក. ឆែកមើលសិនថាតើមានទិន្នន័យឬຍັງ?
    const { data: existingRecord } = await supabase
      .from('facebook_accounts')
      .select('id')
      .eq('user_id', currentUserId)
      .single();

    let dbError;
    
    // ខ. បើមានស្រាប់ ធ្វើការ Update. បើអត់ទាន់មាន ធ្វើការ Insert
    if (existingRecord) {
      const { error } = await supabase
        .from('facebook_accounts')
        .update({
          facebook_user_id: facebookUserId,
          access_token: pageAccessToken,
          page_id: pageId,
          page_name: pageName,
          ad_account_id: adAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUserId);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('facebook_accounts')
        .insert([{
          user_id: currentUserId,
          facebook_user_id: facebookUserId,
          access_token: pageAccessToken,
          page_id: pageId,
          page_name: pageName,
          ad_account_id: adAccountId,
          updated_at: new Date().toISOString(),
        }]);
      dbError = error;
    }

    if (dbError) {
      throw new Error(`Supabase DB Error: ${dbError.message}`);
    }

    // 6. Redirect ត្រឡប់មក Dashboard វិញ ព្រមទាំងបញ្ជាក់ថា Connected ជោគជ័យ
    return NextResponse.redirect(new URL(`/?connected=true`, origin));
    
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error.message);
    
    // 🌟 កូដថ្មី៖ បើមាន Error វានឹងបោះសារ Error នោះមកបង្ហាញលើ URL ឱ្យបងឃើញច្បាស់តែម្ដង!
    const url = new URL(request.url);
    const errorMessage = encodeURIComponent(error.message);
    return NextResponse.redirect(new URL(`/?error=facebook_failed&reason=${errorMessage}`, url.origin));
  }
}