import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "No URL provided" });

    // ឱ្យ Server រត់ទៅបើក Link ទូរស័ព្ទនោះ ដើម្បីឱ្យ Facebook បញ្ជូនទៅកាន់ Link ពេញ
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const expandedUrl = response.url; // នេះគឺជា Link ពេញក្រោយពេលលាតសន្ធឹង
    let finalId = "";

    // ប្រើក្បួនស្រង់យក ID ពីតំណភ្ជាប់ពេញ
    const pcbMatch = expandedUrl.match(/set=pcb\.([0-9]+)/);
    const fbidMatch = expandedUrl.match(/(?:story_fbid=|fbid=)([0-9]+)/);
    const postMatch = expandedUrl.match(/\/posts\/([0-9]+)/);
    const pfbidMatch = expandedUrl.match(/(pfbid[a-zA-Z0-9]+)/);
    const longNumMatch = expandedUrl.match(/([0-9]{13,})/g);

    if (pcbMatch) finalId = pcbMatch[1];
    else if (fbidMatch) finalId = fbidMatch[1];
    else if (postMatch) finalId = postMatch[1];
    else if (pfbidMatch) finalId = pfbidMatch[1];
    else if (longNumMatch && longNumMatch.length > 0) finalId = longNumMatch[longNumMatch.length - 1];

    // បើនៅតែរកមិនឃើញក្នុង URL ឱ្យវាចូលទៅកាយរកក្នុងកូដ HTML របស់ Facebook ផ្ទាល់
    if (!finalId) {
      const html = await response.text();
      const metaMatch = html.match(/"post_id":"([0-9]+)"/) || html.match(/"top_level_post_id":"([0-9]+)"/);
      if (metaMatch) finalId = metaMatch[1];
    }

    if (finalId) {
      return NextResponse.json({ success: true, id: finalId });
    } else {
      return NextResponse.json({ success: false, error: "Cannot extract ID" });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}