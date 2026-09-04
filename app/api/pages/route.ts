import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // ១. ចាប់យក Token ពី Frontend (Customer Token)
    const clientToken = searchParams.get('access_token');
    
    // ២. ប្រើ Token អតិថិជនជាចម្បង បើអត់មាន ទើបប្រើ Admin Token ក្នុង .env
    const accessToken = clientToken || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Missing Facebook Access Token. Please login." }, { status: 401 });
    }

    let allPages: any[] = [];
    let url = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture{url}&limit=100&access_token=${accessToken}`;

    // ៣. Loop ទាញយក Page ទាំងអស់ (ករណីមានច្រើនលើស ១០០)
    while (url) {
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();

      if (data.error) {
        return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
      }

      if (data.data) {
        allPages = [...allPages, ...data.data];
      }

      url = data.paging && data.paging.next ? data.paging.next : null;
    }

    return NextResponse.json({ success: true, pages: allPages });
  } catch (error: any) {
    console.error("Error fetching pages:", error.message);
    return NextResponse.json({ success: false, error: "មិនអាចទាញយក Page ได้ទេ: " + error.message }, { status: 500 });
  }
}