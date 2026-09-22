import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, id, newName, newPostId, pageId, access_token } = body;
    // level អាចជា: 'campaign', 'adset', ឬ 'ad'

    const clientToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!clientToken) {
      return NextResponse.json({ success: false, error: "🔒 រកមិនឃើញ Access Token ទេ!" }, { status: 401 });
    }

    let adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || '';
    if (!adAccountId.startsWith('act_')) {
      adAccountId = `act_${adAccountId}`;
    }

    if (level === 'campaign') {
      // ថ្នាក់ទី១៖ Duplicate Campaign (Clone ទាំងមូល ទាំង Campaign, Ad Set និង Ad)
      const res = await fetch(`https://graph.facebook.com/v18.0/${id}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_option: 'ACTIVE', access_token: clientToken }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      return NextResponse.json({ success: true, message: "✅ Duplicate Campaign បានជោគជ័យ!" });

    } else if (level === 'adset') {
      // ថ្នាក់ទី២៖ Duplicate Ad Set (រក្សា Campaign ដើម តែបង្កើត Ad Set ថ្មី និង Ad ថ្មី)
      const res = await fetch(`https://graph.facebook.com/v18.0/${id}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_option: 'ACTIVE', access_token: clientToken }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      return NextResponse.json({ success: true, message: "✅ Duplicate Ad Set បានជោគជ័យ!" });

    } else {
      // ថ្នាក់ទី៣៖ Duplicate Ad (ស្ថិតក្រោម Ad Set ដើម តែបំបែក Post ទី២)
      if (!newPostId || !pageId) {
        return NextResponse.json({ success: false, error: "Missing newPostId or pageId" }, { status: 400 });
      }

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
      if (creativeData.error) throw new Error(creativeData.error.message);
      const newCreativeId = creativeData.id;

      const duplicateRes = await fetch(`https://graph.facebook.com/v18.0/${id}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_option: 'ACTIVE', access_token: clientToken }),
      });
      const duplicateData = await duplicateRes.json();
      if (duplicateData.error) throw new Error(duplicateData.error.message);
      
      const newAdId = duplicateData.copied_ad_id;

      await fetch(`https://graph.facebook.com/v18.0/${newAdId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: clientToken,
          name: newName,
          creative: { creative_id: newCreativeId }
        }),
      });

      return NextResponse.json({ success: true, message: "✅ Duplicate Ad និងប្តូរ Post ថ្មីដោយជោគជ័យ!" });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}