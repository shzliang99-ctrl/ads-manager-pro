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

    // 🌟 1. ឆែកមើលថា តើ User ណាជាអ្នកកំពុង Login ក្នុងប្រព័ន្ធឥឡូវនេះ?
    const { data: { session } } = await supabase.auth.getSession();
    
    // បើអតិថិជនអត់ទាន់ Log in ចូលគណនីគេទេ ឱ្យ redirect ទៅកាន់ទំព័រ login ជាមុនសិន
    if (!session) {
      return NextResponse.redirect(new URL('/login?error=not_authenticated', origin));
    }

    const currentUserId = session.user.id; // យក User ID ពិតប្រាកដជា UUID (ឧ. 'a0eebc99-9c0b...')

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 2. ប្តូរយក User Access Token ពី Facebook Graph API
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const userAccessToken = tokenData.access_token;

    // 3. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 4. ទាញយកបញ្ជី Facebook Pages របស់ User ນີ້
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`);
    const pagesData = await pagesRes.json();
    
    const firstPage = pagesData.data && pagesData.data.length > 0 ? pagesData.data[0] : null;
    const pageId = firstPage ? firstPage.id : null;
    const pageName = firstPage ? firstPage.name : null;
    const pageAccessToken = firstPage ? firstPage.access_token : userAccessToken;

    // 5. ទាញយក Ad Account ID របស់ User ນີ້
    const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${userAccessToken}`);
    const adAccountsData = await adAccountsRes.json();
    const firstAdAccount = adAccountsData.data && adAccountsData.data.length > 0 ? adAccountsData.data[0] : null;
    const adAccountId = firstAdAccount ? firstAdAccount.id : null;

    // 🌟 6. រក្សាទុក (Save) ចូលទៅក្នុង Database (Supabase) ដោយผูกជាមួយ user_id ពិតប្រាកដ
    const { error: dbError } = await supabase
      .from('facebook_accounts')
      .upsert([
        {
          user_id: currentUserId, // ຜูกជាប់กับ Client នីមួយៗដាច់ដោយឡែកពីគ្នា
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

    // 7. Redirect ត្រឡប់មក Dashboard វិញ ព្រមទាំងបញ្ជាក់ថា Connected ជោគជ័យ
    return NextResponse.redirect(new URL(`/?connected=true`, origin));
    
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}