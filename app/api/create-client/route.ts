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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables!" }, { status: 500 });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // ១. បង្កើតគណនី Login (Authentication) តាមរយៈ Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true // អនុញ្ញាតឱ្យ Login បានភ្លាមៗដោយមិនបាច់ Verify Gmail
    });

    // ប្រសិនបើ Email ហ្នឹងមានរួចហើយក្នុង Auth គឺយើងរំលងការបង្កើត Auth ចោល
    if (authError && !authError.message.includes("already been registered")) {
      return NextResponse.json({ success: false, error: authError.message });
    }

    // ២. កំណត់កាលបរិច្ឆេទចាប់ផ្តើម និងថ្ងៃផុតកំណត់សេវា
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + Number(durationDays || 30));

    // ៣. ពិនិត្យមើលសិនថាមាន Email នេះក្នុង Database customer_subscriptions ហើយឬยัง
    const { data: existingUser } = await supabaseAdmin
      .from('customer_subscriptions')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    let dbError;
    if (existingUser) {
      // បើមានរួចហើយ ធ្វើការ Update ព័ត៌មានថ្មី
      const { error } = await supabaseAdmin.from('customer_subscriptions').update({
        client_name: clientName || 'No Name',
        password: password, 
        phone: phone || '',
        linked_fb_page: linkedFbPage || null,
        package_name: packageName || '១ ខែ (Standard)',
        expiry_date: expiryDate.toISOString(),
        amount: Number(amountPaid) || 0,
        status: 'active',
      }).eq('email', email.trim().toLowerCase());
      dbError = error;
    } else {
      // បើអត់ទាន់មាន ធ្វើការ Insert ថ្មីចូល Database
      const { error } = await supabaseAdmin.from('customer_subscriptions').insert([{
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
      }]);
      dbError = error;
    }

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message });
    }

    return NextResponse.json({ success: true, message: 'គណនីត្រូវបានបង្កើតជោគជ័យ!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server Internal Error' });
  }
}