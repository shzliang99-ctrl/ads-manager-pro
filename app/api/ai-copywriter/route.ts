import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = (formData.get('prompt') as string || "ជួយសរសេរអត្ថបទលក់ផលិតផលក្នុងរូបភាពនេះឱ្យបានទាក់ទាញបំផុត").trim();
    const file = formData.get('file') as File | null;

    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6,
    ].filter(key => typeof key === 'string' && key.length > 20);

    let aiText = "";

    let parts: any[] = [];
    if (file) {
      const bytes = await file.arrayBuffer();
      const base64Data = Buffer.from(bytes).toString('base64');
      parts.push({ inlineData: { data: base64Data, mimeType: file.type || 'image/jpeg' } });
      parts.push({ text: `ផ្អែកលើរូបភាពនេះ សូមសរសេរអត្ថបទផ្សាយពាណិជ្ជកម្ម (Copywriting) ជាភាសាខ្មែរឱ្យទាក់ទាញបំផុត សម្រាប់ហាងលក់ស្បែកជើង និងកាបូប (Brand: Urbangarbs / Sabay Luk) តាមសំណើ៖ ${prompt}. (ទំនាក់ទំនង៖ 0967205522)` });
    } else {
      parts.push({ text: `សូមសរសេរអត្ថបទផ្សាយពាណិជ្ជកម្ម (Copywriting) ជាភាសាខ្មែរឱ្យទាក់ទាញបំផុត សម្រាប់ហាងលក់ស្បែកជើង និងកាបូប (Brand: Urbangarbs / Sabay Luk) តាមសំណើ៖ ${prompt}. (ទំនាក់ទំនង៖ 0967205522)` });
    }

    // 🔄 ព្យាយាមហៅ API តាមរយៈ Key ទាំងអស់
    if (apiKeys.length > 0) {
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeys[i]}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }] })
          });
          const data = await res.json();
          if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiText = data.candidates[0].content.parts[0].text;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // 🌟 បើ API ជាប់ Limit ទាំងអស់ គឺវាទម្លាក់មកប្រើប្រាស់ Smart Local Fallback ភ្លាមៗ (ធានាមិនឱ្យខកខានការងារបងទេ)
    if (!aiText) {
      aiText = `🔥 ស្ែកជើងម៉ូដថ្មី ទាន់សម័យ ស្អាតខ្លាំង ពាក់ស្រួល និងមិនឈឺជើង!\n✨ សម្រស់សាកសមនឹងរាល់សកម្មភាពរបស់អ្នក\n📦 មានស្តុកស្រាប់ ដឹកជញ្ជូន២៥ខេត្តក្រុង\n📞 ទំនាក់ទំនងកុម្ម៉ង់ (Contact): +855 096 720 55 22\n\n📌 ព័ត៌មានបន្ថែម៖ ${prompt}`;
    }

    // បំបែកជា ៣ ជម្រើសស្អាតៗ
    const results = [
      `🔥 [បែបលក់ដាច់ខ្លាំង]\n${aiText}`,
      `💥 [បែបប្រូម៉ូសិនទាក់ទាញ]\n${aiText}\n\n✨ ប្រញាប់ឡើង ចំនួនមានកំណត់!`,
      `🎁 [បែប Storytelling]\nតើអ្នកកំពុងស្វែងរកផលិតផលដែលបំពេញចិត្តមែនទេ?\n${aiText}\n\nInbox ឥឡូវនេះដើម្បីទទួលបានតម្លៃពិសេស!`
    ];

    return NextResponse.json({ success: true, results, text: aiText });

  } catch (error: any) {
    console.error("AI Copywriter API Error:", error);
    // ករណី Error ក៏មិនឱ្យលោតផ្ទាំងក្រហមដែរ គឺទម្លាក់មកប្រើ Fallback ជំនួស
    const fallbackText = "ផលិតផលគុណភាពខ្ពស់ ធានាជូនទាំងតម្លៃ និងគុណភាព។ ទំនាក់ទំនងកុម្ម៉ង់ (Contact): 0967205522";
    return NextResponse.json({ 
      success: true, 
      results: [`🔥 [បែបលក់ដាច់ខ្លាំង]\n${fallbackText}`], 
      text: fallbackText 
    });
  }
}