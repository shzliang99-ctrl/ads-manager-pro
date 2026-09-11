import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      adAccountId, 
      pageId, 
      greeting, 
      questions, 
      includeAdImages, 
      adButtonText, 
      adAutoResponse 
    } = body;

    // 1. ទាញយក Client Token ពី Request headers ឬ fallback យកពី Database តាម pageId
    // (ក្នុងករណីនេះ យើងទាញយក Token ដែលបាន Save ទុកក្នុង facebook_accounts ស្របតាម Client ម្នាក់ៗ)
    const { data: accountData, error: dbError } = await supabase
      .from('facebook_accounts')
      .select('access_token')
      .eq('page_id', pageId)
      .single();

    const ACCESS_TOKEN = accountData?.access_token || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!ACCESS_TOKEN || !pageId || !adAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing Access Token, Page ID, or Ad Account ID. Please reconnect Facebook." 
      }, { status: 400 });
    }

    // 2. រៀបចំ cấu trúc Call-to-Action / Options សម្រាប់ Messenger តាមស្តង់ដារ Facebook Marketing API (Ad Creative)
    const callToActionType = "SEND_MESSAGE";
    
    // រៀបចំ Quick Replies ឬ Options តាមសំណួរដែលអតិថិជនបានកំណត់
    const options = questions
      .filter((q: any) => q.q && q.q.trim() !== "")
      .map((q: any) => ({
        text: q.q.substring(0, 80), // Facebook limit កំណត់ត្រឹម 80 តួអក្សរសម្រាប់ Quick Reply
      }));

    // 3. បង្កើត Ad Creative ផ្អែកលើ Messenger Template ផ្លូវការរបស់ Meta
    // កែសម្រួល URL ឱ្យរត់ចំ Version 18.0 ឬ 19.0 របស់ Ad Account Creative Endpoint
    const cleanAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    const creativePayload: any = {
      name: `Ad Creative - ${new Date().toISOString()}`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: greeting || adAutoResponse || "Thanks for your interest! How can we help you today?",
          call_to_action: {
            type: callToActionType,
            value: {
              // បង្កើត Messenger Template ជាមួយ Welcome Message និង Options
              welcome_message: greeting || "Hi! Please let us know how we can help you.",
              ...(options.length > 0 ? { options: options } : {})
            }
          }
        }
      },
      access_token: ACCESS_TOKEN
    };

    // បាញ់សំណើ POST ទៅកាន់ Facebook Graph API សម្រាប់បង្កើត Ad Creative
    const fbResponse = await fetch(`https://graph.facebook.com/v18.0/${cleanAdAccountId}/adcreatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(creativePayload),
    });

    const data = await fbResponse.json();

    if (data.error) {
      console.error("Facebook Ad Creative API Error:", data.error);
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      creative_id: data.id, 
      message: "ជោគជ័យ! Ad Creative និង Conversation Template បានបង្កើត និងភ្ជាប់ទៅ Facebook Ads Manager រួចរាល់។" 
    });

  } catch (error: any) {
    console.error("Server Error in create-ad-creative:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}