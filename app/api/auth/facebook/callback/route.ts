import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error("Missing authorization code from Facebook");
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Facebook App ID or Secret in environment variables");
    }

    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក User Access Token (សោរមេ) ពី Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`Facebook Token Error: ${tokenData.error.message}`);
    }

    const userAccessToken = tokenData.access_token; // 🌟 នេះជាសោរមេ (Master Token)

    // 2. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. ទាញយក Facebook Pages របស់ User
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`);
    const pagesData = await pagesRes.json();
    const firstPage = pagesData.data && pagesData.data.length > 0 ? pagesData.data[0] : null;

    // 4. ទាញយក Ad Account ID
    const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${userAccessToken}`);
    const adAccountsData = await adAccountsRes.json();
    const firstAdAccount = adAccountsData.data && adAccountsData.data.length > 0 ? adAccountsData.data[0] : null;

    // 5. តភ្ជាប់ Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 6. រក្សាទុកចូល Supabase (🌟 ត្រូវ Save សោរមេ userAccessToken ទើបមានសិទ្ធិអាន API)
    const { error: dbError } = await supabaseAdmin
      .from('facebook_accounts')
      .upsert({
        facebook_user_id: String(facebookUserId),
        access_token: userAccessToken, // 👈 កែមកប្រើសោរមេនៅទីនេះ
        page_id: firstPage ? String(firstPage.id) : null,
        page_name: firstPage ? firstPage.name : null,
        ad_account_id: firstAdAccount ? String(firstAdAccount.id) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'facebook_user_id' });

    if (dbError) {
      throw new Error(`Supabase DB Error: ${dbError.message}`);
    }

    // 7. 🌟 Redirect បញ្ជូន "សោរមេ" ទៅកាន់ Website ដើម្បីឱ្យវាអាចទាញបញ្ជី Page បាន
    return NextResponse.redirect(
      new URL(`/?connected=true&token=${userAccessToken}`, origin) // 👈 កែមកប្រើសោរមេនៅទីនេះ
    );

  } catch (error: any) {
    console.error("Facebook Callback Error:", error);
    return NextResponse.redirect(new URL(`/?error=facebook_failed&reason=${encodeURIComponent(error.message)}`, origin));
  }
}