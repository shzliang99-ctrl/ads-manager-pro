import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code from Facebook" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: "Missing Facebook App ID or Secret in environment variables" }, { status: 400 });
    }

    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក User Access Token ពី Facebook
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.json({ success: false, error: `Facebook Token Error: ${tokenData.error.message}` }, { status: 400 });
    }

    const userAccessToken = tokenData.access_token;

    // 2. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. ទាញយក Facebook Pages របស់ User
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

    // 5. តភ្ជាប់ Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const currentUserId = 1;

    // 6. រក្សាទុកចូល Supabase Database (facebook_accounts table)
    const { error: dbError } = await supabaseAdmin
      .from('facebook_accounts')
      .upsert({
        user_id: currentUserId,
        facebook_user_id: String(facebookUserId),
        access_token: pageAccessToken,
        page_id: pageId ? String(pageId) : null,
        page_name: pageName,
        ad_account_id: adAccountId ? String(adAccountId) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'facebook_user_id' });

    if (dbError) {
      return NextResponse.json({ success: false, error: `Supabase Database Error: ${dbError.message}` }, { status: 400 });
    }

    // 7. បើជោគជ័យ ១០០% គឺ Redirect ត្រឡប់មក Dashboard វិញ ព្រមទាំងបញ្ជូន Token តាម URL
    return NextResponse.redirect(
      new URL(`/?connected=true&token=${pageAccessToken}`, origin)
    );

  } catch (error: any) {
    console.error("Critical Facebook Callback Error:", error);
    // 🌟 បើមានបញ្ហាអ្វីកើតឡើង វាគ្មិនបង្ហាញសារ Error ច្បាស់ៗនៅលើអكرង់ប្រូស៊ោន (Browser) ផ្ទាល់តែម្ដង មិនបាច់ស្មានទៀតទេ
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown server error during facebook callback" 
    }, { status: 500 });
  }
}