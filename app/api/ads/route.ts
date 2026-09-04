import { NextResponse } from 'next/server';

// Helper function សម្រាប់ទាញយក Token ទាំងពី Query Parameters ឬ Request Body
function getAccessToken(request: Request, body?: any) {
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('access_token') || body?.access_token;
  return clientToken || process.env.FACEBOOK_ACCESS_TOKEN;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = getAccessToken(request);
    const campaignId = searchParams.get('campaignId');
    const adAccountId = searchParams.get('adAccountId');
    let datePreset = searchParams.get('datePreset') || 'maximum';

    // 🌟 ការពារករណីពាក្យ Lifetime ត្រូវបានបញ្ជូនមក
    if (datePreset.toLowerCase() === 'lifetime') {
      datePreset = 'maximum';
    }

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    let allAds: any[] = [];

    if (campaignId) {
      // ១. ស្វែងរក Ad Sets ទាំងអស់ដែលស្ថិតក្រោម Campaign
      const adSetsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id&access_token=${accessToken}`);
      const adSetsData = await adSetsRes.json();
      
      let adSetIds = [campaignId]; 
      if (adSetsData.data && adSetsData.data.length > 0) {
        adSetIds = adSetsData.data.map((adset: any) => adset.id);
      }

      // ២. វាយលុកទាញយក Ads (ដោយប្រើ Level=ad ឱ្យច្បាស់លាស់)
      for (const id of adSetIds) {
        const adsRes = await fetch(`https://graph.facebook.com/v18.0/${id}/ads?fields=id,name,status,effective_status,creative{id,name,object_story_id,thumbnail_url},insights.date_preset(${datePreset}).level(ad){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`);
        const adsData = await adsRes.json();
        
        if (adsData.data && Array.isArray(adsData.data)) {
          for (const ad of adsData.data) {
            if (!allAds.some(existing => existing.id === ad.id)) {
              allAds.push(ad);
            }
          }
        }
      }

      // ៣. បើនៅតែអត់ទាន់បាន គឺទាញតាម Campaign directly
      if (allAds.length === 0) {
        const directAdsRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id,name,status,effective_status,creative{id,name,object_story_id,thumbnail_url},insights.date_preset(${datePreset}).level(ad){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`);
        const directAdsData = await directAdsRes.json();
        if (directAdsData.data) {
          allAds = directAdsData.data;
        }
      }

    } else if (adAccountId) {
      const targetAccount = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
      const url = `https://graph.facebook.com/v18.0/${targetAccount}/ads?fields=id,name,status,effective_status,creative{id,name,object_story_id,thumbnail_url},insights.date_preset(${datePreset}).level(ad){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      allAds = data.data || [];
    } else {
      throw new Error("Missing Campaign ID or Ad Account ID");
    }

    return NextResponse.json({ success: true, ads: allAds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 🌟 Function PUT សម្រាប់ទទួលការប្ដូរ Status (Off/On) របស់ Ad នីមួយៗ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const accessToken = getAccessToken(request, body);

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'POST', // Facebook API ប្រើ POST សម្រាប់ការ Update Status
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: status,
        access_token: accessToken
      })
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}