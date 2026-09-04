import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, newName, newPostId, pageId } = body;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (!campaignId) throw new Error("Missing Campaign ID");

    // ១. រក Ad ដំបូងគេនៅក្នុង Campaign ហ្នឹងដើម្បីយកមក Copy
    const adsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id&access_token=${accessToken}`);
    const adsData = await adsRes.json();
    
    if (adsData.error) throw new Error(adsData.error.message);
    if (!adsData.data || adsData.data.length === 0) throw new Error("យុទ្ធនាការនេះមិនទាន់មាន Ad ទេ!");
    
    const originalAdId = adsData.data[0].id;

    // ២. បើមានការជ្រើសរើស Post ថ្មី ត្រូវបង្កើត Ad Creative ថ្មីជាមុនសិន
    let newCreativeId = null;
    if (newPostId && pageId) {
      const objectStoryId = newPostId.includes('_') ? newPostId : `${pageId}_${newPostId}`;
      
      const creativeRes = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
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

    // ៣. Copy Ad ដើម (ដាក់ Paused សិន)
    const duplicateRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdId}/copies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_option: 'PAUSED', access_token: accessToken }),
    });

    const duplicateData = await duplicateRes.json();
    if (duplicateData.error) throw new Error(duplicateData.error.message);
    
    const newAdId = duplicateData.copied_ad_id;
    let updatePayload: any = { access_token: accessToken };

    // ៤. ដាក់ឈ្មោះថ្មីចូល Payload (បើមាន)
    if (newName) updatePayload.name = newName;

    // ៥. ដាក់ Creative ID ថ្មីចូល Payload (បើមាន)
    if (newCreativeId) {
      updatePayload.creative = { creative_id: newCreativeId };
    }

    // ៦. Update ឈ្មោះ និង Creative ទៅកាន់ Ad ដែលទើបតែកូពីបានរួច
    if (updatePayload.name || updatePayload.creative) {
      const updateRes = await fetch(`https://graph.facebook.com/v18.0/${newAdId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const updateData = await updateRes.json();
      if (updateData.error) {
        throw new Error("Copy បាន ប៉ុន្តែមិនអាច Update ឈ្មោះ ឬ Post ថ្មីបានទេ: " + updateData.error.message);
      }
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