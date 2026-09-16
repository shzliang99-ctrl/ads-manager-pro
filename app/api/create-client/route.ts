import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, email, password, phone, linkedFbPage, packageName, durationDays, amountPaid } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "សូមបញ្ចូល Email និង Password ឱ្យបានត្រឹមត្រូវ!" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // ១. បង្កើតគណនី Login (Authentication) តាមរយៈ Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true // អនុញ្ញាតឱ្យ Login បានភ្លាមៗដោយមិនបាច់ Verify Gmail
    });

    // ប្រសិនបើ Email ហ្នឹងមានរួចហើយក្នុង Auth គឺយើងរំលងការបង្កើត Auth ចោល ហើយឱ្យវា Insert ចូល Table តែម្ដងការពារការគាំង
    if (authError && !authError.message.includes("already been registered")) {
      return NextResponse.json({ success: false, error: authError.message });
    }

    // ២. បញ្ចូល ឬអាប់ដេតប្រវត្តិអតិថិជនទៅក្នុង Table customer_subscriptions
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + Number(durationDays || 30));

    const { error: dbError } = await supabaseAdmin.from('customer_subscriptions').upsert([{
      client_name: clientName || 'No Name',
      email: email.trim().toLowerCase(),
      password: password, 
      phone: phone || '',
      linked_fb_page: linkedFbPage || null,
      package_name: packageName || '១ ខែ (Standard)',
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      amount: Number(amountPaid) || 0,
      status: 'active',
    }], { onConflict: 'email' }); // បើស្ទួន Email គឺវា Update ជំនួសឱ្យការ Error

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message });
    }

    return NextResponse.json({ success: true, message: 'គណនីត្រូវបានបង្កើតជោគជ័យ!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Internal Error' });
  }
}