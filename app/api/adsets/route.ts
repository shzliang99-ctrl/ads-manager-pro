import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const adAccountId = searchParams.get('adAccountId');
    const datePreset = searchParams.get('datePreset') || 'maximum';

    if (!accessToken) {
      throw new Error("Missing Facebook Access Token");
    }

    let url = '';

    // ជំនួស URL ចាស់ មក URL ថ្មីនេះ (បន្ថែម bid_strategy និង updated_time)
    if (campaignId) {
    url = `https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
    } else if (adAccountId) {
    // ធ្វើដូចគ្នាសម្រាប់ adAccountId បើមាន
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