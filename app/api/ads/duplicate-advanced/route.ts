import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      originalId, 
      access_token, 
      newCampaignName, 
      budget, 
      budgetType, 
      adsetName, 
      location, 
      gender, 
      ageMin, 
      ageMax, 
      targeting, 
      adName, 
      pageId, 
      newPostId, 
      callToAction 
    } = body;

    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    if (!originalId) {
      return NextResponse.json({ success: false, error: "Missing Original Campaign ID" }, { status: 400 });
    }

    // 1. យក account_id និង objective ពី Campaign ដើម
    const campRes = await fetch(`https://graph.facebook.com/v18.0/${originalId}?fields=account_id,objective&access_token=${clientToken}`);
    const campData = await campRes.json();
    if (campData.error) throw new Error(campData.error.message);

    const actId = campData.account_id.replace('act_', '');
    const objective = campData.objective || 'OUTCOME_ENGAGEMENT';

    // 2. បង្កើត Campaign ថ្មី (Active ស្រាប់)
    const createCampRes = await fetch(`https://graph.facebook.com/v18.0/act_${actId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCampaignName || 'Duplicated Campaign',
        objective: objective,
        status: 'ACTIVE',
        special_ad_categories: [],
        access_token: clientToken
      })
    });
    const newCampJson = await createCampRes.json();
    if (newCampJson.error) throw new Error("Campaign Error: " + newCampJson.error.message);
    const newCampaignId = newCampJson.id;

    // 3. បង្កើត Ad Set ថ្មី
    const budgetCents = Math.round(Number(budget || 5) * 100);
    const adsetPayload: any = {
      name: adsetName || 'Duplicated Ad Set',
      campaign_id: newCampaignId,
      optimization_goal: objective === 'OUTCOME_ENGAGEMENT' ? 'CONVERSATIONS' : 'LINK_CLICKS',
      billing_event: 'IMPRESSIONS',
      bid_amount: 100,
      status: 'ACTIVE',
      destination_type: 'MESSENGER',
      targeting: {
        geo_locations: { countries: [location === 'CAMBODIA' ? 'KH' : 'KH'] },
        age_min: Number(ageMin) || 18,
        age_max: Number(ageMax) || 65,
        genders: gender === 'MALE' ? [1] : gender === 'FEMALE' ? [2] : [1, 2]
      },
      access_token: clientToken
    };

    if (budgetType === 'DAILY') {
      adsetPayload.daily_budget = budgetCents;
    } else {
      adsetPayload.lifetime_budget = budgetCents;
    }

    if (targeting && targeting.trim() !== "") {
      const keywords = targeting.split(',').map((k: string) => k.trim()).filter(Boolean);
      adsetPayload.targeting.flexible_spec = [{ interests: keywords.map((kw: string) => ({ name: kw })) }];
    }

    const createAdsetRes = await fetch(`https://graph.facebook.com/v18.0/act_${actId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adsetPayload)
    });
    const newAdsetJson = await createAdsetRes.json();
    if (newAdsetJson.error) throw new Error("AdSet Error: " + newAdsetJson.error.message);
    const newAdsetId = newAdsetJson.id;

    // 4. បង្កើត Ad Creative (ភ្ជាប់ជាមួយ Post ID ថ្មី ឬ Post ដើម)
    const creativePayload: any = {
      name: `${adName} Creative`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          call_to_action: { type: callToAction || 'SEND_MESSAGE' },
          link: `https://www.facebook.com/${pageId}`
        },
        ...(newPostId && !newPostId.includes('draft') ? { object_story_id: newPostId } : {})
      },
      access_token: clientToken
    };

    const creativeRes = await fetch(`https://graph.facebook.com/v18.0/act_${actId}/adcreatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creativePayload)
    });
    const creativeJson = await creativeRes.json();
    if (creativeJson.error) throw new Error("Creative Error: " + creativeJson.error.message);
    const creativeId = creativeJson.id;

    // 5. បង្កើត Ad ក្នុង Ad Set យ៉ាងប្រាកដប្រជា
    const createAdRes = await fetch(`https://graph.facebook.com/v18.0/act_${actId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: adName || 'Duplicated Ad',
        adset_id: newAdsetId,
        creative: { creative_id: creativeId },
        status: 'ACTIVE',
        access_token: clientToken
      })
    });
    const newAdJson = await createAdRes.json();
    if (newAdJson.error) throw new Error("Ad Error: " + newAdJson.error.message);

    return NextResponse.json({
      success: true,
      message: "✅ Duplicate Campaign, Ad Set និង Ads បានជោគជ័យទាំងស្រុង (Active ស្រាប់)!",
      copiedCampaignId: newCampaignId
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}