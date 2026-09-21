import { NextResponse } from 'next/server';
import { checkRateLimit } from '../middleware/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 15, 60000)) { 
      return NextResponse.json({ success: false, error: "⚠️ សំណូមពរច្រើនហួសហេតុពេក!" }, { status: 429 });
    }

    const body = await request.json();
    // 🌟 ប្ដូរមកទទួល adId ជំនួសឱ្យការទាញយកពី Campaign ID
    const { adId, campaignId, newName, newPostId, pageId, access_token } = body;

    if (!access_token) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    // យក adId ផ្ទាល់ពី Ad ដែរបងបាន Select (បើគ្មាន ទើប fallback ទៅរក campaignId ដើម)
    let targetAdId = adId;
    if (!targetAdId && campaignId) {
      const adsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id&access_token=${access_token}`);
      const adsData = await adsRes.json();
      if (adsData.data && adsData.data.length > 0) {
        targetAdId = adsData.data[0].id;
      }
    }

    if (!targetAdId) {
      return NextResponse.json({ success: false, error: "Missing Ad ID to Duplicate" }, { status: 400 });
    }

    // ទាញយក Ad Account ID តាមរយៈ Ad ID ផ្ទាល់
    const adInfoRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdId}?fields=account_id,adset_id&access_token=${access_token}`);
    const adInfoData = await adInfoRes.json();
    
    if (adInfoData.error) throw new Error(adInfoData.error.message);
    const adAccountId = adInfoData.account_id ? `act_${adInfoData.account_id.replace('act_', '')}` : 'me';

    // ១. បង្កើត Ad Creative ថ្មីពី Post ថ្មីដែលបងបាន Select យ៉ាងត្រឹមត្រូវ
    let newCreativeId = null;
    if (newPostId && pageId) {
      const objectStoryId = newPostId.includes('_') ? newPostId : `${pageId}_${newPostId}`;
      
      const creativeRes = await fetch(`https://graph.facebook.com/v18.0/${adAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: access_token,
          name: `Creative for ${newName || newPostId}`,
          object_story_id: objectStoryId 
        }),
      });
      const creativeData = await creativeRes.json();
      
      if (creativeData.error) {
        throw new Error("មិនអាចបង្កើត Ad Creative ថ្មីបានទេ: " + creativeData.error.message);
      }
      if (creativeData.id) {
        newCreativeId = creativeData.id;
      }
    }

    if (!newCreativeId) {
      throw new Error("⚠️ សូមជ្រើសរើស Post ថ្មីឱ្យបានត្រឹមត្រូវជាមុនសិន!");
    }

    // ២. Copy Ad គោលដៅពិតប្រាកដ និងបំពាក់ Creative ថ្មីចូលទៅជាមួយគ្នា
    const duplicateRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status_option: 'ACTIVE', 
        access_token: access_token,
        name: newName || "New Ad - Copy",
        creative: { creative_id: newCreativeId } // 👈 ស្បែកជើងថ្មីដែលបង Select នឹងចូលទីនេះ ១០០%
      }),
    });

    const duplicateData = await duplicateRes.json();
    if (duplicateData.error) throw new Error("Copy Ad Error: " + duplicateData.error.message);
    
    const newAdId = duplicateData.copied_ad_id;

    return NextResponse.json({
      success: true,
      message: "បាន Duplicate យក Post ថ្មីនៅកម្រិត Ads ដោយជោគជ័យ!",
      newAdId: newAdId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}