import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, access_token } = body;

    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    if (!campaignId) {
      return NextResponse.json({ success: false, error: "Missing Campaign ID" }, { status: 400 });
    }

    // 🌟 កែសម្រួល៖ ផ្ញើតែ access_token ទៅកាន់ Facebook API ដោយមិនបាច់ភ្ជាប់ status_option toISO ដើម្បីការពារ Invalid parameter
    const res = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/copies`, {
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
      message: "Duplicate Campaign បានជោគជ័យ!",
      copiedCampaignId: data.copied_campaign_id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}