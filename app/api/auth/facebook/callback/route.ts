import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state'); // 🌟 នេះគឺជា Email ដែលបាន Encode

    if (!code) {
      throw new Error("Missing authorization code from Facebook");
    }

    // 🌟 បំប្លែង Email ត្រឡប់មកទម្រង់ដើមវិញដោយសុវត្ថិភាពបំផុត
    const userEmail = stateStr ? decodeURIComponent(stateStr) : null;

    if (!userEmail) {
       throw new Error("មិនអាចកំណត់អត្តសញ្ញាណគណនីរបស់អ្នកបានទេ សូម Login ម្តងទៀត។");
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក Access Token ពី Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`Facebook Token Error: ${tokenData.error.message}`);
    }

    const fbAccessToken = tokenData.access_token;

    // 2. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${fbAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. ទាញយក Facebook Pages របស់ User
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${fbAccessToken}`);
    const pagesData = await pagesRes.json();
    const firstPage = pagesData.data && pagesData.data.length > 0 ? pagesData.data[0] : null;

    // 4. ទាញយក Ad Account ID
    const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${fbAccessToken}`);
    const adAccountsData = await adAccountsRes.json();
    const firstAdAccount = adAccountsData.data && adAccountsData.data.length > 0 ? adAccountsData.data[0] : null;

    // 5. តភ្ជាប់ Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    // 6. 🌟 ធ្វើការ Update Token ចូលទៅក្នុងតារាង customer_subscriptions
    const { error: dbError } = await supabaseAdmin
      .from('customer_subscriptions')
      .update({
        facebook_user_id: String(facebookUserId),
        access_token: fbAccessToken, 
        page_id: firstPage ? String(firstPage.id) : null,
        page_name: firstPage ? String(firstPage.name) : null,
        ad_account_id: firstAdAccount ? String(firstAdAccount.id) : null
      })
      .eq('email', userEmail); // 👈 Update ចំ Email អតិថិជនពិតប្រាកដ

    if (dbError) {
      throw new Error(`Supabase DB Update Error: ${dbError.message}`);
    }

    // 7. Redirect ត្រឡប់ទៅ Website វិញដោយជោគជ័យ
    return NextResponse.redirect(new URL(`/?connected=true&token=${fbAccessToken}`, origin));

  } catch (error: any) {
    console.error("Facebook Callback Error:", error);
    return NextResponse.redirect(new URL(`/?error=facebook_failed&reason=${encodeURIComponent(error.message)}`, origin));
  }
}