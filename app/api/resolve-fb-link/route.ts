import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "No URL provided" });

    // ១. ប្រព័ន្ធដើរតួជាកុំព្យូទ័រ ចូលទៅបើក Link កាត់ខ្លី ដើម្បីឱ្យវាលោតទៅ Link ពេញ
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

    // ២. រូបមន្តឆែករកលេខ ID តាមប្រភេទ (Reel, Photo, Video, Post) ពីតំណភ្ជាប់ពេញ
    const urlPatterns = [
      /\/reel\/([0-9]{10,})/,             // សម្រាប់ Reels: ដូចរូបទី១៦ របស់បង
      /set=pcb\.([0-9]{10,})/,             // សម្រាប់ អាល់ប៊ុមរូបភាព (Album)
      /(?:fbid=|story_fbid=)([0-9]{10,})/, // សម្រាប់ រូបភាពទូទៅ
      /\/posts\/([0-9]{10,})/,             // សម្រាប់ អត្ថបទ (Posts)
      /\/videos\/([0-9]{10,})/,            // សម្រាប់ វីដេអូ (Videos)
      /v=([0-9]{10,})/                     // សម្រាប់ Facebook Watch
    ];

    for (let regex of urlPatterns) {
      const match = finalUrl.match(regex);
      if (match) {
        numericId = match[1];
        break;
      }
    }

    // ៣. បើនៅតែរកមិនឃើញក្នុង URL វាចូលទៅកាយរកក្នុងកូដ HTML របស់ហ្វេសប៊ុកតែម្តង
    if (!numericId) {
      const htmlPatterns = [
        /"video_id":"([0-9]{10,})"/,
        /"photo_id":"([0-9]{10,})"/,
        /"top_level_post_id":"([0-9]{10,})"/,
        /"post_id":"([0-9]{10,})"/
      ];

      for (let regex of htmlPatterns) {
        let match = html.match(regex);
        if (match) {
          numericId = match[1];
          break;
        }
      }
    }

    // ៤. បញ្ជូនលេខ ID សុទ្ធមកកាន់ប្រអប់វិញ
    if (numericId) {
      return NextResponse.json({ success: true, id: numericId });
    } else {
      return NextResponse.json({ success: false, error: "រកលេខ ID សុទ្ធមិនឃើញទេ" });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server Error" });
  }
}