import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { adName, spend, results, impressions, reach, ctr, cpa } = await request.json();

    const prompt = `
      អ្នកគឺជាអ្នកជំនាញខាង Meta Ads Marketing អាជីព។ សូមវិភាគទិន្នន័យ Facebook Ad នេះជាភាសាខ្មែរឱ្យបានច្បាស់លាស់៖
      - ឈ្មោះ Ad: ${adName || 'N/A'}
      - ប្រាក់ចំណាយ (Spend): $${spend || 0}
      - លទ្ធផលឆាត (Results): ${results || 0}
      - ការមើល (Impressions): ${impressions || 0}
      - CTR: ${ctr || 0}%
      - Cost Per Result (CPA): $${cpa || 0}

      សូមធ្វើការវាយតម្លៃ និងបែងចែកចំណាត់ថ្នាក់ជា ៣ កម្រិតណាមួយ៖
      1. "green" (ប្រសិនបើលទ្ធផលល្អ ចំណាយតិច បានឆាតច្រើន)
      2. "yellow" (ប្រសិនបើលទ្ធមធ្យម ធម្មតា)
      3. "red" (ប្រសិនបើខាតលុយ ស៊ីលុយច្រើនគ្មានលទ្ធផល ឬ CTR ទាបពេក)

      សូមឆ្លើយតបមកវិញជាទម្រង់ JSON សុទ្ធសាធ (មិនមាន Markdown formatting ដូចជា \`\`\`json ទេ) តាមទម្រង់ខាងក្រោមនេះ៖
      {
        "statusColor": "green ឬ yellow ឬ red",
        "title": "ចំណងជើងសង្ខេបជាភាសាខ្មែរ",
        "analysis": "ការពន្យល់លម្អិតជាភាសាខ្មែរពីមូលហេតុ និងចំណុចខ្សោយ",
        "recommendation": "យោបល់ ឬដំណោះស្រាយគួរធ្វើអ្វីបន្ត (ឧ. បន្ថែមលុយ ឬបិទចោល)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let textResponse = response.text || "{}";
    // សម្អាត Markdown formatting ចេញធានាថាបាន JSON ស្អាត
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonResult = JSON.parse(textResponse);

    return NextResponse.json({ success: true, audit: jsonResult });
  } catch (error: any) {
    console.error("AI Audit Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}