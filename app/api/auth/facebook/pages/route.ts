import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      throw new Error("Missing access token");
    }

    // ទាញយកបញ្ជី Pages ពី Facebook Graph API
    const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ success: true, pages: data.data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}