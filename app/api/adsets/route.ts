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
    
    // 🌟 គាំទ្រទាំង campaignIds (ຫຼາຍ ID) និង campaignId ឬ adAccountId ធម្មតា
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

    // 🌟 ករណីមាន Campaign IDs ច្រើន (រត់ Loop ប្រមូលទិន្នន័យបញ្ចូលគ្នា)
    if (campaignIdsParam) {
      const campaignIds = campaignIdsParam.split(',');
      
      for (const campId of campaignIds) {
        // 🌟 បន្ថែម ads{id,status,effective_status,name} ចូលក្នុង fields ដើម្បីឆែករកមើល Ad Sets ដែលគ្មាន Ads (No ads)
        const url = `https://graph.facebook.com/v18.0/${campId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,end_time,bid_strategy,updated_time,ads{id,status,effective_status,name},insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
        
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();

        if (data.error) {
          console.warn(`⚠️ Warning for campaign ${campId}:`, data.error.message);
          continue; // រំលងបើមាន Campaign ណាមួយខុស ប៉ុន្តែបន្តទាញ Campaign ផ្សេងទៀត
        }

        if (data.data) {
          // ពិនិត្យស្ថានភាព Ad Set ថាមាន Ads ខាងក្នុងដែរឬទេ
          const processedAdsets = data.data.map((adset: any) => {
            const adsList = adset.ads?.data || [];
            
            // បើគ្មាន Ads ខាងក្នុងសោះ ដាក់ flag ថា hasNoAds = true
            if (adsList.length === 0) {
              adset.hasNoAds = true; 
            }
            return adset;
          });

          allAdsets = [...allAdsets, ...processedAdsets];
        }
      }
    } 
    // 🌟 ករណីទាញតាម Ad Account ID ផ្ទាល់
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