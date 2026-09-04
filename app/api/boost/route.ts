import { NextResponse } from 'next/server';

// 🌟 មុខងារបកប្រែ Error របស់ Facebook មកជាភាសាខ្មែរឱ្យអតិថិជនងាយយល់
const translateFBError = (errMsg: string) => {
  if (!errMsg) return "មានបញ្ហាមិនស្គាល់មួយបានកើតឡើងក្នុងប្រព័ន្ធ។";
  if (errMsg.includes("selected performance goal with your campaign objective")) return "គោលដៅនៃការផ្សាយ (Performance Goal) មិនស៊ីគ្នាជាមួយប្រភេទ Campaign នេះទេ។ សូមជ្រើសរើស Goal ផ្សេង។";
  if (errMsg.includes("Bid amount") || errMsg.includes("bid constraints")) return "ប្រព័ន្ធទាមទារឱ្យកំណត់ចំនួនទឹកប្រាក់ដេញថ្លៃ (Bid Amount) ឱ្យបានត្រឹមត្រូវ។";
  if (errMsg.includes("Invalid parameter")) return "ទិន្នន័យដែលបានបញ្ជូនទៅកាន់ Facebook មិនត្រឹមត្រូវ (Invalid parameter)។ សូមពិនិត្យមើលការកំណត់ម្ដងទៀត។";
  if (errMsg.includes("Invalid Creative")) return "ផុសនេះមិនអាចយកមកផ្សាយបានទេ (អាចដោយសារអត់មានប៊ូតុង Send Message ឬជារូបច្រើនសន្លឹកខុសខ្នាត)។";
  if (errMsg.includes("Permissions error")) return "គណនីរបស់អ្នកមិនមានសិទ្ធិ (Permission) គ្រប់គ្រាន់ក្នុងការបង្កើតការផ្សាយនេះទេ។";
  return errMsg; // បើអត់មានក្នុងបញ្ជី គឺវាបង្ហាញ Error ដើម
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      campaignName, adsetName, adName, pageId, postUrl, objective, conversionLocation,
      performanceGoal, callToAction, 
      ageMin, ageMax, gender, location, targeting, 
      placementType, deviceType, osType, wifiOnly, platforms, detailedPlacements, 
      budgetType, budget, duration,
      access_token, adAccountId // 🌟 ទទួលយក Token និង Ad Account ID ដែលបោះមកពី Frontend ផ្ទាល់របស់ Client
    } = body;

    // 🌟 ប្រើប្រាស់ Token និង Ad Account ID របស់ Client ជាចម្បង ព្រមទាំងមាន .env ទុកជាជម្រើសបម្រុង
    const accessToken = access_token || process.env.FACEBOOK_ACCESS_TOKEN;
    const rawAdAccountId = adAccountId || process.env.FACEBOOK_AD_ACCOUNT_ID; 

    if (!accessToken || !rawAdAccountId) {
      throw new Error("ប្រព័ន្ធមិនមាននាក្តោប Token ឬ Ad Account ID របស់ Facebook ទេ។ សូម Login ជាមុនសិន។");
    }

    const targetAdAccountId = rawAdAccountId.startsWith('act_') ? rawAdAccountId : `act_${rawAdAccountId}`;

    // ==========================================
    // ជំហានទី ១៖ បង្កើត Campaign
    // ==========================================
    const campRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: campaignName || `Auto Boost Campaign`,
        objective: 'OUTCOME_ENGAGEMENT', 
        status: 'PAUSED',
        special_ad_categories: ['NONE'], 
        is_adset_budget_sharing_enabled: false,
        access_token: accessToken,
      })
    });
    
    const campData = await campRes.json();
    if (campData.error) throw new Error(`Campaign ធ្លាក់: ${translateFBError(campData.error.message)}`);
    const campaignId = campData.id;

    // ==========================================
    // ជំហានទី ២៖ បង្កើត Ad Set & ដោះស្រាយ Detailed Targeting
    // ==========================================
    let geoLocations: any = { countries: ["KH"] };
    const targetingData: any = {
      age_min: Number(ageMin) || 18,
      age_max: Number(ageMax) || 65,
      geo_locations: geoLocations,
      targeting_automation: { advantage_audience: 0 } // 🌟 ត្រូវថែមជួរនេះចូលវិញជាដាច់ខាត ដើម្បីប្រាប់ Facebook កុំឱ្យវាទារ
    };

    if (targeting && targeting.trim() !== "") {
       const interestNames = targeting.split(',').map((item: string) => item.trim()).filter(Boolean);
       if (interestNames.length > 0) {
          const validInterests = [];
          for (const keyword of interestNames) {
             try {
                const searchRes = await fetch(`https://graph.facebook.com/v18.0/search?type=adinterest&q=${encodeURIComponent(keyword)}&limit=1&access_token=${accessToken}`);
                const searchData = await searchRes.json();
                if (searchData.data && searchData.data.length > 0) {
                   validInterests.push({ id: searchData.data[0].id, name: searchData.data[0].name });
                }
             } catch (e) { console.error("Search interest error:", e); }
          }
          if (validInterests.length > 0) {
             targetingData.flexible_spec = [{ interests: validInterests }];
          }
       }
    }

    if (placementType === 'MANUAL') {
       if (deviceType === 'MOBILE') targetingData.device_platforms = ['mobile'];
       else if (deviceType === 'DESKTOP') targetingData.device_platforms = ['desktop'];
       else targetingData.device_platforms = ['mobile', 'desktop'];

       if (osType === 'ANDROID') targetingData.user_os = ['Android'];
       else if (osType === 'IOS') targetingData.user_os = ['iOS'];

       const pubPlatforms: string[] = [];
       if (platforms?.facebook) pubPlatforms.push('facebook');
       if (platforms?.instagram) pubPlatforms.push('instagram');
       if (platforms?.audienceNetwork) pubPlatforms.push('audience_network');
       if (platforms?.messenger) pubPlatforms.push('messenger');
       targetingData.publisher_platforms = pubPlatforms.length > 0 ? pubPlatforms : ['facebook'];

       if (detailedPlacements) {
          const fbPos: string[] = [];
          const igPos: string[] = [];
          const msgPos: string[] = [];
          const anPos: string[] = [];

          if (detailedPlacements.fb_feed) fbPos.push('feed');
          if (detailedPlacements.fb_profile) fbPos.push('profile_feed');
          if (detailedPlacements.fb_marketplace) fbPos.push('marketplace');
          if (detailedPlacements.fb_right_col) fbPos.push('right_hand_column');
          if (detailedPlacements.fb_stories) fbPos.push('story');
          if (detailedPlacements.fb_reels) fbPos.push('facebook_reels');
          if (detailedPlacements.fb_search) fbPos.push('search');
          if (detailedPlacements.fb_notifications) fbPos.push('notification'); 
          if (detailedPlacements.instream_reels) fbPos.push('instream_video');
          if (detailedPlacements.fb_reels_ads) fbPos.push('facebook_reels_overlay');

          if (detailedPlacements.ig_feed) igPos.push('stream');
          if (detailedPlacements.ig_profile) igPos.push('profile_feed');
          if (detailedPlacements.ig_explore) { igPos.push('explore'); igPos.push('explore_home'); }
          if (detailedPlacements.ig_stories) igPos.push('story');
          if (detailedPlacements.ig_reels) igPos.push('reels');
          if (detailedPlacements.ig_search) igPos.push('search');

          if (platforms?.messenger) msgPos.push('messenger_home');
          if (detailedPlacements.msg_stories) msgPos.push('story');

          if (detailedPlacements.an_native) anPos.push('classic'); 
          if (detailedPlacements.an_rewarded) anPos.push('rewarded_video');

          if (pubPlatforms.includes('facebook') && fbPos.length > 0) targetingData.facebook_positions = fbPos;
          if (pubPlatforms.includes('instagram') && igPos.length > 0) targetingData.instagram_positions = igPos;
          if (pubPlatforms.includes('messenger') && msgPos.length > 0) targetingData.messenger_positions = msgPos;
          if (pubPlatforms.includes('audience_network') && anPos.length > 0) targetingData.audience_network_positions = anPos;
       }
    }

    // 🌟 បំប្លែង Performance Goal ឱ្យត្រូវក្បួន Facebook API ១០០%
    let fbOptimizationGoal = performanceGoal || 'REPLIES';
    if (fbOptimizationGoal === 'CONVERSATIONS') {
       fbOptimizationGoal = 'REPLIES'; // Facebook API ប្រើពាក្យ REPLIES សម្រាប់សារ Messenger
    }

    const adSetPayload: any = {
      name: adsetName || `AdSet - ${campaignName}`,
      campaign_id: campaignId,
      billing_event: 'IMPRESSIONS',
      optimization_goal: fbOptimizationGoal, 
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      status: 'PAUSED',
      targeting: targetingData,
      access_token: accessToken,
    };

    if (conversionLocation === 'MESSAGES' || fbOptimizationGoal === 'REPLIES') {
      adSetPayload.promoted_object = { page_id: pageId };
      adSetPayload.destination_type = 'MESSENGER';
    }

    if (budgetType === 'LIFETIME') {
       adSetPayload.lifetime_budget = Number(budget) * 100;
       const startUnix = Math.floor(Date.now() / 1000) + (10 * 60); 
       const days = Number(duration) || 1;
       const endUnix = startUnix + (days * 86400); 
       adSetPayload.start_time = startUnix;
       adSetPayload.end_time = endUnix;
    } else {
       adSetPayload.daily_budget = Number(budget) * 100;
    }

    const adSetRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adSetPayload)
    });
    const adSetData = await adSetRes.json();
    
    if (adSetData.error) {
       const specificError = adSetData.error.error_user_msg || adSetData.error.message;
       throw new Error(`AdSet ធ្លាក់: ${translateFBError(specificError)}`);
    }
    
    const adSetId = adSetData.id;

    // ==========================================
    // ជំហានទី ៣៖ លួចបំពាក់ប៊ូតុង និងក្បាច់ Dark Post
    // ==========================================
    let validPostId = postUrl.includes('_') ? postUrl : `${pageId}_${postUrl}`;
    let finalCreativePostId = validPostId; 

    let ctaType = 'MESSAGE_PAGE';
    if (callToAction === 'LEARN_MORE') ctaType = 'LEARN_MORE';
    else if (callToAction === 'SHOP_NOW') ctaType = 'SHOP_NOW';
    else if (callToAction === 'NO_BUTTON') ctaType = '';

    if (ctaType !== '') {
      try {
        const pageRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${accessToken}`);
        const pageData = await pageRes.json();
        const pageToken = pageData.access_token || accessToken;
        
        if (pageToken) {
          const updateParams = new URLSearchParams();
          updateParams.append('call_to_action', JSON.stringify({ type: ctaType, value: { page: pageId } }));
          updateParams.append('access_token', pageToken);

          let updateRes = await fetch(`https://graph.facebook.com/v18.0/${validPostId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: updateParams.toString()
          });
          let updateResult = await updateRes.json();

          if (updateResult.error) {
             const getPostRes = await fetch(`https://graph.facebook.com/v18.0/${validPostId}?fields=message,full_picture&access_token=${pageToken}`);
             const postContent = await getPostRes.json();

             let darkPostUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
             const darkPostParams = new URLSearchParams();
             darkPostParams.append('published', 'false');
             darkPostParams.append('access_token', pageToken);
             darkPostParams.append('call_to_action', JSON.stringify({ type: ctaType, value: { page: pageId } }));

             if (postContent.full_picture) {
                darkPostUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
                darkPostParams.append('url', postContent.full_picture);
                if (postContent.message) darkPostParams.append('caption', postContent.message);
             } else if (postContent.message) {
                darkPostParams.append('message', postContent.message);
             }

             const cloneRes = await fetch(darkPostUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: darkPostParams.toString()
             });
             const cloneResult = await cloneRes.json();

             if (cloneResult.id || cloneResult.post_id) {
                finalCreativePostId = cloneResult.id || cloneResult.post_id; 
             }
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); 
        }
      } catch (err) {
        console.error("CTA Injection Crash:", err);
      }
    }

    // ==========================================
    // ជំហានទី ៤៖ បង្កើត Ad Creative និង Ad
    // ==========================================
    const creativeRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/adcreatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Creative - ${adName}`,
        object_story_id: finalCreativePostId, 
        access_token: accessToken,
      })
    });
    const creativeData = await creativeRes.json();
    if (creativeData.error) throw new Error(`Creative ធ្លាក់: ${translateFBError(creativeData.error.message)}`);

    const adRes = await fetch(`https://graph.facebook.com/v18.0/${targetAdAccountId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: adName || `Ad - Final`, 
        adset_id: adSetId,
        creative: { creative_id: creativeData.id },
        status: 'PAUSED',
        access_token: accessToken,
      })
    });
    const adData = await adRes.json();
    
    if (adData.error) {
       const subcode = adData.error.error_subcode;
       if (subcode === 1487891 || adData.error.error_user_title?.includes('Invalid Creative')) {
          throw new Error(`\n🛑 ផុសនេះអត់មានប៊ូតុង "Send Message" ទេ!\n(បញ្ជាក់៖ ផុសជារូបច្រើនសន្លឹក មិនអាចបំពាក់ប៊ូតុងដោយស្វ័យប្រវត្តិបានទេ)`);
       }
       throw new Error(`Ad ធ្លាក់: ${translateFBError(adData.error.message)}`);
    }

    return NextResponse.json({ success: true, message: `🎉 ជោគជ័យ ១០០%` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}