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
    
    // 🌟 គាំទ្រทั้ง campaignIds (ຫຼາຍ ID) និង campaignId ធម្មតា ឬ adAccountId
    const campaignIdsParam = searchParams.get('campaignIds') || searchParams.get('campaignId');
    const adAccountId = searchParams.get('adAccountId');
    let datePreset = searchParams.get('datePreset') || 'maximum'; 

    if (datePreset.toLowerCase() === 'lifetime') {
      datePreset = 'maximum';
    }

    if (!accessToken) throw new Error("Missing Facebook Access Token");

    let allAds: any[] = [];
    const creativeFields = 'id,name,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,effective_object_story_id,object_story_id';

    // 🌟 ត្រូវប្រាកដថា Loop នេះប្រមូលយក Ads គ្រប់ Campaign ទាំងអស់មកដាក់ក្នុង allAds យ៉ាងត្រឹមត្រូវ
    if (campaignIdsParam) {
      const campaignIds = campaignIdsParam.split(',');
      allAds = []; // សម្អាតចោលជាមុនសិន

      for (const campId of campaignIds) {
        const url = `https://graph.facebook.com/v18.0/${campId}/ads?fields=id,name,status,effective_status,creative{${creativeFields}},insights.date_preset(${datePreset}).level(ad){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
        
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          for (const ad of data.data) {
            // បញ្ចូលទាំងអស់ដោយមិនឱ្យជាន់គ្នាធានាថាមិនបាត់ Ads
            if (!allAds.some(existing => existing.id === ad.id)) {
              allAds.push(ad);
            }
          }
        }
      }
    } else if (adAccountId) {
      const targetAccount = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
      const url = `https://graph.facebook.com/v18.0/${targetAccount}/ads?fields=id,name,status,effective_status,creative{${creativeFields}},insights.date_preset(${datePreset}).level(ad){spend,impressions,reach,actions}&limit=500&access_token=${accessToken}`;
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      allAds = data.data || [];
    } else {
      throw new Error("Missing Campaign ID(s) or Ad Account ID");
    }

    // 🌟 ជំហានពិសេស៖ បង្ខំឱ្យ API រត់ទៅទាញយក "រូបភាពច្រើនសន្លឹក" ចេញពី Post ផ្ទាល់ សម្រាប់គ្រប់ Ads ទាំងអស់!
    const storyIds = [...new Set(allAds.map(ad => ad.creative?.effective_object_story_id || ad.creative?.object_story_id).filter(Boolean))];
    
    if (storyIds.length > 0) {
      const chunkedIds = [];
      for (let i = 0; i < storyIds.length; i += 50) {
        chunkedIds.push(storyIds.slice(i, i + 50));
      }

      let enrichedPosts: any = {};

      for (const chunk of chunkedIds) {
        const idsParam = chunk.join(',');
        const postUrl = `https://graph.facebook.com/v18.0/?ids=${idsParam}&fields=id,message,full_picture,attachments{media,subattachments{media}}&access_token=${accessToken}`;
        const postRes = await fetch(postUrl);
        const postData = await postRes.json();
        if (!postData.error) {
          enrichedPosts = { ...enrichedPosts, ...postData };
        }
      }

      // បញ្ចូលទិន្នន័យរូបភាពពិតប្រាកដទៅក្នុង Ad វិញ
      allAds = allAds.map(ad => {
        const sId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
        if (sId && enrichedPosts[sId]) {
          ad.enriched_post = enrichedPosts[sId]; 
        }
        return ad;
      });
    }

    return NextResponse.json({ success: true, ads: allAds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const accessToken = getAccessToken(request, body);

    if (!accessToken) throw new Error("Missing Facebook Access Token");

    const res = await fetch(`https://graph.facebook.com/v18.0/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status, access_token: accessToken })
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}