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

    // 🌟 កំណត់ User ID (លុបកូដឆែក Session ចាស់ចោល ព្រោះវាជាអ្នកធ្វើឱ្យរត់ទៅទំព័រ Login វិញ)
    const currentUserId = 1;

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក User Access Token ពី Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
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

    // 5. រក្សាទុក (Save) ចូលទៅក្នុង Database (Supabase)
    const { error: dbError } = await supabase
      .from('facebook_accounts')
      .upsert([
        {
          user_id: currentUserId,
          facebook_user_id: facebookUserId,
          access_token: pageAccessToken,
          page_id: pageId,
          page_name: pageName,
          ad_account_id: adAccountId,
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'facebook_user_id' });

    if (dbError) {
      throw new Error("Supabase Error: " + dbError.message);
    }

    // 6. Redirect ត្រឡប់មក Dashboard វិញ (ភ្ជាប់ជោគជ័យ)
    return NextResponse.redirect(new URL(`/?connected=true`, origin));
    
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error.message);
    // បើមាន Error អ្វីមួយ ឱ្យត្រឡប់មក Dashboard ជាមួយនឹងសារបញ្ជាក់ថាភ្ជាប់បរាជ័យ
    const url = new URL(request.url);
    return NextResponse.redirect(new URL(`/?error=facebook_failed`, url.origin));
  }
}