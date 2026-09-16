"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // ឆែកមើលថាតើ User បាន Login ឬยัง
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setMsg({ text: "❌ លേខសម្ងាត់ថ្មី និងការបញ្ជាក់លេខសម្ងាត់មិនដូចគ្នាទេ!", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ text: "❌ លេខសម្ងាត់ថ្មីត្រូវតែមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // ធ្វើការប្ដូរ Password តាមរយៈ Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // ធ្វើការ Update ក្នុង Database តារាង customer_subscriptions ផងដែរ (ប្រសិនបើចាំបាច់)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        await supabase
          .from('customer_subscriptions')
          .update({ password: newPassword })
          .eq('email', user.email);
      }

      setMsg({ text: "✅ បានផ្លាស់ប្ដូរលេខសម្ងាត់ថ្មីដោយជោគជ័យ!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err: any) {
      setMsg({ text: "❌ បរាជ័យក្នុងការប្ដូរលេខសម្ងាត់: " + (err.message || "សូមព្យាយាមម្ដងទៀត"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition">
            ←
          </Link>
          <h1 className="text-base font-black text-blue-600">Ads Manager Pro - Settings</h1>
        </div>
        <Link href="/" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition">
          ត្រឡប់ទៅ Dashboard វិញ
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ការកំណត់គណនី (Settings)</h2>
              <p className="text-xs text-slate-500">ផ្លាស់ប្ដូរលេខសម្ងាត់ថ្មីដើម្បីសុវត្ថិភាពគណនីរបស់អ្នក</p>
            </div>
          </div>

          {msg.text && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs font-bold text-center border ${
              msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">លេខសម្ងាត់ថ្មី (New Password)</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="យ៉ាងហោចណាស់ ៦ តួអក្សរ"
                  className="w-full px-3.5 py-3 pr-10 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm Password)</label>
              <input 
                type={showPass ? "text" : "password"} 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="វាយបញ្ចូលលេខសម្ងាត់ថ្មីម្ដងទៀត"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium bg-slate-50"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>កំពុងរក្សាទុក...</span>
                </>
              ) : (
                "✓ រក្សាទុកការផ្លាស់ប្ដូរ"
              )}
            </button>
          </form>

        </div>
      </main>

    </div>
  );
}