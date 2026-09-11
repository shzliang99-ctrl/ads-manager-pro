"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
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
              className="w-full border rounded-xl p-3 text-sm bg-slate-50 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm bg-slate-50 text-slate-900"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm mt-2"
          >
            {loading ? "កំពុងចូល..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}