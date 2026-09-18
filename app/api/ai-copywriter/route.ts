import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || "ជួយសរសេរអត្ថបទលក់ផលិតផលក្នុងរូបភាពនេះឱ្យបានទាក់ទាញបំផុត";
    const file = formData.get('file') as File | null;
    
    // ទាញយក API Key
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "មិនមាន API Key ទេ!" }, { status: 400 });
    }

    let parts: any[] = [];

    // ប្រសិនបើមាន Upload រូបភាព យើងបម្លែងវាជា Base64 
    if (file) {
      const bytes = await file.arrayBuffer();
      const base64Data = Buffer.from(bytes).toString('base64');
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'image/jpeg'
        }
      });
      parts.push({
        text: `ផ្អែកលើរូបភាព/វីដេអូដែលបានផ្ដល់ជូននេះ សូមជួយសរសេរអត្ថបទផ្សាយពាណិជ្ជកម្ម (Copywriting) ជាភាសាខ្មែរឱ្យទាក់ទាញបំផុត តាមសំណើ៖ ${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }

    // 🌟 ប្រើប្រាស់ Fetch ហៅទៅកាន់ API ផ្ទាល់ (ធានាដើរ ១០០% មិនខ្វល់រឿង Library ចាស់)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      })
    });

    const data = await response.json();

    // ចាប់យក Error ប្រសិនបើមានបញ្ហាពី Server របស់ Google
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Gemini API");
    }

    // ទាញយកអត្ថបទដែល AI សរសេរបាន
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "មិនអាចបង្កើតអត្ថបទបានទេ សូមព្យាយាមម្ដងទៀត។";

    // បំបែកជា ៣ ជម្រើស
    const results = [
      `🔥 [បែបលក់ដាច់ខ្លាំង]\n${aiText}`,
      `💥 [បែបប្រូម៉ូសិនទាក់ទាញ]\n${aiText}\n\n✨ ពិសេសសម្រាប់ការបញ្ជាទិញថ្ងៃនេះ!`,
      `🎁 [បែប Storytelling]\nតើអ្នកកំពុងស្វែងរកផលិតផលបែបនេះមែនទេ?\n${aiText}\n\nInbox ឥឡូវនេះដើម្បីទទួលបានតម្លៃពិសេស!`
    ];

    return NextResponse.json({ success: true, results, text: aiText });

  } catch (error: any) {
    console.error("AI Copywriter API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}