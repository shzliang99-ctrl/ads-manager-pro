import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// កន្លែងសម្រាប់រក្សាទុកទិន្នន័យ Welcome Message ជាបណ្ដោះអាសន្ន (JSON File)
const filePath = path.join(process.cwd(), 'welcome-config.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, pageId, frequency } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // រៀបចំទុកដាក់ទិន្នន័យរួមមាន message, pageId និង frequency ចូលក្នុង File JSON
    const dataToSave = { 
      pageId: pageId || 'default', 
      message, 
      frequency: frequency || '24h', 
      updatedAt: new Date().toISOString() 
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));

    console.log("✅ Saved Welcome Message successfully for Page:", pageId);

    // ប្រសិនបើបងចង់ឱ្យវាបញ្ជូនទិន្នន័យទៅ Facebook Page API ក្នុងពេលជាមួយគ្នា អាចដាក់កូដ Graph API ទីនេះបាន

    return NextResponse.json({ 
      success: true, 
      message: 'រក្សាទុកសារស្វាគមន៍ និងការកំណត់ដោយជោគជ័យ!',
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