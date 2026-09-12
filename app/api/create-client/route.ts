import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, email, password, phone, linkedFbPage, packageName, durationDays, amountPaid } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // 🌟 ប្រើ Admin Key ដើម្បីបង្កើត Account ឱ្យគេបាន
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // ១. បង្កើតគណនី Login (Authentication)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // អនុញ្ញាតឱ្យ Login បានភ្លាមៗ
    });

    if (authError) return NextResponse.json({ success: false, error: authError.message });

    // ២. បញ្ចូលប្រវត្តិអតិថិជនទៅក្នុង Table
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + Number(durationDays));

    const { error: dbError } = await supabaseAdmin.from('customer_subscriptions').insert([{
      client_name: clientName,
      email: email,
      password: password, 
      phone: phone,
      linked_fb_page: linkedFbPage,
      package_name: packageName,
      start_date: startDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      amount: Number(amountPaid) || 0,
      status: 'active',
    }]);

    if (dbError) return NextResponse.json({ success: false, error: dbError.message });

    return NextResponse.json({ success: true, message: 'គណនីត្រូវបានបង្កើតជោគជ័យ!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}