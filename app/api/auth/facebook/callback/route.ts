import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      throw new Error("Missing authorization code from Facebook");
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // ត្រូវឱ្យស្របគ្នាជាមួយ Redirect URI ដែលបានចុះបញ្ជីក្នុង Facebook App Dashboard
    const redirectUri = 'http://localhost:3000/api/auth/facebook/callback';

    // 1. ប្តូរយក User Access Token ពី Facebook Graph API ព្រមទាំង Encode Redirect URI ឱ្យបានត្រឹមត្រូវ
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const userAccessToken = tokenData.access_token;

    // 2. Redirect กลับមក Dashboard ព្រមទាំងแนบ Token ទៅជាមួយតាម URL query parameter
    return NextResponse.redirect(new URL(`/?connected=true&token=${userAccessToken}`, request.url));
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}