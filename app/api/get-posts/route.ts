import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pageId, accessToken, filterType } = await req.json();

    if (!pageId || !accessToken) {
      return NextResponse.json({ success: false, error: "Missing Page ID or Token" });
    }

    // កំណត់ Fields ដែលចង់ទាញយក (រួមទាំងលក្ខខណ្ឌដែលអាច Boost បាន)
    const fields = "id,message,created_time,full_picture,permalink_url,is_eligible_for_promotion";
    let endpoint = "";

    // ប្ដូរ Endpoint របស់ Facebook ទៅតាម Filter ដែលបានរើសពី UI
    switch (filterType) {
      case "all":
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=${fields}&access_token=${accessToken}`;
        break;
      case "published":
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/published_posts?fields=${fields}&access_token=${accessToken}`;
        break;
      case "ads":
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/ads_posts?fields=${fields}&access_token=${accessToken}`;
        break;
      case "scheduled":
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/scheduled_posts?fields=${fields}&access_token=${accessToken}`;
        break;
      case "available": // Available posts only (ទាញយកតែផុសដែល Boost កើត)
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/published_posts?fields=${fields}&access_token=${accessToken}`;
        break;
      default:
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/published_posts?fields=${fields}&access_token=${accessToken}`;
    }

    // ទាញយកទិន្នន័យពី Facebook
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error.message });
    }

    let posts = data.data || [];

    // បើជ្រើសរើសយកតែ Available (Boost កើត) ត្រូវ Filter លុបផុសដែលជាប់ពណ៌ប្រផេះ (អត់ឲ្យ Boost) ចេញ
    if (filterType === "available") {
      posts = posts.filter((post: any) => post.is_eligible_for_promotion === true);
    }

    return NextResponse.json({ success: true, data: posts });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}