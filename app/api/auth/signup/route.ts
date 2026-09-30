import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, email, password, phone, packageName } = body;

    if (!clientName || !email || !password) {
      return NextResponse.json({ success: false, error: 'សូមបំពេញឈ្មោះ អ៊ីមែល និងលេខសម្ងាត់ឱ្យបានត្រឹមត្រូវ!' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    // ១. បង្កើត User ថ្មីក្នុង Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // ២. បញ្ចូលទិន្នន័យអតិថិជនចូលទៅក្នុងតារាង customer_subscriptions របស់ Admin (ដើម្បីឱ្យលោតមក Tab គ្រប់គ្រងអតិថិជន)
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() - 1); // ដាក់ហួសថ្ងៃបន្តិច ឬ 0 ដើម្បីទប់ស្កាត់មិនទាន់ឱ្យប្រើប្រាស់រហូតទាល់តែ Admin Approve

    const { error: dbError } = await supabase
      .from('customer_subscriptions')
      .insert([
        {
          client_name: clientName,
          email: email.trim().toLowerCase(),
          phone: phone || '',
          package_name: packageName || 'កញ្ចប់ស្តង់ដារ (1 ខែ)',
          amount: 5.00, // តម្លៃកម្រិតដើម
          start_date: today.toISOString(),
          expiry_date: expiryDate.toISOString(), // 🔒 ដាក់ឱ្យផុតកំណត់សិន ដើម្បីឱ្យរុញទៅទំព័រទូទាត់ប្រាក់
          status: 'pending',
          slip_status: 'pending' // ⏳ រង់ចាំ Admin ពិនិត្យ Slip និង Approve
        }
      ]);

    if (dbError) {
      console.error("Database insert error:", dbError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'បានចុះឈ្មោះដោយជោគជ័យ! សូមធ្វើការ Login និងទូទាត់ប្រាក់ដើម្បីបន្តប្រើប្រាស់។' 
    });

  } catch (err: any) {
    console.error("Signup API Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}