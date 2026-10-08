import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product) {
      return NextResponse.json({ success: false, error: "Missing product description" }, { status: 400 });
    }

    // 🔑 ប្រមូលបញ្ជី API Keys ទាំងអស់
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6,
    ].filter(key => typeof key === 'string' && key.length > 20);

    if (apiKeys.length === 0) {
      return NextResponse.json({ success: false, error: "រកមិនឃើញ API Keys ក្នុង .env.local ទេ" }, { status: 500 });
    }

    const prompt = `
    You are an expert Facebook Ads Manager in Cambodia. 
    Based on the product/service description provided by the user, generate optimized Facebook Ad targeting, naming parameters, and placement type in strict JSON format.

    Product Description: "${product}"

    Return ONLY a valid JSON object with the following keys and NO markdown formatting (no backticks):
    {
      "campaignName": "A catchy campaign name in English or Khmer",
      "adsetName": "An optimized ad set name",
      "ageMin": 18,
      "ageMax": 50,
      "gender": "ALL",
      "targeting": "Comma-separated list of relevant Facebook detailed targeting interests in English",
      "placementType": "photo"
    }
    `;

    let jsonResult = null;

    // 🔄 បង្វិលហៅ API Key តាមរយៈ REST API ផ្ទាល់
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const apiKey = apiKeys[i];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!res.ok) continue;

        const data = await res.json();
        let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // សម្អាត JSON
        textResponse = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          textResponse = textResponse.substring(firstBrace, lastBrace + 1);
        }

        jsonResult = JSON.parse(textResponse);
        break; // ជោគជ័យ បញ្ឈប់ការ Loop
      } catch (err) {
        continue;
      }
    }

    if (!jsonResult) {
      return NextResponse.json({ success: false, error: "API Keys ទាំងអស់កំពុងជាប់ Limit ឬមិនអាចប្រើបាន។" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: jsonResult });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}