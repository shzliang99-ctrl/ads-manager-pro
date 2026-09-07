import { NextResponse } from 'next/server';

// បងអាចដូរពាក្យសម្ងាត់នេះបាន (វាសម្រាប់ដាក់បញ្ជាក់ជាមួយ Facebook Webhook)
const VERIFY_TOKEN = "urbangarbs_bot_token_2026"; 

// 1. GET Request: សម្រាប់ការផ្ទៀងផ្ទាត់ (Verify) ពេលបងភ្ជាប់ App ជាមួយ Facebook Webhook ដំបូង
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified ជោគជ័យ!");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

// 2. POST Request: ទទួលសញ្ញាពេលមានអ្នក Comment លើ Page រួចដំណើរការ Auto-Reply
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    // ឆែកមើលថាវាជាទិន្នន័យមកពី Page មែនអត់
    if (body.object === "page") {
      for (const entry of body.entry) {
        const webhookEvent = entry.changes[0];

        // ត្រួតពិនិត្យថាវាគឺជាសកម្មភាព "Comment" ថ្មី
        if (webhookEvent.field === "feed" && webhookEvent.value.item === "comment" && webhookEvent.value.verb === "add") {
          const commentId = webhookEvent.value.comment_id;
          const senderId = webhookEvent.value.from.id;
          const pageId = entry.id;

          // កុំឱ្យ Bot ឆ្លើយតប Comment របស់ Page ខ្លួនឯង (ការពារកុំឱ្យវាឆ្លើយតបឆ្លាស់គ្នាមិនឈប់)
          if (senderId === pageId) continue;

          console.log(`🔔 មានអ្នកខំមិនថ្មី! Comment ID: ${commentId}`);

          // 📝 សារដែលយើងចង់តបទៅភ្ញៀវ (បងអាចប្ដូរបាន)
          const autoCommentReply = "ជម្រាបសួរអតិថិជន! សូមឆែកប្រអប់សារ (Inbox) ខាងយើងខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនហើយ។ អរគុណបង! 🙏";
          const autoInboxMessage = "សួស្តីបង! តើបងចាប់អារម្មណ៍ស្បែកជើងម៉ូដមួយណាដែរ? អាចសួរខាងហាង UrbanGarbs បានណា៎! 😊 ចុចទីនេះដើម្បីមើលម៉ូដបន្ថែម...";

          // 1️⃣ Auto Like: ចុច Like លើ Comment របស់ភ្ញៀវហ្នឹង
          await fetch(`https://graph.facebook.com/v19.0/${commentId}/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: PAGE_ACCESS_TOKEN })
          });

          // 2️⃣ Auto Comment: តប Comment ភ្ញៀវវិញ
          await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: autoCommentReply,
              access_token: PAGE_ACCESS_TOKEN
            })
          });

          // 3️⃣ Auto Inbox: បាញ់សារចូល Inbox ភ្ញៀវឯកជន (Private Reply)
          await fetch(`https://graph.facebook.com/v19.0/${commentId}/private_replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: autoInboxMessage,
              access_token: PAGE_ACCESS_TOKEN
            })
          });

          console.log("✅ ប្រព័ន្ធបាន Auto-Like, Auto-Comment និងបាញ់ចូល Inbox ជោគជ័យ!");
        }
      }
      // ប្រាប់ទៅ Facebook វិញថាយើងបានទទួលទិន្នន័យជោគជ័យ (ការពារកុំឱ្យ Facebook បាញ់កូដមកផ្ទួនៗ)
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}