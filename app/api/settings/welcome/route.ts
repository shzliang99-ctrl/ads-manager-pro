import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// កន្លែងសម្រាប់រក្សាទុកទិន្នន័យ Welcome Message ជាបណ្ដោះអាសន្ន (JSON File)
const filePath = path.join(process.cwd(), 'welcome-config.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, pageId, pageToken, frequency } = body;

    if (!message || !pageId) {
      return NextResponse.json({ success: false, error: 'Message and Page ID are required' }, { status: 400 });
    }

    // 🌟 1. បញ្ជូនសំណើ (API Call) ទៅកាន់ Facebook Messenger Profile API ផ្លូវការ ដើម្បីលុបបំបាត់ការ Loading
    if (pageToken) {
      const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me/messenger_profile?access_token=${pageToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          get_started: { payload: "WELCOME_PAYLOAD" },
          greeting: [
            {
              locale: "default",
              text: message
            }
          ]
        })
      });

      const fbResult = await fbResponse.json();
      if (fbResult.error) {
        console.error("Facebook API Error:", fbResult.error);
        return NextResponse.json({ success: false, error: fbResult.error.message }, { status: 400 });
      }
    }

    // 🌟 2. រក្សាទុកទិន្នន័យរួមមាន message, pageId, pageToken និង frequency ចូលក្នុង File JSON
    const dataToSave = { 
      pageId, 
      message, 
      frequency: frequency || '24h', 
      updatedAt: new Date().toISOString() 
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));

    console.log("✅ Saved Welcome Message successfully for Page:", pageId);

    return NextResponse.json({ 
      success: true, 
      message: 'រក្សាទុកសារស្វាគមន៍ និងភ្ជាប់ជាមួយ Facebook Page ដោយជោគជ័យ!',
      data: dataToSave 
    });

  } catch (error: any) {
    console.error("❌ Save Welcome API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

// មុខងារសម្រាប់ទាញយកទិន្នន័យមកបង្ហាញវិញបើចាំបាច់
export async function GET() {
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json({ success: true, data: JSON.parse(fileData) });
    }
    return NextResponse.json({ success: true, data: { message: '', frequency: '24h', pageId: '' } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}