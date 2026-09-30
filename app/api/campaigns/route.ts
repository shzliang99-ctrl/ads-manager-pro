import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 🌟 Helper function សម្រាប់បង្កើត Supabase Client សម្រាប់ Route Handler (Next.js App Router)
async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// 🌟 Helper function សម្រាប់ទាញយក Token (គាំទ្រទាំង Query Parameters និង Request Body)
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
    let datePreset = searchParams.get('datePreset') || 'maximum';

    // 🌟 ការពារករណីពាក្យ Lifetime ឬ last_30d ឱ្យរត់ត្រូវជាមួយ Graph API
    if (datePreset.toLowerCase() === 'lifetime' || datePreset.toLowerCase() === 'maximum') {
      datePreset = 'maximum';
    }

    const targetAdAccountId = queryAdAccountId ? `act_${queryAdAccountId.replace('act_', '')}` : defaultAdAccountId;

    if (!accessToken || !targetAdAccountId) {
      throw new Error("Missing Token or Ad Account ID");
    }

    // 🌟 ជំហានទី ១៖ ទាញយក Campaigns ព្រមទាំង Ads ខាង內 (ads{status,effective_status}) មកជាមួយ
    const endpoint = `https://graph.facebook.com/v18.0/${targetAdAccountId}/campaigns?fields=id,name,status,effective_status,daily_budget,lifetime_budget,objective,start_time,stop_time,ads{status,effective_status},insights.date_preset(${datePreset}){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;

    const response = await fetch(endpoint, { cache: 'no-store' });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // 🌟 ជំហានទី ២៖ ពិនិត្យផ្ទៀងផ្ទាត់ (Map)៖ បើ Ads ខាងក្នុងមានស្ថានភាព In Review (PENDING_REVIEW ឬ IN_PROCESS) 
    // គឺបង្ខំឱ្យ Campaign មេបង្ហាញ Status តាម Ads នោះភ្លាម
    const processedCampaigns = (data.data || []).map((camp: any) => {
      const adsList = camp.ads?.data || [];
      
      // ឆែកមើលថាតើមាន Ad ណាមួយកំពុងស្ថិតក្នុង Review ដែរឬទេ
      const hasReviewAd = adsList.some((ad: any) => {
        const adStatus = (ad.effective_status || ad.status || "").toUpperCase();
        return adStatus.includes('REVIEW') || adStatus.includes('PENDING') || adStatus === 'IN_PROCESS';
      });

      if (hasReviewAd) {
        // បើមាន Ad កំពុង Review ឱ្យប្ដូរ effective_status របស់ Campaign មកជា PENDING_REVIEW ជាបន្ទាន់
        camp.effective_status = 'PENDING_REVIEW';
      }

      return camp;
    });

    return NextResponse.json({ success: true, campaigns: processedCampaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// 🌟 មុខងារ POST វៃឆ្លាត៖ គាំទ្រទាំង CBO និង ABO (កែប្រែថវិកា និងម៉ោងនៅ Ad Set ផ្ទាល់បើ Campaign គ្មាន Budget)
export async function POST(request: Request) {
  // 🌟 ឆែកសុវត្ថិភាព (Security Check): ផ្ទៀងផ្ទាត់ថា User បាន Login ចូលប្រព័ន្ធពិតប្រាកដមែនទេ?
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: សូម Login ជាមុនសិន!' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { campaignId, name, budget, stopTime } = body;
    const accessToken = getAccessToken(request, body);

    if (!campaignId) {
      throw new Error("Missing Campaign ID");
    }

    // ១. ឆែកមើលថាតើ Campaign នេះប្រើ CBO (Campaign Budget) ឬ ABO (AdSet Budget)?
    const campInfoRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`);
    const campInfo = await campInfoRes.json();

    let isCBO = false;
    if (campInfo.daily_budget || campInfo.lifetime_budget) {
      isCBO = true;
    }

    // ២. កែប្រែឈ្មោះ Campaign
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

    // ៣. កែប្រែថវិកា ABO និងម៉ោងបញ្ចប់ នៅកម្រិត Ad Set Level (ផ្ទៀងផ្ទាត់ប្រភេទ Budget ជាមុនសិន)
    if ((budget !== undefined && budget !== "" && !isCBO) || stopTime) {
      const adsetRes = await fetch(`https://graph.facebook.com/v18.0/${campaignId}/adsets?fields=id,daily_budget,lifetime_budget&access_token=${accessToken}`);
      const adsetData = await adsetRes.json();

      if (adsetData.error) {
        throw new Error(`[AdSet Fetch Error]: ${adsetData.error.message}`);
      }

      if (adsetData.data && adsetData.data.length > 0) {
        for (const targetAdSet of adsetData.data) {
          const adsetPayload: any = { access_token: accessToken };
          let updateAdset = false;

          // កែប្រែថវិកា Ad Set
          if (budget !== undefined && budget !== "" && !isCBO) {
            const budgetInCents = Math.round(Number(budget) * 100);
            if (targetAdSet.lifetime_budget) {
              adsetPayload.lifetime_budget = budgetInCents;
            } else {
              adsetPayload.daily_budget = budgetInCents;
            }
            updateAdset = true;
          }

          // 🌟 ពិនិត្យយ៉ាងតឹងរ៉ឹង៖ បញ្ជូន end_time ទៅได้ កាលណា Ad Set នោះមាន lifetime_budget ស្រាប់ប៉ុណ្ណោះ!
          if (stopTime && targetAdSet.lifetime_budget) {
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
    }

    return NextResponse.json({ success: true, message: "Updated successfully" });
  } catch (error: any) {
    let errorMessage = error.message;

    // 🌟 បម្លែងសារ Error របស់ Facebook ឱ្យទៅជាភាសាខ្មែរងាយយល់
    if (errorMessage.includes("too far in the future") || errorMessage.includes("one year")) {
      errorMessage = "⚠️ កាលបរិច្ឆេទបញ្ចប់ (End Date) មិនអាចកំណត់លើសពី ១ ឆ្នាំ ចាប់ពីថ្ងៃនេះបានទេ។ សូមជ្រើសរើសថ្ងៃខែឆ្នាំក្រោម ១ ឆ្នាំ។";
    }

    console.error("Update API Error:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// មុខងារសម្រាប់ Update Status (On/Off) Campaign
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const accessToken = getAccessToken(request, body);

    if (!id || !status) throw new Error("Missing ID or Status");

    // បាញ់សំណើទៅកាន់ Facebook Graph API ដោយផ្ទាល់តែម្ដង (មិនបាច់ទាមទារ Supabase Session ទេ)
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
  // 🌟 ឆែកសុវត្ថិភាព (Security Check) សម្រាប់ DELETE
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized: សូម Login ជាមុនសិន!' }, { status: 401 });
  }

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