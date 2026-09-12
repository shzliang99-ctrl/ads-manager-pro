"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ!");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!");
      return;
    }

    setLoading(true);

    try {
      // ធ្វើការ Update Password ថ្មីតាមរយៈ Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // បច្ចុប្បន្នភាពក្នុង Table customer_subscriptions ផងដែរ (ដើម្បីឱ្យ Admin មើលឃើញ Password ថ្មី)
      await supabase
        .from('customer_subscriptions')
        .update({ password: newPassword })
        .eq('email', userEmail);

      setMessage("✅ បានផ្លាស់ប្ដូរលេខសម្ងាត់ថ្មីដោយជោគជ័យ!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "មានបញ្ហាក្នុងការផ្លាស់ប្ដូរលេខសម្ងាត់។");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-lg font-bold text-slate-800">⚙️ កែប្រែគណនី (Settings)</h1>
          <button 
            onClick={() => router.push('/')} 
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            ← ត្រឡប់ក្រោយវិញ
          </button>
        </div>

        <div className="mb-4 text-xs text-slate-500 font-medium">
          គណនីបច្ចុប្បន្ន៖ <strong className="text-slate-800">{userEmail}</strong>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl text-center">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">លេខសម្ងាត់ថ្មី (New Password)</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium"
              placeholder="••••••••" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm Password)</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium"
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? "កំពុងរក្សាទុក..." : "រក្សាទុកលេខសម្ងាត់ថ្មី"}
          </button>
        </form>

      </div>
    </div>
  );
}