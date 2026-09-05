import { NextResponse } from 'next/server';

// 🛡️ មុខងារទប់ស្កាត់ការផ្ញើសារซ้ำ (Deduplication Map) ដើម្បីការពារកុំឱ្យផ្ញើចូល Inbox ឬ Comment ស្ទួនៗច្រើនដង
const processedEvents = new Map<string, number>();

// លុប Cache ចាស់ៗចេញជារៀងរាល់ ១០ នាទី ដើម្បីកុំឱ្យ memory ធ្ងន់ពេក
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > 600000) { // ៦០០វិនាទី (១០នាទី)
      processedEvents.delete(key);
    }
  }
}, 600000);

// 🌟 1. GET Method: សម្រាប់ឱ្យ Facebook ផ្ទៀងផ្ទាត់ Webhook (Verify Token)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'ads_manager_pro_verify_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new Response(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed verification' }, { status: 403 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🌟 2. POST Method: ទទួល Event ពេលមាន Comment ឬ Message ចូលមកក្នុង Page
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Raw Webhook Payload Received:", JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const pageId = entry.id;
        
        // 📥 ករណីមាន Comment ឬ Feed Change ថ្មីនៅលើ Page
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'feed') {
              const val = change.value;
              if (val?.item === 'comment' || val?.verb === 'add') {
                const commentId = val.comment_id || val.id;
                const postId = val.post_id;
                const message = val.message || val.text || '';
                const commenterName = val.sender_name || val.from?.name || 'អតិថិជន';
                const commenterId = val.from?.id || val.sender_id;

                if (commentId) {
                  // 🛡️ [ការពារស្ទួន] ឆែកមើលថាតើ Comment ID នេះធ្លាប់បានឆ្លើយតបហើយឬยัง?
                  if (processedEvents.has(`comment_${commentId}`)) {
                    console.log(`⚠️ រំលង Comment ID ${commentId} ព្រោះធ្លាប់បានឆ្លើយតបរួចហើយ (Duplicate Prevented)`);
                    continue;
                  }
                  // កត់ត្រាថា Comment ID នេះត្រូវបានដំណើរការរួច
                  processedEvents.set(`comment_${commentId}`, Date.now());

                  console.log(`💬 បានទទួល Comment ថ្មីពី ${commenterName}: "${message}" (Post ID: ${postId})`);

                  await handleAutoReplyAndHide({
                    pageId,
                    commentId,
                    postId,
                    message,
                    commenterName,
                    commenterId
                  });
                }
              }
            }
          }
        }

        // 💬 ករណីមានអតិថិជនផ្ញើសារឆាតផ្ទាល់មកកាន់ Messenger (Messaging Event)
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              const senderPsid = messagingEvent.sender.id;
              const messageId = messagingEvent.message.mid; // Message ID សម្រាប់ទប់ស្កួន
              const messageText = messagingEvent.message.text || '';
              
              // 🛡️ [ការពារស្ទួន] ឆែកមើល Message ID
              if (messageId && processedEvents.has(`msg_${messageId}`)) {
                console.log(`⚠️ រំលង Message ID ${messageId} ព្រោះធ្លាប់បានឆ្លើយតបរួចហើយ`);
                continue;
              }
              if (messageId) {
                processedEvents.set(`msg_${messageId}`, Date.now());
              }

              console.log(`📩 បានទទួលសារ Messenger ពី ${senderPsid}: "${messageText}"`);
              
              await handleMessengerAutoReply(senderPsid, messageText);
            }
          }
        }
      }

      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Not a page event' }, { status: 404 });
    }
  } catch (error: any) {
    console.error("❌ Webhook Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🤖 មុខងារស្នូលសម្រាប់បញ្ជា Bot ឆ្លើយតបខំមិន, ផ្ញើ Inbox និងលាក់ខំមិន
async function handleAutoReplyAndHide(data: {
  pageId: string;
  commentId: string;
  postId: string;
  message: string;
  commenterName: string;
  commenterId?: string;
}) {
  try {
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pageAccessToken) {
      console.error("❌ រកមិនឃើញ Page Access Token ក្នុង Environment Variables ទេ។");
      return;
    }

    const { commentId, message, commenterName } = data;
    const lowerMsg = message.toLowerCase();

    // 1. 🛡️ លាក់ខំមិនអវិជ្ជមាន (Auto-Hide Negative Keywords)
    const bannedKeywords = ["ថ្លៃម៉្លេះ", "ថ្លៃ", "បោក", "មិនល្អ", "fake", "bad"];
    const isNegative = bannedKeywords.some(keyword => lowerMsg.includes(keyword));

    if (isNegative) {
      const hideRes = await fetch(`https://graph.facebook.com/v18.0/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: true, access_token: pageAccessToken })
      });
      const hideData = await hideRes.json();
      console.log("🛡️ Hide Comment Result:", hideData);
    }

    // 2. 💬 ឆ្លើយតបខំមិនស្វ័យប្រវត្តិ (Auto Comment Reply)
    const replyText = `ជម្រាបសួរបង ${commenterName}! ហាងយើងខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនក្នុងប្រអប់សារ (Inbox) ហើយណ៎ា! 🙏✨`;
    
    const commentReplyRes = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: replyText, access_token: pageAccessToken })
    });
    const commentReplyData = await commentReplyRes.json();
    console.log("✅ Comment Reply Response:", commentReplyData);

    // 3. 📥 ផ្ញើសារចូល Inbox ស្វ័យប្រវត្តិ (Private Reply)
    const inboxText = `សួស្តីបង ${commenterName}! អរគុណខ្លាំងណាស់ដែលបានចាប់អារម្មណ៍ផលិតផលស្បែកជើងយើងខ្ញុំ។ ស្បែកជើងម៉ូដនេះមានតម្លៃពិសេស និងទំហំពេញលេញ តើបងចង់មើលពណ៌ ឬទំហំមួយណាដែរអូន? 😊`;

    const privateReplyRes = await fetch(`https://graph.facebook.com/v18.0/${commentId}/private_replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inboxText, access_token: pageAccessToken })
    });
    const privateReplyData = await privateReplyRes.json();
    console.log("📨 Private Reply Response:", privateReplyData);

  } catch (err) {
    console.error("❌ Auto-Reply Execution Error:", err);
  }
}

// 💬 មុខងារឆ្លើយតបសារឆាតផ្ទាល់ (Messenger Direct Chat Auto-Reply)
async function handleMessengerAutoReply(senderPsid: string, userMessage: string) {
  try {
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!pageAccessToken) return;

    let replyText = 'បាទ/ចាស៎! សួស្តីបង។ ហាងស្បែកជើង Wear Luxury Cambodia មានលក់ស្បែកជើងស្អាតៗ និងគុណភាពខ្ពស់ តើចង់ឱ្យហាងយើងខ្ញុំជួយណែនាំម៉ូដអវីដែរបង?';
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes('តម្លៃ') || lowerMsg.includes('price') || lowerMsg.includes('ប៉ុន្មាន')) {
      replyText = 'ស្បែកជើងរបស់យើងមានតម្លៃពិសេសចាប់ពី ១៥ដុល្លារឡើងទៅបង! អាចផ្ញូរូបម៉ូដដែលបងពេញចិត្តមកបានណា៎ 👟✨';
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderPsid },
        message: { text: replyText },
      }),
    });
    const data = await res.json();
    console.log(`✅ Messenger Auto-Reply Response for PSID ${senderPsid}:`, data);
  } catch (error) {
    console.error("❌ Messenger Auto-Reply Error:", error);
  }
}