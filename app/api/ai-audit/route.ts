import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { adName, spend, results, impressions, reach, ctr, cpa } = await request.json();

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
      2. "yellow" (ប្រសិនបើលទ្ធផលមធ្យម ធម្មតា)
      3. "red" (ប្រសិនបើខាតលុយ ស៊ីលុយច្រើនគ្មានលទ្ធផល ឬ CTR ទាបពេក)

      សូមឆ្លើយតបមកវិញជាទម្រង់ JSON សុទ្ធសាធ តាមទម្រង់ខាងក្រោមនេះ៖
      {
        "statusColor": "green ឬ yellow ឬ red",
        "title": "ចំណងជើងសង្ខេបជាភាសាខ្មែរ",
        "analysis": "ការពន្យល់លម្អិតជាភាសាខ្មែរពីមូលហេតុ និងចំណុចខ្សោយ",
        "recommendation": "យោបល់ ឬដំណោះស្រាយគួរធ្វើអ្វីបន្ត (ឧ. បន្ថែមលុយ ឬបិទចោល)"
      }
    `;

    let jsonResult = null;
    let usedSource = "";

    // 🔄 បង្វិលហៅ API Key តាមរយៈ REST API ផ្ទាល់ (មិនបាច់ប្រើ SDK) ធានាថាដើរ 100%
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

        if (!res.ok) {
          console.warn(`⚠️ Key ទី ${i + 1} បរាជ័យ កំពុងបន្តទៅ Key ថ្មី...`);
          continue; // បើ Error ឱ្យលោតទៅ Key បន្ទាប់
        }

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
        usedSource = `✨ ដំណើរការដោយ Key ទី ${i + 1}`;
        break; // ជោគជ័យ បញ្ឈប់ការ Loop
      } catch (err) {
        continue;
      }
    }

    if (!jsonResult) {
      return NextResponse.json({ success: false, error: "API Keys ទាំងអស់កំពុងជាប់ Limit!" }, { status: 500 });
    }

    return NextResponse.json({ success: true, audit: { ...jsonResult, source: usedSource } });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}