import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const token = searchParams.get("token") || ""; // 🌟 ទទួល Token ថ្មីដែលផ្ញើមកពី Dashboard ផ្ទាល់

    if (!query) {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing Access Token. Please select a page." }, { status: 400 });
    }

    // 🌟 ប្រើប្រាស់ Token របស់ Page ដែលនៅសកម្មស្រាប់ មកទាញយក Interest
    const graphUrl = `https://graph.facebook.com/search?type=adinterest&q=[${encodeURIComponent(query)}]&limit=10000&locale=en_KH&access_token=${token}`;

    const res = await fetch(graphUrl);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data.data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}