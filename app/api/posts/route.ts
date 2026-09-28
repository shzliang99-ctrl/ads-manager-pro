import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 🌟 ករណីទី១៖ បើ Frontend ផ្ញើមកជា JSON (សម្រាប់ទាញយក Posts មកបង្ហាញក្នុង Table)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { pageId, pageToken, access_token } = body;
      
      const token = (pageToken || access_token || process.env.FACEBOOK_ACCESS_TOKEN || '').replace(/['"]+/g, '').trim();

      if (!pageId || !token) {
        return NextResponse.json({ success: false, error: "ខ្វះ Page ID ឬ Token" }, { status: 400 });
      }

      // ១. ទាញយក Page Access Token ផ្ទាល់របស់ Page សិន (ប្រសិនបើមាន)
      let validPageToken = token;
      try {
        const pageRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${token}`);
        const pageData = await pageRes.json();
        if (pageData.access_token) {
          validPageToken = pageData.access_token;
        }
      } catch (e) {}

      // ២. ទាញយក Posts ត្រឹម 25 ផុសម្ដង (limit=25) ដើម្បីការពារកុំឱ្យ Facebook Error "Please reduce the amount of data"
      const fieldsFull = "id,message,story,created_time,full_picture,status_type,attachments,shares,likes.summary(true),comments.summary(true)";
      let res = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/posts?fields=${fieldsFull}&limit=60&access_token=${validPageToken}`,
        { cache: 'no-store' }
      );
      let data = await res.json();

      // 🌟 ៣. ប្រសិនបើ Facebook នៅតែថាទិន្នន័យធ្ងន់ពេក ឱ្យវាទាញយកទម្រង់ស្រាលភ្លាមៗដោយស្វ័យប្រវត្តិ (Fallback)
      if (data.error) {
        const fieldsLight = "id,message,story,created_time,full_picture,status_type,attachments,shares";
        res = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/posts?fields=${fieldsLight}&limit=60&access_token=${validPageToken}`,
          { cache: 'no-store' }
        );
        data = await res.json();
      }

      if (data.error) {
        console.error("Facebook API Error:", data.error);
        return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
      }

      // ចម្រាញ់ទិន្នន័យឱ្យស្រួលប្រើប្រាស់លើ Frontend
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