import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      type, // 'CAMPAIGN' ឬ 'AD' សម្រាប់បែងចែកមុខងារ
      campaignId, 
      originalAdId, 
      adsetId,
      newName, 
      newPostId, 
      pageId, 
      access_token, 
      adAccountId,
      // សម្រាប់ករណី Campaign Duplicate Advanced ពេញលេញ
      adsetName,
      objective,
      conversionLocation,
      performanceGoal,
      callToAction,
      ageMin,
      ageMax,
      gender,
      location,
      targeting,
      placementType,
      deviceType,
      osType,
      wifiOnly,
      platforms,
      detailedPlacements,
      budgetType,
      budget,
      duration 
    } = body;

    if (!access_token || !adAccountId) {
      return NextResponse.json({ success: false, error: "Missing required Token or Ad Account ID" }, { status: 400 });
    }

    const cleanActId = adAccountId.replace('act_', '');

    // ==========================================
    // ករណីទី ១៖ DUPLICATE យកតែ AD (ហៅពី Tab ADS)
    // ==========================================
    if (type === 'AD' || (originalAdId && !campaignId && !adsetName)) {
      if (!originalAdId || !newPostId) {
        return NextResponse.json({ success: false, error: "Missing original Ad ID or new Post ID for Ad duplication" }, { status: 400 });
      }

      // 1. រកមើល AdSet ID របស់ Ad ដើម ប្រសិនបើគ្មានបញ្ជូនមក
      let targetAdSetId = adsetId;
      if (!targetAdSetId) {
        const adInfoRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}?fields=adset_id&access_token=${access_token}`);
        const adInfoData = await adInfoRes.json();
        targetAdSetId = adInfoData.adset_id;
      }

      if (!targetAdSetId) {
        return NextResponse.json({ success: false, error: "Could not determine AdSet ID for the Ad" }, { status: 400 });
      }

      // 2. បង្កើត Ad Creative ថ្មីជាមួយ Post ID ថ្មី
      const creativePayload = {
        name: `${newName || 'Duplicated Ad'} - Creative`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            object_attachment: newPostId
          }
        },
        access_token: access_token
      };

      const createCreativeRes = await fetch(`https://graph.facebook.com/v18.0/act_${cleanActId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload)
      });
      const creativeResult = await createCreativeRes.json();

      if (creativeResult.error) {
        throw new Error(creativeResult.error.message);
      }

      // 3. បង្កើត Ad ថ្មីដាក់ក្រោម Ad Set ដើម
      const newAdPayload = {
        name: newName || 'Duplicated Ad',
        adset_id: targetAdSetId,
        creative: { creative_id: creativeResult.id },
        status: 'PAUSED',
        access_token: access_token
      };

      const createAdRes = await fetch(`https://graph.facebook.com/v18.0/act_${cleanActId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdPayload)
      });
      const adResult = await createAdRes.json();

      if (adResult.error) {
        throw new Error(adResult.error.message);
      }

      return NextResponse.json({ success: true, adId: adResult.id, message: "Ad duplicated successfully!" });
    }

    // ==========================================
    // ករណីទី ២៖ DUPLICATE ពេញលេញ (Campaign, AdSet & Ads)
    // ==========================================
    // (រក្សាក្បួនកូដ Duplicate Campaign ពេញលេញដដែលរបស់បងនៅទីនេះ)
    return NextResponse.json({ success: true, message: "Advanced Campaign duplication processed successfully!" });

  } catch (error: any) {
    console.error("Duplicate Advanced API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}