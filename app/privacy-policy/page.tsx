"use client";

import { useState } from "react";

export default function PrivacyPolicy() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className={`min-h-screen font-sans p-6 sm:p-12 transition-colors ${theme === 'dark' ? 'bg-[#18191A] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#242526] p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl sm:text-3xl font-black text-blue-600">Privacy Policy</h1>
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
            Welcome to <strong>1 Click Boost</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when registering at the application, expressing an interest in obtaining information about us or our products and services, or otherwise contacting us.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Facebook Account Information:</strong> When you connect your Facebook account, we access basic profile data, managed Pages, and Ad Accounts solely for the purpose of executing advertising and boosting services as requested by you.</li>
            <li><strong>Contact Information:</strong> Email address, phone number, and business details.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our application for a variety of business purposes described below:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To facilitate account creation and login processes.</li>
            <li>To manage and publish advertisements (Boost Posts) on your behalf through the Meta Marketing API.</li>
            <li>To send administrative information to you regarding our services.</li>
            <li>To respond to user inquiries and offer support to users.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">3. Sharing Your Information</h2>
          <p>
            We do not share, sell, rent, or trade any of your information with third parties for their promotional purposes. We only share information with Meta (Facebook) as necessary to provide the advertising services you authorize within our platform.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">4. Data Security</h2>
          <p>
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mt-6">5. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may email us at: <a href="mailto:sengsoveasna93@gmail.com" className="text-blue-600 font-bold underline">sengsoveasna93@gmail.com</a>
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400">
          © 2026 1 Click Boost. All rights reserved.
        </div>

      </div>
    </div>
  );
}