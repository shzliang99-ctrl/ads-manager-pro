"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Email ឬ Password មិនត្រឹមត្រូវទេ។");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-white rounded-[22.5%] overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-xl font-black text-blue-600">Ads Manager Pro</h1>
          <p className="text-xs text-slate-500 mt-1">សូម Login ចូលប្រព័ន្ធគ្រប់គ្រងរបស់អ្នក</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">EMAIL</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium"
              placeholder="example@gmail.com" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PASSWORD</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900 font-medium"
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? "កំពុងចូល..." : "Login"}
          </button>
        </form>

        {/* 🌟 ធ្វើជាប៊ូតុង Sign Up ស្អាតនៅខាងក្រោម Login */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">មិនទាន់មានគណនីសម្រាប់ហាងរបស់អ្នកទេ?</span>
          <Link 
            href="/sign-up" 
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition text-center block shadow-xs"
          >
            បង្កើតគណនីថ្មី (Sign Up)
          </Link>
        </div>

      </div>
    </div>
  );
}