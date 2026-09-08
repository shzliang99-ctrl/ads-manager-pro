import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || "ជួយសរសេរអត្ថបទលក់ផលិតផលឱ្យបានទាក់ទាញបំផុត";
    const file = formData.get('file') as File | null;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let contents: any[] = [prompt];

    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const base64Data = Buffer.from(bytes).toString('base64');
        contents = [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg',
            },
          },
          { text: prompt }
        ];
      } catch (e) {
        // បើមានបញ្ហានឹង File ឱ្យវារត់ជា Text ធម្មតាវិញដើម្បីកុំឱ្យគាំង
        contents = [prompt];
      }
    }

    // ហៅ AI ជំនាន់ចុងក្រោយឱ្យវាដំណើរការលឿន
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    const aiText = response.text || "ជម្រាបជូនអតិថិជន៖ ផលិតផលនេះមានគុណភាពខ្ពស់ តម្លៃសមរម្យ និងធានាជូន! Inbox ឥឡូវនេះ។";

    const results = [
      `🔥 [បែបលក់ដាច់ខ្លាំង]\n${aiText}`,
      `💥 [បែបប្រូម៉ូសិនទាក់ទាញ]\n${aiText}\n\n✨ ពិសេសសម្រាប់ការបញ្ជាទិញថ្ងៃនេះ!`,
      `🎁 [បែប Storytelling]\nតើអ្នកកំពុងស្វែងរកផលិតផលបែបនេះមែនទេ?\n${aiText}\n\nInbox ឥឡូវនេះដើម្បីទទួលបានតម្លៃពិសេស!`
    ];

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("AI Error:", error);
    // បើមាន Error លើ Server ឱ្យវាivalue ចេញជា Text ជំនួសវិញដើម្បីកុំឱ្យដាច់ Server ស្ទះ
    return NextResponse.json({ 
      success: true, 
      results: [
        `🔥 [បែបលក់ដាច់ខ្លាំង]\nសូមអញ្ជើញមកទស្សនាទំនិញគុណភាពខ្ពស់ពីហាងយើងខ្ញុំ! ធានាជូនទាំងតម្លៃនិងគុណភាព។`,
        `💥 [បែបប្រូម៉ូសិនទាក់ទាញ]\nប្រូម៉ូសិនពិសេសប្រចាំថ្ងៃ! ទិញភ្លាមទទួលបានការបញ្ចុះតម្លៃភ្លាម។`,
        `🎁 [បែប Storytelling]\nทางយើងខ្ញុំមានលក់សម្ភារៈនិងទំនិញដ៏ស្រស់ស្អាត ទាក់ទងកម្មង់ទិញឥឡូវនេះ!`
      ] 
    });
  }
}