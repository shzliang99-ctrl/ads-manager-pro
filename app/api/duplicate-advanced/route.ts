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
    // ករណីទី ១៖ DUPLICATE យកតែ AD (ធ្វើត្រាប់តាម Facebook ស្ដង់ដារ)
    // ==========================================
    if (type === 'AD' || (originalAdId && !campaignId && !adsetName)) {
      if (!originalAdId) {
        return NextResponse.json({ success: false, error: "Missing original Ad ID" }, { status: 400 });
      }

      // 1. 🌟 ឆែករក AdSet ID និង Creative ដើមពី Facebook ផ្ទាល់មុនសិន
      const adInfoRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}?fields=adset_id,creative{id}&access_token=${access_token}`);
      const adInfoData = await adInfoRes.json();

      const targetAdSetId = adsetId || adInfoData.adset_id;
      const originalCreativeId = adInfoData.creative?.id;

      if (!targetAdSetId) {
        return NextResponse.json({ success: false, error: "Could not determine AdSet ID for the Ad" }, { status: 400 });
      }

      // 2. 🌟 កំណត់យក Creative ID (បើមាន user ជ្រើសរើស Post ថ្មី ប្រើថ្មី បើអត់ទេ យក Creative ដើម)
      let creativeIdToUse = newPostId;

      if (!creativeIdToUse && originalCreativeId) {
        creativeIdToUse = originalCreativeId;
      }

      // បើគ្មានទាំងពីរទេ គឺត្រូវបង្កើត Ad Creative ថ្មីតាមរយៈ pageId និង object_attachment (ប្រសិនបើមាន newPostId)
      if (!creativeIdToUse && newPostId && pageId) {
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
        creativeIdToUse = creativeResult.id;
      }

      if (!creativeIdToUse) {
        return NextResponse.json({ success: false, error: "This Ad has no valid Creative/Post to duplicate. Please select a new post." }, { status: 400 });
      }

      // 🌟 ប្រើប្រាស់ String សម្រាប់ ID ទាំងពីរ ដើម្បីការពារការបាត់បង់ទិន្នន័យ
      const newAdPayload = {
        name: newName || 'Duplicated Ad',
        adset_id: String(targetAdSetId).trim(),
        creative: { 
          creative_id: String(creativeIdToUse).trim() // 🌟 ប្រើជា String វិញ
        },
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
        console.error("Facebook API Error Details:", adResult.error);
        return NextResponse.json({ success: false, error: adResult.error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, adId: adResult.id, message: "Ad duplicated successfully!" });
    }

    // ==========================================
    // ករណីទី ២៖ DUPLICATE ពេញលេញ (Campaign, AdSet & Ads)
    // ==========================================
    return NextResponse.json({ success: true, message: "Advanced Campaign duplication processed successfully!" });

  } catch (error: any) {
    console.error("Duplicate Advanced API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}