import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error("Missing authorization code from Facebook");
    }

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    // 🌟 កែប្រែមកប្រើ Dynamic Origin វិញ ដើម្បីឱ្យវាត្រូវគ្នាទាំង Localhost និង Vercel Domain
    const origin = url.origin;
    const redirectUri = `${origin}/api/auth/facebook/callback`;

    // 1. ប្តូរយក User Access Token ពី Facebook Graph API
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const userAccessToken = tokenData.access_token;

    // 2. Redirect ត្រឡប់មក Dashboard វិញ ព្រមទាំងแนบ Token ទៅជាមួយ
    return NextResponse.redirect(new URL(`/?connected=true&token=${userAccessToken}`, origin));
  } catch (error: any) {
    console.error("Facebook OAuth Callback Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}