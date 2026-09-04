import { NextResponse } from 'next/server';

// 🌟 Helper function សម្រាប់ទាញយក Token (គាំទ្រទាំង Query Parameters និង Request Body)
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

    if (datePreset.toLowerCase() === 'lifetime') {
      datePreset = 'maximum';
    }

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    let url = '';

    if (campaignId) {
      url = `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
    } else if (adAccountId) {
      const targetAccount = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
      url = `https://graph.facebook.com/v18.0/${targetAccount}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
    } else {
      throw new Error("Missing Campaign ID or Ad Account ID");
    }

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json({ success: true, adsets: data.data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 🌟 មុខងារ PUT សម្រាប់ទទួលការប្ដូរ Status (Off/On) របស់ Ad Set នីមួយៗ
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