import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { postUrl, access_token } = await request.json();

    if (!postUrl) {
      return NextResponse.json({ success: false, error: "Missing postUrl" }, { status: 400 });
    }

    // 1. បើជា Link ពេញពីកុំព្យូទ័រដែលមានស្រាប់លេខ ID ឬ posts/ គឺស្រង់យកភ្លាមៗ
    const longNumMatch = postUrl.match(/([0-9]{13,})/g);
    if (longNumMatch && longNumMatch.length > 0) {
      const pureId = longNumMatch[longNumMatch.length - 1];
      return NextResponse.json({ success: true, postId: pureId });
    }

    // 2. បើជា Link កាត់ខ្លី (share/p/...) គឺត្រូវដោះស្រាយតាមរយៈ Facebook Graph API ជាមួយ Token
    // (ចំណាំ៖ Facebook API តម្រូវឱ្យមានការ convert URL ទៅជា oEmbed ឬ OGP ដើម្បីទាញយក Object ID)
    if (access_token && (postUrl.includes('/share/p/') || postUrl.includes('share/v/'))) {
      try {
        // ប្រើប្រាស់ Facebook oEmbed API ដើម្បីបំប្លែង Short Link ទៅជា ID
        const oembedUrl = `https://graph.facebook.com/v18.0/oembed_page?url=${encodeURIComponent(postUrl)}&access_token=${access_token}`;
        const response = await fetch(oembedUrl);
        const data = await response.json();

        if (data && data.post_id) {
          return NextResponse.json({ success: true, postId: data.post_id });
        }
      } catch (err) {
        console.error("Graph API Error:", err);
      }
    }

    // 3. ករណីទាញមិនចេញ ព្យាយាមแกะ Segment ចុងក្រោយ
    const segments = postUrl.split('/');
    const fallbackId = segments.filter(Boolean).pop()?.split('?')[0];

    if (fallbackId) {
      return NextResponse.json({ success: true, postId: fallbackId });
    }

    return NextResponse.json({ success: false, error: "Could not extract post ID" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}