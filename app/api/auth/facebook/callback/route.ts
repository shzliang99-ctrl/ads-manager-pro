import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  
  // 🌟 ចាប់យក Supabase Access Token ដែលយើងបញ្ជូនមកតាម State
  const supabaseToken = url.searchParams.get('state');

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

    const fbAccessToken = tokenData.access_token;

    // 2. ទាញយក Facebook User Profile (ID)
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${fbAccessToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. ទាញយក Facebook Pages របស់ User
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${fbAccessToken}`);
    const pagesData = await pagesRes.json();
    const firstPage = pagesData.data && pagesData.data.length > 0 ? pagesData.data[0] : null;
    
    const pageId = firstPage ? firstPage.id : null;
    const pageName = firstPage ? firstPage.name : null;

    // 4. ទាញយក Ad Account ID
    const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${fbAccessToken}`);
    const adAccountsData = await adAccountsRes.json();
    const firstAdAccount = adAccountsData.data && adAccountsData.data.length > 0 ? adAccountsData.data[0] : null;
    const adAccountId = firstAdAccount ? firstAdAccount.id : null;

    // 5. តភ្ជាប់ Supabase 
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 6. 🌟 ស្វែងរក Email របស់ User ពិតប្រាកដ ដោយផ្អែកលើ Token ដែលបញ្ជូនមក
    let userEmail = null;
    if (supabaseToken) {
       // បង្កើត Client មួយទៀតដោយប្រើ Token របស់ User ដើម្បីទាញយកព័ត៌មានរបស់គាត់ (សុវត្ថិភាពខ្ពស់បំផុត)
       const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
         global: { headers: { Authorization: `Bearer ${supabaseToken}` } }
       });
       const { data: { user } } = await userClient.auth.getUser();
       if (user && user.email) {
          userEmail = user.email;
       }
    }

    if (!userEmail) {
       throw new Error("មិនអាចកំណត់អត្តសញ្ញាណគណនីរបស់អ្នកបានទេ។ សូមសាកល្បង Login ម្ដងទៀត។");
    }

    // 7. 🌟 រក្សាទុក Token និងទិន្នន័យ Facebook ចូលតារាង customer_subscriptions ដោយផ្អែកលើ Email
    const { error: dbError } = await supabaseAdmin
      .from('customer_subscriptions')
      .update({
        facebook_user_id: String(facebookUserId),
        access_token: fbAccessToken, // Update តែ Token ហ្វេសប៊ុក និង Page ដែលពាក់ព័ន្ធ
        page_id: pageId ? String(pageId) : null,
        page_name: pageName,
        ad_account_id: adAccountId ? String(adAccountId) : null,
        // លែង Update updated_at បើអត់មាន Column នេះក្នុង Table ថ្មី
      })
      .eq('email', userEmail); // Update ចំ Account របស់គាត់ ១០០%

    if (dbError) {
      throw new Error(`Supabase DB Update Error: ${dbError.message}`);
    }

    // 8. Redirect ទៅកាន់ Website វិញយ៉ាងរលូន
    return NextResponse.redirect(
      new URL(`/?connected=true&token=${fbAccessToken}`, origin)
    );

  } catch (error: any) {
    console.error("Facebook Callback Error:", error);
    return NextResponse.redirect(new URL(`/?error=facebook_failed&reason=${encodeURIComponent(error.message)}`, origin));
  }
}