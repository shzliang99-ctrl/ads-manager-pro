import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adId, access_token } = body;

    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    if (!adId) {
      return NextResponse.json({ success: false, error: "Missing Ad ID" }, { status: 400 });
    }

    // 🌟 ធ្វើការ Duplicate Ad ដោយផ្ញើតែ access_token ទៅកាន់ Facebook API ត្រឹមត្រូវតាមស្ដង់ដារ
    const res = await fetch(`https://graph.facebook.com/v18.0/${adId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        access_token: clientToken 
      }),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Duplicate Ad បានជោគជ័យ!",
      copiedAdId: data.copied_ad_id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}