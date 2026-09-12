import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { adName, spend, results, impressions, reach, ctr, cpa } = await request.json();

    // 🔑 ប្រមូលបញ្ជី API Keys ទាំងអស់
    const apiKeys = [
      { name: 'Gemini Key #1', key: process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY },
      { name: 'Gemini Key #2', key: process.env.GEMINI_API_KEY_2 },
      { name: 'Gemini Key #3', key: process.env.GEMINI_API_KEY_3 },
      { name: 'Gemini Key #4', key: process.env.GEMINI_API_KEY_4 },
    ].filter(item => item.key && item.key.length > 10 && !item.key.includes("xxxx"));

    if (apiKeys.length === 0) {
      return NextResponse.json({ success: false, error: "រកមិនឃើញ API Key ត្រឹមត្រូវក្នុង .env.local ទេ។" }, { status: 500 });
    }

    const prompt = `
      អ្នកគឺជាអ្នកជំនាញខាង Meta Ads Marketing អាជីព។ សូមវិភាគទិន្នន័យ Facebook Ad នេះជាភាសាខ្មែរឱ្យបានច្បាស់លាស់៖
      - ឈ្មោះ Ad: ${adName || 'N/A'}
      - ប្រាក់ចំណាយ (Spend): $${spend || 0}
      - លទ្ធផលឆាត (Results): ${results || 0}
      - ការមើល (Impressions): ${impressions || 0}
      - ការទៅដល់ (Reach): ${reach || 0}
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

    let jsonResult = null;
    let usedSource = "";

    // 🔄 វដ្តប្តូរវេនហៅ API Key នីមួយៗ
    for (let i = 0; i < apiKeys.length; i++) {
      const item = apiKeys[i];
      try {
        console.log(`➡️ កំពុងព្យាយាមហៅ ${item.name}...`);
        
        const ai = new GoogleGenAI({ apiKey: item.key });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        let textResponse = response.text || "{}";
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        if (textResponse) {
          jsonResult = JSON.parse(textResponse);
          usedSource = `✨ ដំណើរការដោយ៖ ${item.name}`; // 👈 ចេញមកជា Gemini Key #1, #2, #3, #4
          console.log(`✅ ជោគជ័យជាមួយ ${item.name}`);
          break;
        }
      } catch (err: any) {
        console.warn(`⚠️ ${item.name} Error: ${err.message} -> កំពុងប្តូរទៅ Key បន្ទាប់...`);
        continue;
      }
    }

    if (!jsonResult) {
      return NextResponse.json({ success: false, error: "API Keys ទាំងអស់កំពុងជាប់ Limit ឬមានបញ្ហា។" }, { status: 500 });
    }

    // 📤 បញ្ជូនលទ្ធផលរួមជាមួយ source ទៅកាន់ Frontend
    return NextResponse.json({ 
      success: true, 
      audit: { 
        ...jsonResult, 
        source: usedSource 
      } 
    });

  } catch (error: any) {
    console.error("AI Audit Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}