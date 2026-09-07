import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 🌟 ករណីទី១៖ បើ Frontend ផ្ញើមកជា JSON (សម្រាប់ទាញយក Posts មកបង្ហាញក្នុង Table)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { pageId, pageToken } = body;

      if (!pageId || !pageToken) {
        return NextResponse.json({ success: false, error: "Missing pageId or pageToken" }, { status: 400 });
      }

      // 🌟 បន្ថែម ,attachments ដើម្បីទាញយកគ្រប់រូបភាពទាំងអស់ក្នុង Post មកបង្ហាញជា Grid
      const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,status_type,attachments&limit=20&access_token=${pageToken}`);
      const data = await res.json();

      if (data.error) {
         console.error("Facebook API Error:", data.error);
         return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, posts: data.data || [] });
    }

    // 🌟 ករណីទី២៖ បើ Frontend ផ្ញើមកជា FormData (សម្រាប់បង្កើត Post ថ្មី ឬ Upload រូបភាព/វីដេអូ)
    const formData = await request.formData();
    const pageId = formData.get("pageId") as string;
    const pageToken = formData.get("pageToken") as string;
    const message = formData.get("message") as string || "";
    const file = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    if (!pageId || !pageToken) {
      return NextResponse.json({ success: false, error: "Missing pageId or pageToken" }, { status: 400 });
    }

    let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let fbFormData = new FormData();
    fbFormData.append("access_token", pageToken);

    if (file) {
      const isVideo = file.type.startsWith("video/");
      url = `https://graph.facebook.com/v18.0/${pageId}/${isVideo ? 'videos' : 'photos'}`;
      fbFormData.append("source", file);
      if (message) fbFormData.append(isVideo ? "description" : "caption", message);
    } else if (imageUrl) {
      url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      fbFormData.append("url", imageUrl);
      if (message) fbFormData.append("caption", message);
    } else {
      fbFormData.append("message", message);
    }

    // 🔥 មុខងារថ្មី៖ បង្ខំដាក់ប៊ូតុង "Send Message" ទៅគ្រប់ Post ដែលបានបង្កើតថ្មី ដើម្បីកុំឱ្យជាប់ Error ពេល Boost
    fbFormData.append("call_to_action", JSON.stringify({ type: "MESSAGE_PAGE" }));

    const response = await fetch(url, {
      method: 'POST',
      body: fbFormData,
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, postId: data.id || data.post_id });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}