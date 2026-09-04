import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pageId, pageToken, message, imageUrl } = await request.json();

    if (!pageId || !pageToken) {
      return NextResponse.json({ success: false, error: "Missing pageId or pageToken" }, { status: 400 });
    }

    // 🌟 កសាង URL សម្រាប់ផុស (បើមានរូបភាព ប្រើ /photos បើអត់ទេ ប្រើ /feed)
    // បញ្ជាក់៖ យើងបានបន្ថែម call_to_action ចូលទៅជាមួយ ដើម្បីឱ្យវាមានប៊ូតុង Send Message អូតូ
    let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let bodyData: any = {
      message: message,
      access_token: pageToken,
      call_to_action: JSON.stringify({ type: 'MESSAGE_PAGE', value: { page: pageId } })
    };

    if (imageUrl) {
      url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      bodyData = {
        url: imageUrl,
        caption: message,
        access_token: pageToken,
        call_to_action: JSON.stringify({ type: 'MESSAGE_PAGE', value: { page: pageId } })
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, postId: data.id || data.post_id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "មិនអាចបង្កើត Post បានទេ" }, { status: 500 });
  }
}