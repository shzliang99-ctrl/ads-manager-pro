"use client";

import { useState } from "react";

export default function TermsOfService() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className={`min-h-screen font-sans p-6 sm:p-12 transition-colors ${theme === 'dark' ? 'bg-[#18191A] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#242526] p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl sm:text-3xl font-black text-blue-600">Terms of Service</h1>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 cursor-pointer text-base"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
          <p><strong>Effective Date:</strong> September 18, 2026</p>
          <p>
            By accessing or using <strong>1 Click Boost</strong>, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">1. Use of Services</h2>
          <p>
            Our platform provides tools to help you manage and boost Facebook advertisements through the official Meta Marketing API. You agree to use this service only for lawful purposes and in compliance with Meta's advertising policies.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">2. Facebook Account Connection</h2>
          <p>
            You are responsible for maintaining the security of your Facebook account tokens and credentials linked to our application. We are not liable for any unauthorized ad spend resulting from compromised account security on your end.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">3. Limitation of Liability</h2>
          <p>
            In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or connected to your use of our advertising tools or decisions made by Meta regarding ad disapprovals or account restrictions.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">4. Contact Information</h2>
          <p>
            For any questions about these Terms, please contact us at: <a href="mailto:sengsoveasna93@gmail.com" className="text-blue-600 font-bold underline">sengsoveasna93@gmail.com</a>
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400">
          © 2026 1 Click Boost. All rights reserved.
        </div>

      </div>
    </div>
  );
}