import { NextResponse } from 'next/server';

// 🌟 មុខងារបកប្រែ Error របស់ Facebook មកជាភាសាខ្មែរឱ្យងាយយល់
const translateFBError = (errMsg: string) => {
  if (!errMsg) return "មានបញ្ហាមិនស្គាល់មួយបានកើតឡើងក្នុងប្រព័ន្ធ។";
  if (errMsg.includes("Invalid parameter")) return "ទិន្នន័យដែលបានបញ្ជូនទៅកាន់ Facebook មិនត្រឹមត្រូវ។ សូមពិនិត្យមើលម្ដងទៀត។";
  if (errMsg.includes("Permissions error")) return "គណនីរបស់អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ទេ។";
  return errMsg;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      campaignId,          // Campaign មេដែលត្រូវយក Ad Set ទៅដាក់ចូល
      originalAdSetId,     // Ad Set ដើមដែលត្រូវ Copy
      newAdSetName,        // ឈ្មោះ Ad Set ថ្មី
      targeting,           // Targeting / Interests ថ្មី
      ageMin, ageMax,      // អាយុ
      gender,              // ភេទ
      postUrl,             // 🌟 Post ID ឬ URL ថ្មីដែលបានជ្រើសរើសពី Modal
      callToAction,        // ប៊ូតុងទំនាក់ទំនង
      access_token,        // Token របស់អតិថិជន
      adAccountId          // Ad Account ID
    } = body;

    const accessToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    const rawAdAccountId = adAccountId || process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (!accessToken || !rawAdAccountId || !campaignId || !originalAdSetId) {
      throw new Error("ប្រព័ន្ធខ្វះព័ត៌មានសំខាន់ៗ (Token, Ad Account ID, Campaign ID ឬ AdSet ID)។");
    }

    const targetAdAccountId = rawAdAccountId.startsWith('act_') ? rawAdAccountId : `act_${rawAdAccountId}`;

    // ជំហានទី ១៖ ទាញយកទិន្នន័យពី Ad Set ដើមមកធ្វើជាមូលដ្ឋាន
    const originalAdSetRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdSetId}?fields=name,optimization_goal,billing_event,bid_strategy,daily_budget,lifetime_budget,targeting&access_token=${accessToken}`);
    const originalAdSetData = await originalAdSetRes.json();

    if (originalAdSetData.error) {
      throw new Error(`AdSet ដើមមានបញ្ហា: ${translateFBError(originalAdSetData.error.message)}`);
    }

    // រៀបចំ Targeting Data ថ្មី
    let targetingData = originalAdSetData.targeting || {};
    if (ageMin) targetingData.age_min = Number(ageMin);
    if (ageMax) targetingData.age_max = Number(ageMax);
    
    if (targeting && targeting.trim() !== "") {
      targetingData.interests = targeting.split(',').map((item: string) => ({ name: item.trim() }));
    }

    // ជំហានទី ២៖ បង្កើត Ad Set ថ្មីក្រោម Campaign មេ
    const createAdSetPayload: any = {
      name: newAdSetName || `${originalAdSetData.name} - Copy`,
      campaign_id: campaignId,
      optimization_goal: originalAdSetData.optimization_goal || 'REPLIES',
      billing_event: originalAdSetData.billing_event || 'IMPRESSIONS',
      bid_strategy: originalAdSetData.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
      targeting: targetingData,
      status: 'ACTIVE',
      access_token: accessToken
    };

    if (originalAdSetData.daily_budget) {
      createAdSetPayload.daily_budget = originalAdSetData.daily_budget;
    } else if (originalAdSetData.lifetime_budget) {
      createAdSetPayload.lifetime_budget = originalAdSetData.lifetime_budget;
    }

    const newAdSetRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createAdSetPayload)
    });

    const newAdSetData = await newAdSetRes.json();
    if (newAdSetData.error) {
      throw new Error(`បង្កើត Ad Set ថ្មីធ្លាក់: ${translateFBError(newAdSetData.error.message)}`);
    }

    const newAdSetId = newAdSetData.id;

    // ជំហានទី ៣៖ បង្កើត Ad ថ្មី (ឆែកមើលថាតើមាន Post ID ថ្មី ឬត្រូវប្រើ Post ដើម)
    let creativeIdToUse = null;

    if (postUrl && postUrl.trim() !== "") {
      // បើមានជ្រើសរើស Post ID ថ្មី យកវាទៅបង្កើត AdCreative ថ្មី
      const cleanPostId = postUrl.includes('_') ? postUrl.split('_').pop() : postUrl;
      
      // រកមើល Page ID ដើម្បីផ្សារភ្ជាប់ជាមួយ Post
      const postCreativeRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_story_id: postUrl.includes('_') ? postUrl : `${body.pageId || ''}_${postUrl}`,
          call_to_action: {
            type: callToAction || 'SEND_MESSAGE',
            value: { link: `https://www.facebook.com/${postUrl}` }
          },
          access_token: accessToken
        })
      });
      const postCreativeData = await postCreativeRes.json();
      if (postCreativeData.id) {
        creativeIdToUse = postCreativeData.id;
      }
    }

    // បើគ្មាន Post ID ថ្មីទេ គឺទាញយក Creative របស់ Ad ដើមមកប្រើប្រាស់ជំនួស
    if (!creativeIdToUse) {
      const adsRes = await fetch(`https://graph.facebook.com/v18.0/${originalAdSetId}/ads?fields=name,creative{id}&access_token=${accessToken}`);
      const adsData = await adsRes.json();
      if (adsData.data && adsData.data.length > 0) {
        creativeIdToUse = adsData.data[0].creative?.id;
      }
    }

    // បញ្ចូល Ad ថ្មីទៅក្នុង Ad Set ថ្មី
    if (creativeIdToUse) {
      await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newAdSetName} - Ad`,
          adset_id: newAdSetId,
          creative: { creative_id: creativeIdToUse },
          status: 'ACTIVE',
          access_token: accessToken
        })
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "🎉 Duplicate Ad Set & Ads បានជោគជ័យ ១០០%!", 
      adsetId: newAdSetId 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}