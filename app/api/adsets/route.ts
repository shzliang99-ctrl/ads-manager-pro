import { NextResponse } from 'next/server';

function getAccessToken(request: Request, body?: any) {
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('access_token') || body?.access_token;
  return clientToken || process.env.FACEBOOK_ACCESS_TOKEN;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = getAccessToken(request);
    
    const campaignIdsParam = searchParams.get('campaignIds') || searchParams.get('campaignId');
    const adAccountId = searchParams.get('adAccountId');
    let datePreset = searchParams.get('datePreset') || 'maximum';

    if (datePreset.toLowerCase() === 'lifetime') {
      datePreset = 'maximum';
    }

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    let allAdsets: any[] = [];

    if (campaignIdsParam) {
      const campaignIds = campaignIdsParam.split(',');
      
      for (const campId of campaignIds) {
        const url = `https://graph.facebook.com/v18.0/${campId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,ads{id,status,effective_status,name},insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
        
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();

        if (data.error) continue;

        if (data.data) {
          const processedAdsets = data.data.map((adset: any) => {
            const adsList = adset.ads?.data || [];
            if (adsList.length === 0) adset.hasNoAds = true; 

            const hasReviewAd = adsList.some((ad: any) => {
              const adStatus = (ad.effective_status || ad.status || "").toUpperCase();
              return adStatus.includes('REVIEW') || adStatus.includes('PENDING') || adStatus === 'IN_PROCESS';
            });

            if (hasReviewAd) adset.effective_status = 'PENDING_REVIEW';
            return adset;
          });

          allAdsets = [...allAdsets, ...processedAdsets];
        }
      }
    } 
    else if (adAccountId) {
      const targetAccount = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
      const url = `https://graph.facebook.com/v18.0/${targetAccount}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,ads{id,status,effective_status,name},insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const rawAdsets = data.data || [];
      allAdsets = rawAdsets.map((adset: any) => {
        const adsList = adset.ads?.data || [];
        if (adsList.length === 0) adset.hasNoAds = true;

        const hasReviewAd = adsList.some((ad: any) => {
          const adStatus = (ad.effective_status || ad.status || "").toUpperCase();
          return adStatus.includes('REVIEW') || adStatus.includes('PENDING') || adStatus === 'IN_PROCESS';
        });

        if (hasReviewAd) adset.effective_status = 'PENDING_REVIEW';
        return adset;
      });
    } else {
      throw new Error("Missing Campaign ID(s) or Ad Account ID");
    }

    return NextResponse.json({ success: true, adsets: allAdsets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 🌟 មុខងារ POST ឆ្លាតវៃកម្រិតខ្ពស់ ១០០%៖ Auto-Detect Campaign ID & CBO vs ABO Routing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { campaignId, adsetId, budget, stopTime, name } = body;
    const accessToken = getAccessToken(request, body);

    if (!campaignId && !adsetId) {
      throw new Error("Missing Campaign ID or Ad Set ID");
    }

    let targetAdSetIds = adsetId ? [adsetId] : [];
    if (targetAdSetIds.length === 0 && campaignId) {
      const adsetRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id&access_token=${accessToken}`);
      const adsetData = await adsetRes.json();
      if (adsetData.data) targetAdSetIds = adsetData.data.map((a: any) => a.id);
    }

    if (targetAdSetIds.length === 0) throw new Error("No Ad Sets found to update");

    for (const tId of targetAdSetIds) {
      // 🌟 ១. ទាញយកព័ត៌មាន Ad Set ព្រមទាំង campaign_id ផ្ទាល់ពី Facebook Graph API
      const infoRes = await fetch(`https://graph.facebook.com/v18.0/${tId}?fields=daily_budget,lifetime_budget,campaign_id&access_token=${accessToken}`);
      const infoData = await infoRes.json();

      if (infoData.error) {
        throw new Error(infoData.error.message);
      }

      // យក Campaign ID ដែលជាប់ជាមួយ Ad Set នោះមកប្រើប្រាស់ផ្ទាល់
      const resolvedCampId = campaignId || infoData.campaign_id;

      // 🌟 ២. ឆែកមើលថាតើ Campaign មេប្រើប្រាស់ CBO ដែរឬទេ
      let isUsingCBO = false;
      let campLifetime = 0;
      let campDaily = 0;

      if (resolvedCampId) {
        const campRes = await fetch(`https://graph.facebook.com/v18.0/${resolvedCampId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`);
        const campData = await campRes.json();
        if (!campData.error) {
          campDaily = Number(campData.daily_budget || 0);
          campLifetime = Number(campData.lifetime_budget || 0);
          if (campDaily > 0 || campLifetime > 0) {
            isUsingCBO = true;
          }
        }
      }

      // 🌟 ៣. Update ឈ្មោះ និង ពេលវេលា (Basic Update)
      let hasBasicUpdate = false;
      const basicPayload: any = { access_token: accessToken };

      if (name && name.trim() !== "") {
        basicPayload.name = name;
        hasBasicUpdate = true;
      }
      if (stopTime) {
        const dateObj = new Date(stopTime);
        if (!isNaN(dateObj.getTime())) {
          basicPayload.end_time = dateObj.toISOString();
          hasBasicUpdate = true;
        }
      }

      if (hasBasicUpdate) {
        const upRes = await fetch(`https://graph.facebook.com/v18.0/${tId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basicPayload)
        });
        const upData = await upRes.json();
        if (upData.error) throw new Error(`[Update Name/Time Failed]: ${upData.error.message}`);
      }

      // 🌟 ៤. កែប្រែថវិកា (Smart Routing: CBO vs ABO 100%)
      if (budget !== undefined && budget !== "") {
        const budgetCents = Math.round(Number(budget) * 100);

        if (isUsingCBO && resolvedCampId) {
          // 👉 បើជា CBO គឺបង្វែរថវិកាទៅកែនៅកម្រិត Campaign មេភ្លាម
          const campPayload: any = { access_token: accessToken };
          if (campLifetime > 0) {
            campPayload.lifetime_budget = budgetCents;
          } else {
            campPayload.daily_budget = budgetCents;
          }

          const cboRes = await fetch(`https://graph.facebook.com/v18.0/${resolvedCampId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campPayload)
          });
          const cboData = await cboRes.json();
          if (cboData.error) throw new Error(`[CBO Budget Failed]: ${cboData.error.message}`);
          
        } else {
          // 👉 បើជា ABO គឺ Update ថវិកាផ្ទាល់លើ Ad Set ហ្នឹង (គាំទ្រទាំង Daily $5)
          const aboPayload: any = { access_token: accessToken };
          const adsetLifetime = Number(infoData.lifetime_budget || 0);

          if (adsetLifetime > 0) {
            aboPayload.lifetime_budget = budgetCents;
          } else {
            aboPayload.daily_budget = budgetCents;
          }

          const aboRes = await fetch(`https://graph.facebook.com/v18.0/${tId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aboPayload)
          });
          const aboData = await aboRes.json();
          if (aboData.error) throw new Error(`[Ad Set Budget Failed]: ${aboData.error.message}`);
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Ad Set updated successfully" });
  } catch (error: any) {
    console.error("AdSet Update API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const accessToken = getAccessToken(request, body);

    if (!accessToken) throw new Error("Missing Facebook Access Token");
    if (!id || !status) throw new Error("Missing Ad Set ID or Status");

    const res = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, access_token: accessToken })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}