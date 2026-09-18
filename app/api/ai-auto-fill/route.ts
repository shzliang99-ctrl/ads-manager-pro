import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ហៅយក Gemini API Key ពី Environment Variables
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product) {
      return NextResponse.json({ success: false, error: "Missing product description" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // 🌟 ប្រើប្រាស់ Model ស្តង់ដារដែលដំណើរការបានរលូនបំផុត
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // សម្អាត Format ឱ្យចេញមកជា JSON សុទ្ធ ១០០% មិនឱ្យបែក Error ពេល Parse
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    const jsonResult = JSON.parse(text);

    return NextResponse.json({ success: true, result: jsonResult });
  } catch (error: any) {
    console.error("AI Auto-Fill API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}