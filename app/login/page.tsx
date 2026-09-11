"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 🌟 State សម្រាប់បង្ហាញ/លាក់ Password
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🌟 ទាញយក Email និង Password ដែលធ្លាប់ Save ទុក (បើមាន) ពេលបើកផ្ទាំង Login មកដំបូង
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
        // 🌟 ពិនិត្យមើលថាតើ User បាន ടിច Remember Me ដែរឬទេ?
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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        
        <h1 className="text-2xl font-black text-blue-600 mb-1 text-center">Ads Manager Pro</h1>
        <p className="text-sm text-slate-500 text-center mb-6">សូម Login ចូលប្រព័ន្ធជាមុនសិន</p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium">
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} // 🌟 ប្ដូរប្រភេទ Input តាមស្ថានភាព Show/Hide
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl p-3 pr-10 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
              {/* 🌟 ប៊ូតុងរូបកងភ្នែកសម្រាប់ចុចមើល Password */}
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

          {/* 🌟 ផ្នែក Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm mt-2 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "កំពុងចូល..." : "Login"}
          </button>
        </form>

      </div>
    </div>
  );
}