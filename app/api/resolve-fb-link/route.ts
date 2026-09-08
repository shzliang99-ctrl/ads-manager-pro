import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "No URL provided" });

    // ១. ឱ្យ Server រត់ទៅបើក Link ហ្នឹង ដើម្បីឱ្យ Facebook បញ្ជូនទៅ Link ពេញ
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const finalUrl = response.url;
    const html = await response.text();

    let numericId = "";

    // ២. ព្យាយាមទាញលេខចេញពី Link ពេញ (fbid, pcb, posts)
    const urlPattern = /(?:fbid=|set=pcb\.|posts\/|videos\/|groups\/.*?\/permalink\/)([0-9]{10,})/;
    const urlMatch = finalUrl.match(urlPattern);
    
    if (urlMatch) {
        numericId = urlMatch[1];
    }

    // ៣. បើទាញពី Link អត់បានលេខទេ មានន័យថាវាចេញ pfbid អញ្ចឹងត្រូវកាយរកលេខសុទ្ធក្នុង HTML របស់ Facebook ផ្ទាល់តែម្តង!
    if (!numericId) {
        const htmlPatterns = [
            /"top_level_post_id":"([0-9]{10,})"/,
            /"post_id":"([0-9]{10,})"/,
            /fb:\/\/post\/([0-9]{10,})/,
            /fb:\/\/photo\/([0-9]{10,})/,
            /"mf_story_key":"([0-9]{10,})"/,
            /ft_ent_identifier=([0-9]{10,})/
        ];

        for (let regex of htmlPatterns) {
            let match = html.match(regex);
            if (match) {
                numericId = match[1];
                break;
            }
        }
    }

    // បញ្ជូនលេខ ID សុទ្ធទៅកាន់អ្នកប្រើប្រាស់វិញ
    if (numericId) {
        return NextResponse.json({ success: true, id: numericId });
    } else {
        return NextResponse.json({ success: false, error: "Cannot find numeric ID" });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server Error" });
  }
}