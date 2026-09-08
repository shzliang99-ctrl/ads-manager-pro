import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// 🌟 កូដ API សម្រាប់ទទួល Prompt និង រូបភាព/វីដេអូ យកទៅឱ្យ Gemini Vision វិភាគសរសេរ Copywriting ជូន
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || "ជួយសរសេរអត្ថបទលក់ផលិតផលក្នុងរូបភាពនេះឱ្យបានទាក់ទាញបំផុត";
    const file = formData.get('file') as File | null;

    // ត្រៀមភ្ជាប់ជាមួយ Google Gemini API (កុំភ្លេចដាក់ GEMINI_API_KEY ក្នុង .env.local)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let contents: any[] = [prompt];

    // បើមាន Upload រូបភាព ឬវីដេអូ យើងបម្លែងវាជា Base64 ញាត់ចូលទៅជាមួយ Prompt ឱ្យ AI ឃើញច្បាស់ៗ
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');

      contents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type || 'image/jpeg',
          },
        },
        {
          text: `ផ្អែកលើរូបភាព/វីដេអូដែលបានផ្ដល់ជូននេះ សូមช่วยសរសេរអត្ថបទផ្សាយពាណិជ្ជកម្ម (Copywriting) ជាភាសាខ្មែរឱ្យបានទាក់ទាញបំផុត តាមសំណើ៖ ${prompt}`
        }
      ];
    }

    // ហៅប្រើប្រាស់ Gemini Model ស៊េរីថ្មីទ່ី SDK នេះស្គាល់ច្បាស់
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: contents,
    });

    const aiText = response.text || "មិនអាចបង្កើតអត្ថបទបានទេ សូមព្យាយាមម្ដងទៀត។";

    // ចែកចេញជា ៣ ជម្រើសស្អាតៗ (Options)
    const results = [
      `🔥 [បែបលក់ដាច់ខ្លាំង]\n${aiText}`,
      `💥 [បែបប្រូម៉ូសិនទាក់ទាញ]\n${aiText}\n\n✨ ពិសេសសម្រាប់ការបញ្ជាទិញថ្ងៃនេះ!`,
      `🎁 [បែប Storytelling]\nតើអ្នកកំពុងស្វែងរកផលិតផលបែបនេះមែនទេ?\n${aiText}\n\nInbox ឥឡូវនេះដើម្បីទទួលបានតម្លៃពិសេស!`
    ];

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}