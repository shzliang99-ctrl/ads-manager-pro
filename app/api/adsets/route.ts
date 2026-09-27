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

        if (data.error) {
          console.warn(`⚠️ Warning for campaign ${campId}:`, data.error.message);
          continue;
        }

        if (data.data) {
          const processedAdsets = data.data.map((adset: any) => {
            const adsList = adset.ads?.data || [];
            
            if (adsList.length === 0) {
              adset.hasNoAds = true; 
            }

            const hasReviewAd = adsList.some((ad: any) => {
              const adStatus = (ad.effective_status || ad.status || "").toUpperCase();
              return adStatus.includes('REVIEW') || adStatus.includes('PENDING') || adStatus === 'IN_PROCESS';
            });

            if (hasReviewAd) {
              adset.effective_status = 'PENDING_REVIEW';
            }

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

      if (data.error) {
        throw new Error(data.error.message);
      }

      const rawAdsets = data.data || [];
      allAdsets = rawAdsets.map((adset: any) => {
        const adsList = adset.ads?.data || [];
        if (adsList.length === 0) {
          adset.hasNoAds = true;
        }

        const hasReviewAd = adsList.some((ad: any) => {
          const adStatus = (ad.effective_status || ad.status || "").toUpperCase();
          return adStatus.includes('REVIEW') || adStatus.includes('PENDING') || adStatus === 'IN_PROCESS';
        });

        if (hasReviewAd) {
          adset.effective_status = 'PENDING_REVIEW';
        }

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

// 🌟 មុខងារ POST ឆ្លាតវៃ៖ ដោះស្រាយទាំងកែឈ្មោះ, ម៉ោង និងថវិកា (CBO vs ABO)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, adsetId, budget, stopTime, name } = body;
    const accessToken = getAccessToken(request, body);

    if (!campaignId && !adsetId) {
      throw new Error("Missing Campaign ID or Ad Set ID");
    }

    let targetAdSetIds = adsetId ? [adsetId] : [];
    if (targetAdSetIds.length === 0 && campaignId) {
      const adsetRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,lifetime_budget&access_token=${accessToken}`);
      const adsetData = await adsetRes.json();
      if (adsetData.data) {
        targetAdSetIds = adsetData.data.map((a: any) => a.id);
      }
    }

    if (targetAdSetIds.length === 0) {
      throw new Error("No Ad Sets found to update");
    }

    for (const targetId of targetAdSetIds) {
      const infoRes = await fetch(`https://graph.facebook.com/v18.0/${targetId}?fields=daily_budget,lifetime_budget,campaign{id,daily_budget,lifetime_budget}&access_token=${accessToken}`);
      const infoData = await infoRes.json();

      if (infoData.error) {
        throw new Error(infoData.error.message);
      }

      const adsetPayload: any = { access_token: accessToken };
      let updateNeeded = false;

      // 1. កែប្រែឈ្មោះ (Name)
      if (name && name.trim() !== "") {
        adsetPayload.name = name;
        updateNeeded = true;
      }

      // 2. កែប្រែពេលវេលា (Stop Time)
      if (stopTime) {
        const dateObj = new Date(stopTime);
        if (!isNaN(dateObj.getTime())) {
          adsetPayload.end_time = dateObj.toISOString();
          updateNeeded = true;
        }
      }

      // បាញ់ Update ឈ្មោះ និង ម៉ោង ទៅ Ad Set ផ្ទាល់
      if (updateNeeded) {
        const updateRes = await fetch(`https://graph.facebook.com/v18.0/${targetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adsetPayload),
        });
        const updateData = await updateRes.json();
        if (updateData.error) {
          throw new Error(`[AdSet Update Failed]: ${updateData.error.message}`);
        }
      }

      // 3. កែប្រែថវិកា (CBO vs ABO Smart Routing)
      if (budget !== undefined && budget !== "") {
        const budgetInCents = Math.round(Number(budget) * 100);
        const isUsingCBO = !infoData.daily_budget && !infoData.lifetime_budget && infoData.campaign;

        if (isUsingCBO) {
          // បើប្រើ CBO គឺបង្វែរថវិកាទៅកែនៅកម្រិត Campaign មេវិញ
          const campId = infoData.campaign.id;
          const campPayload: any = { access_token: accessToken };
          
          if (infoData.campaign.lifetime_budget) {
            campPayload.lifetime_budget = budgetInCents;
          } else {
            campPayload.daily_budget = budgetInCents;
          }

          const cboUpdateRes = await fetch(`https://graph.facebook.com/v18.0/${campId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campPayload),
          });
          const cboUpdateData = await cboUpdateRes.json();
          if (cboUpdateData.error) throw new Error(`[CBO Budget Update Failed]: ${cboUpdateData.error.message}`);

        } else {
          // បើប្រើ ABO គឺ Update ថវិកាផ្ទាល់លើ Ad Set ហ្នឹង
          const aboPayload: any = { access_token: accessToken };
          if (infoData.lifetime_budget) {
            aboPayload.lifetime_budget = budgetInCents;
          } else {
            aboPayload.daily_budget = budgetInCents;
          }

          const aboUpdateRes = await fetch(`https://graph.facebook.com/v18.0/${targetId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aboPayload),
          });
          const aboUpdateData = await aboUpdateRes.json();
          if (aboUpdateData.error) throw new Error(`[Ad Set Budget Update Failed]: ${aboUpdateData.error.message}`);
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

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    if (!id || !status) {
      throw new Error("Missing Ad Set ID or Status");
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'POST',
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