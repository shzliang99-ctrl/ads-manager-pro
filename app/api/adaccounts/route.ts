import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // ចាប់យក Token ដែលបោះមកពី Frontend (Customer Token)
    const clientToken = searchParams.get('access_token');
    
    // ប្រើ Token អតិថិជនជាចម្បង បើអត់មាន ទើបប្រើ Admin Token ក្នុង .env ជាជម្រើសទី២ (សម្រាប់ Test)
    const accessToken = clientToken || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token. Please login with Facebook or configure .env");
    }

    // ទាញយក Ad Accounts ទាំងអស់ដែល User/Token នេះមានសិទ្ធិមើលឃើញ
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=account_id,name,account_status,currency&access_token=${accessToken}`,
      { cache: 'no-store' }
    );
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ success: true, accounts: data.data });
  } catch (error: any) {
    console.error("Error fetching Ad Accounts:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}