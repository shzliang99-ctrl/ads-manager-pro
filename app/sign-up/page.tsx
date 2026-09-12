"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 🌟 ជំហានទី ១៖ ឆែកមើលថាតើ Email នេះមានក្នុង Database ស្រាប់ហើយឬยัง?
      const { data: existingUser, error: checkError } = await supabase
        .from('customer_subscriptions')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        setLoading(false);
        setErrorMsg("⚠️ អ៊ីមែល (Gmail) នេះត្រូវបានគេប្រើប្រាស់រួចហើយ! សូមប្រើអ៊ីមែលផ្សេង។");
        return;
      }

      // ជំហានទី ២៖ បង្កើត Account ក្នុង Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (authError) throw authError;

      // ជំហានទី ៣៖ បន្ថែមទិន្នន័យអតិថិជនចូលទៅក្នុងតារាង customer_subscriptions
      const { error: dbError } = await supabase
        .from('customer_subscriptions')
        .insert([
          {
            client_name: clientName,
            email: cleanEmail,
            password: password,
            phone: phone,
            package_name: '១ ខែ (Standard)',
            amount: '0.00',
            start_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);

      if (dbError) {
        console.error("Database insert warning:", dbError.message);
      }

      setLoading(false);
      setIsSuccessModal(true);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "មានបញ្ហាក្នុងการចុះឈ្មោះ សូមព្យាយាមម្ដងទៀត។");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans relative">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-white rounded-[22.5%] overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-xl font-black text-blue-600">Ads Manager Pro</h1>
          <p className="text-xs text-slate-500 mt-0.5">បង្កើតគណនីថ្មីសម្រាប់ហាងរបស់អ្នក</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ឈ្មោះហាង ឬឈ្មោះអតិថិជន</label>
            <input 
              type="text" 
              required 
              value={clientName} 
              onChange={(e) => setClientName(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
              placeholder="បញ្ចូលឈ្មោះ..." 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">អ៊ីមែល (Gmail)</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
              placeholder="example@gmail.com" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">លេខទូរស័ព្ទ</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
              placeholder="012 345 678" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">លេខសម្ងាត់ (Password)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
                placeholder="យ៉ាងហោចណាស់ ៦ តួអក្សរ" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>กำลังបង្កើតគណនី...</span>
              </>
            ) : (
              "ចុះឈ្មោះ (Sign Up)"
            )}
          </button>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
          មានគណនីរួចហើយ?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            ចូលគណនី (Login)
          </Link>
        </div>

      </div>

      {/* Success Modal Popup */}
      {(loading || isSuccessModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 transform transition-transform scale-100 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            
            {loading ? (
              <>
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#1877F2] border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#1877F2] text-xl">⚡</span>
                  </div>
                </div>
                <h3 className="text-[17px] font-bold text-slate-800 mb-1">កំពុងបង្កើតគណនី...</h3>
                <p className="text-[12.5px] text-slate-500 text-center leading-relaxed">
                  ប្រព័ន្ធកំពុងរៀបចំ Profile និង Database ជូនលោកអ្នក សូមមេត្តារង់ចាំបន្តិច...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
                  ✓
                </div>
                <h3 className="text-[18px] font-bold text-slate-800 mb-2">ចុះឈ្មោះជោគជ័យ!</h3>
                <p className="text-[13px] text-slate-500 text-center leading-relaxed mb-6">
                  គណនីរបស់អ្នកត្រូវបានបង្កើតរួចរាល់ហើយ។ ឥឡូវនេះលោកអ្នកអាចចូលប្រើប្រាស់ប្រព័ន្ធបាន។
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-[14.5px] transition shadow-md cursor-pointer"
                >
                  ចូលគណនី (Login)
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}