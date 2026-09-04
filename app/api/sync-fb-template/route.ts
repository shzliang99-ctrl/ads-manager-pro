import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { greeting, questions, pageId } = body;

    // ទាញយក Token ពី .env.local របស់បង (បងមានស្រាប់ហើយពីមុន)
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!ACCESS_TOKEN || !pageId) {
      return NextResponse.json({ success: false, error: "Missing Access Token or Page ID" }, { status: 400 });
    }

    // ១. រៀបចំទម្រង់ JSON Payload តាមស្តង់ដារ Facebook Message Template សម្រាប់ Ads
    const messageTemplate = {
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: greeting || "Hi! Please let us know how we can help you.",
            buttons: questions
              .filter((q: any) => q.q.trim() !== "")
              .map((q: any) => ({
                type: "postback",
                title: q.q.substring(0, 20), // Facebook limit ចំណងជើងប៊ូតុងត្រឹម 20 តួអក្សរ
                payload: q.a || "auto_response_payload" // ពេលអតិថិជនចុច វានឹងលោតចម្លើយនេះ
              }))
          }
        }
      }
    };

    // ២. បាញ់សំណើ (POST Request) ទៅកាន់ Facebook Graph API
    // ចំណាំ៖ ការ Update Ad Template ផ្ទាល់ត្រូវធ្វើតាមរយៈ Ad Creative ID ឬ Page Messaging
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/message_custom_templates?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Custom Ad Template From App",
        page_id: pageId,
        message_destination: "MESSENGER",
        message_template: messageTemplate
      }),
    });

    const data = await fbResponse.json();

    if (data.error) {
      console.error("Facebook API Error:", data.error);
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, template_id: data.id, message: "ជោគជ័យ! ទិន្នន័យបានបញ្ជូនទៅ Facebook ទីភ្នាក់ងារផ្សាយពាណិជ្ជកម្មហើយ។" });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}