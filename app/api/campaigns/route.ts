import { NextResponse } from 'next/server';

// Helper function សម្រាប់ទាញយក Token ទាំងពី Query Parameters ឬ Headers / Body
function getAccessToken(request: Request, body?: any) {
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('access_token') || body?.access_token;
  return clientToken || process.env.FACEBOOK_ACCESS_TOKEN;
}

export async function GET(request: Request) {
  try {
    const accessToken = getAccessToken(request);
    const defaultAdAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    const { searchParams } = new URL(request.url);
    const queryAdAccountId = searchParams.get('adAccountId');
    const datePreset = searchParams.get('datePreset') || 'today';

    const targetAdAccountId = queryAdAccountId ? `act_${queryAdAccountId.replace('act_', '')}` : defaultAdAccountId;

    if (!accessToken || !targetAdAccountId) {
      throw new Error("Missing Token or Ad Account ID");
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${targetAdAccountId}/campaigns?fields=id,name,status,effective_status,daily_budget,lifetime_budget,objective,start_time,stop_time,insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`,
      { cache: 'no-store' }
    );
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ success: true, campaigns: data.data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 🌟 មុខងារ POST វៃឆ្លាត៖ ប្រើ ISO String សម្រាប់ម៉ោង និងទាញយក Error លម្អិតពី FB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, name, budget, stopTime } = body;
    const accessToken = getAccessToken(request, body);

    if (!campaignId) {
      throw new Error("Missing Campaign ID");
    }

    // ១. ឆែកមើលថា Campaign ប្រើ CBO ឬ ABO?
    const campInfoRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`);
    const campInfo = await campInfoRes.json();

    let isCBO = false;
    if (campInfo.daily_budget || campInfo.lifetime_budget) {
      isCBO = true;
    }

    // កែប្រែឈ្មោះ និង/ឬ ថវិកា CBO ទៅកាន់ Campaign Level
    const campPayload: any = { access_token: accessToken };
    let updateCamp = false;

    if (name) {
      campPayload.name = name;
      updateCamp = true;
    }

    if (budget !== undefined && budget !== "" && isCBO) {
      const budgetInCents = Math.round(Number(budget) * 100);
      if (campInfo.lifetime_budget) {
        campPayload.lifetime_budget = budgetInCents;
      } else {
        campPayload.daily_budget = budgetInCents;
      }
      updateCamp = true;
    }

    if (updateCamp) {
      const campRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campPayload),
      });
      const campData = await campRes.json();
      if (campData.error) {
        const errMsg = campData.error.error_user_msg || campData.error.message;
        throw new Error(`[Campaign Error]: ${errMsg}`);
      }
    }

    // ២. កែប្រែថវិកា ABO និង ម៉ោងបញ្ចប់ នៅ Ad Set Level
    if ((budget !== undefined && budget !== "" && !isCBO) || stopTime) {
      const adsetRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,daily_budget,lifetime_budget&access_token=${accessToken}`);
      const adsetData = await adsetRes.json();

      if (adsetData.error) {
        throw new Error(`[AdSet Fetch Error]: ${adsetData.error.message}`);
      }

      if (adsetData.data && adsetData.data.length > 0) {
        const targetAdSet = adsetData.data[0];
        const adsetPayload: any = { access_token: accessToken };
        let updateAdset = false;

        if (budget !== undefined && budget !== "" && !isCBO) {
          const budgetInCents = Math.round(Number(budget) * 100);
          if (targetAdSet.lifetime_budget) {
            adsetPayload.lifetime_budget = budgetInCents;
          } else {
            adsetPayload.daily_budget = budgetInCents;
          }
          updateAdset = true;
        }

        if (stopTime) {
          const dateObj = new Date(stopTime);
          if (!isNaN(dateObj.getTime())) {
            adsetPayload.end_time = dateObj.toISOString();
            updateAdset = true;
          }
        }

        if (updateAdset) {
          const adsetUpdateRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdSet.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adsetPayload),
          });

          const adsetUpdateData = await adsetUpdateRes.json();
          if (adsetUpdateData.error) {
            const errMsg = adsetUpdateData.error.error_user_msg || adsetUpdateData.error.message;
            throw new Error(`[AdSet Update Failed]: ${errMsg}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error: any) {
    console.error("Update API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// មុខងារសម្រាប់ Update Status (On/Off) Campaign
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const accessToken = getAccessToken(request, body);

    if (!id || !status) throw new Error("Missing Campaign ID or Status");

    const response = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status, access_token: accessToken }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// មុខងារសម្រាប់លុប Campaign
export async function DELETE(request: Request) {
  try {
    const accessToken = getAccessToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw new Error("Missing Campaign ID");

    const response = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}