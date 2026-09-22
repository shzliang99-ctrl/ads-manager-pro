import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adsetId, access_token } = body;

    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    if (!adsetId) {
      return NextResponse.json({ success: false, error: "Missing Ad Set ID" }, { status: 400 });
    }

    // ហៅ Facebook Graph API ដើម្បី Duplicate Ad Set
    const res = await fetch(`https://graph.facebook.com/v18.0/${adsetId}/copies`, {
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
      message: "Duplicate Ad Set បានជោគជ័យ!",
      copiedAdsetId: data.copied_adset_id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}