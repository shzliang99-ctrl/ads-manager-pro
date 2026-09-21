import { NextResponse } from 'next/server';
import { checkRateLimit } from '../middleware/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 15, 60000)) { 
      return NextResponse.json({ success: false, error: "⚠️ សំណូមពរច្រើនហួសហេតុពេក!" }, { status: 429 });
    }

    const body = await request.json();
    const { campaignId, newName, newPostId, pageId, access_token } = body;

    // 🌟 ប្រើប្រាស់ Token របស់ User ដែលផ្ញើមកផ្ទាល់ (ធានាថាមិនខុស Account / Page)
    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    if (!campaignId) {
      return NextResponse.json({ success: false, error: "Missing Campaign ID" }, { status: 400 });
    }

    // ១. រក Ad ដំបូងគេនៅក្នុង Campaign ហ្នឹងដើម្បីយកមក Copy
    const adsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id&access_token=${clientToken}`);
    const adsData = await adsRes.json();
    
    if (adsData.error) throw new Error(adsData.error.message);
    if (!adsData.data || adsData.data.length === 0) throw new Error("យុទ្ធនាការនេះមិនទាន់មាន Ad ទេ!");
    
    const originalAdId = adsData.data[0].id;

    // ២. ទាញយក Ad Account ID ឱ្យបានត្រឹមត្រូវពី Campaign ឬ Ad Set
    const adSetsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,account_id&access_token=${clientToken}`);
    const adSetsData = await adSetsRes.json();
    
    let adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || '';
    if (adSetsData.data && adSetsData.data.length > 0 && adSetsData.data[0].account_id) {
      const rawAcc = adSetsData.data[0].account_id;
      adAccountId = rawAcc.startsWith('act_') ? rawAcc : `act_${rawAcc}`;
    } else if (!adAccountId.startsWith('act_')) {
      adAccountId = `act_${adAccountId}`;
    }

    // ៣. បើមានការជ្រើសរើស Post ថ្មី ត្រូវបង្កើត Ad Creative ថ្មីជាមុនសិន
    let newCreativeId = null;
    if (newPostId && pageId) {
      const objectStoryId = newPostId.includes('_') ? newPostId : `${pageId}_${newPostId}`;
      
      const creativeRes = await fetch(`https://graph.facebook.com/v18.0/${adAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: clientToken,
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

    // ៤. Copy Ad ដើម (ដាក់ Active ស្រាប់)
    const duplicateRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_option: 'ACTIVE', access_token: clientToken }),
    });

    const duplicateData = await duplicateRes.json();
    if (duplicateData.error) throw new Error(duplicateData.error.message);
    
    const newAdId = duplicateData.copied_ad_id;
    let updatePayload: any = { access_token: clientToken };

    // ៥. ដាក់ឈ្មោះថ្មីចូល Payload (បើមាន)
    if (newName) updatePayload.name = newName;

    // ៦. ដាក់ Creative ID ថ្មី (ស្បែកជើង) ចូល Payload
    if (newCreativeId) {
      updatePayload.creative = { creative_id: newCreativeId };
    }

    // ៧. Update ឈ្មោះ និង Creative ទៅកាន់ Ad ដែលទើបតែកូពីបានរួច
    const updateRes = await fetch(`https://graph.facebook.com/v18.0/${newAdId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    
    const updateData = await updateRes.json();
    if (updateData.error) {
      throw new Error("Copy បាន ប៉ុន្តែមិនអាច Update ឈ្មោះ ឬ Post ថ្មីបានទេ: " + updateData.error.message);
    }

    return NextResponse.json({
      success: true,
      message: "បាន Duplicate និងផ្លាស់ប្តូរ Post ថ្មីដោយជោគជ័យ!",
      newAdId: newAdId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}