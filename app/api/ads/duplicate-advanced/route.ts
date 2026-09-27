import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalAdId, newName, newPostId, pageId, access_token, adAccountId } = body;

    if (!access_token || !originalAdId) {
      return NextResponse.json({ success: false, error: "ខ្វះ Token ឬ Ad ID" }, { status: 400 });
    }

    const cleanToken = access_token.replace(/['"]+/g, '').trim();
    const cleanAdAccountId = (adAccountId || '').replace('act_', '').trim();

    // ១. ទាញយក adset_id ពី Ad ដើម
    const adRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}?fields=adset_id,name&access_token=${cleanToken}`);
    const adData = await adRes.json();
    if (adData.error) throw new Error(adData.error.message);

    const targetAdsetId = adData.adset_id;
    let creativeIdToUse = "";

    // ២. បំប្លែង Post ID (ឧ. 1102_1175) ទៅជាលេខ Creative ID សុទ្ធ 100% តាមរយៈ Facebook API
    if (newPostId) {
      const rawPostId = String(newPostId).trim();
      let objectStoryId = rawPostId;

      // បើគ្មានសញ្ញា _ ទេ ហើយ Page ID មាន គឺផ្គុំចូលគ្នា
      if (!rawPostId.includes('_') && pageId) {
        objectStoryId = `${pageId}_${rawPostId}`;
      } else if (rawPostId.includes('_')) {
        objectStoryId = rawPostId;
      }

      // បង្កើត Ad Creative ថ្មី ដើម្បីទាញយកលេខ ID ជាតួលេខសុទ្ធ
      const creativeRes = await fetch(`https://graph.facebook.com/v18.0/act_${cleanAdAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newName || 'Duplicated Ad'} - Creative`,
          object_story_id: objectStoryId,
          access_token: cleanToken
        })
      });
      const creativeData = await creativeRes.json();

      if (creativeData.error) {
        throw new Error("មិនអាចបង្កើត Creative ពី Post នេះបានទេ: " + creativeData.error.message);
      }

      creativeIdToUse = String(creativeData.id);
    }

    // ពិនិត្យបញ្ជាក់ថា creativeIdToUse ពិតជាលេខសុទ្ធ
    if (!creativeIdToUse || !/^\d+$/.test(creativeIdToUse)) {
      throw new Error("Creative ID មិនមែនជាតួលេខសុទ្ធ: " + creativeIdToUse);
    }

    // ៣. បង្កើត Ad ថ្មី (Duplicate Ad) ក្រោម Ad Set ដើមដោយជោគជ័យ
    const createAdRes = await fetch(`https://graph.facebook.com/v18.0/act_${cleanAdAccountId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName || `${adData.name} - Copy`,
        adset_id: targetAdsetId,
        creative: { creative_id: creativeIdToUse },
        status: 'PAUSED',
        access_token: cleanToken
      })
    });
    const newAdData = await createAdRes.json();

    if (newAdData.error) {
      throw new Error(newAdData.error.message);
    }

    return NextResponse.json({ success: true, adId: newAdData.id });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}