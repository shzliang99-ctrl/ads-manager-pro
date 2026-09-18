import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, newName, newPostId, pageId, access_token } = body;

    // 🌟 1. ពិនិត្យមើលសោរ Token
    if (!access_token) {
      return NextResponse.json({ success: false, error: "មិនមាន Access Token ទេ!" }, { status: 400 });
    }

    if (!campaignId) {
      return NextResponse.json({ success: false, error: "Missing Campaign ID" }, { status: 400 });
    }

    // ២. រក Ad ដំបូងគេនៅក្នុង Campaign ហ្នឹងដើម្បីយកមក Copy (កូដដើមរបស់បង)
    const adsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id,adset_id&access_token=${access_token}`);
    const adsData = await adsRes.json();
    
    if (adsData.error) throw new Error(adsData.error.message);
    if (!adsData.data || adsData.data.length === 0) throw new Error("យុទ្ធនាការនេះមិនទាន់មាន Ad ទេ!");
    
    const originalAdId = adsData.data[0].id;

    // ៣. ទាញយក Ad Set info ដើម្បីយក Ad Account ID
    const adSetsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,account_id&access_token=${access_token}`);
    const adSetsData = await adSetsRes.json();
    
    if (!adSetsData.data || adSetsData.data.length === 0) throw new Error("រកមិនឃើញ Ad Set ទេ។");
    const originalAdSet = adSetsData.data[0];
    const adAccountId = originalAdSet.account_id ? `act_${originalAdSet.account_id.replace('act_', '')}` : 'me';

    // ៤. បង្កើត Ad Creative ថ្មី (បើមានជ្រើសរើស Post ថ្មី)
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
      
      if (creativeData.error) throw new Error("មិនអាចបង្កើត Ad Creative ថ្មីបានទេ: " + creativeData.error.message);
      if (creativeData.id) newCreativeId = creativeData.id;
    }

    // ៥. Copy Ad ដើម (ដាក់ Paused សិន)
    const duplicateRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_option: 'PAUSED', access_token: access_token }),
    });

    const duplicateData = await duplicateRes.json();
    if (duplicateData.error) throw new Error("Copy Ad Error: " + duplicateData.error.message);
    
    const newAdId = duplicateData.copied_ad_id;
    let updatePayload: any = { access_token: access_token };

    // ៦. ដាក់ឈ្មោះ និង Creative ថ្មី
    if (newName) updatePayload.name = newName;
    if (newCreativeId) updatePayload.creative = { creative_id: newCreativeId };

    // ៧. Update ទៅកាន់ Ad ដែលទើបតែកូពីបានរួច
    if (updatePayload.name || updatePayload.creative) {
      const updateRes = await fetch(`https://graph.facebook.com/v18.0/${newAdId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const updateData = await updateRes.json();
      if (updateData.error) throw new Error("Update Ad Error: " + updateData.error.message);
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