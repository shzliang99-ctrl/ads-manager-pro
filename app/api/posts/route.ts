import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 🌟 ករណីទី១៖ បើ Frontend ផ្ញើមកជា JSON (សម្រាប់ទាញយក Posts មកបង្ហាញក្នុង Table ព្រមទាំង Likes, Comments, Shares)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { pageId, pageToken, access_token } = body;
      
      const token = pageToken || access_token || process.env.FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !token) {
        return NextResponse.json({ success: false, error: "Missing pageId or pageToken" }, { status: 400 });
      }

      // 🌟 ទាញយកទិន្នន័យរួមបញ្ចូលទាំង likes.summary(true), comments.summary(true) និង shares យ៉ាងសុវត្ថិភាព
      const url = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,status_type,attachments,likes.summary(true),comments.summary(true),shares&limit=50&access_token=${token}`;
      
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.error) {
         console.error("Facebook API Error:", data.error);
         return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
      }

      // 🌟 ចម្រាញ់ទិន្នន័យទាញយកចំនួន Like, Comment, Share ពិតប្រាកដមកបង្ហាញលើ Frontend
      const formattedPosts = (data.data || []).map((p: any) => ({
        ...p,
        likesCount: p.likes?.summary?.total_count || 0,
        commentsCount: p.comments?.summary?.total_count || 0,
        sharesCount: p.shares?.count || 0
      }));

      return NextResponse.json({ success: true, posts: formattedPosts });
    }

    // 🌟 ករណីទី២៖ បើ Frontend ផ្ញើមកជា FormData (សម្រាប់បង្កើត Post ថ្មី)
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

    // បន្ថែមប៊ូតុង Send Message ស្វ័យប្រវត្តិ
    fbFormData.append("call_to_action", JSON.stringify({ type: "MESSAGE_PAGE" }));

    const response = await fetch(url, { method: 'POST', body: fbFormData });
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