"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    const savedPassword = localStorage.getItem("remembered_password");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
          localStorage.setItem("remembered_password", password);
        } else {
          localStorage.removeItem("remembered_email");
          localStorage.removeItem("remembered_password");
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "មានបញ្ហាពេលចូលគណនី។");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-white rounded-[22.5%] overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
          </div>
          <h1 className="text-xl font-black text-blue-600">Ads Manager Pro</h1>
          <p className="text-xs text-slate-500 mt-0.5">សូម Login ចូលប្រព័ន្ធគ្រប់គ្រងរបស់អ្នក</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl p-3 pr-10 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700 text-sm font-bold cursor-pointer"
                title={showPassword ? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span className="font-medium">Remember me</span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {loading ? "កំពុងចូល..." : "Login"}
          </button>
        </form>

        {/* 🌟 ផ្នែកប៊ូតុង Sign Up រៀបចំគម្លាតស្អាត មិនធ្លាក់បាត */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">មិនទាន់មានគណនីសម្រាប់ហាងរបស់អ្នកទេ?</span>
          <Link 
            href="/sign-up" 
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold rounded-xl text-sm transition text-center block shadow-xs cursor-pointer border border-slate-200/60"
          >
            + បង្កើតគណនីថ្មី (Sign Up)
          </Link>
        </div>

      </div>
    </div>
  );
}