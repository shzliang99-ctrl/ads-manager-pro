"use client";

import { useState, useEffect, useRef } from "react"; // 👈 ថែម useRef ត្រង់នេះ
import { supabase } from "@/lib/supabase";

const translations = {
  kh: {
    createCampaign: "បង្កើតយុទ្ធនាការ",
    manageCampaign: "គ្រប់គ្រងយុទ្ធនាការ",
    aiCopywriter: "AI Copywriter",
    subscriptions: "គ្រប់គ្រងអតិថិជន",
    settings: "ការកំណត់ (Settings)",
    logout: "Logout ចេញពីប្រព័ន្ធ",
  },
  en: {
    createCampaign: "Create Campaign",
    manageCampaign: "Manage Campaigns",
    aiCopywriter: "AI Copywriter",
    subscriptions: "Manage Subscriptions",
    settings: "Settings",
    logout: "Logout",
  }
};

// 🌟 Option សម្រាប់ជ្រើសរើសថ្ងៃ
const datePresetOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_14d', label: 'Last 14 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'maximum', label: 'Lifetime' },
];

export default function Home() {

  // 🌟 ឆែកមើលថាតើ User ដែលកំពុង Login ជា Admin ដែរឬត់? (ប្តូរ Email នេះជា Email ផ្ទាល់ខ្លួនរបស់បង)
  const ADMIN_EMAIL = "sengsoveasna93@gmail.com"; 
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, []);

  const [activePreviewAdId, setActivePreviewAdId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchClientExpiry = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) return;

      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select('expiry_date')
        .eq('email', user.email)
        .single();

      if (data && data.expiry_date) {
        const today = new Date();
        const expiry = new Date(data.expiry_date);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setClientExpiryDaysLeft(diffDays);
      }
    };
    fetchClientExpiry();
  }, []);

  // 🌟 State សម្រាប់ Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000); // បាត់ទៅវិញដោយស្វ័យប្រវត្តិក្រោយ ៤ វិនាទី
  };

  // 🌟 មុខងារកំណត់កម្រិត CPA พร้อม Tooltip ពេលเอา Mouse ដាក់លើ
  const getCpaBadge = (cpa: number) => {
    let badgeConfig = {
      bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300",
      text: "🟢 ល្អខ្លាំង (Excellent)",
      action: "រក្សាលំនឹង ឬ បង្កើនថវិកា (Scale Budget) បន្ថែមព្រោះការផ្សាយពាណិជ្ជកម្មទាក់ទាញខ្លាំង។"
    };

    if (cpa > 0.50 && cpa <= 1.00) {
      badgeConfig = {
        bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
        text: "🟢 ល្អ (Good)",
        action: "ប្រសិទ្ធភាពការងារល្អប្រសើរ អាចបន្តដំណើរការយុទ្ធនាការនេះធម្មតា។"
      };
    } else if (cpa > 1.00 && cpa <= 2.00) {
      badgeConfig = {
        bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300",
        text: "🟡 មធ្យម (Average)",
        action: "នៅអាចទទួលយកបាន ប៉ុន្តែគួរពិនិត្យមើលរូបភាព ឬអត្ថបទ (Copywriter) ក្រែងលោអាចកែច្នៃឱ្យទាក់ទាញជាងមុន។"
      };
    } else if (cpa > 2.00 && cpa <= 5.00) {
      badgeConfig = {
        bg: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border-orange-300",
        text: "🟠 ខ្សោយ (Poor)",
        action: "ចំណាយដើមទុនច្រើន ប៉ុន្តែទទួលបានលទ្ធផលតិច គួរផ្អាកសិន ឬកែសម្រួល Targeting ។"
      };
    } else if (cpa > 5.00) {
      badgeConfig = {
        bg: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-300",
        text: "🔴 អត់ល្អ (Critical)",
        action: "ត្រូវផ្អាក (Pause) ជាបន្ទាន់! បើមិនដូច្នេះទេ នឹងខាតលុយឥតប្រយោជន៍ ហើយត្រូវប្រើ AI Copywriter សរសេរ Content ថ្មី ឬប្ដូរម៉ូដស្បែកជើងមកសាកល្បងម្ដងទៀត។"
      };
    }

    return (
      <div className="relative group inline-block">
        {/* Badge Button */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-max cursor-pointer transition-transform duration-200 hover:scale-105 shadow-xs ${badgeConfig.bg}`}>
          {badgeConfig.text}
        </span>

        {/* 🌟 Tooltip Box នឹងលោតបង្ហាញពេលเอา Mouse ដាក់លើយ៉ាងស្អាត */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-[260px] p-3 text-xs text-white bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
            <span>💡</span> យោបល់ណែនាំសម្រាប់អ្នកគ្រប់គ្រង៖
          </div>
          <p className="leading-relaxed text-slate-200 font-normal">
            {badgeConfig.action}
          </p>
          {/* Triangle Pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-slate-900 border-t-8 border-x-transparent border-x-8 border-b-0"></div>
        </div>
      </div>
    );
  };

  const [clientExpiryDaysLeft, setClientExpiryDaysLeft] = useState<number | null>(null);

  // 🌟 State និង Function សម្រាប់ទាញយក និង Upload Admin QR Code
  const [adminQrUrl, setAdminQrUrl] = useState("");

  const fetchAdminQR = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'bank_qr_url')
        .single();
      
      if (data && data.setting_value) {
        setAdminQrUrl(data.setting_value);
      }
    } catch (e) {
      console.error("Error fetching admin QR:", e);
    }
  };

  useEffect(() => {
    fetchAdminQR();
  }, []);

  const handleUploadAdminQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `admin_qr_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('slips') // ប្រើ Bucket 'slips' ដែលមានស្រាប់
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(fileName);

      await supabase
        .from('admin_settings')
        .upsert({ setting_key: 'bank_qr_url', setting_value: publicUrl }, { onConflict: 'setting_key' });

      showToast("✅ បានอప్‌ಲೋដ QR Code ថ្មីដោយជោគជ័យ!", "success");
      fetchAdminQR();
    } catch (err: any) {
      alert("❌ បរាជ័យក្នុងការ Upload: " + err.message);
    }
  };
  // 🌟 State សម្រាប់ເກັບបញ្ជី Facebook Pages របស់អ្នកប្រើប្រាស់
  const [facebookPages, setFacebookPages] = useState<any[]>([]);

  // 🌟 Function សម្រាប់ទាញយក Facebook Pages របស់អ្នកប្រើប្រាស់
  const fetchFacebookPages = async (token: string) => {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
      const data = await res.json();
      
      if (data.data) {
        setFacebookPages(data.data); // ទុកក្នុង state សម្រាប់បង្ហាញក្នុង Dropdown
      } else {
        console.error("No pages found or error:", data);
      }
    } catch (err) {
      console.error("Error fetching Facebook pages:", err);
    }
  };

  // 🌟 ប្រកាស State សម្រាប់ Pop-up កែប្រែប្រាក់ចំណូលសរុប
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [customRevenueInput, setCustomRevenueInput] = useState("");
  
  // 🌟 បន្ថែម State សម្រាប់គ្រប់គ្រង Page Menu Dropdown
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);

  // 🌟 States សម្រាប់ Modal Confirm លុបយុទ្ធនាការ
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteSuccessModal, setIsDeleteSuccessModal] = useState(false);

  const [autoFillInput, setAutoFillInput] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [showConversationSection, setShowConversationSection] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState<'none' | 'photo' | 'video'>('none');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // 🌟 State សម្រាប់គ្រប់គ្រង Custom Error Modal និង Link ទៅ Ads Manager
  const [customError, setCustomError] = useState<string | null>(null);
  const [errorActionUrl, setErrorActionUrl] = useState<string | null>(null);

  // 🌟 State និង Function សម្រាប់ AI Audit ព្រមទាំង Speaker (Text-to-Speech)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 🌟 State សម្រាប់ទប់ស្កាត់ការចុចញាប់ពេក (Cooldown / Throttling)
  const [isAuditCoolingDown, setIsAuditCoolingDown] = useState(false);

  const handleAiAudit = async (adItem: any) => {
    // បើកំពុងติด Lock មិនទាន់គ្រប់ពេល ឱ្យវាប្រាប់សិនដើម្បីការពារ Error 429
    if (isAuditCoolingDown) {
      alert("⏳ សូមស្ងប់ចិត្តបន្តិច! ប្រព័ន្ធកំពុងសម្រាករំពេចដើម្បីការពារការកកស្ទះ AI (Rate Limit)។ សូមរង់ចាំប្រហែល ១០ វិនាទីសិន។");
      return;
    }

    setIsAuditModalOpen(true);
    setAuditLoading(true);
    setAuditResult(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const ins = adItem.insights && adItem.insights.data && adItem.insights.data.length > 0 ? adItem.insights.data[0] : null;
    const spend = ins?.spend || 0;
    const impressions = ins?.impressions || 0;
    
    let results = 0;
    if (ins && ins.actions) {
      const actionObj = ins.actions.find((a: any) => 
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || 
        a.action_type === 'messaging_conversation_started_7d' ||
        a.action_type === 'link_click'
      );
      if (actionObj) results = Number(actionObj.value);
    }

    const ctr = impressions > 0 ? ((results / impressions) * 100).toFixed(2) : "0";
    const cpa = results > 0 ? (Number(spend) / results).toFixed(2) : "0";

    try {
      const res = await fetch('/api/ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adName: adItem.name,
          spend,
          results,
          impressions,
          ctr,
          cpa
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setAuditResult(data.audit);
      } else {
        // បើជួប Error 429 ឱ្យវាដាស់តឿនប្រាប់ថាកំណត់ពេលរួចរាល់
        if (data.error && data.error.includes("429")) {
          alert("⚠️ AI ជាប់ដែនកំណត់ Free Tier មួយភ្លែត (Rate Limit)! សូមរង់ចាំ ១០ វិនាទីរួចចុចមើលម្ដងទៀត។");
        } else {
          alert("❌ AI Audit Error: " + data.error);
        }
        setIsAuditModalOpen(false);
      }
    } catch (err) {
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ AI Server!");
      setIsAuditModalOpen(false);
    }
    
    setAuditLoading(false);

    // 🌟 បង្កើត Cool-down ផ្អាករយៈពេល ១០ វិនាទី មិនឱ្យចុចញាប់ពេក
    setIsAuditCoolingDown(true);
    setTimeout(() => {
      setIsAuditCoolingDown(false);
    }, 10000); // 10 វិនាទី
  };
  

  // 🔊 មុខងារ AI Voice និយាយភាសាខ្មែរពិតប្រាកដ (ប្រើ Google TTS Cloud Engine)
  const speakKhmerText = (text: string) => {
    if (!text) return;
    
    // បើកំពុងនិយាយ ឱ្យវា stop សិន
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      // ប្រើប្រាស់ Google Translate TTS Engine សម្រាប់แปลงអត្ថបទខ្មែរទៅជាសំឡេងនិយាយខ្មែរពិតៗ
      const encodedText = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=km&client=tw-ob`;
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        console.error("Audio playback error");
      };

      audio.play().catch(err => {
        setIsSpeaking(false);
        console.log("Auto-play blocked by browser, user interaction needed.");
      });
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  // 🔊 មុខងារ Auto-Play ពេល Pop-up ផ្ទាំងលោតមកដល់និយាយភ្លាមៗជាខ្មែរ
  useEffect(() => {
    if (auditResult && isAuditModalOpen) {
      const fullText = `ចំណាត់ថ្នាក់ពាណិជ្ជកម្ម៖ ${auditResult.title}។ ការវិភាគស៊ីជម្រៅ៖ ${auditResult.analysis}។ យោបល់ណែនាំ៖ ${auditResult.recommendation}`;
      
      setTimeout(() => {
         speakKhmerText(fullText);
      }, 400);
    }
    
    return () => {
      // Clean up ពេលបិទ
    };
  }, [auditResult, isAuditModalOpen]);

 // 🔗 មុខងារសម្រាប់ពេលចុច Connect Facebook
  const handleFacebookConnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      alert("សូមអភ័យទោស! លោកអ្នកត្រូវតែ Login ជាមុនសិន។");
      return window.location.href = '/login';
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) return alert("❌ រកមិនឃើញ Facebook App ID ទេ!");
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/facebook/callback`);
    const scope = 'public_profile,ads_management,ads_read,pages_read_engagement,pages_show_list,pages_manage_ads';
    
    // 🌟 ប្រើមុខងារស្តង់ដារ encodeURIComponent ដើម្បីការពារ Email កុំឱ្យ Error URL
    const safeState = encodeURIComponent(user.email); 
    
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${safeState}&response_type=code`;
  };

  // 🌟 មុខងារទាញយក Facebook Pages មកដាក់បង្ហាញក្នុង Dropdown យ៉ាងរលូន
  useEffect(() => {
    const token = localStorage.getItem('fb_user_token');
    if (!token) return;

    fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setFacebookPages(data.data);
          setPages(data.data);

          const savedPageId = localStorage.getItem("selectedPage");
          const targetPage = savedPageId && data.data.find((p: any) => p.id === savedPageId) 
            ? data.data.find((p: any) => p.id === savedPageId) 
            : data.data[0];

          if (targetPage) {
            setSelectedPage(targetPage.id);
            localStorage.setItem("selectedPage", targetPage.id);
            setFbPageName(targetPage.name);
            localStorage.setItem("fbPageName", targetPage.name);
          }
        }
      })
      .catch(err => console.error("Error fetching pages:", err));
  }, []); 

  // 🌟 មុខងារ AI Auto-Fill វិភាគ និងបំពេញទិន្នន័យទាំង Targeting & Placements ស្វ័យប្រវត្តិ ១០០%
  const handleAiAutoFill = async () => {
    if (!autoFillInput.trim()) {
      showToast("⚠️ សូមវាយបញ្ចូលប្រភេទផលិតផល ឬសេវាកម្មជាមុនសិន!", "error");
      return;
    }
    
    setIsAutoFilling(true);
    try {
      const res = await fetch('/api/ai-auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: autoFillInput })
      });
      const data = await res.json();

      if (data.success && data.result) {
        const resData = data.result;
        
        // 1. បំពេញ Campaign & Ad Set Name
        if (resData.campaignName) saveParam("campaignName", resData.campaignName, setCampaignName);
        if (resData.adsetName) saveParam("adsetName", resData.adsetName, setAdsetName);
        
        // 2. កំណត់ Age & Gender
        if (resData.ageMin) saveParam("ageMin", String(resData.ageMin), setAgeMin);
        if (resData.ageMax) saveParam("ageMax", String(resData.ageMax), setAgeMax);
        if (resData.gender) saveParam("gender", resData.gender, setGender);
        
        // 3. បំពេញ Targeting Keywords (Interests) ស្វ័យប្រវត្តិ
        if (resData.targeting) {
          setTargeting(resData.targeting);
          localStorage.setItem("targeting", resData.targeting);
        }

        // 4. 🌟 កំណត់ PlacementType និង Auto-Tick លើប្រអប់ Placements ផ្ទាល់ស្វ័យប្រវត្តិ
        if (resData.placementType) {
           const pType = resData.placementType.toLowerCase();
           
           if (pType === 'photo') {
              // កំណត់ស្តង់ដារសម្រាប់រូបភាព (Feed & Marketplace ប៉ុណ្ណោះ មិនយក Reels/Stories)
              handleBoostPhotos(); 
           } else if (pType === 'video') {
              // កំណត់ស្តង់ដារសម្រាប់វីដេអូ (Feed, Stories & Reels)
              handleBoostVideos(); 
           } else {
              // បើមិនច្បាស់ ទុកជា Advantage+ (Manual Placements ពេញលេញ)
              setPlacementType("MANUAL");
              localStorage.setItem("placementType", "MANUAL");
           }
        }

        showToast("✨ AI បានបំពេញការកំណត់ (Targeting & Placements) ជូនរួចរាល់ដោយជោគជ័យ!", "success");
      } else {
        showToast("❌ AI Auto-Fill Error: " + (data.error || "Unknown error"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ AI Server!", "error");
    }
    setIsAutoFilling(false);
  };

  // 🚪 មុខងារសម្រាប់ Logout ចេញពីប្រព័ន្ធទាំងស្រុង
  const handleLogout = async () => {
    if (!confirm('តើបងពិតជាចង់ Logout ចេញពីប្រព័ន្ធមែនទេ?')) return;
    
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('fb_user_token');
      localStorage.removeItem('selectedPage');
      localStorage.removeItem('selectedAdAccount');
      localStorage.removeItem('activeTab');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  // 🌟 កូដថ្មី៖ បង្ខំឱ្យប្រាកដថា User បាន Login មុននឹងអាចឃើញផ្ទាំង Dashboard
  useEffect(() => {
    const enforceLogin = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login'; // បោះទៅទំព័រ Login បើមិនទាន់ចូលគណនី
      }
    };
    enforceLogin();
  }, []);

  const [adName, setAdName] = useState("");

  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postFilterType, setPostFilterType] = useState("Published posts");
  const [isPostFilterMenuOpen, setIsPostFilterMenuOpen] = useState(false);

  // 🌟 1. ប្រកាស State Tab ធំ ដោយអានពី LocalStorage ភ្លាមៗការពារកុំឱ្យកន្ត្រាក់
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeTab") || "MANAGE";
    }
    return "MANAGE";
  });
  const [isMounted, setIsMounted] = useState(false);

  // 🌟 បន្ថែមទីនេះ៖ ការពារកុំឱ្យគាំង Blank Screen ពេល Refresh
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🌟 ឆែកមើលការតភ្ជាប់ Facebook ពី Supabase Database (ការពារ Error JSON 100%)
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const res = await fetch('/api/facebook/get-account');
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const result = await res.json();
          if (result.connected) {
            setIsFbConnected(true);
            
            // ✅ កែត្រង់នេះ៖ អានឈ្មោះពី localStorage សិន កុំឱ្យ Database ជាន់ពីលើ!
            const savedPageName = localStorage.getItem("fbPageName");
            if (!savedPageName && result.pageName) {
              setFbPageName(result.pageName);
            }

            if (result.accessToken) {
              localStorage.setItem('fb_user_token', result.accessToken);
            }
            if (result.adAccountId) {
              const savedAdAccount = localStorage.getItem("selectedAdAccount");
              if (!savedAdAccount) {
                 setSelectedAdAccount(result.adAccountId);
                 localStorage.setItem('selectedAdAccount', result.adAccountId);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err);
      }
    };
    checkSupabaseConnection();
  }, []);
  
  // 🌟 1. អាន Page ចុងក្រោយពី localStorage មកដាក់ជា Default ភ្លាមៗពេលបើកទំព័រ
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedPage") || "";
    }
    return "";
  });
  const [isFbConnected, setIsFbConnected] = useState(false);
  const [fbPageName, setFbPageName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fbPageName") || "";
    }
    return "";
  });

  // 🌟 2. មុខងារពេលចុចប្ដូរ Page ក្នុង Dropdown (ចងចាំទុកអចិន្ត្រៃយ៍)
  const handlePageSelect = (pageId: string) => {
    setSelectedPage(pageId);
    localStorage.setItem("selectedPage", pageId);
    
    const selectedObj = pages.find(p => p.id === pageId);
    if (selectedObj) {
      setFbPageName(selectedObj.name);
      localStorage.setItem("fbPageName", selectedObj.name);
    }
    setIsPageMenuOpen(false);
  };

  // 🌟 វិធីសាស្ត្រចាក់សោរដាច់ខាត៖ ហាមរំលោភបំពាន Account ដែល User បានជ្រើសរើសរួច
  useEffect(() => {
    const token = localStorage.getItem('fb_user_token');
    if (!token) return;

    fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=account_id,name&access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          const accList = data.data.map((acc: any) => ({
            account_id: (acc.account_id || acc.id || "").replace('act_', ''),
            name: acc.name || `Ad Account`
          }));
          
          setAdAccountsList(accList);

          // 🌟 ពិនិត្យមើលសិន៖ បើមានការរើស Account រួចហើយ គឺរក្សាទុកវាដាច់ខាត មិនត្រូវអោយប្ដូរទៅណាទេ
          const currentSelected = localStorage.getItem("selectedAdAccount");
          if (currentSelected) {
            setSelectedAdAccount(currentSelected.replace('act_', ''));
          } else {
            setSelectedAdAccount(accList[0].account_id);
            localStorage.setItem("selectedAdAccount", accList[0].account_id);
          }
        }
      })
      .catch(err => console.error("API Error:", err));
  }, [isFbConnected]);

 useEffect(() => {
    // 1. ចាប់យក Token ពី URL ពេលទើប Login មកវិញ
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      localStorage.setItem('fb_user_token', tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. ឆែកមើល Token ក្នុង localStorage ហើយប្តូរ State ព្រមទាំងហៅ API ភ្លាមៗ
    const token = localStorage.getItem('fb_user_token');
    if (token) {
      setIsFbConnected(true);
      fetchAdAccounts();

      // ទាញយកឈ្មោះ Page មកបង្ហាញលើប៊ូតុងបៃតង
      fetch(`/api/auth/facebook/pages?access_token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.pages && data.pages.length > 0) {
            // ✅ កែត្រង់នេះ៖ ហាមយក Page ទី១ [0] មកជាន់ពីលើរាល់ដង!
            const savedPageId = localStorage.getItem("selectedPage");
            const targetPage = savedPageId 
               ? data.pages.find((p: any) => p.id === savedPageId) 
               : data.pages[0];
               
            if (targetPage) {
               setFbPageName(targetPage.name);
               localStorage.setItem("fbPageName", targetPage.name);
            }
          }
        })
        .catch(err => console.log("API Error:", err));
    }
  }, []);

  // 🌟 Auto-fetch Facebook Pages ស្វ័យប្រវត្តិពេលបើកទំព័រ
  useEffect(() => {
    const token = localStorage.getItem('fb_user_token');
    if (!token) return;

    // ហៅ Graph API ទាញយក Pages មកផ្ទុកទុកក្នុង State ភ្លាមៗ
    fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setFacebookPages(data.data);
          setPages(data.data);

          // បើគ្មាន Page ណាត្រូវបានជ្រើសរើសទេ យក Page ទី១ ដាក់ជា Default
          const savedPageId = localStorage.getItem("selectedPage");
          if (!savedPageId || !data.data.find((p: any) => p.id === savedPageId)) {
            setSelectedPage(data.data[0].id);
            localStorage.setItem("selectedPage", data.data[0].id);
            setFbPageName(data.data[0].name);
            localStorage.setItem("fbPageName", data.data[0].name);
          }
        }
      })
      .catch(err => console.error("Error auto-fetching pages:", err));
  }, [isFbConnected]);


  const [adsList, setAdsList] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adsetsList, setAdsetsList] = useState<any[]>([]);
  const [loadingAdsets, setLoadingAdsets] = useState(false);

  // 🌟 [មុខងារ handleTabChange ត្រឹមត្រូវ]
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeTab", tabName);
    }
    if (tabName === "MANAGE") {
      fetchCampaigns();
    }
  };

  // 🌟 States សម្រាប់មុខងារ Duplicate (មាន Pop-up ជ្រើសរើស Post)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateAdName, setDuplicateAdName] = useState("");
  const [duplicatePostId, setDuplicatePostId] = useState("");
  const [postSelectionContext, setPostSelectionContext] = useState<'create' | 'duplicate'>('create'); // ដើម្បីដឹងថាចុច Select Post ពីផ្ទាំងណា

  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // 🌟 States សម្រាប់មុខងារ Quick Edit (កែប្រែរហ័ស)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editStartDate, setEditStartDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editEndDate, setEditEndDate] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  
  // កូដផ្ទាំង Loading
  const [isPublishing, setIsPublishing] = useState(false);

  // 🌟 fetchPostEngagement 
  const fetchPostEngagement = async (postId: string, pageToken: string) => {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageToken}`);
      const data = await res.json();
      return {
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0
      };
    } catch (e) {
      return { likes: 0, comments: 0, shares: 0 };
    }
  };

  // 🌟 State សម្រាប់ Theme (យប់/ថ្ងៃ) និង Language (ខ្មែរ/អង់គ្លេស)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // យក variable នេះមកប្រើប្រាស់កន្លែងបង្ហាញអត្ថបទ
  const t = translations[lang];
  
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState("");
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false); // 🌟 បន្ថែម State សម្រាប់បង្ហាញផ្ទាំងជោគជ័យ និងប៊ូតុង OK
  
  // 1. ប្រកាស State ធម្មតា (ការពារ Next.js Hydration Error)
  const [activeManageTab, setActiveManageTab] = useState("CAMPAIGNS");
  const [selectedAdAccount, setSelectedAdAccount] = useState(() => {
  if (typeof window !== "undefined") {
    // 🌟 ព្យាយាមអានយក ID ចុងក្រោយដែលបានរើសក្នុង localStorage មកប្រើភ្លាមៗ
    return localStorage.getItem("selectedAdAccount") || "1013142813637440";
  }
  return "1013142813637440";
});

  const [postIdHistory, setPostIdHistory] = useState<any[]>([]);

  // ឱ្យវាទាញយកទិន្នន័យពី localStorage ពេល Component ដំណើរការដំបូង
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem('post_id_history');
        if (saved) setPostIdHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // 🌟 create-post
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // 🌟 States សម្រាប់ Ad Account Dropdown
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  
  const [adAccountsList, setAdAccountsList] = useState<any[]>([
    { account_id: "1013142813637440", name: "Personal Account" },
    { account_id: "1445624587438136", name: "Business Account" }
  ]);
  
  const fetchAdAccounts = async () => {
  // 1. ឆែកមើលក្នុង localStorage មុនគេបង្អស់ បើមាន គឺកំណត់តម្លៃនោះទុកជាគោល
  const savedAccount = localStorage.getItem('selectedAdAccount');
  if (savedAccount) {
    setSelectedAdAccount(savedAccount.replace('act_', ''));
  }

  const token = localStorage.getItem('fb_user_token');
  if (!token) return;

  try {
    const response = await fetch(`/api/adaccounts?access_token=${token}`);
    const data = await response.json();

    if (data.success && data.accounts) {
      setAdAccountsList(data.accounts);
      
      // 2. 🌟 ពិនិត្យមើល៖ បើក្នុង localStorage គ្មានតម្លៃទេ ទើបអនុញ្ញាតឱ្យយកអាទីមួយមកដាក់
      const currentSaved = localStorage.getItem('selectedAdAccount');
      if (!currentSaved && data.accounts.length > 0) {
        const firstAccountId = data.accounts[0].account_id.replace('act_', '');
        setSelectedAdAccount(firstAccountId);
        localStorage.setItem('selectedAdAccount', firstAccountId);
      }
    }
  } catch (error) {
    console.error("API Error:", error);
  }
};

  // 🌟 ទាញយកសោរពី Database ប៉ុន្តែ "ហាម" យកមកជាន់ពីលើ Ad Account ដែលបងកំពុងប្រើប្រាស់ផ្ទាល់
  useEffect(() => {
    const syncFacebookDataDirectly = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('customer_subscriptions')
          .select('*')
          .eq('email', user.email)
          .single();

        if (data && data.access_token) {
          localStorage.setItem('fb_user_token', data.access_token);
          setIsFbConnected(true);
          
          const localPageId = localStorage.getItem('selectedPage');
          if (!localPageId && data.page_id) {
             setSelectedPage(data.page_id);
             localStorage.setItem('selectedPage', data.page_id);
             if (data.page_name) {
               setFbPageName(data.page_name);
               localStorage.setItem('fbPageName', data.page_name);
             }
          }
        }
      } catch (err) {
        console.error("Cloud Sync Error:", err);
      }
    };

    syncFacebookDataDirectly();
  }, []);
  
  // 🌟 ឱ្យប្រអប់ Search ចាំ និងរក្សាទុកពាក្យចុងក្រោយជាប់ជានិច្ច ទោះ Refresh ក៏មិនបាត់
  const [interestQuery, setInterestQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("interestQuery") || "";
    }
    return "";
  });
  const [interestResults, setInterestResults] = useState<any[]>([]);

  // 🌟 States សម្រាប់ Date Preset Dropdown
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [selectedDatePreset, setSelectedDatePreset] = useState("last_30d");

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showPlacementsSection, setShowPlacementsSection] = useState(false);
  const [campaignName, setCampaignName] = useState("New Engagement Campaign");
  const [adsetName, setAdsetName] = useState("New Engagement Ad Set");

  const [objective, setObjective] = useState("ENGAGEMENT");
  const [conversionLocation, setConversionLocation] = useState("MESSAGES");
  const [performanceGoal, setPerformanceGoal] = useState("CONVERSATIONS");
  
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [gender, setGender] = useState("ALL");
  const [location, setLocation] = useState("CAMBODIA");
  const [targeting, setTargeting] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("targeting") || "";
    }
    return "";
  });
  
  const [budgetType, setBudgetType] = useState("DAILY");
  const [budget, setBudget] = useState("5"); 
  const [duration, setDuration] = useState("5");

  const [placementType, setPlacementType] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("placementType") || "ADVANTAGE";
  }
  return "ADVANTAGE";
  });
  const [deviceType, setDeviceType] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("deviceType") || "MOBILE"; // បើអត់ទាន់មាន ដាក់ Mobile ជា Default តែម្ដង
  }
  return "MOBILE";
  });
  const [osType, setOsType] = useState("ALL");
  const [wifiOnly, setWifiOnly] = useState(false);
  
  const [showDevices, setShowDevices] = useState(true);
  const [showPlatforms, setShowPlatforms] = useState(true);
  const [showPlacementCtrls, setShowPlacementCtrls] = useState(true);

  // 🌟 States សម្រាប់ AI Copywriter
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);

  // 🌟 State សម្រាប់ Enter Post ID
  const [isEnterPostIdModalOpen, setIsEnterPostIdModalOpen] = useState(false);
  const [manualPostId, setManualPostId] = useState("");

  // 🌟 State សម្រាប់ Real Switcher 
  const [previewMode, setPreviewMode] = useState("fb_feed");

  // 🌟 State សម្រាប់ Call to Action Button
  const [callToAction, setCallToAction] = useState("SEND_MESSAGE");

  // 🌟 States បន្ថែមសម្រាប់ Conversations (Greeting & Interactive Chat)
  const [greetingType, setGreetingType] = useState('text');
  const [greetingMediaUrl, setGreetingMediaUrl] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState('Frequently asked questions');

  // 🌟 States សម្រាប់ Conversations
  const [templateTab, setTemplateTab] = useState("suggested");
  const [isEditingConversations, setIsEditingConversations] = useState(false);
  const [msgGreeting, setMsgGreeting] = useState("Hi Seng! Please let us know how we can help you.");
  const [msgQuestions, setMsgQuestions] = useState([
    { q: "What services do you offer?", a: "" },
    { q: "How much do your services cost?", a: "" },
    { q: "Can I book an appointment?", a: "" }
  ]);
  const [isSavingToFb, setIsSavingToFb] = useState(false);
  const [isPhoneEnabled, setIsPhoneEnabled] = useState(false);
  const [isFollowUpEnabled, setIsFollowUpEnabled] = useState(true);
  const [msgFollowUp, setMsgFollowUp] = useState("Hi Seng! We wanted to follow up. Do you have any questions?");
  const [msgTemplateName, setMsgTemplateName] = useState("Start conversations 08/29/26");

  // 🌟 ធ្វើឱ្យប្រព័ន្ធចងចាំ Campaign ដែលបានជ្រើសរើស (Tick) ទោះ Refresh ក៏មិនបាត់
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedCampaigns");
      if (saved) try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCampaigns", JSON.stringify(selectedCampaigns));
    }
  }, [selectedCampaigns]);

  // 🌟 Master Memory Hook: រត់តែម្តងគត់ពេល Load Page ចប់ ដើម្បីចាក់សោរទិន្នន័យមិនឱ្យលោត
  useEffect(() => {
    if (typeof window !== "undefined") {
      // រក្សាទុក Tab (Ads, Adsets...)
      const savedTab = localStorage.getItem("activeManageTab");
      if (savedTab) setActiveManageTab(savedTab);

      // រក្សាទុក Ad Account ហើយកាត់ពាក្យ act_ ចេញជានិច្ចការពារ Error មិនស្គាល់គ្នា
      const savedAcc = localStorage.getItem("selectedAdAccount");
      if (savedAcc) {
         setSelectedAdAccount(savedAcc.replace('act_', ''));
      }
    }
  }, []);

  // 🌟 ធ្វើឱ្យប្រព័ន្ធចងចាំ Ads ដែលបានជ្រើសរើស
  const [selectedAds, setSelectedAds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedAds");
      if (saved) try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedAds", JSON.stringify(selectedAds));
    }
  }, [selectedAds]);

  // 🌟 ១. Auto-Load ទិន្នន័យ Draft ដែលធ្លាប់បានរក្សាទុកក្នុង LocalStorage ពេលបើកទំព័រដំបូង
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem('ads_manager_campaign_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.campaignName) setCampaignName(parsed.campaignName);
          if (parsed.adsetName) setAdsetName(parsed.adsetName);
          if (parsed.budget) setBudget(parsed.budget);
          if (parsed.duration) setDuration(parsed.duration);
          if (parsed.targeting) setTargeting(parsed.targeting);
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      }
    }
  }, []);

  // 🌟 ២. Auto-Save Draft ស្វ័យប្រវត្តិរាល់ពេលដែលទិន្នន័យមានការផ្លាស់ប្តូរ
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draftData = {
        campaignName,
        adsetName,
        budget,
        duration,
        targeting,
        updatedAt: new Date().toLocaleTimeString()
      };
      localStorage.setItem('ads_manager_campaign_draft', JSON.stringify(draftData));
    }
  }, [campaignName, adsetName, budget, duration, targeting]);

  // 🌟 State សម្រាប់បង្ហាញ Popup เตือน Client ពេលជិតផុតកំណត់សេវា (≤ 7 ថ្ងៃ)
  const [showExpiryAlertModal, setShowExpiryAlertModal] = useState(false);
  const [clientExpiryDaysLeftModal, setClientExpiryDaysLeftModal] = useState<number | null>(null);

  // 🌟 ឆែកមើលថ្ងៃផុតកំណត់របស់ Client ដែលកំពុង Login ដើម្បីបើក Popup ស្វ័យប្រវត្តិ
  useEffect(() => {
    const checkClientAlertModal = async () => {
      if (isAdmin) return; // បើជា Admin មិនបាច់លោត Popup นี้ទេ
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) return;

      const { data } = await supabase
        .from('customer_subscriptions')
        .select('expiry_date')
        .eq('email', user.email)
        .single();

      if (data && data.expiry_date) {
        const today = new Date();
        const expiry = new Date(data.expiry_date);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setClientExpiryDaysLeftModal(diffDays);

        // បើនៅសល់តិចជាង ឬស្មើ 7 ថ្ងៃ និងមិនទាន់ផុតកំណត់ ឬទើបផុត គឺលោត Popup เตือน
        if (diffDays <= 7) {
          setShowExpiryAlertModal(true);
        }
      }
    };
    checkClientAlertModal();
  }, [isAdmin]);

  

  // ១. ថែម State សម្រាប់មុខងារថ្មីនេះ (ដាក់ជិត State ចាស់ៗ)
  const [includeAdImages, setIncludeAdImages] = useState(true);
  const [adButtonText, setAdButtonText] = useState('Ask for availability');
  const [adAutoResponse, setAdAutoResponse] = useState("Thanks for your interest. We'll get back to you with availability of this product.");

  // Update Function Save ឱ្យបាញ់ទិន្នន័យទៅបង្កើត Ad Creative API ផ្លូវការ
  const handleSaveToFacebook = async () => {
    setIsSavingToFb(true);
    try {
      const res = await fetch('/api/create-ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adAccountId: "123456789012345", // ⚠️ បញ្ចូលលេខ Ad Account ID របស់បងទីនេះ (កុំមានពាក្យ act_ ពីមុខ)
          pageId: selectedPageData?.id || "YOUR_PAGE_ID_HERE",
          greeting: msgGreeting,
          questions: msgQuestions,
          includeAdImages: includeAdImages,
          adButtonText: adButtonText,
          adAutoResponse: adAutoResponse
        })
      });
      
      const result = await res.json();
      if (result.success) {
        alert("✅ " + result.message + "\nCreative ID: " + result.creative_id);
        setIsEditingConversations(false);
      } else {
        alert("❌ បរាជ័យក្នុងការភ្ជាប់ទៅ Facebook: " + result.error);
      }
    } catch (error) {
      alert("❌ មានបញ្ហាប្រព័ន្ធពេលកំពុងភ្ជាប់។");
    } finally {
      setIsSavingToFb(false);
    }
  };

  // 🌟 State សម្រាប់ Post Selection ក្នុង Modal ថ្មី
  const [tempSelectedPost, setTempSelectedPost] = useState("");

  const handleAddQuestion = () => {
    if (msgQuestions.length < 5) {
      setMsgQuestions([...msgQuestions, { q: "", a: "" }]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = msgQuestions.filter((_, i) => i !== index);
    setMsgQuestions(updated);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...msgQuestions];
    updated[index].q = value;
    setMsgQuestions(updated);
  };

  const handleAutoResponseChange = (index: number, value: string) => {
    const updated = [...msgQuestions];
    updated[index].a = value;
    setMsgQuestions(updated);
  };

  const [platforms, setPlatforms] = useState({
  facebook: true, 
  instagram: false, 
  audienceNetwork: false, 
  messenger: true, 
  whatsapp: false, 
  threads: false
});


  const [expandedPlacements, setExpandedPlacements] = useState({
    feeds: false, stories: false, instream: false, search: false, messages: false, apps: false
  });

  const [detailedPlacements, setDetailedPlacements] = useState({
  fb_feed: true, fb_profile: true, ig_feed: true, ig_profile: true, fb_marketplace: true, fb_right_col: true, ig_explore: true, fb_business: true, threads_feed: true, fb_notifications: true,
  ig_stories: true, fb_stories: true, msg_stories: true, ig_reels: true, fb_reels: true, wa_status: false,
  instream_reels: true, fb_reels_ads: true,
  fb_search: true, ig_search: true,
  wa_messages: false,
  an_native: true, an_rewarded: true
});

  const placementGroups: Record<string, string[]> = {
    feeds: ['fb_feed', 'fb_profile', 'ig_feed', 'ig_profile', 'fb_marketplace', 'fb_right_col', 'ig_explore', 'fb_notifications'],
    stories: ['ig_stories', 'fb_stories', 'msg_stories', 'ig_reels', 'fb_reels'],
    instream: ['instream_reels', 'fb_reels_ads'],
    search: ['fb_search'],
    apps: ['an_native', 'an_rewarded']
  };

  const isGroupChecked = (group: string) => {
    return placementGroups[group].some(key => (detailedPlacements as any)[key]);
  };

  const handleGroupToggle = (group: string, isChecked: boolean) => {
    const updates: any = {};
    placementGroups[group].forEach(key => {
      updates[key] = isChecked;
    });
    const newDetailed = { ...detailedPlacements, ...updates };
    setDetailedPlacements(newDetailed);
    localStorage.setItem("detailedPlacements", JSON.stringify(newDetailed));
  };

  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 🌟 // 🌟 Helper Functions (កែបំបាត់ NaN)
  const formatCurrency = (cents: any) => {
    if (!cents || cents === "-" || isNaN(cents)) return "$0.00";
    return "$" + (Number(cents) / 100).toFixed(2);
  };
  const formatNumber = (num: any) => {
    if (!num || num === "-" || isNaN(num)) return "-";
    return Number(num).toLocaleString('en-US');
  };
  const getInsights = (campaign: any) => {
    if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
      return campaign.insights.data[0];
    }
    return null;
  };

  const getResults = (insights: any, objective: string) => {
    if (!insights || !insights.actions) return "-";
    let resultValue = 0;
    if (objective === 'OUTCOME_ENGAGEMENT' || objective === 'MESSAGES') {
        const msgAction = insights.actions.find((a: any) => 
            a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || 
            a.action_type === 'messaging_conversation_started_7d'
        );
        resultValue = msgAction ? Number(msgAction.value) : 0;
    } else {
        const defaultAction = insights.actions.find((a: any) => a.action_type === 'link_click');
        resultValue = defaultAction ? Number(defaultAction.value) : 0;
    }
    return resultValue > 0 ? resultValue : "-";
  };


  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'desc';
    const direction = isAsc ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...campaignsList].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (field === 'name') {
        valA = (a.name || "").toLowerCase();
        valB = (b.name || "").toLowerCase();
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'status') {
        valA = a.effective_status || a.status || "";
        valB = b.effective_status || b.status || "";
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'results') {
        valA = Number(getResults(getInsights(a), a.objective)) || 0;
        valB = Number(getResults(getInsights(b), b.objective)) || 0;
      } else if (field === 'spend') {
        valA = Number(getInsights(a)?.spend) || 0;
        valB = Number(getInsights(b)?.spend) || 0;
      } else if (field === 'impressions') {
        valA = Number(getInsights(a)?.impressions) || 0;
        valB = Number(getInsights(b)?.impressions) || 0;
      } else if (field === 'reach') {
        valA = Number(getInsights(a)?.reach) || 0;
        valB = Number(getInsights(b)?.reach) || 0;
      } else if (field === 'budget') {
        valA = Number(a.daily_budget || a.lifetime_budget) || 0;
        valB = Number(b.daily_budget || b.lifetime_budget) || 0;
      }
      return direction === 'asc' ? valA - valB : valB - valA;
    });
    setCampaignsList(sorted);
  };

  const fetchCampaigns = async () => {
    // ១. ទាញយក Token និង Ad Account ID ឱ្យបានច្បាស់លាស់
    const clientToken = localStorage.getItem('fb_user_token');
    const adAccountId = selectedAdAccount || localStorage.getItem('selectedAdAccount');

    // ២. ឆែកមើល៖ បើអត់ទាន់មាន Token ទាំងពីរ ទើបផ្អាកដំណើរការ
    if (!clientToken) {
      console.warn("រកមិនឃើញ Token របស់អតិថិជនទេ សូម Login ម្តងទៀត!");
      return;
    }

    if (!adAccountId) {
      console.warn("រកមិនឃើញ Ad Account ID ទេ!");
      return;
    }

    try {
      // ៣. បោះ access_token និង adAccountId ទៅកាន់ API ខាងក្រោយតាម URL ຢ່າງត្រឹមត្រូវ
      const response = await fetch(`/api/campaigns?adAccountId=${adAccountId}&access_token=${clientToken}`);
      const data = await response.json();

      if (data.success) {
        setCampaignsList(data.campaigns);
      } else {
        console.error("API Error message:", data.error);
      }
    } catch (error) {
      console.error("Fetch Campaigns Error:", error);
    }
  };

  // 🌟 មុខងារសម្រាប់ចុច Refresh ទិន្នន័យដោយដៃ (Manual Refresh)
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeManageTab === 'CAMPAIGNS' || typeof fetchCampaigns === 'function') {
        await fetchCampaigns();
      }
      if (activeManageTab === 'ADSETS' && typeof fetchAdsets === 'function') {
        await fetchAdsets();
      }
      if (activeManageTab === 'ADS' && typeof fetchAds === 'function') {
        await fetchAds();
      }
      showToast("🔄 បានទាញយកទិន្នន័យថ្មីពី Facebook ដោយជោគជ័យ!", "success");
    } catch (err) {
      showToast("❌ បរាជ័យក្នុងការ Refresh ទិន្នន័យ!", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // 🌟 Logic សម្រាប់ AI Generator
  const generateAiCopy = async () => {
    if (!aiInput.trim() && !aiMedia) return alert("⚠️ សូមវាយអត្ថបទ ឬបញ្ចូលរូបភាពជាមុនសិន!");
    setAiLoading(true);

    try {
      const formData = new FormData();
      formData.append("prompt", aiInput || "ជួយសរសេរអត្ថបទលក់ផលិតផលក្នុងរូបភាពនេះឱ្យបានទាក់ទាញបំផុត");
      if (aiMedia) {
        formData.append("file", aiMedia);
      }

      const res = await fetch('/api/ai-copywriter', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setAiResults(data.results || [data.text]);
      } else {
        alert("❌ AI Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ AI Server!");
    }
    setAiLoading(false);
  };

  // ជំនួយក្នុងការរក្សាទុក AI Prompt និង Media
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMedia, setAiMedia] = useState<File | null>(null);
  const [aiMediaPreview, setAiMediaPreview] = useState<string>("");

  const handleAiMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiMedia(file);
      setAiMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeAiMedia = () => {
    setAiMedia(null);
    setAiMediaPreview("");
  };

  // 🌟 មុខងារ Submit Enter Post ID ថ្មី (ទាញយកទិន្នន័យមកបង្ហាញ Preview ភ្លាមៗ)
  const handleEnterPostIdSubmit = async () => {
    if (!manualPostId.trim()) return;
    
    const postId = manualPostId.trim();
    const pageInfo = pages.find(p => p.id === selectedPage);
    const token = pageInfo?.access_token || localStorage.getItem('fb_user_token');

    if (!token) {
      alert("⚠️ រកមិនឃើញ Token ទេ។ សូមភ្ជាប់ Facebook ម្តងទៀត!");
      return;
    }

    try {
      // ផ្លាស់ប្តូរប៊ូតុងទៅជាស្ថានភាព Loading អាចឱ្យអតិថិជនដឹងថាប្រព័ន្ធកំពុងធ្វើការ
      alert("កំពុងទាញយកទិន្នន័យ Post ពី Facebook...");

      // Facebook Graph API ភាគច្រើនទាមទារទម្រង់ PageID_PostID សម្រាប់ការអាន
      let validFetchId = postId;
      if (!postId.includes('_')) {
        validFetchId = `${selectedPage}_${postId}`;
      }

      // ហៅទាញយកទិន្នន័យ Post ផ្ទាល់ពី Facebook
      const res = await fetch(`https://graph.facebook.com/v18.0/${validFetchId}?fields=id,message,created_time,full_picture,status_type,attachments,likes.summary(true),comments.summary(true),shares&access_token=${token}`);
      const data = await res.json();

      if (data.error) {
        alert(`❌ មិនអាចទាញយក Post នេះបានទេ៖\n${data.error.message}\n(សូមប្រាកដថា Post ID នេះពិតជារបស់ Page នេះមែន)`);
        return;
      }

      // រៀបចំចម្រាញ់ទិន្នន័យ Like, Comment, Share ឱ្យត្រូវក្បួន
      const newPostData = {
        ...data,
        likesCount: data.likes?.summary?.total_count || 0,
        commentsCount: data.comments?.summary?.total_count || 0,
        sharesCount: data.shares?.count || 0
      };

      // 🌟 ញាត់ Post ដែលទើបទាញយកបាន ចូលទៅក្នុងតារាង Posts ដើម្បីឱ្យលោត Preview ភ្លាមៗ
      setPosts(prevPosts => {
        const filtered = prevPosts.filter(p => p.id !== data.id && p.id !== postId); // ដកចេញបើមានជាន់គ្នា
        return [newPostData, ...filtered];
      });

      saveParam("selectedPost", data.id, setSelectedPost);
      setIsEnterPostIdModalOpen(false);
      setManualPostId("");
      
    } catch (error) {
      console.error("Fetch Post Error:", error);
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Facebook Graph API!");
    }
  };

  // 🌟 States សម្រាប់គ្រប់គ្រងការបង់ប្រាក់ និងមើល Slip
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedClientSlip, setSelectedClientSlip] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // សម្រាប់អតិថិជនបង់ប្រាក់

  // 🌟 States សម្រាប់ Clients និង Pending Slips Count
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const clientRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const [highlightedClientId, setHighlightedClientId] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setClients(data || []);
    setLoadingClients(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const pendingSlipsCount = clients.filter(c => c.slip_status === 'pending').length;
  // 🌟 States បន្ថែមសម្រាប់កែប្រែ (Edit Client)
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientPassword, setEditClientPassword] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editLinkedFbPage, setEditLinkedFbPage] = useState('');
  const [editPackageName, setEditPackageName] = useState('');
  const [editAmountPaid, setEditAmountPaid] = useState('');
  
  // States ថ្មីសម្រាប់ Profile និង Account អតិថិជន (មាន Password)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState(''); // 👈 ថែម Password
  const [clientPhone, setClientPhone] = useState('');
  const [linkedFbPage, setLinkedFbPage] = useState('');
  const [packageName, setPackageName] = useState('១ ខែ (Standard)');
  const [durationDays, setDurationDays] = useState(30);
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (activeTab === 'SUBSCRIPTIONS') {
      fetchClients();
    }
  }, [activeTab]);


  // 🟢 មុខងារបើក Pop-up កែប្រែ និងទាញទិន្នន័យចាស់មកបំពេញស្រាប់
  
  const handleOpenEditClient = (client: any) => {
    setEditingClient(client);
    setEditClientName(client.client_name || '');
    setEditClientEmail(client.email || '');
    setEditClientPassword(client.password || '');
    setEditClientPhone(client.phone || '');
    setEditLinkedFbPage(client.linked_fb_page || '');
    setEditPackageName(client.package_name || '');
    setEditAmountPaid(client.amount || '');
    
    // 🌟 បន្ថែមទាញយកថ្ងៃខែចាប់ផ្តើម និងផុតកំណត់ចាស់មកជាមួយ
    setEditStartDate(client.start_date ? client.start_date.split('T')[0] : '');
    setEditExpiryDate(client.expiry_date ? client.expiry_date.split('T')[0] : '');
    
    setIsEditClientModalOpen(true);
  };
  // 🟢 មុខងារបញ្ជូនទិន្នន័យដែលបានកែប្រែទៅកាន់ Supabase ផ្ទាល់
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({
          client_name: editClientName,
          email: editClientEmail,
          password: editClientPassword,
          phone: editClientPhone,
          linked_fb_page: editLinkedFbPage,
          package_name: editPackageName,
          amount: editAmountPaid ? Number(editAmountPaid) : 0,
          start_date: editStartDate ? new Date(editStartDate).toISOString() : editingClient.start_date,
          expiry_date: editExpiryDate ? new Date(editExpiryDate).toISOString() : editingClient.expiry_date
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      showToast("✅ បានកែប្រែព័ត៌មាន និងថ្ងៃខែសុពលភាពដោយជោគជ័យ!", "success");
      setIsEditClientModalOpen(false);
      fetchClients(); 
    } catch (err: any) {
      alert("❌ បរាជ័យក្នុងការកែប្រែ: " + err.message);
    }
  };

  // 🟢 មុខងារបន្តអាយុកាលសេវាស្វ័យប្រវត្តិ (+៣០ ថ្ងៃ)
  const handleRenewSubscription = async (client: any) => {
    if (!confirm(`តើបងពិតជាចង់បន្តសេវាកម្មជូនអតិថិជន "${client.client_name}" ចំនួន ៣០ថ្ងៃ បន្ថែមទៀតមែនទេ?`)) return;

    try {
      const currentExpiry = client.expiry_date ? new Date(client.expiry_date) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + 30);
      const newExpiryDate = baseDate.toISOString();

      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ 
          expiry_date: newExpiryDate,
          status: 'active' 
        })
        .eq('id', client.id);

      if (error) throw error;

      showToast(`✅ បានបន្តសេវាជូន ${client.client_name} រយៈពេល ៣០ថ្ងៃដោយជោគជ័យ!`, "success");
      fetchClients(); 
    } catch (err: any) {
      alert("❌ បរាជ័យក្នុងការបន្តសេវា: " + err.message);
    }
  };

  // 🟢 មុខងារអនុម័ត Slip ទឹកប្រាក់ (Approve Slip)
  const handleApproveSlip = async (client: any) => {
    try {
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ slip_status: 'approved' })
        .eq('id', client.id);

      if (error) throw error;

      showToast(`✅ បានអនុម័ត Slip របស់ ${client.client_name} រួចរាល់! ប្រាក់បានបញ្ចូលក្នុងចំណូលសរុប។`, "success");
      fetchClients(); 
    } catch (err: any) {
      alert("❌ បរាជ័យ: " + err.message);
    }
  };

  // 🟢 មុខងារបើកផ្ទាំងមើល Slip របស់អតិថិជន
  const handleOpenSlipModal = (client: any) => {
    setSelectedClientSlip(client);
    setIsSlipModalOpen(true);
  };

  // 🌟 កូដថ្មីដែលបញ្ជូនទិន្នន័យទៅឱ្យ API ធ្វើការងារទាំង ២ ខាងលើ
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPassword) {
      return alert('សូមបញ្ចូលឈ្មោះ អ៊ីមែល និងលេខសម្ងាត់អតិថិជនឱ្យបានគ្រប់គ្រាន់!');
    }

    try {
      // ហៅ API ដែលយើងទើបបង្កើត
      const res = await fetch('/api/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          email: clientEmail,
          password: clientPassword,
          phone: clientPhone,
          linkedFbPage,
          packageName,
          durationDays,
          amountPaid
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ បង្កើតគណនីជោគជ័យ! អតិថិជនអាចយក Email និង Password នេះទៅ Login បានឥឡូវនេះ។');
        // សម្អាតប្រអប់ទិន្នន័យវិញ
        setClientName(''); setClientEmail(''); setClientPassword(''); setClientPhone(''); 
        setLinkedFbPage(''); setAmountPaid(''); setShowSubModal(false);
        fetchClients(); 
      } else {
        alert('❌ បរាជ័យក្នុងការបង្កើតគណនី: ' + data.error);
      }
    } catch (err) {
      alert('❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server API!');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('តើបងពិតជាចង់លុបទិន្នន័យអតិថិជននេះមែនទេ?')) return;
    const { error } = await supabase.from('customer_subscriptions').delete().eq('id', id);
    if (!error) fetchClients();
  };

  const toggleAccordion = (section: string) => {
    setExpandedPlacements(prev => ({ ...prev, [section]: !(prev as any)[section] }));
  };

  const handlePlatformChange = (platform: string) => {
    const newPlatforms = { ...platforms, [platform]: !(platforms as any)[platform] };
    setPlatforms(newPlatforms);
    localStorage.setItem("platforms", JSON.stringify(newPlatforms));
  };

  const handleDetailedPlacementChange = (key: string) => {
    const newDetailed = { ...detailedPlacements, [key]: !(detailedPlacements as any)[key] };
    setDetailedPlacements(newDetailed);
    localStorage.setItem("detailedPlacements", JSON.stringify(newDetailed));
  };

  const saveParam = (key: string, value: string, setter: any) => {
    setter(value);
    localStorage.setItem(key, value);
  };

  useEffect(() => {
    if (localStorage.getItem("campaignName")) setCampaignName(localStorage.getItem("campaignName")!);
    if (localStorage.getItem("adsetName")) setAdsetName(localStorage.getItem("adsetName")!);
    if (localStorage.getItem("adName")) setAdName(localStorage.getItem("adName")!);
    if (localStorage.getItem("obj")) setObjective(localStorage.getItem("obj")!);
    if (localStorage.getItem("conversionLoc")) setConversionLocation(localStorage.getItem("conversionLoc")!);
    if (localStorage.getItem("performanceGoal")) setPerformanceGoal(localStorage.getItem("performanceGoal")!);
    if (localStorage.getItem("ageMin")) setAgeMin(localStorage.getItem("ageMin")!);
    if (localStorage.getItem("ageMax")) setAgeMax(localStorage.getItem("ageMax")!);
    if (localStorage.getItem("gender")) setGender(localStorage.getItem("gender")!);
    if (localStorage.getItem("location")) setLocation(localStorage.getItem("location")!);
    if (localStorage.getItem("targeting")) setTargeting(localStorage.getItem("targeting")!);
    if (localStorage.getItem("placementType")) setPlacementType(localStorage.getItem("placementType")!);
    if (localStorage.getItem("deviceType")) setDeviceType(localStorage.getItem("deviceType")!);
    if (localStorage.getItem("osType")) setOsType(localStorage.getItem("osType")!);
    if (localStorage.getItem("wifiOnly")) setWifiOnly(localStorage.getItem("wifiOnly") === "true");
    if (localStorage.getItem("budgetType")) setBudgetType(localStorage.getItem("budgetType")!);
    if (localStorage.getItem("budget")) setBudget(localStorage.getItem("budget")!);
    if (localStorage.getItem("duration")) setDuration(localStorage.getItem("duration")!);
    if (localStorage.getItem("callToAction")) setCallToAction(localStorage.getItem("callToAction")!);

    // 🌟 ដាក់កូដនេះនៅខាងក្នុង useEffect ទើបមិនគាំង Infinite Loop
    const savedPlatforms = localStorage.getItem("platforms");
    if (savedPlatforms) {
      try { setPlatforms(JSON.parse(savedPlatforms)); } catch(e) {}
    } else {
      setPlatforms({ 
        facebook: true, 
        instagram: false, 
        audienceNetwork: false, 
        messenger: true, 
        whatsapp: false, 
        threads: false 
      });
    }

    const savedDetailed = localStorage.getItem("detailedPlacements");
    if (savedDetailed) {
      try { setDetailedPlacements(JSON.parse(savedDetailed)); } catch(e) {}
    }

    if (localStorage.getItem("selectedDatePreset")) {
      setSelectedDatePreset(localStorage.getItem("selectedDatePreset")!);
    }
  }, []);

  useEffect(() => {
    if (selectedAdAccount && activeTab === "MANAGE") {
      fetchCampaigns();
    }
  }, [selectedAdAccount, selectedDatePreset, activeTab]);

  // 🌟 1. ទាញយក Posts ដោយមានប្រព័ន្ធ Cache (រក្សាទុកក្នុង localStorage កុំឱ្យទាញញឹកញាប់ពេក)
  useEffect(() => {
    if (!selectedPage) return;
    localStorage.setItem("selectedPage", selectedPage);
    const pageInfo = pages.find(p => p.id === selectedPage);
    if (!pageInfo) return;

    // 🔍 ឆែកមើលក្នុង Cache ថាតើធ្លាប់ទាញ Posts របស់ Page នេះទុកហើយឬនៅ?
    const cacheKey = `cached_posts_${selectedPage}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsedPosts = JSON.parse(cachedData);
        if (parsedPosts && parsedPosts.length > 0) {
          setPosts(parsedPosts);
          const savedPost = localStorage.getItem("selectedPost");
          if (savedPost && parsedPosts.find((p: any) => p.id === savedPost)) {
            setSelectedPost(savedPost);
          } else {
            setSelectedPost(parsedPosts[0].id);
          }
          console.log("⚡ ប្រើប្រាស់ទិន្នន័យ Posts ពី Cache ស្រាប់ (លឿន និងមិន Error)");
          return; // 🛑 បើមានក្នុង Cache ហើយ គឺមិនបាច់ហៅ API ទៅ Facebook ទៀតទេ!
        }
      } catch (e) {
        console.error("Parse cached posts error:", e);
      }
    }

    // 🚀 បើគ្មានក្នុង Cache ទើបហៅ API ទៅ Facebook មួយដងគត់
    setFetchingPosts(true);
    const userToken = localStorage.getItem('fb_user_token');
    
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pageId: pageInfo.id, 
        pageToken: pageInfo.access_token,
        access_token: userToken 
      })
    }).then(res => res.json()).then(data => {
      setFetchingPosts(false);
      
      if (data.success) {
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
          
          // 💾 រក្សាទុកចូលក្នុង localStorage (Cache) ទុកប្រើប្រាស់លើកក្រោយ
          localStorage.setItem(cacheKey, JSON.stringify(data.posts));

          const savedPost = localStorage.getItem("selectedPost");
          if (savedPost && data.posts.find((p: any) => p.id === savedPost)) {
            setSelectedPost(savedPost);
          } else {
            setSelectedPost(data.posts[0].id);
            localStorage.setItem("selectedPost", data.posts[0].id);
          }
        } else {
          setPosts([]);
          setSelectedPost("");
        }
      } else {
        setPosts([]);
        setSelectedPost("");
        alert("❌ មិនអាចទាញ Post បានទេ:\n" + (data.error || "សូម Reconnect Facebook ម្ដងទៀត!"));
      }
    }).catch((err) => {
      console.error("Fetch Posts Error:", err);
      setFetchingPosts(false);
    });
  }, [selectedPage, pages]);

  const isBudgetError = budgetType === "LIFETIME" && Number(budget) < Number(duration);

  // 🌟 1. Function សម្រាប់កំណត់ស្តង់ដារ Boost រូបភាព (ដក Alert ចេញ)
  const handleBoostPhotos = () => {
    const newPlatforms = { facebook: true, instagram: false, audienceNetwork: false, messenger: true, whatsapp: false, threads: false };
    const newDetailed = {
      fb_feed: true, fb_profile: true, ig_feed: false, ig_profile: false, fb_marketplace: true, fb_right_col: false, ig_explore: false, fb_business: false, threads_feed: false, fb_notifications: false,
      ig_stories: false, fb_stories: false, msg_stories: false, ig_reels: false, fb_reels: false, wa_status: false,
      instream_reels: false, fb_reels_ads: false,
      fb_search: false, ig_search: false,
      wa_messages: false,
      an_native: false, an_rewarded: false
    };

    setPlacementType("MANUAL"); localStorage.setItem("placementType", "MANUAL");
    setDeviceType("MOBILE"); localStorage.setItem("deviceType", "MOBILE");
    setPlatforms(newPlatforms); localStorage.setItem("platforms", JSON.stringify(newPlatforms));
    setDetailedPlacements(newDetailed); localStorage.setItem("detailedPlacements", JSON.stringify(newDetailed));

    setPresetModalOpen('none'); // បិទ Modal ពេលជោគជ័យ
  };

  // 🌟 2. Function សម្រាប់កំណត់ស្តង់ដារ Boost វីដេអូ (ដក Alert ចេញ)
  const handleBoostVideos = () => {
    const newPlatforms = { facebook: true, instagram: false, audienceNetwork: false, messenger: true, whatsapp: false, threads: false };
    const newDetailed = {
      fb_feed: true, fb_profile: true, ig_feed: false, ig_profile: false, fb_marketplace: true, fb_right_col: false, ig_explore: false, fb_business: false, threads_feed: false, fb_notifications: false,
      ig_stories: false, fb_stories: true, msg_stories: true, ig_reels: false, fb_reels: true, wa_status: false,
      instream_reels: false, fb_reels_ads: false,
      fb_search: false, ig_search: false,
      wa_messages: false,
      an_native: false, an_rewarded: false
    };

    setPlacementType("MANUAL"); localStorage.setItem("placementType", "MANUAL");
    setDeviceType("MOBILE"); localStorage.setItem("deviceType", "MOBILE");
    setPlatforms(newPlatforms); localStorage.setItem("platforms", JSON.stringify(newPlatforms));
    setDetailedPlacements(newDetailed); localStorage.setItem("detailedPlacements", JSON.stringify(newDetailed));

    setPresetModalOpen('none'); // បិទ Modal ពេលជោគជ័យ
  };

  // 🌟 មុខងារ Restart Placements ឱ្យត្រឡប់ទៅទម្រង់ដើម
  const handleResetPlacements = () => {
    if (!confirm("តើបងពិតជាចង់ Restart ការកំណត់ Placements ទាំងអស់ឱ្យត្រឡប់ទៅដើមវិញមែនទេ?")) return;
    
    localStorage.removeItem("placementType");
    localStorage.removeItem("platforms");
    localStorage.removeItem("detailedPlacements");
    localStorage.removeItem("deviceType");

    setPlacementType("ADVANTAGE");
    setDeviceType("MOBILE"); 
    setPlatforms({ facebook: true, instagram: false, audienceNetwork: false, messenger: true, whatsapp: false, threads: false });
    setDetailedPlacements({
      fb_feed: true, fb_profile: true, ig_feed: true, ig_profile: true, fb_marketplace: true, fb_right_col: true, ig_explore: true, fb_business: true, threads_feed: true, fb_notifications: true,
      ig_stories: true, fb_stories: true, msg_stories: true, ig_reels: true, fb_reels: true, wa_status: false,
      instream_reels: true, fb_reels_ads: true, fb_search: true, ig_search: true, wa_messages: false, an_native: true, an_rewarded: true
    });

    alert("🔄 បាន Restart ការកំណត់ Placements ត្រឡប់ទៅទម្រង់ដើមវិញដោយជោគជ័យ!");
  };

  const handleAutoBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return alert("⚠️ សូមជ្រើសរើស Post ណាមួយជាមុនសិន!");
    if (isBudgetError) {
      return alert(`🛑 កំហុសថវិកា៖ ហ្វេសប៊ុកទាមទារយ៉ាងហោចណាស់ 1$ ក្នុងមួយថ្ងៃ។`);
    }

    setLoading(true);

    let finalPostId = selectedPost;
    const selectedPostObj = posts.find(p => p.id === selectedPost);

    if (selectedPostObj?.isDraft) {
       try {
          const pageInfo = pages.find(p => p.id === selectedPage);
          const formData = new FormData();
          formData.append("pageId", selectedPage);
          formData.append("pageToken", pageInfo?.access_token || "");
          formData.append("message", selectedPostObj.message || "");
          
          if (selectedPostObj.file) {
            formData.append("file", selectedPostObj.file);
          } else if (selectedPostObj.full_picture && !selectedPostObj.full_picture.startsWith('blob:')) {
            formData.append("imageUrl", selectedPostObj.full_picture);
          }

          const postRes = await fetch('/api/create-post', {
            method: 'POST',
            body: formData
          });
          const postData = await postRes.json();
          
          if (postData.success) {
             finalPostId = postData.postId;
             setPosts(prev => prev.map(p => p.id === selectedPost ? { ...p, id: finalPostId, isDraft: false } : p));
             setSelectedPost(finalPostId);
             localStorage.setItem("selectedPost", finalPostId);

             await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
             setLoading(false);
             return alert("❌ បរាជ័យក្នុងការបង្កើត Post ចូល Page:\n" + postData.error);
          }
       } catch (err) {
          setLoading(false);
          return alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server ពេលបង្កើត Post!");
       }
    }
    
    // 🌟 1. ទាញយក Token និង Ad Account ID ពី localStorage ផ្ទាល់
    const clientToken = localStorage.getItem('fb_user_token');
    const adAccountId = selectedAdAccount || localStorage.getItem('selectedAdAccount');

    if (!clientToken) {
      setLoading(false);
      return alert("❌ រកមិនឃើញ Token ទេ សូម Login ជាមួយ Facebook ជាមុនសិន!");
    }

    // 🌟 2. បញ្ចូល access_token និង adAccountId ទៅក្នុង boostData
    const boostData = {
      campaignName, adsetName, adName,
      pageId: selectedPage, postUrl: finalPostId,
      objective, conversionLocation, performanceGoal,
      callToAction, 
      ageMin, ageMax, gender, location, targeting, 
      placementType, deviceType, osType, wifiOnly, platforms, detailedPlacements,
      budgetType, budget, duration,
      access_token: clientToken,      // 👈 បញ្ជូន Token របស់អតិថិជនទៅជាមួយ
      adAccountId: adAccountId        // 👈 បញ្ជូន Ad Account ID ទៅជាមួយ
    };

    try {
      const response = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boostData),
      });
      const data = await response.json();
      
      if(data.success) {
        setLoading(false);
        setTimeout(() => {
          setIsSuccessModal(true);
        }, 150);
      } else {
        setLoading(false);
        
        // 🌟 ឆែកមើល Error រឿងអត់មានប៊ូតុង ឬ Invalid Creative
        if (data.error && (data.error.includes("ប៊ូតុង") || data.error.includes("Creative") || data.error.includes("message"))) {
          
          // 🌟 ប្រើប្រាស់ Link ចូលទៅកាន់ Facebook Page ផ្ទាល់ (ធានាថាមិន Error 100%)
        const pageIdClean = selectedPage; 
        
        // ទម្រង់ Link ស្តង់ដាររបស់ Facebook Page
        const directPostUrl = `https://www.facebook.com/${pageIdClean}`;
        
        setCustomError("⚠️ ផុសនេះមានបញ្ហា (ឧ. ជារូបភាពច្រើនសន្លឹក មិនអាចដាក់ប៊ូតុង Send Message បាន)។\n\nសូមចុច OK ដើម្បីបើកទៅកាន់ Facebook Page របស់បង រួចធ្វើការកែសម្រួល Post នោះជាការស្រេច!");
        setErrorActionUrl(directPostUrl);

        } else {
          alert("❌ បរាជ័យពី Facebook ក្នុងការ Boost:\n\n" + data.error);
        }
      }
    } catch (error) {
      setLoading(false);
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server ពេល Boost!");
    }
  };

  const handleDeleteCampaigns = async () => {
    if (selectedCampaigns.length === 0) return;
    if (!confirm(`តើអ្នកពិតជាចង់លុប Campaign ចំនួន ${selectedCampaigns.length} នេះមែនទេ? (លុបហើយមិនអាចទាញមកវិញបានទេ)`)) return;
    
    setLoadingCampaigns(true);
    try {
      for (const id of selectedCampaigns) {
         await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
      }
      alert("✅ លុបបានជោគជ័យ!");
      fetchCampaigns();
    } catch (err) {
      alert("❌ មានបញ្ហាក្នុងការលុប");
      setLoadingCampaigns(false);
    }
  };

  const handleDeleteSingleCampaign = async (id: string, name: string) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុប Campaign "${name}" នេះមែនទេ?`)) return;
    setCampaignsList(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      fetchCampaigns(); 
    }
  };

  // 🌟 បន្ថែម State សម្រាប់ចងចាំ Ad Sets ដែលបានជ្រើសរើស
  const [selectedAdSets, setSelectedAdSets] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedAdSets");
      if (saved) try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedAdSets", JSON.stringify(selectedAdSets));
    }
  }, [selectedAdSets]);

  // 🌟 ១. Function ប្ដូរ Status (Off/On) របស់ Campaign
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    setCampaignsList(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, effective_status: newStatus } : c));

    try {
      const clientToken = localStorage.getItem('fb_user_token');
      const res = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status: newStatus,
          access_token: clientToken 
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        alert("❌ Facebook បដិសេធការប្ដូរ Status:\n\n" + (data.error || "Unknown error"));
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server!");
      fetchCampaigns();
    }
  };

  // 🌟 ២. Function Duplicate ឆ្លាតវៃតាម Tab (Campaigns, Ad sets, Ads)
  const handleDuplicate = async () => {
    try {
      if (activeManageTab === 'CAMPAIGNS') {
        if (!selectedCampaigns || selectedCampaigns.length === 0) {
          alert("សូមជ្រើសរើស Campaign យ៉ាងហោចណាស់មួយដើម្បី Duplicate!");
          return;
        }
        
        for (const campId of selectedCampaigns) {
          const res = await fetch(`/api/campaigns/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: campId, access_token: localStorage.getItem('fb_user_token') })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        }
        alert("Duplicate Campaigns បានជោគជ័យ!");
        fetchCampaigns();

      } else if (activeManageTab === 'ADSETS') {
        if (!selectedAdSets || selectedAdSets.length === 0) {
          alert("សូមជ្រើសរើស Ad Set យ៉ាងហោចណាស់មួយដើម្បី Duplicate!");
          return;
        }
        
        for (const adsetId of selectedAdSets) {
          const res = await fetch(`/api/adsets/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adsetId: adsetId, access_token: localStorage.getItem('fb_user_token') })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        }
        alert("Duplicate Ad Sets បានជោគជ័យ!");
        if (selectedCampaigns[0]) fetchAdsets();

      } else if (activeManageTab === 'ADS') {
        if (!selectedAds || selectedAds.length === 0) {
          alert("សូមជ្រើសរើស Ad យ៉ាងហោចណាស់មួយដើម្បី Duplicate!");
          return;
        }
        
        for (const adId of selectedAds) {
          const res = await fetch(`/api/ads/duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId: adId, access_token: localStorage.getItem('fb_user_token') })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        }
        alert("Duplicate Ads បានជោគជ័យ!");
        if (selectedCampaigns[0]) fetchAds();
      }
    } catch (error: any) {
      alert("មានបញ្ហាក្នុងការ Duplicate: " + error.message);
    }
  };

  // 🌟 មុខងារលុប Ad ជាក់លាក់ដែលបានធីក (Tick) មិនឱ្យប៉ះពាល់ Ad ផ្សេងឡើយ
  const handleDeleteSelectedAds = async () => {
    if (!selectedAds || selectedAds.length === 0) {
      alert("⚠️ សូមធីក (Tick) ជ្រើសរើស Ad ណាដែលចង់លុបជាមុនសិន!");
      return;
    }

    if (!confirm(`តើបងពិតជាចង់លុប Ads ចំនួន ${selectedAds.length} នេះមែនទេ?`)) return;

    try {
      const token = localStorage.getItem('fb_user_token');
      if (!token) {
        alert("⚠️ រកមិនឃើញ Token ទេ សូម Connect Facebook ឡើងវិញ!");
        return;
      }

      // លុបទៅកាន់ Graph API ដោយផ្ទាល់
      for (const adId of selectedAds) {
        await fetch(`https://graph.facebook.com/v18.0/${adId}?access_token=${token}`, {
          method: 'DELETE',
        });
      }

      alert("✅ បានលុប Ad ដែលបានជ្រើសរើសដោយជោគជ័យ!");
      setSelectedAds([]); // សម្អាតបញ្ជីដែលបានធីក
      if (typeof fetchAds === 'function') fetchAds(); // Refresh តារាង Ads ភ្លាមៗ
    } catch (err: any) {
      alert("❌ មានបញ្ហាក្នុងការលុប: " + err.message);
    }
  };

  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    // ធ្វើការ Update UI ទុកជាមុន (Optimistic Update) ឱ្យវាដូរពណ៌ភ្លាមៗរហ័ស
    setAdsList(prev => prev.map(ad => ad.id === adId ? { ...ad, status: newStatus, effective_status: newStatus } : ad));

    try {
      // 🌟 ទាញយក Token ពី localStorage យកមកផ្ញើទៅជាមួយ
      const token = localStorage.getItem('fb_user_token');

      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: adId, 
          status: newStatus,
          access_token: token // 👈 បញ្ជូន access_token ទៅជាមួយដើម្បីកុំឱ្យ Error Missing Token
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert("❌ បរាជ័យក្នុងការប្ដូរ Status របស់ Ad: " + data.error);
        fetchAds(); // ទាញយកទិន្នន័យដើមមកវិញបើមាន Error
      }
    } catch (error) {
      console.error("Error toggling ad status:", error);
      fetchAds();
    }
  };

  // 🌟 1. Function សម្រាប់ទាញយក Ads ទាំងអស់ពី Campaigns ដែលបាន Select (គាំទ្រ Multi-selection)
const fetchAds = async () => {
  // បើអត់ទាន់បាន Select Campaign ទេ ឬក៏គ្មាន Campaign ក្នុង List សោះ ឱ្យវាទាញយក Campaign ដំបូងបង្អស់មកបង្គ្រប់កិច្ច
  let targetIds = selectedCampaigns;
  if (targetIds.length === 0 && campaignsList.length > 0) {
    targetIds = [campaignsList[0].id];
  }

  if (targetIds.length === 0) return;

  setLoadingAds(true);
  try {
    const token = localStorage.getItem('fb_user_token');
    const tokenParam = token ? `&access_token=${token}` : '';

    // 🌟 បញ្ជូន Campaign IDs ទាំងអស់ដែលបាន Select (គั่นដោយសញ្ញាក្បៀស ,)
    const campIdsString = targetIds.join(',');
    
    let apiDatePreset = selectedDatePreset.toLowerCase();
    if (apiDatePreset === 'lifetime') apiDatePreset = 'maximum';
    
    const res = await fetch(`/api/ads?campaignIds=${campIdsString}&datePreset=${apiDatePreset}${tokenParam}`);
    const data = await res.json();
    
    if (data.success) {
      setAdsList(data.ads || []);
    } else {
      console.error("Error fetching ads:", data.error);
    }
  } catch (err) {
    console.error("Error fetching ads:", err);
  }
  setLoadingAds(false);
};

// 🌟 2. Function សម្រាប់ទាញយក Ad Sets ទាំងអស់ពី Campaigns ដែលបាន Select (គាំទ្រ Multi-selection)
const fetchAdsets = async () => {
  let targetIds = selectedCampaigns;
  if (targetIds.length === 0 && campaignsList.length > 0) {
    targetIds = [campaignsList[0].id];
  }

  if (targetIds.length === 0) return;

  setLoadingAdsets(true);
  try {
    const token = localStorage.getItem('fb_user_token');
    const tokenParam = token ? `&access_token=${token}` : '';

    // 🌟 បញ្ជូន Campaign IDs ទាំងអស់ដែលបាន Select (គั่นដោយសញ្ញាក្បៀស ,)
    const campIdsString = targetIds.join(',');
    
    const res = await fetch(`/api/adsets?campaignIds=${campIdsString}&datePreset=${selectedDatePreset}${tokenParam}`);
    const data = await res.json();
    
    if (data.success) {
      setAdsetsList(data.adsets || []);
    } else {
      console.error("Error fetching ad sets:", data.error);
    }
  } catch (err) {
    console.error("Error fetching ad sets:", err);
  }
  setLoadingAdsets(false);
};

  // 🌟 Auto fetch Ad Sets ពេលចូល Tab 'ADSETS'
  useEffect(() => {
    if (activeManageTab === 'ADSETS' && selectedCampaigns.length > 0) {
      fetchAdsets();
    }
  }, [activeManageTab, selectedCampaigns, selectedDatePreset]);

  // 🌟 ទាញយក Ads ដោយស្វ័យប្រវត្តិ នៅពេលប្ដូរមក Tab 'ADS' ឬពេលប្ដូរ Campaign ដែលបានជ្រើសរើស
  useEffect(() => {
    if (activeManageTab === 'ADS' && selectedCampaigns.length > 0) {
      fetchAds();
    }
  }, [activeManageTab, selectedCampaigns]);
  

  // 🌟 មុខងារសម្រាប់បញ្ជូនទិន្នន័យទៅ Save (Update ទៅកាន់ Facebook ពិតប្រាកដ)
  const handleSaveQuickEdit = async () => {
    setIsSavingEdit(true);
    try {
      // ផ្លាស់ប្តូរ URL មក /api/campaigns វិញ ទើបត្រូវកន្លែងជាមួយកូដ Backend របស់យើង
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: editCampaignId,
          name: editCampaignName,
          budget: editBudget,
          startTime: editStartDate,
          stopTime: editEndDate
        })
      });
      
      const data = await res.json();

      // ចាប់លទ្ធផលពិតប្រាកដពី API
      if (data.success) {
        alert("✅ បានរក្សាទុកការកែប្រែចូល Facebook ដោយជោគជ័យ!");
        setIsEditModalOpen(false);
        fetchCampaigns(); // ទាញយកទិន្នន័យថ្មីពី Facebook មកបង្ហាញភ្លាមៗ
      } else {
        // បើ Facebook បដិសេធ (ឧទាហរណ៍: លុយតិចពេក, ខុសទម្រង់) វានឹងលោតប្រាប់នៅទីនេះ
        alert("❌ Facebook បដិសេធការកែប្រែ:\n\n" + data.error);
      }
    } catch (error) {
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server API។");
    }
    setIsSavingEdit(false);
  };

  const [isDuplicating, setIsDuplicating] = useState(false);

  // 🌟 កែសម្រួលមុខងារនេះឱ្យស្អាត និងមិនឱ្យជាប់ Post ចាស់
  const handleOpenDuplicateModal = () => {
    if (selectedCampaigns.length === 0) {
      alert("⚠️ សូមជ្រើសរើស Campaign ណាមួយជាមុនសិន!");
      return;
    }
    setDuplicateAdName("New Ad - Copy");
    setDuplicatePostId(""); // 👈 ត្រូវកំណត់ឱ្យទទេសិន ដើម្បីកុំឱ្យវាទាញយក Post ចាស់មកជាន់ពីលើ!
    setIsDuplicateModalOpen(true);
  };

  
  
  const executeDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const pageInfo = pages.find(p => p.id === selectedPage);
      let validToken = pageInfo?.access_token || localStorage.getItem('fb_user_token');

      if (!validToken || validToken === 'null' || validToken === 'undefined') {
        alert("⚠️ រកមិនឃើញសោរ Token ទេ! សូម Connect Facebook ឡើងវិញ។");
        setIsDuplicating(false); return;
      }
      validToken = validToken.replace(/['"]+/g, '').trim();

      if (!duplicatePostId) {
        alert("⚠️ សូមជ្រើសរើស Post ថ្មីជាមុនសិន!");
        setIsDuplicating(false); return;
      }

      if (selectedCampaigns.length === 0) {
        alert("⚠️ សូមជ្រើសរើស Campaign ណាមួយជាមុនសិន!");
        setIsDuplicating(false); return;
      }

      const targetCampaignId = selectedCampaigns[0];

      // 🌟 ចំណុចសំខាន់៖ ត្រូវបញ្ជូន newPostId ទៅកាន់ API
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: targetCampaignId, 
          newName: duplicateAdName,
          newPostId: duplicatePostId, // 👈 ផ្ញើ Post ID ថ្មីដែលបានជ្រើសរើសទៅទីនេះ
          pageId: selectedPage,
          access_token: validToken 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsDuplicateModalOpen(false);
        setIsSuccessModal(true);
        setActiveManageTab('ADS');
        if (typeof fetchAds === 'function') fetchAds();
      } else {
        alert("❌ ការ Duplicate បរាជ័យ:\n\n" + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server: " + err.message);
    } finally {
      setIsDuplicating(false);
    }
  };

  // ជំនួយការបំលែងម៉ោង Facebook ទៅដាក់ក្នុងប្រអប់ Input
  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    try { return new Date(dateString).toISOString().slice(0, 16); } catch { return ""; }
  };

  // 🌟 មុខងារសម្រាប់ប៊ូតុង Edit តូចខាងក្រោម (Inline Edit)
  const handleInlineEdit = (id: string) => {
    setSelectedCampaigns([id]);
    const campToEdit = campaignsList.find(c => c.id === id);
    if (campToEdit) {
      setEditCampaignId(id);
      setEditCampaignName(campToEdit.name || "Campaign Selected");
      const bgt = campToEdit.daily_budget ? (Number(campToEdit.daily_budget) / 100).toString() : (campToEdit.lifetime_budget ? (Number(campToEdit.lifetime_budget) / 100).toString() : "5");
      setEditBudget(bgt);
      
      // ទាញយកថ្ងៃចាប់ផ្តើម និងថ្ងៃបញ្ចប់ពី Facebook
      setEditStartDate(campToEdit.start_time ? formatForInput(campToEdit.start_time) : new Date().toISOString().slice(0, 16));
      if (campToEdit.stop_time) {
        setEditEndDate(formatForInput(campToEdit.stop_time));
      } else {
        const d = new Date(); d.setDate(d.getDate() + 5);
        setEditEndDate(d.toISOString().slice(0, 16));
      }

      setIsEditModalOpen(true); 
    }
  };

  

  // 🌟 មុខងារពេលចុចប៊ូតុង Edit
  const handleEditCampaign = () => {
    if (selectedCampaigns.length === 0) {
      alert("⚠️ សូមជ្រើសរើស Campaign យ៉ាងហោចណាស់ ១ ជាមុនសិន!");
      return;
    }
    
    // បើ select ច្រើន យក ID ទីមួយមក Edit មុនគេ
    const targetId = selectedCampaigns[0];
    const campToEdit = campaignsList.find(c => c.id === targetId);
    
    setEditCampaignId(targetId);
    setEditCampaignName(campToEdit ? (campToEdit.name || "") : "Campaign Selected");
    
    const bgt = campToEdit?.daily_budget ? (Number(campToEdit.daily_budget) / 100).toString() : (campToEdit?.lifetime_budget ? (Number(campToEdit.lifetime_budget) / 100).toString() : "5");
    setEditBudget(bgt);
    
    setEditStartDate(campToEdit?.start_time ? new Date(campToEdit.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    if (campToEdit?.stop_time) {
      setEditEndDate(new Date(campToEdit.stop_time).toISOString().slice(0, 16));
    } else {
      const d = new Date(); d.setDate(d.getDate() + 5);
      setEditEndDate(d.toISOString().slice(0, 16));
    }

    setIsEditModalOpen(true);
  };

  const getSelectedDateLabel = () => {
    const option = datePresetOptions.find(opt => opt.value === selectedDatePreset);
    return option ? option.label : "Select Date";
  };

  const selectedPageData = pages.find(p => p.id === selectedPage);
  // ដោយសារយើងអាច Enter ID ផ្ទាល់ ពេលខ្លះ selectedPostData អាចអត់មានក្នុង posts list ទេ
  const selectedPostData = posts.find(p => p.id === selectedPost);

  // 🌟 មុខងារត្រួតពិនិត្យភាពត្រឹមត្រូវ Form (Validation Function)
  const validateForm = () => {
    if (!campaignName.trim()) {
      alert("⚠️ សូមបញ្ចូលឈ្មោះ Campaign (Campaign Name) ជាមុនសិន!");
      return false;
    }
    if (!adsetName.trim()) {
      alert("⚠️ សូមបញ្ចូលឈ្មោះ Ad Set (Ad Set Name) ជាមុនសិន!");
      return false;
    }
    if (!selectedPage) {
      alert("⚠️ សូមជ្រើសរើស Facebook Page ឱ្យបានត្រឹមត្រូវ!");
      return false;
    }
    if (!selectedPost) {
      alert("⚠️ សូមជ្រើសរើស Post ណាមួយសម្រាប់ការផ្សាយពាណិជ្ជកម្ម!");
      return false;
    }
    if (!budget || Number(budget) <= 0) {
      alert("⚠️ សូមកំណត់ថវិកា (Budget) ឱ្យបានត្រឹមត្រូវ (ត្រូវតែធំជាង 0)!");
      return false;
    }
    if (isBudgetError) {
      alert("🛑 កំហុសថវិកា៖ ថវិកាសរុបរបស់អ្នកតិចជាងចំនួនថ្ងៃដែលត្រូវរត់។");
      return false;
    }
    return true;
  };

  // 🌟 [យកវាមកដាក់ទីនេះវិញ ទើបត្រូវច្បាប់របស់ React]
  if (!isMounted) {
    return null;
  }
  
  return (
    <div className={`min-h-screen font-sans flex flex-col pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#18191A] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 🌟 Modern Toast Notification Popup (มุมខាងស្តាំលើ) */}
      {toast && (
        <div className="fixed top-20 right-6 z-[999999] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md font-sans ${
            toast.type === 'success' 
              ? (theme === 'dark' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' : 'bg-emerald-600 border-emerald-500 text-white')
              : toast.type === 'error'
              ? (theme === 'dark' ? 'bg-red-950/90 border-red-800 text-red-200' : 'bg-red-600 border-red-500 text-white')
              : (theme === 'dark' ? 'bg-blue-950/90 border-blue-800 text-blue-200' : 'bg-blue-600 border-blue-500 text-white')
          }`}>
            <span className="text-xl">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-bold tracking-wide">{toast.message}</span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="ml-3 opacity-70 hover:opacity-100 text-lg font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Global Header */}
      <header className={`${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-sm py-3 px-3 lg:px-8 flex flex-wrap items-center justify-between sticky top-0 z-30 border-b transition-colors duration-300 gap-3`}>
        
        {/* ផ្នែកទី១៖ Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white rounded-[22.5%] overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
            <img 
              src="/logo.png"
              alt="1 Click Boost Logo" 
              className="w-[85%] h-[85%] object-contain pointer-events-none" 
            />
          </div>
          <h1 className="text-sm sm:text-lg font-black text-blue-600 truncate">Ads Manager Pro</h1>
        </div>

        {/* ផ្នែកប៊ូតុង Connect Facebook & Logout */}
        <div className="flex items-center gap-2">
          {isFbConnected ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs shadow-sm shrink-0 cursor-default">
                <span>✅</span> <span className="hidden md:inline">{fbPageName || "Connected"}</span>
              </div>
              
              <button 
                onClick={async () => {
                  try {
                    localStorage.removeItem('fb_user_token');
                    localStorage.removeItem('selectedPage');
                    localStorage.removeItem('selectedAdAccount');
                    setIsFbConnected(false);
                    setFbPageName("");

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && user.email) {
                      await supabase
                        .from('customer_subscriptions')
                        .update({ access_token: null, page_id: null, page_name: null, ad_account_id: null })
                        .eq('email', user.email);
                    }

                    window.location.href = window.location.origin;
                  } catch (err) {
                    console.error("Disconnect error:", err);
                    window.location.reload();
                  }
                }}
                className={`px-3 py-1.5 font-bold rounded-lg border text-xs transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1 ${
                  theme === 'dark' 
                    ? 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-900/40' 
                    : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                <span>🚪</span> <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={handleFacebookConnect}
              className="px-3.5 py-1.5 bg-[#1877F2] text-white font-bold rounded-lg hover:bg-blue-600 transition flex items-center gap-1.5 text-xs shadow-sm shrink-0 cursor-pointer"
            >
              <span>🔄</span> <span>Connect Facebook</span>
            </button>
          )}
        </div>

        {/* ផ្នែកទី៣៖ Controls (Language, Theme, Ad Account, Reporting) */}
        <div className="flex items-center flex-wrap gap-2 ml-auto lg:ml-0">
          
          {/* 🌟 ដាក់ Badge បង្ហាញថ្ងៃសេវាកម្មនៅសល់នៅទីនេះ (ស្ថិតនៅពីលើ Language Dropdown) */}
          {clientExpiryDaysLeft !== null && (
            <div className={`px-3 h-8 flex items-center gap-1.5 rounded-full text-xs font-bold border shadow-xs ${
              clientExpiryDaysLeft < 0 
                ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                : clientExpiryDaysLeft <= 3 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
            }`}>
              <span>⏳</span>
              <span>
                {clientExpiryDaysLeft < 0 
                  ? `ផុតកំណត់សេវា (${Math.abs(clientExpiryDaysLeft)} ថ្ងៃមុន)` 
                  : clientExpiryDaysLeft === 0 
                  ? 'ផុតកំណត់ថ្ងៃនេះ!' 
                  : `សេវាកម្មនៅសល់៖ ${clientExpiryDaysLeft} ថ្ងៃ`}
              </span>
            </div>
          )}

          {/* 🌟 Language Dropdown (ខ្មែរ / English) */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
              className={`px-3 h-8 flex items-center gap-2 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer border group ${
                theme === 'dark' 
                  ? 'bg-[#242526] border-slate-600 text-slate-100 hover:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500'
              }`}
              title="ប្តូរភាសា / Change Language"
            >
              <div className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px]">
                🌐
              </div>
              <span className="tracking-wide font-extrabold text-[11px]">
                {lang === 'kh' ? 'ភាសាខ្មែរ (KH)' : 'English (EN)'}
              </span>
              <span className="text-[9px] opacity-60 ml-[-2px]">▼</span>
            </button>

            {isLangMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)}></div>
                <div className={`absolute top-[110%] right-0 w-[160px] border rounded-xl shadow-xl z-50 p-1.5 flex flex-col ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
                  <div 
                    onClick={() => { setLang('kh'); setIsLangMenuOpen(false); showToast("🇰🇭 បានប្ដូរទៅជាភាសាខ្មែរ", "success"); }}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${lang === 'kh' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-[#3A3B3C]'}`}
                  >
                    <span>🇰🇭 ភាសាខ្មែរ (KH)</span>
                    {lang === 'kh' && <span>✓</span>}
                  </div>
                  <div 
                    onClick={() => { setLang('en'); setIsLangMenuOpen(false); showToast("🇺🇸 Switched to English", "success"); }}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${lang === 'en' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-[#3A3B3C]'}`}
                  >
                    <span>🇺🇸 English (EN)</span>
                    {lang === 'en' && <span>✓</span>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ប៊ូតុងផ្លាស់ប្តូរ យប់/ថ្ងៃ (នៅជាប់ខាងក្រោម Language Dropdown) */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className={`w-8 h-8 flex items-center justify-center rounded-full text-base shadow-sm transition-all cursor-pointer ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
            title="ប្តូរទម្រង់ យប់/ថ្ងៃ"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Ad Account Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className={`${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white hover:bg-[#3A3B3C]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'} border rounded-lg px-2.5 py-1 flex items-center gap-1.5 cursor-pointer shadow-sm transition max-w-[140px] sm:max-w-[180px] lg:max-w-[220px] justify-between h-[38px]`}
            >
              <div className="flex items-center gap-1.5 text-left truncate min-w-0">
                <span className="text-xs shrink-0 hidden sm:inline-block">🖥️</span>
                <div className="flex flex-col truncate min-w-0">
                  <span className={`text-[11px] font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {adAccountsList.find(acc => acc.account_id === selectedAdAccount)?.name || "Account"}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate">ID: {selectedAdAccount}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 ml-1 shrink-0">▼</span>
            </div>

            {isAccountMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)}></div>
                <div className={`absolute top-[110%] right-0 w-[280px] border rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                  <div className="text-xs font-bold text-slate-400 px-3 py-1">{adAccountsList.length} ad accounts</div>
                  <div className="max-h-[250px] overflow-y-auto">
                    {adAccountsList.map((acc: any) => (
                      <div 
                        key={acc.account_id}
                        onClick={() => {
                          const cleanId = acc.account_id.replace('act_', '');
                          setSelectedAdAccount(cleanId);
                          localStorage.setItem("selectedAdAccount", cleanId); // 👈 រក្សាទុកអចិន្ត្រៃយ៍
                          setIsAccountMenuOpen(false);
                          fetchCampaigns(); // 👈 ទាញយក Campaign របស់ Account នេះភ្លាម
                        }}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition mb-1 ${selectedAdAccount === acc.account_id ? (theme === 'dark' ? 'bg-blue-900/40 border-blue-600' : 'bg-blue-50/60 border-blue-300') : (theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-50')}`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          <input type="radio" checked={selectedAdAccount === acc.account_id} readOnly className="text-blue-600 w-3.5 h-3.5 shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <div className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{acc.name}</div>
                            <div className="text-[9px] text-slate-400 truncate">ID: {acc.account_id}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Date Preset Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className={`${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white hover:bg-[#3A3B3C]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'} border rounded-lg px-2.5 py-1 flex items-center gap-1.5 cursor-pointer shadow-sm transition max-w-[120px] sm:max-w-[155px] h-[38px] justify-between`}
            >
              <div className="flex flex-col text-left truncate min-w-0">
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Reporting</span>
                 <span className={`text-[11px] font-bold truncate leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{getSelectedDateLabel()}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">▼</span>
            </div>

            {isDateMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDateMenuOpen(false)}></div>
                <div className={`absolute top-[110%] right-0 w-[180px] border rounded-xl shadow-2xl z-50 p-1.5 flex flex-col ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                  {datePresetOptions.map((option) => (
                    <div 
                      key={option.value}
                      onClick={() => {
                        setSelectedDatePreset(option.value);
                        setIsDateMenuOpen(false);
                        localStorage.setItem("selectedDatePreset", option.value);
                      }}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${selectedDatePreset === option.value ? 'bg-blue-600 text-white font-bold' : (theme === 'dark' ? 'text-slate-200 hover:bg-[#3A3B3C]' : 'text-slate-700 hover:bg-slate-100 font-medium')}`}
                    >
                      {option.label}
                      {selectedDatePreset === option.value && <span className="text-xs">✓</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 🌟 Layout Main + Left Sidebar (ប៊ូតុង Logout ជាប់នឹងបាត Sidebar ឃើញជានិច្ច) */}
      <div className="flex flex-1 w-full items-stretch">

        {/* 🌟 ១. យក Object វចនានុក្រមភាសា មកដាក់ពីលើ Component Home របស់បង */}
        {/* 
          const translations = {
            kh: { createCampaign: "បង្កើតយុទ្ធនាការ", manageCampaign: "គ្រប់គ្រងយុទ្ធនាការ", aiCopywriter: "AI Copywriter", subscriptions: "គ្រប់គ្រងអតិថិជន", settings: "ការកំណត់ (Settings)", logout: "Logout ចេញពីប្រព័ន្ធ" },
            en: { createCampaign: "Create Campaign", manageCampaign: "Manage Campaigns", aiCopywriter: "AI Copywriter", subscriptions: "Manage Subscriptions", settings: "Settings", logout: "Logout" }
          };
          const t = translations[lang];
        */}

        {/* ២. យកកូដ Sidebar នេះទៅដាក់ជំនួសកន្លែងចាស់ក្នុង Page.tsx របស់បង */}
        <aside className={`hidden md:flex flex-col w-[260px] shrink-0 border-r h-[calc(100vh-64px)] sticky top-[64px] shadow-sm z-10 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          
          {/* ១. ផ្នែកមឺនុយខាងលើ (Main Menu & Tools) */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pt-6 custom-scrollbar">
            <div className="text-[11px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-widest">Main Menu</div>
            
            <button 
              onClick={() => handleTabChange("CREATE")}
              className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "CREATE" ? "bg-blue-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
            >
              <span className="text-lg leading-none">✍️</span> <span className="text-[13.5px]">{t.createCampaign}</span>
            </button>

            <button 
              onClick={() => handleTabChange("MANAGE")}
              className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "MANAGE" ? "bg-blue-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
            >
              <span className="text-lg leading-none">📊</span> <span className="text-[13.5px]">{t.manageCampaign}</span>
            </button>
            
            {/* 🌟 ផ្នែក Tools */}
            <div className={`border-t my-2 mt-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
            <div className="text-[11px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-widest">Tools</div>
            
            <button 
              onClick={() => handleTabChange("AI")}
              className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "AI" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
            >
              <span className="text-lg leading-none">✨</span> <span className="text-[13.5px]">{t.aiCopywriter}</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => handleTabChange("SUBSCRIPTIONS")}
                className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer relative ${
                  activeTab === "SUBSCRIPTIONS" 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" 
                    : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                }`}
              >
                <div className="flex items-center gap-3 relative">
                  <span className="text-lg leading-none relative">
                    📋
                    {/* 🌟 ដាក់សញ្ញា Notification Dot ពណ៌ក្រហម (Facebook Style) នៅលើ Icon ផ្ទាល់ */}
                    {pendingSlipsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white dark:border-[#242526] rounded-full animate-ping"></span>
                    )}
                    {pendingSlipsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white dark:border-[#242526] rounded-full"></span>
                    )}
                  </span> 
                  <span className="text-[13.5px]">{t.subscriptions}</span>
                </div>

                {/* 🌟 ផ្នែកតួលេខចំនួន Slip រង់ចាំនៅខាងស្ដាំប៊ូតុង (Facebook Notification Counter Style) */}
                {pendingSlipsCount > 0 ? (
                  <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[11px] rounded-full shadow-md flex items-center justify-center animate-bounce">
                    {pendingSlipsCount} ថ្មី
                  </span>
                ) : (
                  <span className="text-xs opacity-40">0</span>
                )}
              </button>
            )}

            {/* 🌟 Tab គ្រប់គ្រងការទូទាត់ (Payments) - បើកបង្ហាញជូនគ្រប់អតិថិជនទាំងអស់ */}
            <button 
              onClick={() => handleTabChange("PAYMENTS")}
              className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "PAYMENTS" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
            >
              <span className="text-lg leading-none">💳</span> <span className="text-[13.5px]">ការទូទាត់ (Payments)</span>
            </button>
         </div>

         {/* ២. ផ្នែកបាតក្រោម៖ ប៊ូតុង Setting និង Logout ជាប់ស្អិតជាមួយគ្នា */}
         <div className={`p-4 border-t shrink-0 flex flex-col gap-2 ${theme === 'dark' ? 'border-slate-700 bg-[#242526]' : 'border-slate-200 bg-white'}`}>
            
            {/* 🌟 ប៊ូតុង Settings ដាក់ជាប់លើ Logout ខាងក្រោម */}
            <button 
              onClick={() => handleTabChange("SETTINGS")}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${
                activeTab === "SETTINGS" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-700 hover:bg-slate-100')
              }`}
            >
              <span className="text-lg leading-none">⚙️</span> <span className="text-[13.5px]">{t.settings}</span>
            </button>

            {/* ប៊ូតុង Logout */}
            <button 
              type="button"
              onClick={handleLogout}
              className={`w-full px-4 py-3 font-bold rounded-xl border text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-900/40' 
                  : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
              }`}
              title="ចាកចេញពីគណនី / Logout"
            >
              <span>🚪</span> <span className="text-[13.5px]">{t.logout}</span>
            </button>

         </div>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 lg:p-8 relative">
          <div className="max-w-[1400px] mx-auto w-full">
            
            {/* ========================================================= */}
            {/* ផ្ទាំងជំនួយការ AI Copywriter (Dark/Light Mode Supported) */}
            {/* ========================================================= */}
            {activeTab === "AI" && (
              <div className={`p-6 rounded-xl shadow-sm border w-full max-w-4xl mx-auto my-6 animate-in fade-in zoom-in-95 duration-300 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                {/* Header */}
                <div className={`flex items-center gap-4 mb-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border-indigo-900/50' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100/50'}`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200/20">✨</div>
                  <div>
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>AI Copywriting Generator</h2>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>បង្កើតអត្ថបទលក់ប្រកបដោយភាពច្នៃប្រឌិតជាមួយ AI</p>
                  </div>
                </div>

                {/* ប្រអប់បញ្ចូលអត្ថបទ និង ប៊ូតុង Upload រូបភាព/វីដេអូ */}
                <div className="mb-6">
                  <label className={`block text-[14px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>តើអ្នកចង់លក់ផលិតផល ឬសេវាកម្មអ្វី?</label>
                  <div className={`relative rounded-xl border transition-all shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 focus-within:border-indigo-400' : 'bg-white border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'}`}>
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={`ឧ. ចង់សរសេរអត្ថបទលក់ខោអាវ, ស្បែកជើង... (អ្នកអាចបញ្ចូលរូបភាព/វីដេអូ)
      ឈ្មោះហាង Mario
      phone 0967205522
      សូម Hashtag ចំនួន 5`}
                      className={`w-full p-4 min-h-[190px] text-[14.5px] outline-none resize-y pb-16 bg-transparent leading-relaxed ${theme === 'dark' ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
                    ></textarea>
                    
                    {/* Toolbar ខាងក្រោមប្រអប់ Text */}
                    <div className={`absolute bottom-2 left-2 right-2 flex items-center justify-between backdrop-blur-sm pt-2 px-3 pb-2 border-t ${theme === 'dark' ? 'bg-[#242526]/95 border-slate-700' : 'bg-white/95 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        {/* ប៊ូតុង Upload រូបភាព/វីដេអូ */}
                        <label className={`cursor-pointer flex items-center justify-center w-9 h-9 rounded-full transition-colors shadow-sm border ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'}`} title="បញ្ចូលរូបថត ឬវីដេអូ">
                          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleAiMediaChange} />
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        </label>
                        
                        {/* រូបភាពបង្ហាញជាមុន (Preview Thumbnail) */}
                        {aiMediaPreview && (
                          <div className="relative group animate-in zoom-in duration-200">
                            {aiMedia?.type.startsWith('video') ? (
                              <video src={aiMediaPreview} className="w-10 h-10 object-cover rounded border border-slate-500 shadow-sm" />
                            ) : (
                              <img src={aiMediaPreview} alt="Preview" className="w-10 h-10 object-cover rounded border border-slate-500 shadow-sm" />
                            )}
                            <button onClick={removeAiMedia} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600 shadow-md">✕</button>
                          </div>
                        )}
                      </div>
                      
                      {/* ប៊ូតុង Generate */}
                      <button 
                        type="button"
                        onClick={generateAiCopy}
                        disabled={!aiInput.trim() || aiLoading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-6 rounded-lg text-[13.5px] shadow-md shadow-indigo-200/20 flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> កំពុងបង្កើត...</>
                        ) : (
                          <>⚡ បង្កើតអត្ថបទ</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts (គំរូសំណួរតូចៗសម្រាប់ចុចយកលឿន) */}
                <div className={`border rounded-xl p-4 shadow-inner mt-4 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-[#F8FAFC] border-slate-200'}`}>
                  <h3 className={`text-[13px] font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                    <span className="text-amber-500">💡</span> គំរូសំណួរ (ចុចដើម្បីប្រើប្រាស់លឿន):
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "👟 សរសេរអត្ថបទផ្សាយលក់ស្បែកជើងថ្មី...", text: "ជួយសរសេរអត្ថបទផ្សាយលក់ស្បែកជើងម៉ូដថ្មី ឱ្យទាក់ទាញខ្លាំង និងជំរុញឱ្យអតិថិជនឆាតមកសួរតម្លៃភ្លាមៗ។", color: theme === 'dark' ? "text-blue-300 bg-blue-950/50 border-blue-800 hover:bg-blue-900/50" : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" },
                      { label: "💎 ប្រូម៉ូសិនពិសេសសម្រាប់អតិថិជនចាស់...", text: "ជួយសរសេរខ្លឹមសារបញ្ចុះតម្លៃពិសេសសម្រាប់អតិថិជនចាស់ ដែលធ្លាប់គាំទ្រហាងយើងផ្ទាល់ខ្លួន។", color: theme === 'dark' ? "text-blue-300 bg-blue-950/50 border-blue-800 hover:bg-blue-900/50" : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" },
                      { label: "⭐ អត្ថបទ Review ពីអតិថិជនពិត...", text: "បង្កើតអត្ថបទផ្សាយលក់បែប Review ពីអតិថិជនដែលធ្លាប់បានទិញយកទៅពាក់រួច ឱ្យមានភាពគួរឱ្យទុកចិត្តខ្ពស់។", color: theme === 'dark' ? "text-blue-300 bg-blue-950/50 border-blue-800 hover:bg-blue-900/50" : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100" },
                      { label: "🎬 Caption ខ្លីៗសម្រាប់ Reels/TikTok...", text: "សរសេរអត្ថបទខ្លីៗ ចាប់អារម្មណ៍ខ្លាំង សម្រាប់យកទៅរៀបចំជា Caption ភ្ជាប់ជាមួយវីដេអូខ្លីៗ (Reels/TikTok)។", color: theme === 'dark' ? "text-purple-300 bg-purple-950/50 border-purple-800 hover:bg-purple-900/50" : "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100" },
                      { label: "សរសេរអត្ថបទផ្សាយលក់ផលិតផល...", text: "ជួយសរសេរអត្ថបទផ្សាយលក់ផលិតផលឱ្យទាក់ទាញ និងមានអ្នកខំមិនទិញច្រើន។", color: theme === 'dark' ? "text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700" : "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100" },
                      { label: "បង្កើតចំណងជើង (Headline) ខ្លីៗ ញាក់ៗ...", text: "បង្កើតចំណងជើង (Headline) ខ្លីៗ ញាក់ៗ សម្រាប់ជម្រុញការលក់លើ Facebook Page ។", color: theme === 'dark' ? "text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700" : "text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100" },
                      { label: "សរសេរប្រូម៉ូសិនបញ្ចុះតម្លៃ ៥០%...", text: "សរសេរអត្ថបទប្រូម៉ូសិនបញ្ចុះតម្លៃ ៥០% សម្រាប់ថ្ងៃបុណ្យខាងមុខនេះ។", color: theme === 'dark' ? "text-emerald-300 bg-emerald-950/50 border-emerald-800 hover:bg-emerald-900/50" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
                      { label: "ពន្យល់ពីគុណភាព កាត់បន្ថយការសង្ស័យ...", text: "សរសេរអត្ថបទពន្យល់ពីគុណភាពផលិតផល ដើម្បីកាត់បន្ថយការសង្ស័យរបស់អតិថិជន។", color: theme === 'dark' ? "text-emerald-300 bg-emerald-950/50 border-emerald-800 hover:bg-emerald-900/50" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
                      { label: "ឆ្លើយតបពេលអតិថិជនថាផលិតផលថ្លៃ...", text: "តើគួរឆ្លើយតបយ៉ាងណាពេលអតិថិជនថា ផលិតផលយើងថ្លៃជាងគេ? ជួយសរសេរមក។", color: theme === 'dark' ? "text-emerald-300 bg-emerald-950/50 border-emerald-800 hover:bg-emerald-900/50" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
                      { label: "អត្ថបទធានាគុណភាព (Warranty)...", text: "សរសេរអត្ថបទធានាគុណភាព (Warranty/Guarantee) ដើម្បីឱ្យអតិថិជនមានទំនុកចិត្តទិញ។", color: theme === 'dark' ? "text-emerald-300 bg-emerald-950/50 border-emerald-800 hover:bg-emerald-900/50" : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
                      { label: "បង្កើតគំនិត Content រយៈពេល ៧ថ្ងៃ...", text: "បង្កើតគំនិតខ្លឹមសារ (Content Ideas) រយៈពេល ៧ថ្ងៃសម្រាប់ផេកលក់ផលិតផល។", color: theme === 'dark' ? "text-purple-300 bg-purple-950/50 border-purple-800 hover:bg-purple-900/50" : "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100" },
                      { label: "សរសេររឿងរ៉ាវ (Storytelling)...", text: "សរសេររឿងរ៉ាវ (Storytelling) ពីរបៀបដែលផលិតផលយើងអាចជួយដោះស្រាយបញ្ហារបស់អតិថិជន។", color: theme === 'dark' ? "text-purple-300 bg-purple-950/50 border-purple-800 hover:bg-purple-900/50" : "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100" }
                    ].map((prompt, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        onClick={() => {
                          setAiInput(prompt.text);
                        }}
                        className={`border text-[12px] px-3 py-1.5 rounded-full transition-colors text-left max-w-full truncate shadow-sm cursor-pointer ${prompt.color}`}
                        title={prompt.text}
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Results Display ជាមួយនឹងប៊ូតុង Save & Use for Ads */}
                {aiResults.length > 0 && (
                  <div className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <h3 className={`font-bold text-[15px] border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>
                      ជម្រើសអត្ថបទដែល AI បានបង្កើត៖
                    </h3>
                    {aiResults.map((res, idx) => (
                      <div key={idx} className={`border p-5 rounded-xl shadow-sm hover:shadow-md transition relative group ${theme === 'dark' ? 'bg-[#3A3B3C] border-indigo-900/50 text-white' : 'bg-[#F8F9FE] border-indigo-100 text-slate-800'}`}>
                        <p className="text-[14px] leading-relaxed pr-8 whitespace-pre-wrap mb-4">{res}</p>
                        
                        {/* 🌟 Toolbar ក្រោមអត្ថបទនីមួយៗ (Copy & Save & Use for Ads) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-indigo-100/50 dark:border-slate-600">
                          <button 
                            type="button"
                            onClick={() => { 
                              navigator.clipboard.writeText(res); 
                              showToast("✅ បានចម្លងអត្ថបទ (Copied!)", "success"); 
                            }} 
                            className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            <span>📋</span> Copy
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              // ១. រក្សាទុកអត្ថបទនេះចូលក្នុង localStorage សម្រាប់ឱ្យផ្ទាំង Create Campaign អានយកទៅប្រើ
                              localStorage.setItem("selected_ai_ad_copy", res);
                              // ២. ប្ដូរ Tab ទៅកាន់ CREATE ស្វ័យប្រវត្តិ
                              setActiveTab("CREATE");
                              if (typeof window !== "undefined") {
                                localStorage.setItem("activeTab", "CREATE");
                              }
                              showToast("🚀 បានរក្សាទុក និងផ្ដល់ជូនផ្ទាំង Create Campaign រួចរាល់!", "success");
                            }}
                            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>💾</span> Save & Use for Ads ➔
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {activeTab === "SETTINGS" && (
              <div className={`p-6 rounded-2xl shadow-sm border w-full max-w-xl mx-auto my-6 animate-in fade-in duration-300 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center text-xl shadow-xs">
                    ⚙️
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>ការកំណត់គណនី (Settings)</h2>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>គ្រប់គ្រងព័ត៌មាន និងផ្លាស់ប្ដូរលេខសម្ងាត់របស់អ្នក</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      <span>🔒</span> ផ្លាស់ប្ដូរលេខសម្ងាត់ (Change Password)
                    </h3>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const newPass = (form.elements.namedItem('newPass') as HTMLInputElement).value;
                      const confirmPass = (form.elements.namedItem('confirmPass') as HTMLInputElement).value;

                      if (newPass !== confirmPass) {
                        alert("❌ លេខសម្ងាត់ថ្មី និងការបញ្ជាក់មិនដូចគ្នាទេ!");
                        return;
                      }
                      if (newPass.length < 6) {
                        alert("❌ លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!");
                        return;
                      }

                      try {
                        const { error } = await supabase.auth.updateUser({ password: newPass });
                        if (error) throw error;
                        
                        // Update ក្នុង Database ផងដែរ
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user?.email) {
                          await supabase.from('customer_subscriptions').update({ password: newPass }).eq('email', user.email);
                        }

                        alert("✅ បានផ្លាស់ប្ដូរលេខសម្ងាត់ថ្មីដោយជោគជ័យ!");
                        form.reset();
                      } catch (err: any) {
                        alert("❌ បរាជ័យ: " + err.message);
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">លេខសម្ងាត់ថ្មី</label>
                        <input 
                          type="password" 
                          name="newPass"
                          required
                          placeholder="••••••••" 
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">បញ្ជាក់លេខសម្ងាត់ថ្មី</label>
                        <input 
                          type="password" 
                          name="confirmPass"
                          required
                          placeholder="••••••••" 
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer"
                      >
                        ✓ រក្សាទុកការផ្លាស់ប្ដូរ
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
            
            {/* ========================================================= */}
            {/* ផ្ទាំងគ្រប់គ្រងអតិថិជន (CRM & SUBSCRIPTIONS) */}
            {/* ========================================================= */}
            {activeTab === "SUBSCRIPTIONS" && (
              <div className={`p-6 rounded-xl shadow-sm border w-full max-w-7xl mx-auto my-6 animate-in fade-in duration-300 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4 relative">
                  <div>
                    <h1 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-lg">👥</span> 
                      គ្រប់គ្រងគណនី និងកញ្ចប់សេវាអតិថិជន
                    </h1>
                    <p className={`text-sm mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>បង្កើតគណនីភ្ជាប់ជាមួយ Facebook Page និងតាមដានទិន្នន័យអតិថិជនរបស់អ្នក</p>
                  </div>

                  {/* 🌟 ផ្ទាំង Alert ពណ៌ទឹកក្រូចអណ្តែតនៅខាងស្តាំលើ (Floating Top-Right) */}
                  {isAdmin && pendingSlipsCount > 0 && (
                    <div className="fixed top-20 right-6 z-[999999] animate-in slide-in-from-top-5 fade-in duration-300">
                      <div 
                        onClick={() => {
                          setActiveTab("SUBSCRIPTIONS");
                          const firstPending = clients.find(c => c.slip_status === 'pending');
                          if (firstPending) {
                            setHighlightedClientId(firstPending.id);
                            setTimeout(() => {
                              const el = clientRowRefs.current[firstPending.id];
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 200);
                          }
                        }}
                        className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-2xl border border-orange-400/50 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        title="Click to check new slips"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base shrink-0 shadow-inner">
                          🔔
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[13.5px] tracking-wide">មាន Slip ថ្មីរង់ចាំ Approve!</span>
                          <span className="text-[11px] opacity-90 font-normal">ចំនួន {pendingSlipsCount} ភ័ស្តុតាងទូទាត់ប្រាក់</span>
                        </div>
                        <span className="w-6 h-6 bg-white text-orange-600 rounded-full font-black text-xs flex items-center justify-center shadow-md ml-2 animate-bounce">
                          {pendingSlipsCount}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowSubModal(true)} className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl transition shadow-md cursor-pointer flex items-center gap-2">
                      <span className="text-lg leading-none">+</span> <span className="hidden sm:inline">បង្កើតគណនីថ្មីអោយអតិថិជន</span>
                    </button>
                  </div>
                </div>

                {/* 🌟 ផ្នែក Dashboard Statistic Cards ទាំង ៤ (ដាក់ពីលើតារាង) */}
                {(() => {
                  const totalClients = clients.length;
                  const activeClients = clients.filter(c => new Date(c.expiry_date) >= new Date()).length;
                  const totalRevenue = clients
                    .filter(c => c.slip_status === 'approved') // គណនាតែប្រាក់ណាដែលអនុម័តរួច
                    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                  const pendingSlips = clients.filter(c => c.slip_status === 'pending').length || 0;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      
                      {/* 1. សរុបអតិថិជន (TOTAL CLIENTS) */}
                      <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>សរុបអតិថិជន (Total Clients)</h4>
                          <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{totalClients}</div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-inner">
                          👥
                        </div>
                      </div>

                      {/* 2. អតិថិជនសកម្ម (ACTIVE) */}
                      <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>អតិថិជនសកម្ម (Active)</h4>
                          <div className="text-3xl font-black text-[#31A24C]">{activeClients}</div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[#31A24C] flex items-center justify-center text-xl shadow-inner">
                          ✅
                        </div>
                      </div>

                      {/* 3. ប្រាក់ចំណូលសរុប (REVENUE) មានប៊ូតុង Edit បែបទំនើប */}
                      <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors relative group ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className={`text-[11px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>ប្រាក់ចំណូលសរុប (Revenue)</h4>
                            
                            {/* 🌟 ប៊ូតុង Edit បែប Modern ទំនើប */}
                            <button 
                              type="button"
                              onClick={() => {
                                const currentVal = localStorage.getItem("admin_custom_revenue") || totalRevenue.toString();
                                setCustomRevenueInput(currentVal);
                                setIsRevenueModalOpen(true);
                              }}
                              className="opacity-80 group-hover:opacity-100 text-[11px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-2.5 py-0.5 rounded-full font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 transform hover:scale-105 active:scale-95"
                              title="កែប្រែប្រាក់ចំណូលសរុប"
                            >
                              <span>✏️</span> កែប្រែ
                            </button>
                          </div>
                          <div className="text-3xl font-black text-[#F5C33B] dark:text-amber-400">
                            ${Number(localStorage.getItem("admin_custom_revenue") || totalRevenue).toFixed(2)}
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-inner">
                          💰
                        </div>
                      </div>

                      {/* 4. រង់ចាំពិនិត្យ SLIP (PENDING) */}
                      <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>រង់ចាំពិនិត្យ SLIP (Pending)</h4>
                          <div className={`text-3xl font-black ${pendingSlips > 0 ? 'text-[#F5533D]' : (theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}`}>{pendingSlips}</div>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${pendingSlips > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                          ⏳
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Table CRM */}
                <div className={`rounded-2xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-white border-gray-100'}`}>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className={`text-xs uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-300 border-slate-700' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          <th className="py-4 px-4 font-bold">ព័ត៌មានអតិថិជន</th>
                          <th className="py-4 px-4 font-bold">គណនី (Email & Password)</th>
                          <th className="py-4 px-4 font-bold">គណនីភ្ជាប់ (Linked FB)</th>
                          <th className="py-4 px-4 font-bold">កញ្ចប់សេវា & តម្លៃ</th>
                          <th className="py-4 px-4 font-bold">សុពលភាពសេវាកម្ម</th>
                          <th className="py-4 px-4 font-bold text-center">សកម្មភាព</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        {loadingClients ? (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-400">កំពុងទាញយកទិន្នន័យអតិថិជន...</td></tr>
                          ) : clients.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-gray-400">មិនទាន់មានទិន្នន័យអតិថិជននៅឡើយទេ។</td></tr>
                          ) : (
                            clients.map((item) => {
                              const isExpired = new Date(item.expiry_date) < new Date();
                              const isPendingSlip = item.slip_status === 'pending';
                              const isHighlighted = highlightedClientId === item.id;

                              // 🌟 គណនាមើលថាតើនៅសល់ថ្ងៃប៉ុន្មានទៀតទើបដល់ថ្ងៃផុតកំណត់ (សម្រាប់ Warning សល់ <= 7 ថ្ងៃ)
                              const today = new Date();
                              const expiry = new Date(item.expiry_date);
                              const diffTime = expiry.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              const isNearExpiry = diffDays >= 0 && diffDays <= 7;

                              return (
                                <tr 
                                  key={item.id} 
                                  ref={(el) => { clientRowRefs.current[item.id] = el; }}
                                  className={`transition ${isHighlighted ? 'bg-amber-500/20 ring-2 ring-amber-500' : ''} ${
                                    isNearExpiry 
                                      ? (theme === 'dark' ? 'bg-orange-950/40 border-l-4 border-orange-500 animate-pulse' : 'bg-orange-50 border-l-4 border-orange-500 animate-pulse') 
                                      : isPendingSlip ? 'animate-pulse bg-red-500/10' : (theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-gray-50')
                                  }`}
                                >
                                  {/* 1. ព័ត៌មានអតិថិជន */}
                                  <td className="py-3.5 px-4">
                                    <div className={`font-bold text-[14.5px] ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{item.client_name}</div>
                                    <div className={`text-[12px] flex items-center gap-1.5 mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                                      <span>📞</span> {item.phone || 'គ្មានលេខទូរស័ព្ទ'}
                                    </div>
                                  </td>
                                  
                                  {/* 2. គណនី Login (Email & Password) */}
                                  <td className="py-3.5 px-4">
                                    <div className={`text-[12px] flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} font-medium`}>
                                      <span>✉️</span> {item.email || '-'}
                                    </div>
                                    <div className="text-[12px] flex items-center gap-1.5 mt-1 font-mono font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 w-fit px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100" title="លេខសម្ងាត់" onClick={() => { navigator.clipboard.writeText(item.password); alert("បាន Copy លេខសម្ងាត់!"); }}>
                                      <span>🔑</span> {item.password || 'គ្មានលេខសម្ងាត់'}
                                    </div>
                                  </td>

                                  {/* 3. Linked Facebook */}
                                  <td className="py-3.5 px-4">
                                    {item.linked_fb_page ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                                          ាប់
                                        </div>
                                        <span className={`text-[12.5px] font-bold truncate max-w-[160px] ${theme === 'dark' ? 'text-blue-400' : 'text-[#1877F2]'}`} title={item.linked_fb_page}>
                                          {pages.find(p => p.id === item.linked_fb_page)?.name || `Page ID: ${item.linked_fb_page}`}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[12px] text-slate-400 italic">មិនបានភ្ជាប់</span>
                                    )}
                                  </td>

                                  {/* 4. Package & Price */}
                                  <td className="py-3.5 px-4">
                                    <div className={`font-bold text-[13px] ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>{item.package_name}</div>
                                    <div className="text-emerald-500 font-bold text-[12px] mt-0.5">បង់ប្រាក់៖ ${item.amount}</div>
                                  </td>

                                  {/* 5. Dates & Status */}
                                  <td className="py-3.5 px-4">
                                    <div className={`text-[12px] ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                                      ចាប់ផ្តើម៖ {new Date(item.start_date).toLocaleDateString('km-KH')}
                                    </div>
                                    
                                    <div className={`text-[12px] font-bold mt-0.5 ${isExpired ? 'text-red-500' : (theme === 'dark' ? 'text-slate-200' : 'text-gray-700')}`}>
                                      ផុតកំណត់៖ {new Date(item.expiry_date).toLocaleDateString('km-KH')}
                                    </div>

                                    <div className="mt-1">
                                      {(() => {
                                        const today = new Date();
                                        const expiry = new Date(item.expiry_date);
                                        const diffTime = expiry.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        if (diffDays < 0) {
                                          return <span className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">ផុតកំណត់យូរហើយ ({Math.abs(diffDays)} ថ្ងៃមុន)</span>;
                                        } else if (diffDays === 0) {
                                          return <span className="text-[11px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">ផុតកំណត់ថ្ងៃនេះ!</span>;
                                        } else {
                                          return <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">⏳ នៅសល់ {diffDays} ថ្ងៃទៀត</span>;
                                        }
                                      })()}
                                    </div>
                                    
                                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                      {isExpired ? (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[10px] font-bold border border-red-500/20">ផុតកំណត់សេវា</span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold border border-emerald-500/20">កំពុងដំណើរការ</span>
                                      )}

                                      {item.slip_status === 'pending' ? (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded text-[10px] font-bold border border-amber-500/20 animate-bounce">រង់ចាំ Slip ₱</span>
                                      ) : item.slip_status === 'approved' ? (
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[10px] font-bold border border-blue-500/20">បានទូទាត់ប្រាក់ ✓</span>
                                      ) : null}
                                    </div>
                                  </td>

                                  {/* 6. Actions */}
                                  <td className="py-4 px-4 text-center align-middle">
                                    <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                      {item.slip_url && (
                                        <button type="button" onClick={() => handleOpenSlipModal(item)} className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border border-purple-200/50">
                                          <span>🧾</span> <span>Slip</span>
                                        </button>
                                      )}
                                      <button type="button" onClick={() => handleOpenEditClient(item)} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border border-blue-200/50">
                                        <span>✏️</span> <span>កែប្រែ</span>
                                      </button>
                                      <button type="button" onClick={() => handleDeleteClient(item.id)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border border-red-200/50">
                                        <span>🗑️</span> <span>លុប</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pop-up បង្កើតគណនីអតិថិជន */}
                {showSubModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${theme === 'dark' ? 'bg-[#242526] border border-slate-700' : 'bg-white'}`}>
                      <div className="flex justify-between items-center mb-5 border-b pb-3 dark:border-slate-700">
                        <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">🔑</span> បង្កើតគណនីអតិថិជនថ្មី
                        </h2>
                        <button onClick={() => setShowSubModal(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold cursor-pointer">&times;</button>
                      </div>

                      <form onSubmit={handleAddClient} className="space-y-5">
                        
                        {/* ផ្នែកទី១៖ គណនី Login (Account Credentials) */}
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                          <h3 className={`text-[13px] font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            1. គណនីសម្រាប់អតិថិជនប្រើប្រាស់
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>អ៊ីមែល (Gmail) <span className="text-red-500">*</span></label>
                              <input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`} placeholder="customer@gmail.com" />
                            </div>
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>លេខសម្ងាត់ (Password) <span className="text-red-500">*</span></label>
                              <input type="text" required value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 font-bold tracking-wide ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-blue-400' : 'bg-white border-slate-300 text-blue-600'}`} placeholder="បង្កើតលេខសម្ងាត់..." />
                            </div>
                          </div>
                        </div>

                        {/* ផ្នែកទី២៖ ព័ត៌មានផ្ទាល់ខ្លួន និង ហ្វេសប៊ុក */}
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <h3 className={`text-[13px] font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>2. ព័ត៌មានអតិថិជន & ការតភ្ជាប់</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>ឈ្មោះអតិថិជន / ហាង <span className="text-red-500">*</span></label>
                              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`} placeholder="ឈ្មោះអតិថិជន..." />
                            </div>
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>លេខទូរស័ព្ទ (Phone)</label>
                              <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`} placeholder="012 345 678" />
                            </div>
                            <div className="md:col-span-2">
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>ភ្ជាប់ទៅកាន់ Facebook Page</label>
                              <select value={linkedFbPage} onChange={(e) => setLinkedFbPage(e.target.value)} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none cursor-pointer focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}>
                                <option value="">-- អត់ទាន់ចង់ភ្ជាប់ឥឡូវនេះទេ --</option>
                                {pages.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ផ្នែកទី៣៖ កញ្ចប់ និងការបង់ប្រាក់ */}
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <h3 className={`text-[13px] font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>3. កញ្ចប់សេវាកម្ម & ការទូទាត់</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>ជ្រើសរើសកញ្ចប់សេវា <span className="text-red-500">*</span></label>
                              <select value={packageName} onChange={(e) => { setPackageName(e.target.value); setDurationDays(e.target.value.includes('១ ខែ') ? 30 : e.target.value.includes('៣ ខែ') ? 90 : 365); }} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none cursor-pointer focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}>
                                <option value="១ ខែ (Standard)">កញ្ចប់ ១ ខែ (៣០ ថ្ងៃ)</option>
                                <option value="៣ ខែ (Pro)">កញ្ចប់ ៣ ខែ (៩០ ថ្ងៃ)</option>
                                <option value="១ ឆ្នាំ (VIP)">កញ្ចប់ ១ ឆ្នាំ (៣៦៥ ថ្ងៃ)</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>ទឹកប្រាក់បានបង់ ($) <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">$</span>
                                <input type="number" required value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={`w-full pl-7 pr-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 font-bold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`} placeholder="0.00" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => setShowSubModal(false)} className={`px-5 py-2.5 font-bold rounded-xl text-sm transition cursor-pointer border ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-[#3A3B3C]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>បោះបង់</button>
                          <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition cursor-pointer shadow-md flex items-center gap-2">
                            ✓ រក្សាទុក និង បង្កើតគណនី
                          </button>
                        </div>
                        
                      </form>
                    </div>
                  </div>
                )}
                {/* 🌟 Modal សម្រាប់ Admin មើល Slip និងកែប្រែទឹកប្រាក់មុន Approve */}
                {isSlipModalOpen && selectedClientSlip && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
                    <div className={`rounded-3xl max-w-xl w-full p-6 shadow-2xl border max-h-[90vh] overflow-y-auto custom-scrollbar ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-slate-700">
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <span>🧾</span> ពិនិត្យ Slip និងកំណត់ទឹកប្រាក់
                          </h3>
                          <p className="text-xs text-slate-400">អតិថិជន៖ <strong className="text-blue-500">{selectedClientSlip.client_name}</strong> ({selectedClientSlip.email})</p>
                        </div>
                        <button onClick={() => setIsSlipModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 hover:text-red-500 cursor-pointer transition">✕</button>
                      </div>

                      {/* Slip Image Preview Box */}
                      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[240px] max-h-[320px] mb-4 relative">
                        {selectedClientSlip.slip_url ? (
                          <img src={selectedClientSlip.slip_url} alt="Bank Slip" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                            <span className="text-4xl">េ</span>
                            <p className="text-xs font-medium">អតិថិជនរូបនេះមិនទាន់បាន Upload រូបភាព Slip មកទីកាន់ប្រព័ន្ធនៅឡើយទេ។</p>
                          </div>
                        )}
                      </div>

                      {/* Payment Info Details & Custom Amount Input */}
                      <div className={`p-4 rounded-2xl border mb-5 text-xs space-y-3 ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">កញ្ចប់សេវា៖</span>
                          <span className="font-bold">{selectedClientSlip.package_name}</span>
                        </div>
                        
                        {/* 🌟 ប្រអប់ឱ្យ Admin វាយបញ្ចូលទឹកប្រាក់ (អាចកែប្រែ / Discount បាន) */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">ទឹកប្រាក់អនុម័ត ($)៖</span>
                          <div className="relative w-36">
                            <span className="absolute left-3 top-2 font-bold text-emerald-500">$</span>
                            <input 
                              type="number" 
                              id="adminCustomAmount" 
                              step="0.01"
                              defaultValue={selectedClientSlip.amount || 5.00} 
                              className={`w-full pl-7 pr-3 py-1.5 rounded-xl border text-sm outline-none font-bold text-emerald-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">ស្ថានភាព Slip ចុងក្រោយ៖</span>
                          <span className={`font-bold ${selectedClientSlip.slip_status === 'approved' ? 'text-blue-500' : 'text-amber-500'}`}>
                            {selectedClientSlip.slip_status === 'approved' ? 'បានទូទាត់ប្រាក់ ✓' : 'រង់ចាំការអនុម័ត (Pending)'}
                          </span>
                        </div>
                      </div>

                      {/* 🌟 ផ្នែកតារាងប្រវត្តិបង់ប្រាក់ និងប៊ូតុង Approve / Reject សម្រាប់ Admin */}
                      <div className="mb-6">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                          <span>📜</span> ប្រវត្តិការទូទាត់ប្រាក់ទាំងអស់របស់អតិថិជន
                        </h4>

                        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className={`border-b uppercase ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  <th className="py-2.5 px-3 font-bold">កាលបរិច្ឆេទ</th>
                                  <th className="py-2.5 px-3 font-bold">ទឹកប្រាក់</th>
                                  <th className="py-2.5 px-3 font-bold">Slip</th>
                                  <th className="py-2.5 px-3 font-bold text-center">សកម្មភាព (Approve / Reject)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {(() => {
                                  const records = selectedClientSlip.payment_history || (selectedClientSlip.slip_url ? [{
                                    date: selectedClientSlip.created_at || new Date().toISOString(),
                                    amount: selectedClientSlip.amount || 0,
                                    slip_url: selectedClientSlip.slip_url,
                                    status: selectedClientSlip.slip_status || 'pending'
                                  }] : []);

                                  return records.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="text-center py-6 text-slate-400 italic">គ្មានប្រវត្តិទូទាត់ប្រាក់</td>
                                    </tr>
                                  ) : (
                                    records.map((rec: any, idx: number) => (
                                      <tr key={idx} className={`transition ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                        <td className="py-2.5 px-3 font-medium">
                                          {new Date(rec.date).toLocaleDateString('km-KH')}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-emerald-500">
                                          ${Number(rec.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          {rec.slip_url ? (
                                            <a href={rec.slip_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
                                              មើល Slip 👁️
                                            </a>
                                          ) : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            {rec.status === 'approved' ? (
                                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-bold text-[10px]">Approved ✓</span>
                                            ) : rec.status === 'rejected' ? (
                                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded font-bold text-[10px]">Rejected ✕</span>
                                            ) : (
                                              <>
                                                {/* 🌟 ប៊ូតុង Approve (ទាញយកទឹកប្រាក់ដែល Admin បានវាយកែប្រែ / Discount ដាក់ចូល) */}
                                                <button 
                                                  type="button"
                                                  onClick={async () => {
                                                    try {
                                                      const customAmountEl = document.getElementById('adminCustomAmount') as HTMLInputElement;
                                                      const finalAmount = customAmountEl ? Number(customAmountEl.value) || 0 : (selectedClientSlip.amount || 0);

                                                      const updatedHist = records.map((r: any, i: number) => i === idx ? { ...r, amount: finalAmount, status: 'approved' } : r);
                                                      
                                                      // បន្ថែមថ្ងៃផុតកំណត់ (+30 ថ្ងៃ) ស្វ័យប្រវត្តិ
                                                      const currentExpiry = selectedClientSlip.expiry_date ? new Date(selectedClientSlip.expiry_date) : new Date();
                                                      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                                                      baseDate.setDate(baseDate.getDate() + 30);
                                                      const newExpiryDate = baseDate.toISOString();

                                                      const { error } = await supabase
                                                        .from('customer_subscriptions')
                                                        .update({ 
                                                          slip_status: 'approved',
                                                          status: 'active',
                                                          amount: finalAmount,
                                                          expiry_date: newExpiryDate,
                                                          payment_history: updatedHist 
                                                        })
                                                        .eq('id', selectedClientSlip.id);

                                                      if (error) throw error;

                                                      showToast(`✅ បាន Approve ទឹកប្រាក់ $${finalAmount.toFixed(2)} និងបន្តសេវា ៣០ថ្ងៃជោគជ័យ!`, "success");
                                                      setIsSlipModalOpen(false);
                                                      fetchClients();
                                                    } catch (err: any) {
                                                      alert("Error: " + err.message);
                                                    }
                                                  }}
                                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                                                >
                                                  <span>✓</span> Approve
                                                </button>

                                                {/* 🌟 ប៊ូតុង Reject */}
                                                <button 
                                                  type="button"
                                                  onClick={async () => {
                                                    if (!confirm("តើបងពិតជាចង់ Reject Slip នេះមែនទេ?")) return;
                                                    try {
                                                      const updatedHist = records.map((r: any, i: number) => i === idx ? { ...r, status: 'rejected' } : r);

                                                      const { error } = await supabase
                                                        .from('customer_subscriptions')
                                                        .update({ 
                                                          slip_status: 'rejected',
                                                          payment_history: updatedHist 
                                                        })
                                                        .eq('id', selectedClientSlip.id);

                                                      if (error) throw error;

                                                      showToast("❌ បាន Reject Slip រួចរាល់!", "error");
                                                      setIsSlipModalOpen(false);
                                                      fetchClients();
                                                    } catch (err: any) {
                                                      alert("Error: " + err.message);
                                                    }
                                                  }}
                                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                                                >
                                                  <span>✕</span> Reject
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setIsSlipModalOpen(false)} 
                          className="w-full py-3 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          បិទ (Close)
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* ផ្ទាំងទូទាត់ប្រាក់ និង Scan QR Code សម្រាប់អតិថិជន (PAYMENTS TAB) */}
            {/* ========================================================= */}
            {activeTab === "PAYMENTS" && (
              <div className={`p-6 rounded-2xl shadow-sm border w-full max-w-4xl mx-auto my-6 animate-in fade-in duration-300 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-lg shadow-orange-500/20">
                    💳
                  </div>
                  <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ទូទាត់ប្រាក់ និងបញ្ជាក់ Slip សេវាកម្ម
                  </h1>
                  <p className={`text-sm mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    សូមស្កេន QR Code ខាងក្រោមដើម្បីបង់ប្រាក់ប្រចាំខែ រួច Upload រូបភាព Slip ផ្ទេរប្រាក់បញ្ជូនមកកាន់ប្រព័ន្ធ
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* ផ្នែកខាងឆ្វេង៖ បង្ហាញ QR Code ធនាគារ (ទាញយកពី Supabase ផ្ទាល់) */}
                  <div className={`md:col-span-5 p-6 rounded-2xl border text-center flex flex-col items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="font-bold text-sm mb-4 text-blue-600 dark:text-blue-400">Scan to Pay (ABA / Bakong)</h3>
                    
                    {/* QR Code Frame */}
                    <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center mb-4 relative group">
                      {adminQrUrl ? (
                        <img 
                          src={adminQrUrl} 
                          alt="Admin Bank QR Code" 
                          className="w-full h-full object-contain pointer-events-none" 
                        />
                      ) : (
                        <div className="text-xs text-slate-400 text-center p-4">
                          <span>⏳ កំពុងទាញយក QR Code...</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs space-y-1 font-medium text-slate-500 dark:text-slate-400 mb-6">
                      <p>ឈ្មោះគណនី៖ <strong className="text-slate-800 dark:text-white">SENG SOVEASNA</strong></p>
                      <p>លេខគណនី ABA៖ <strong className="text-blue-600 dark:text-blue-400">000 123 456</strong></p>
                    </div>

                    {/* 🌟 ផ្នែកសម្រាប់ Admin Upload QR Code ថ្មី */}
                      {isAdmin && (
                        <div className="w-full mt-6 pt-4 border-t border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
                          <span className="text-xs font-bold text-amber-500">⚙️ Admin: ផ្លាស់ប្ដូរ QR Code ថ្មី</span>
                          <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2">
                            <span>📁</span>
                            <span>ជ្រើសរើសរូបភាព QR ថ្មី</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleUploadAdminQR} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      )}
                  </div>

                  {/* ផ្នែកខាងស្តាំ៖ Form សម្រាប់អតិថិជន Upload Slip */}
                  <div className={`md:col-span-7 p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className="font-bold text-sm mb-4">បញ្ជូនព័ត៌មាន និង Slip ផ្ទេរប្រាក់</h3>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const amountInput = (form.elements.namedItem('amount') as HTMLInputElement).value;
                      const fileInput = form.elements.namedItem('slipFile') as HTMLInputElement;

                      if (!fileInput.files || fileInput.files.length === 0) {
                        alert("⚠️ សូមជ្រើសរើសរូបភាព Slip ផ្ទេរប្រាក់ជាមុនសិន!");
                        return;
                      }

                      try {
                        const file = fileInput.files[0];
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user || !user.email) {
                          alert("❌ រកមិនឃើញគណនី Login ទេ សូម Login ម្ដងទៀត។");
                          return window.location.href = '/login';
                        }
                        const clientEmailInput = user.email.trim().toLowerCase();

                        const fileName = `slip_${Date.now()}_${file.name}`;
                        const { error: uploadError } = await supabase.storage
                          .from('slips')
                          .upload(fileName, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                          .from('slips')
                          .getPublicUrl(fileName);

                        const { data: oldData } = await supabase
                          .from('customer_subscriptions')
                          .select('payment_history')
                          .eq('email', clientEmailInput)
                          .single();

                        const existingHistory = oldData?.payment_history || [];
                        const newPaymentRecord = {
                          date: new Date().toISOString(),
                          amount: Number(amountInput) || 0,
                          slip_url: publicUrl,
                          status: 'pending'
                        };

                        const updatedHistory = [newPaymentRecord, ...existingHistory];

                        const { error } = await supabase
                          .from('customer_subscriptions')
                          .update({ 
                            slip_url: publicUrl,
                            slip_status: 'pending',
                            amount: Number(amountInput) || 0,
                            payment_history: updatedHistory
                          })
                          .eq('email', clientEmailInput);

                        if (error) throw error;

                        showToast("✅ បានបញ្ជូន Slip ទៅកាន់ Admin ដោយជោគជ័យ!", "success");
                        form.reset();
                        fetchClients(); // ធ្វើការទាញយកទិន្នន័យថ្មីមកបង្ហាញភ្លាមៗ

                      } catch (err: any) {
                        alert("❌ បរាជ័យក្នុងការបញ្ជូន Slip: " + err.message);
                      }
                    }} className="space-y-4 text-xs">
                      
                      <div>
                        <label className="block font-bold mb-1 text-slate-500 uppercase">ទឹកប្រាក់បានបង់ ($)</label>
                        <input 
                          type="number" 
                          name="amount" 
                          step="0.01" 
                          required 
                          placeholder="5.00" 
                          className={`w-full p-3 rounded-xl border text-sm outline-none font-bold text-emerald-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-500 uppercase">រូបភាព Slip ផ្ទេរប្រាក់ (Bank Slip)</label>
                        <input 
                          type="file" 
                          name="slipFile" 
                          accept="image/*" 
                          required 
                          className={`w-full p-2.5 rounded-xl border text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`} 
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer mt-2"
                      >
                        📤 បញ្ជូន Slip ជូន Admin
                      </button>
                    </form>
                  </div>
                </div>

                {/* 🌟 ផ្នែកប្រវត្តិបង់ប្រាក់ (Payment History Table) នៅខាងក្រោម */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <span>📜</span> ប្រវត្តិការទូទាត់ប្រាក់របស់អ្នក (Payment History)
                  </h3>

                  <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b uppercase tracking-wider ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            <th className="py-3 px-4 font-bold">កាលបរិច្ឆេទ (Date)</th>
                            <th className="py-3 px-4 font-bold">ទឹកប្រាក់ (Amount)</th>
                            <th className="py-3 px-4 font-bold">រូបភាព Slip</th>
                            <th className="py-3 px-4 font-bold text-center">ស្ថានភាព (Status)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {(() => {
                            // ទាញយក Email របស់ User ដែលកំពុង Login ដើម្បីត្រងមើលប្រវត្តិរបស់គាត់ផ្ទាល់
                            const currentClientData = clients.find(c => {
                              // អាចប្រៀបធៀបជាមួយ User Session បច្ចុប្បន្ន
                              return true; // បើបង្ហាញទាំងអស់ ឬត្រងតាម client
                            });

                            // ប្រសិនបើមាន payment_history យកមកបង្ហាញ បើអត់ទាន់មាន គឺយក Slip ចុងក្រោយមកបង្ហាញជា Record
                            const historyRecords = currentClientData?.payment_history || (currentClientData?.slip_url ? [{
                              date: currentClientData.created_at || new Date().toISOString(),
                              amount: currentClientData.amount || 0,
                              slip_url: currentClientData.slip_url,
                              status: currentClientData.slip_status || 'pending'
                            }] : []);

                            return historyRecords.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                                  មិនទាន់មានប្រវត្តិការទូទាត់ប្រាក់នៅឡើយទេ។
                                </td>
                              </tr>
                            ) : (
                              historyRecords.map((record: any, idx: number) => (
                                <tr key={idx} className={`transition ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                  <td className="py-3 px-4 font-medium">
                                    {new Date(record.date).toLocaleString('km-KH')}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-emerald-500">
                                    ${Number(record.amount || 0).toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4">
                                    {record.slip_url ? (
                                      <a 
                                        href={record.slip_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-500 hover:underline font-bold flex items-center gap-1"
                                      >
                                        <span>មើល Slip 🧾</span>
                                      </a>
                                    ) : (
                                      <span className="text-slate-400">គ្មាន Slip</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {record.status === 'approved' ? (
                                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-full font-bold text-[11px] border border-blue-500/20">
                                        បានទូទាត់ប្រាក់ ✓ (Approved)
                                      </span>
                                    ) : record.status === 'rejected' ? (
                                      <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full font-bold text-[11px] border border-red-500/20">
                                        បានបដិសេធ ✕ (Rejected)
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-full font-bold text-[11px] border border-amber-500/20 animate-pulse">
                                        រង់ចាំពិនិត្យ ⏳ (Pending)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* ផ្ទាំងបង្កើតយុទ្ធនាការ (CREATE) - Dark Mode Supported */}
            {/* ========================================================= */}
            {activeTab === "CREATE" && (
              <form onSubmit={handleAutoBoost} className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-200 w-full items-start">
                
                {/* ========================================== */}
                {/* 🌟 ផ្នែកខាងឆ្វេង (Left Column): យក 7 ផ្នែក */}
                {/* ========================================== */}
                <div className="xl:col-span-7 flex flex-col gap-6 w-full min-w-0">
                  
                  {/* --- ១. Campaign Details Card --- */}
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col gap-5 w-full transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                    
                    {/* ============================================== */}
                    {/* 🌟 AI Auto-Fill Smart Box (សម្រាប់អ្នកថ្មីងាយស្រួលប្រើ) */}
                    {/* ============================================== */}
                    <div className={`p-5 rounded-2xl border mb-4 shadow-sm ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border-indigo-900/50 text-white' : 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-100 text-slate-900'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md">✨</div>
                        <div>
                          <h4 className="font-bold text-[14px]">ជំនួយការ AI Auto-Fill (សម្រាប់អ្នកមិនសូវចេះប៊ូត)</h4>
                          <p className="text-xs opacity-75">គ្រាន់តែវាយឈ្មោះផលិតផល AI នឹងជួយរៀបចំការកំណត់ទាំងអស់ជូនដោយស្វ័យប្រវត្តិ</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col sm:flex-row">
                        <input 
                          type="text"
                          value={autoFillInput}
                          onChange={(e) => setAutoFillInput(e.target.value)}
                          placeholder="ឧ. លក់ស្បែកជើងកីឡាបុរស, សម្លៀកបំពាក់នារី..."
                          className={`w-full border rounded-xl p-3 text-sm outline-none font-medium shadow-xs ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white placeholder-slate-400 focus:border-indigo-400' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'}`}
                        />
                        
                        <button 
                          type="button"
                          onClick={handleAiAutoFill}
                          disabled={isAutoFilling || !autoFillInput.trim()}
                          className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition shadow-md shadow-indigo-500/20 shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isAutoFilling ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>កំពុងគិត...</span></>
                          ) : (
                            <><span>⚡</span><span>AI Auto-Fill</span></>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center border-b pb-3">
                      <h3 className={`font-bold flex items-center gap-2 text-[15px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        <span className={`p-1.5 rounded-xl ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>📁</span> ១. Campaign Details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <span>{showAdvancedSettings ? "▲ បិទព័ត៌មានលម្អិត" : "⚙️ បើកទម្លាក់មើលបន្ថែម"}</span>
                      </button>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Campaign name (ឈ្មោះយុទ្ធនាការ)</label>
                      <input type="text" value={campaignName} onChange={(e) => saveParam("campaignName", e.target.value, setCampaignName)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                    </div>
                    
                    {showAdvancedSettings && (
                      <div className="flex flex-col gap-4 p-4 rounded-xl border bg-slate-50/80 dark:bg-[#18191A] border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-4 flex-col sm:flex-row">
                          <div className="flex-1 min-w-0">
                            <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Objective</label>
                            <select value={objective} onChange={(e) => saveParam("obj", e.target.value, setObjective)} className={`w-full border rounded-xl p-3 outline-none ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                              <option value="ENGAGEMENT">💬 Engagement</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Conversion Location</label>
                            <select value={conversionLocation} onChange={(e) => saveParam("conversionLoc", e.target.value, setConversionLocation)} className={`w-full border rounded-xl p-3 outline-none ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                              <option value="MESSAGES">📨 Message destinations</option>
                              <option value="ON_AD">👍 On your ad</option>
                            </select>
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-blue-950/20 border-blue-900' : 'bg-[#f2f6fc] border-blue-100'}`}>
                          <label className={`block text-sm font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Performance goal</label>
                          <p className={`text-[12px] mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>How you measure success for your ads.</p>
                          <select value={performanceGoal} onChange={(e) => saveParam("performanceGoal", e.target.value, setPerformanceGoal)} className={`w-full border rounded-xl p-3 text-sm outline-none focus:border-blue-500 shadow-sm font-semibold cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                            <option value="CONVERSATIONS">💬 Maximize number of conversations</option>
                            <option value="LEAD_GENERATION">📝 Maximize number of leads through messaging</option>
                            <option value="LINK_CLICKS">🔗 Maximize number of link clicks</option>
                            <option value="POST_ENGAGEMENT">👍 Maximize engagement with a post</option>
                          </select>
                        </div>
                      </div>
                    )}
                    
                    <div className={`p-4 rounded-xl border mt-1 ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Budget strategy (ទឹកលុយចំណាយ)</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                          <select value={budgetType} onChange={(e) => saveParam("budgetType", e.target.value, setBudgetType)} className={`w-full border rounded-xl p-3 text-sm outline-none font-medium cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                            <option value="DAILY">Daily budget</option>
                            <option value="LIFETIME">Lifetime budget</option>
                          </select>
                        </div>
                        <div className="flex-1 relative min-w-0">
                          <span className="absolute left-3.5 top-3 font-bold text-slate-500">$</span>
                          <input type="number" min="1" step="0.5" value={budget} onChange={(e) => saveParam("budget", e.target.value, setBudget)} className={`w-full border rounded-xl p-3 pl-8 text-sm outline-none font-bold focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`} />
                        </div>
                      </div>

                      {budgetType === "LIFETIME" && (
                        <div className="mt-4 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>ដំណើរការរយៈពេល (ថ្ងៃ)៖</label>
                            <input type="number" min="1" value={duration} onChange={(e) => saveParam("duration", e.target.value, setDuration)} className={`w-24 border rounded-xl p-2.5 text-sm outline-none text-center font-bold focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                          </div>
                          
                          <div className={`text-[13px] p-3.5 rounded-xl border flex flex-col gap-1 shadow-sm ${theme === 'dark' ? 'bg-blue-950/20 border-blue-800 text-slate-300' : 'bg-blue-50 border-blue-100 text-slate-700'}`}>
                            <div className={`font-bold flex items-center gap-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                              <span>📅 ព័ត៌មានសង្ខេបការចំណាយ៖</span>
                            </div>
                            <div>
                              • រយៈពេលដំណើរការ៖ <span className="font-bold">{duration} ថ្ងៃ</span> (ចាប់ពីថ្ងៃនេះ ដល់ថ្ងៃទី {(() => {
                                const d = new Date();
                                d.setDate(d.getDate() + (Number(duration) || 1));
                                return d.toLocaleDateString('km-KH', { month: 'long', day: 'numeric', year: 'numeric' });
                              })()})
                            </div>
                            <div>
                              • ថវិកាសរុបត្រូវកាត់អស់៖ <span className="font-bold text-red-500">${Number(budget || 0).toFixed(2)}</span> 
                              {' '}(ប្រហែល <span className="font-bold">${((Number(budget) || 0) / (Number(duration) || 1)).toFixed(2)}</span> ក្នុងមួយថ្ងៃ)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- ២. Ad Set Details --- */}
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col gap-5 w-full min-w-0 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                    <h3 className={`font-bold border-b pb-3 flex items-center gap-2 text-[15px] ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                      <span className={`p-1.5 rounded-xl ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>🎯</span> ២. Ad Set (Targeting & Placements)
                    </h3>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ad set name</label>
                      <input type="text" value={adsetName} onChange={(e) => saveParam("adsetName", e.target.value, setAdsetName)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                    </div>
                    
                    <div className="flex gap-4 flex-col sm:flex-row">
                      <div className="flex-1 min-w-0">
                        <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Locations</label>
                        <select value={location} onChange={(e) => saveParam("location", e.target.value, setLocation)} className={`w-full border rounded-xl p-3 outline-none text-sm font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                          <option value="CAMBODIA">📍 ទូទាំងប្រទេសកម្ពុជា</option>
                          <option value="PHNOM_PENH">🏙️ រាជធានីភ្នំពេញ</option>
                          <option value="SIEM_REAP">🏛️ ខេត្តសៀមរាប</option>
                          <option value="BATTAMBANG">🌾 ខេត្តបាត់ដំបង</option>
                          <option value="SIANOUKVILLE">🌊 ខេត្តព្រះសីហនុ</option>
                          <option value="KAMPOT">🌴 ខេត្តកំពត</option>
                          <option value="KAMPONG_CHAM">🌳 ខេត្តកំពង់ចាម</option>
                          <option value="KAMPONG_SPEU">⛰️ ខេត្តកំពង់ស្ពឺ</option>
                          <option value="KAMPONG_THOM">🌾 ខេត្តកំពង់ធំ</option>
                          <option value="KANDAL">🏘️ ខេត្តកណ្ដាល</option>
                          <option value="KOH_KONG">🏝️ ខេត្តកោះកុង</option>
                          <option value="KRATIE">🌿 ខេត្តក្រចេះ</option>
                          <option value="MONDUL_KIRI">🌲 ខេត្តមណ្ឌលគីរី</option>
                          <option value="PREY_VENG">🌾 ខេត្តព្រៃវែង</option>
                          <option value="PURSAT">🏞️ ខេត្តពោធិ៍សាត់</option>
                          <option value="RATANAK_KIRI">🌲 ខេត្តរតនគីរី</option>
                          <option value="STUNG_TRENG">🌊 ខេត្តស្ទឹងត្រែង</option>
                          <option value="SVAY_RIENG">🛣️ ខេត្តស្វាយរៀង</option>
                          <option value="TAKEV">🏺 ខេត្តតាកែវ</option>
                          <option value="ODOR_MEANCHEY">🌳 ខេត្តឧត្តរមានជ័យ</option>
                          <option value="KEP">🏖️ ខេត្តកែប</option>
                          <option value="PAILIN">💎 ខេត្តប៉ៃលិន</option>
                          <option value="PREAH_VIHEAR">🏛️ ខេត្តព្រះវិហារ</option>
                          <option value="TBONG_KHMUM">🌴 ខេត្តត្បូងឃ្មុំ</option>
                          <option value="BANTEAY_MEANCHEY">🌾 ខេត្តបន្ទាយមានជ័យ</option>
                          <option value="KAMPONG_CHHNANG">🏺 ខេត្តកំពង់ឆ្នាំង</option>
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Gender</label>
                        <select value={gender} onChange={(e) => saveParam("gender", e.target.value, setGender)} className={`w-full border rounded-xl p-3 outline-none text-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                          <option value="ALL">All genders</option>
                          <option value="MALE">Men</option>
                          <option value="FEMALE">Women</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Age</label>
                      <div className="flex items-center gap-3">
                        <input type="number" min="13" max="65" value={ageMin} onChange={(e) => saveParam("ageMin", e.target.value, setAgeMin)} className={`w-full border rounded-xl p-3 outline-none text-center ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                        <span className="text-slate-400 font-bold">-</span>
                        <input type="number" min="13" max="65" value={ageMax} onChange={(e) => saveParam("ageMax", e.target.value, setAgeMax)} className={`w-full border rounded-xl p-3 outline-none text-center ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Detailed Targeting (Interests)</label>
                      
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <input 
                          type="text"
                          value={interestQuery}
                          onChange={(e) => {
                            setInterestQuery(e.target.value);
                            localStorage.setItem("interestQuery", e.target.value);
                          }}
                          placeholder="Search interests (e.g. Shoes, Footwear)..."
                          className={`w-full border rounded-xl p-3 text-sm outline-none focus:border-blue-500 shadow-sm font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
                        />
                        
                        <button
                          type="button"
                          onClick={async () => {
                            if (!interestQuery.trim()) { alert("⚠️ សូមវាយពាក្យគន្លឹះចូលក្នុងប្រអប់ជាមុនសិន!"); return; }
                            try {
                              const pageInfo = pages.find(p => p.id === selectedPage);
                              const token = pageInfo?.access_token || "";
                              const res = await fetch(`/api/interests?q=${interestQuery}&token=${token}`);
                              const result = await res.json();
                              if (result.success && result.data.length > 0) {
                                const proKeywords = result.data.map((item: any) => item.name).join(", ");
                                setTargeting(proKeywords);
                                localStorage.setItem("targeting", proKeywords);
                                alert(`🔥 ទាញយក AI Pro - Fill ចំនួន ${result.data.length} ដោយជោគជ័យ!`);
                              } else { alert("⚠️ រកមិនឃើញទិន្នន័យទេ: " + (result.error || "Unknown error")); }
                            } catch (err) { console.error("Error:", err); }
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:from-emerald-700 hover:to-teal-700 transition shrink-0 cursor-pointer shadow-sm"
                        >
                          AI Pro - Fill
                        </button>

                        <button
                          type="button"
                          onClick={() => { setTargeting(""); localStorage.removeItem("targeting"); }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          Clear
                        </button>
                      </div>

                      <textarea 
                        rows={3}
                        value={targeting} 
                        onChange={(e) => { setTargeting(e.target.value); localStorage.setItem("targeting", e.target.value); }} 
                        className={`w-full border rounded-xl p-3 mt-2 outline-none focus:border-blue-500 text-sm font-medium resize-y shadow-inner ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700'}`} 
                        placeholder="Selected keywords will appear here and sync to Ad Set..."
                      />
                    </div>

                    <div className={`border rounded-xl overflow-visible mt-2 flex-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      
                      {/* Placements Dropdown Header ជាមួយនឹង Smart Presets ធំជាងមុន */}
                      <div className={`p-3.5 border-b flex flex-wrap justify-between items-center select-none transition-colors gap-3 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                        
                        <div onClick={() => setShowPlacementsSection(!showPlacementsSection)} className="flex items-center gap-2 cursor-pointer">
                          <label className="block text-[14px] font-extrabold cursor-pointer tracking-wide">
                            📍 Placements
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          
                          {/* 🌟 ប៊ូតុង Boost រូបភាព (ទំហំធំ) */}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPresetModalOpen('photo'); }}
                            className="px-5 py-2 min-w-[120px] justify-center rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transform hover:scale-[1.03] active:scale-95"
                          >
                            <span className="text-[15px] leading-none drop-shadow-sm">🖼️</span> 
                            <span className="tracking-wide">រូបភាព</span>
                          </button>

                          {/* 🌟 ប៊ូតុង Boost វីដេអូ (ទំហំធំ) */}
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPresetModalOpen('video'); }}
                            className="px-5 py-2 min-w-[120px] justify-center rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer transform hover:scale-[1.03] active:scale-95"
                          >
                            <span className="text-[15px] leading-none drop-shadow-sm">🎬</span> 
                            <span className="tracking-wide">វីដេអូ</span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => setShowPlacementsSection(!showPlacementsSection)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer ml-1 transition-colors"
                          >
                            {showPlacementsSection ? "▲ លាក់" : "⚙️ បើកមើល"}
                          </button>
                        </div>

                      </div>

                      {showPlacementsSection && (
                        <div className={`p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                          <select 
                            value={placementType} 
                            onChange={(e) => saveParam("placementType", e.target.value, setPlacementType)} 
                            className="..."
                          >
                            <option value="ADVANTAGE">✨ Advantage+ placements</option>
                            <option value="MANUAL">⚙️ Manual placements</option>
                        </select>

                          {placementType === "MANUAL" && (
                            <div className={`flex flex-col gap-4 pt-4 border-t animate-in fade-in text-sm ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                              
                              {/* Devices and OS */}
                              <div className={`rounded-xl border shadow-sm transition-all ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center p-3.5 cursor-pointer select-none" onClick={() => setShowDevices(!showDevices)}>
                                    <h4 className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Devices and operating systems</h4>
                                    <span className="text-slate-500 font-black text-xs">{showDevices ? '▲' : '▼'}</span>
                                </div>
                                
                                {showDevices && (
                                    <div className="flex flex-col gap-3 px-3.5 pb-4 animate-in fade-in slide-in-from-top-2">
                                      <select value={deviceType} onChange={(e) => saveParam("deviceType", e.target.value, setDeviceType)} className={`w-full border rounded-xl p-2.5 outline-none cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                                          <option value="ALL">All devices (recommended)</option>
                                          <option value="MOBILE">Mobile</option>
                                          <option value="DESKTOP">Desktop</option>
                                      </select>
                                      <select value={osType} onChange={(e) => saveParam("osType", e.target.value, setOsType)} className={`w-full border rounded-xl p-2.5 outline-none cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                                          <option value="ALL">All mobile devices</option>
                                          <option value="ANDROID">Android devices only</option>
                                          <option value="IOS">iOS devices only</option>
                                          <option value="FEATURE">Feature phones only</option>
                                      </select>
                                      <label className={`flex items-center gap-2 mt-1 cursor-pointer font-medium select-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                          <input 
                                            type="checkbox" 
                                            checked={wifiOnly} 
                                            onChange={(e) => { 
                                              setWifiOnly(e.target.checked); 
                                              localStorage.setItem("wifiOnly", String(e.target.checked)); 
                                            }} 
                                            className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer ${theme === 'dark' ? 'border-slate-600 bg-[#3A3B3C]' : 'border-slate-300'}`} 
                                          /> 
                                          Only when connected to Wi-Fi
                                      </label>
                                    </div>
                                )}
                              </div>

                              {/* Platforms */}
                              <div className={`border rounded-xl shadow-sm transition-all ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className={`p-3.5 font-bold flex justify-between cursor-pointer select-none ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-200' : 'bg-slate-50 text-slate-700'}`} onClick={() => setShowPlatforms(!showPlatforms)}>
                                    Platforms <span className="text-slate-500 font-black text-xs">{showPlatforms ? '▲' : '▼'}</span>
                                </div>
                                
                                {showPlatforms && (
                                  <div className={`p-4 grid grid-cols-2 gap-y-4 gap-x-2 font-medium animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={platforms.facebook} onChange={() => handlePlatformChange('facebook')} className="w-4 h-4 text-blue-600 rounded border-slate-500" /> Facebook</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={platforms.instagram} onChange={() => handlePlatformChange('instagram')} className="w-4 h-4 text-blue-600 rounded border-slate-500" /> Instagram</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={platforms.audienceNetwork} onChange={() => handlePlatformChange('audienceNetwork')} className="w-4 h-4 text-blue-600 rounded border-slate-500" /> Audience Network</label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={platforms.messenger} onChange={() => handlePlatformChange('messenger')} className="w-4 h-4 text-blue-600 rounded border-slate-500" /> Messenger</label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-40"><input type="checkbox" disabled checked={false} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> WhatsApp</label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-40"><input type="checkbox" disabled checked={false} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> Threads</label>
                                  </div>
                                )}
                              </div>

                              {/* Placement Controls */}
                              <div className={`border rounded-xl shadow-sm mb-2 transition-all ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className={`p-3.5 font-bold flex justify-between items-center cursor-pointer select-none ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-200' : 'bg-slate-50 text-slate-700'}`} onClick={() => setShowPlacementCtrls(!showPlacementCtrls)}>
                                    <span className="flex items-center gap-1">Placement controls <span className="w-3.5 h-3.5 rounded-full bg-slate-400 text-[9px] flex items-center justify-center font-bold text-white">i</span></span>
                                    <span className="text-slate-500 font-black text-xs">{showPlacementCtrls ? '▲' : '▼'}</span>
                                </div>
                                
                                {showPlacementCtrls && (
                                  <div className={`flex flex-col divide-y animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                    
                                    {/* Feeds */}
                                    <div>
                                        <div className={`p-3.5 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                          <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isGroupChecked('feeds')} onChange={(e) => handleGroupToggle('feeds', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-500 cursor-pointer" />
                                            <span className={`font-semibold cursor-pointer select-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} onClick={() => toggleAccordion('feeds')}>🪟 Feeds</span>
                                          </div>
                                          <div className="cursor-pointer px-2" onClick={() => toggleAccordion('feeds')}>
                                            <span className="text-slate-500 font-black text-[10px]">{expandedPlacements.feeds ? '▲' : '▼'}</span>
                                          </div>
                                        </div>
                                        {expandedPlacements.feeds && (
                                          <div className={`px-10 pb-4 pt-2 flex flex-col gap-3.5 text-[13px] font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-slate-50/50 text-slate-600'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_feed} onChange={()=>handleDetailedPlacementChange('fb_feed')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook Feed</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_profile} onChange={()=>handleDetailedPlacementChange('fb_profile')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook profile feed</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.ig_feed} onChange={()=>handleDetailedPlacementChange('ig_feed')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Instagram feed</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.ig_profile} onChange={()=>handleDetailedPlacementChange('ig_profile')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Instagram profile feed</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_marketplace} onChange={()=>handleDetailedPlacementChange('fb_marketplace')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook Marketplace</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_right_col} onChange={()=>handleDetailedPlacementChange('fb_right_col')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook right column</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.ig_explore} onChange={()=>handleDetailedPlacementChange('ig_explore')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Instagram Explore home</label>
                                            <label className="flex items-center gap-3 cursor-pointer opacity-50"><input type="checkbox" disabled checked={detailedPlacements.fb_business} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> Facebook Business Explore</label>
                                            <label className="flex items-center gap-3 cursor-pointer opacity-50"><input type="checkbox" disabled checked={detailedPlacements.threads_feed} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> Threads feed</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_notifications} onChange={()=>handleDetailedPlacementChange('fb_notifications')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook Notifications</label>
                                          </div>
                                        )}
                                    </div>

                                    {/* Stories, Status, Reels */}
                                    <div>
                                        <div className={`p-3.5 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                          <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isGroupChecked('stories')} onChange={(e) => handleGroupToggle('stories', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-500 cursor-pointer" />
                                            <span className={`font-semibold cursor-pointer select-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} onClick={() => toggleAccordion('stories')}>📱 Stories, Status, Reels</span>
                                          </div>
                                          <div className="cursor-pointer px-2" onClick={() => toggleAccordion('stories')}>
                                            <span className="text-slate-500 font-black text-[10px]">{expandedPlacements.stories ? '▲' : '▼'}</span>
                                          </div>
                                        </div>
                                        {expandedPlacements.stories && (
                                          <div className={`px-10 pb-4 pt-2 flex flex-col gap-3.5 text-[13px] font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-slate-50/50 text-slate-600'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.ig_stories} onChange={()=>handleDetailedPlacementChange('ig_stories')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Instagram Stories</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_stories} onChange={()=>handleDetailedPlacementChange('fb_stories')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook Stories</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.msg_stories} onChange={()=>handleDetailedPlacementChange('msg_stories')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Messenger Stories</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.ig_reels} onChange={()=>handleDetailedPlacementChange('ig_reels')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Instagram Reels</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_reels} onChange={()=>handleDetailedPlacementChange('fb_reels')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook Reels</label>
                                            <label className="flex items-center gap-3 cursor-not-allowed opacity-50"><input type="checkbox" disabled checked={detailedPlacements.wa_status} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> WhatsApp Status</label>
                                          </div>
                                        )}
                                    </div>

                                    {/* In-stream ads for reels */}
                                    <div>
                                        <div className={`p-3.5 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                          <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isGroupChecked('instream')} onChange={(e) => handleGroupToggle('instream', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-500 cursor-pointer" />
                                            <span className={`font-semibold cursor-pointer select-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} onClick={() => toggleAccordion('instream')}>▷ In-stream ads for reels</span>
                                          </div>
                                          <div className="cursor-pointer px-2" onClick={() => toggleAccordion('instream')}>
                                            <span className="text-slate-500 font-black text-[10px]">{expandedPlacements.instream ? '▲' : '▼'}</span>
                                          </div>
                                        </div>
                                        {expandedPlacements.instream && (
                                          <div className={`px-10 pb-4 pt-2 flex flex-col gap-3.5 text-[13px] font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-slate-50/50 text-slate-600'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.instream_reels} onChange={()=>handleDetailedPlacementChange('instream_reels')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> In-stream for Reels</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_reels_ads} onChange={()=>handleDetailedPlacementChange('fb_reels_ads')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Ads on Facebook Reels</label>
                                          </div>
                                        )}
                                    </div>

                                    {/* Search results */}
                                    <div>
                                        <div className={`p-3.5 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                          <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isGroupChecked('search')} onChange={(e) => handleGroupToggle('search', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-500 cursor-pointer" />
                                            <span className={`font-semibold cursor-pointer select-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} onClick={() => toggleAccordion('search')}>🔍 Search results</span>
                                          </div>
                                          <div className="cursor-pointer px-2" onClick={() => toggleAccordion('search')}>
                                            <span className="text-slate-500 font-black text-[10px]">{expandedPlacements.search ? '▲' : '▼'}</span>
                                          </div>
                                        </div>
                                        {expandedPlacements.search && (
                                          <div className={`px-10 pb-4 pt-2 flex flex-col gap-3.5 text-[13px] font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-slate-50/50 text-slate-600'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.fb_search} onChange={()=>handleDetailedPlacementChange('fb_search')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Facebook search results</label>
                                            <label className="flex items-center gap-3 cursor-pointer opacity-50"><input type="checkbox" disabled checked={detailedPlacements.ig_search} className="w-4 h-4 rounded border-slate-500 bg-slate-500/20" /> Instagram search results</label>
                                          </div>
                                        )}
                                    </div>

                                    {/* Apps and sites */}
                                    <div>
                                        <div className={`p-3.5 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50'}`}>
                                          <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isGroupChecked('apps')} onChange={(e) => handleGroupToggle('apps', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-500 cursor-pointer" />
                                            <span className={`font-semibold cursor-pointer select-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`} onClick={() => toggleAccordion('apps')}>💻 Apps and sites</span>
                                          </div>
                                          <div className="cursor-pointer px-2" onClick={() => toggleAccordion('apps')}>
                                            <span className="text-slate-500 font-black text-[10px]">{expandedPlacements.apps ? '▲' : '▼'}</span>
                                          </div>
                                        </div>
                                        {expandedPlacements.apps && (
                                          <div className={`px-10 pb-4 pt-2 flex flex-col gap-3.5 text-[13px] font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-slate-50/50 text-slate-600'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.an_native} onChange={()=>handleDetailedPlacementChange('an_native')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Audience Network native, banner and interstitial</label>
                                            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={detailedPlacements.an_rewarded} onChange={()=>handleDetailedPlacementChange('an_rewarded')} className="w-4 h-4 rounded border-slate-500 text-blue-600 cursor-pointer" /> Audience Network rewarded videos</label>
                                          </div>
                                        )}
                                    </div>

                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- ៣. Ad Setup & Conversations Card (រួមបញ្ចូលគ្នា) --- */}
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col gap-5 w-full min-w-0 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                    <h3 className={`font-bold border-b pb-3 flex items-center gap-2 text-[15px] ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                      <span className={`p-1.5 rounded-xl ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>🖼️</span> ៣. Ad Setup & Conversations
                    </h3>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ad name (ឈ្មោះការផ្សាយ)</label>
                      <input type="text" value={adName} onChange={(e) => saveParam("adName", e.target.value, setAdName)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="New Engagement Ad" />
                    </div>

                    {/* 🌟 Custom Dropdown ទំនើបបង្ហាញទាំង Logo Page និងឈ្មោះ */}
                    <div className="relative">
                      <div 
                        onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}
                        className={`p-3 flex justify-between items-center cursor-pointer border rounded-xl transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          {/* ឆែករកមើល Logo ពី pages ឬ facebookPages */}
                          {(() => {
                            const currentSelectedPage = pages.find(p => p.id === selectedPage) || facebookPages.find(p => p.id === selectedPage);
                            return currentSelectedPage?.picture?.data?.url ? (
                              <img src={currentSelectedPage.picture.data.url} className="w-7 h-7 rounded-full object-cover shrink-0 border" alt="Page Logo" />
                            ) : (
                              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">f</div>
                            );
                          })()}
                          
                          <span className="font-bold text-sm truncate block flex-1 min-w-0">
                            {selectedPage ? (pages.find(p => p.id === selectedPage)?.name || facebookPages.find(p => p.id === selectedPage)?.name || "Selected Page") : "Select a Page..."}
                          </span>
                        </div>
                        <span className="text-xs text-blue-500 shrink-0 font-bold">▼</span>
                      </div>

                      {/* Menu List ធ្លាក់ចុះ */}
                      {isPageMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsPageMenuOpen(false)}></div>
                          <div className={`absolute top-[110%] left-0 w-full border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                            {pages && pages.length > 0 ? (
                              pages.map((page: any) => (
                                <div 
                                  key={page.id} 
                                  onClick={() => {
                                    setSelectedPage(page.id);
                                    localStorage.setItem("selectedPage", page.id);
                                    setFbPageName(page.name);
                                    localStorage.setItem("fbPageName", page.name);
                                    setIsPageMenuOpen(false);
                                  }}
                                  className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition ${selectedPage === page.id ? 'bg-blue-600 text-white font-bold' : (theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-100')}`}
                                >
                                  {page.picture?.data?.url ? (
                                    <img src={page.picture.data.url} className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" alt="Page Logo" />
                                  ) : (
                                    <div className="w-7 h-7 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">f</div>
                                  )}
                                  <span className="text-sm truncate">{page.name}</span>
                                </div>
                              ))
                            ) : facebookPages && facebookPages.length > 0 ? (
                              facebookPages.map((page: any) => (
                                <div 
                                  key={page.id} 
                                  onClick={() => {
                                    setSelectedPage(page.id);
                                    localStorage.setItem("selectedPage", page.id);
                                    setFbPageName(page.name);
                                    localStorage.setItem("fbPageName", page.name);
                                    setIsPageMenuOpen(false);
                                  }}
                                  className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition ${selectedPage === page.id ? 'bg-blue-600 text-white font-bold' : (theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-100')}`}
                                >
                                  {page.picture?.data?.url ? (
                                    <img src={page.picture.data.url} className="w-8 h-8 rounded-full object-cover shrink-0 border" alt="Logo" />
                                  ) : (
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">f</div>
                                  )}
                                  <span className="text-sm truncate">{page.name}</span>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-xs text-slate-400 text-center">គ្មាន Page ត្រូវបង្ហាញទេ (សូម Connect Facebook)</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ad creative</label>
                      <div className={`border rounded-xl overflow-visible shadow-sm relative ${theme === 'dark' ? 'border-slate-700 bg-[#18191A]' : 'border-slate-200 bg-white'}`}>
                        <div className="p-4">
                          <div className={`w-full border rounded-xl p-3 flex items-center justify-between mb-4 shadow-sm relative overflow-hidden group ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-white border-slate-300'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                              {fetchingPosts ? (
                                <span className="text-slate-500 font-medium text-sm">⏳ កំពុងទាញយក...</span>
                              ) : (
                                <>
                                  {selectedPostData?.full_picture ? (
                                    <img src={selectedPostData.full_picture} className="w-12 h-12 object-cover rounded-xl shrink-0 border" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-[10px] border bg-slate-100 text-slate-400">No Img</div>
                                  )}
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className={`font-medium text-[13px] line-clamp-2 leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                                      {selectedPostData?.message || (selectedPost ? `Post ID: ${selectedPost}` : "[សូមចុច Select post ជាមុនសិន]")}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <button type="button" onClick={() => { setPostSelectionContext('create'); setIsPostMenuOpen(true); }} className={`flex-1 border rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                              <span className="text-lg leading-none mb-0.5">📄</span> Select post
                            </button>
                            <button type="button" onClick={() => setIsCreatePostOpen(true)} className={`flex-1 border rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                              + Create post
                            </button>
                          </div>
                          <span onClick={() => setIsEnterPostIdModalOpen(true)} className="text-[#1877F2] text-[13px] font-semibold cursor-pointer hover:underline inline-block mt-2">Enter post ID</span>
                        </div>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <div>
                      <label className={`block text-[13px] font-bold mb-1.5 flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Call to action</label>
                      <select value={callToAction} onChange={(e) => saveParam("callToAction", e.target.value, setCallToAction)} className={`w-full border rounded-xl p-3 text-[14px] font-medium outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}>
                        <option value="SEND_MESSAGE">Send message</option>
                        <option value="LEARN_MORE">Learn more</option>
                        <option value="SHOP_NOW">Shop now</option>
                        <option value="NO_BUTTON">No button</option>
                      </select>
                    </div>

                    {/* ============================================== */}
                    {/* 🌟 ផ្នែក Conversation (ស្ថិតក្នុងទម្រង់ Dropdown ទំនើប) */}
                    {/* ============================================== */}
                    <div className={`rounded-2xl border shadow-sm overflow-hidden mb-6 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                      
                      {/* Header សម្រាប់ចុចបើក/បិទ */}
                      <div 
                        onClick={() => setShowConversationSection(!showConversationSection)}
                        className={`p-4 flex justify-between items-center cursor-pointer select-none transition-colors ${theme === 'dark' ? 'bg-[#3A3B3C] hover:bg-[#4E4F50]' : 'bg-slate-100 hover:bg-slate-200'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">💬</span>
                          <div>
                            <h3 className="font-bold text-[14px]">Conversations</h3>
                            <p className="text-xs text-slate-400">Create the messaging experience people see after they tap on your ad.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">
                            {showConversationSection ? "▲ លាក់ការកំណត់" : "▼ បើកទម្លាក់មើល"}
                          </span>
                        </div>
                      </div>

                      {/* មាតិកាខាងក្នុង (លាក់/បង្ហាញ អាស្រ័យលើ State) */}
                      {showConversationSection && (
                        <div className="p-5 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200 space-y-4">
                          
                          <div className="flex gap-2 mb-4">
                            <button type="button" onClick={() => setTemplateTab("suggested")} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition ${templateTab === "suggested" ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-[#1877F2]') : (theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-slate-600 hover:bg-slate-100')}`}>Suggested template</button>
                            <button type="button" onClick={() => setTemplateTab("saved")} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition ${templateTab === "saved" ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-[#1877F2]') : (theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-slate-600 hover:bg-slate-100')}`}>Saved templates</button>
                          </div>

                          <div className={`border rounded-xl p-5 mb-4 shadow-sm min-w-0 ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`font-bold text-sm mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Greeting</div>
                            <div className={`text-[13px] mb-4 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>{msgGreeting}</div>

                            <div className={`font-bold text-sm mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Questions and responses</div>
                            <div className={`text-[13px] flex flex-col gap-1.5 mb-4 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                              {msgQuestions.filter(q => q.q.trim() !== "").map((item, idx) => (
                                <div key={idx}>{idx + 1}. {item.q}</div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button type="button" onClick={() => setIsEditingConversations(true)} className={`border rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center gap-2 transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                              <span>✎</span> Edit
                            </button>
                            <button type="button" className={`border rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center gap-2 transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                              <span>+</span> Create template
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                  

                </div>

                {/* ========================================== */}
                {/* 🌟 ផ្នែកខាងស្តាំ (Right Column): យក 5 ផ្នែក */}
                {/* ========================================== */}
                <div className="xl:col-span-5 w-full sticky top-20 shrink-0 flex flex-col gap-6">
                  
                  {/* Campaign Score */}
                  <div className={`border rounded-2xl p-4 flex items-center gap-3 w-full shadow-sm ${theme === 'dark' ? 'bg-blue-950/30 border-blue-800' : 'bg-[#E7F3FF] border-[#1877F2]'}`}>
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white border-[3px] border-[#31A24C] flex items-center justify-center text-[13px] font-bold text-[#050505]">100</div>
                    <div className="min-w-0">
                      <div className={`font-semibold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Campaign score ⓘ</div>
                      <div className={`text-[12px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>You're using our recommended setup.</div>
                    </div>
                  </div>

                  {/* Ad Preview Area */}
                  <div className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col w-full ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-[#F0F2F5] border-gray-300'}`}>
                    <div className={`border-b ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                      <div className={`flex justify-between items-center p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-5 bg-[#1877F2] rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div></div>
                          <span className={`font-semibold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Ad preview</span>
                        </div>
                        <div className={`flex rounded-xl p-0.5 border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-[#F5F6F8] border-gray-200'}`}>
                          <button type="button" className={`px-3 py-1 rounded-lg shadow-sm text-[12px] font-semibold text-[#1877F2] ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-white'}`}>Ad</button>
                          <button type="button" className={`px-3 py-1 text-[12px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Destination</button>
                        </div>
                      </div>
                      
                      {/* Real Placement Switcher */}
                      <div className={`flex items-center justify-between p-2.5 overflow-x-auto min-w-0 ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" className={`w-8 h-8 rounded-xl flex items-center justify-center border border-transparent ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>💻</button>
                          <button type="button" className={`w-12 h-8 rounded-xl flex items-center justify-center gap-1 text-[10px] border border-transparent ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>📱 ▼</button>
                          <div className={`h-4 w-px mx-2 ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                          
                          <div className="relative group">
                            <select value={previewMode} onChange={(e) => setPreviewMode(e.target.value)} className={`appearance-none border rounded-xl px-3 py-1.5 pr-8 text-[12px] font-bold outline-none cursor-pointer transition shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'}`}>
                                <option value="fb_feed">Facebook Feed</option>
                                <option value="ig_feed">Instagram Feed</option>
                                <option value="stories">Stories & Reels</option>
                                <option value="marketplace">Marketplace</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 text-xs">▼</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>⤢</button>
                          <button type="button" className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>➦ ▼</button>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 flex gap-4 overflow-x-auto items-start min-h-[450px] justify-center ${theme === 'dark' ? 'bg-[#18191A]' : 'bg-[#F0F2F5]'}`}>
                      {selectedPostData ? (
                        <>
                          {/* FB Feed Card */}
                          {previewMode === "fb_feed" && (
                            <div className={`w-[280px] shrink-0 rounded-2xl shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                              <div className="p-3.5 flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                  {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className={`w-9 h-9 rounded-full object-cover border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-100'}`} /> : <div className="w-9 h-9 bg-gray-400 rounded-full"></div>}
                                  <div>
                                    <div className={`font-bold text-[13px] leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{selectedPageData?.name || "Page Name"}</div>
                                    <div className={`text-[11px] flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Sponsored <span className="text-[5px]">●</span> 🌎</div>
                                  </div>
                                </div>
                                <span className={`tracking-widest text-[16px] -mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>...</span>
                              </div>
                              <div className={`px-3.5 pb-2 text-[13px] break-words whitespace-normal line-clamp-3 ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                                {selectedPostData?.message || ""}
                              </div>
                              
                              {selectedPostData?.attachments?.data?.[0]?.subattachments?.data ? (
                                <div className={`grid grid-cols-2 gap-0.5 w-full max-h-[280px] overflow-hidden relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200'}`}>
                                  {selectedPostData.attachments.data[0].subattachments.data.slice(0, 3).map((sub: any, idx: number) => (
                                    <img key={idx} src={sub.media?.image?.src || selectedPostData.full_picture} className="w-full h-[135px] object-cover" alt="Ad sub" />
                                  ))}
                                  {selectedPostData.attachments.data[0].subattachments.data.length > 3 ? (
                                    <div className="relative w-full h-[135px]">
                                      <img src={selectedPostData.attachments.data[0].subattachments.data[3].media?.image?.src || selectedPostData.full_picture} className="w-full h-full object-cover brightness-75" alt="Ad extra" />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-xl">
                                        +{selectedPostData.attachments.data[0].subattachments.data.length - 3}
                                      </div>
                                    </div>
                                  ) : (
                                    selectedPostData.attachments.data[0].subattachments.data[2] && (
                                      <img src={selectedPostData.attachments.data[0].subattachments.data[2].media?.image?.src} className="w-full h-[135px] object-cover" alt="Ad 3" />
                                    )
                                  )}
                                </div>
                              ) : selectedPostData?.full_picture ? (
                                <img src={selectedPostData.full_picture} className="w-full object-cover max-h-[300px]" alt="Ad single" />
                              ) : (
                                <div className={`w-full h-[200px] flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#18191A] text-slate-500' : 'bg-gray-100 text-gray-400'}`}>No Image</div>
                              )}

                              <div className={`px-3.5 py-2.5 flex justify-between items-center ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-[#F0F2F5]'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>CHAT IN MESSENGER</span>
                                    <span className={`font-bold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{callToAction === 'SEND_MESSAGE' ? 'Send message' : callToAction === 'LEARN_MORE' ? 'Learn more' : callToAction === 'SHOP_NOW' ? 'Shop now' : 'Learn more'}</span>
                                </div>
                                {callToAction !== 'NO_BUTTON' && (
                                  <button type="button" className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold ${theme === 'dark' ? 'bg-[#4E4F50] text-white' : 'bg-[#E4E6EB] text-[#050505]'}`}>{callToAction === 'SEND_MESSAGE' ? 'Send' : 'More'}</button>
                                )}
                              </div>

                              <div className={`px-3.5 py-2.5 flex justify-between text-[12px] border-t ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-[#65676B]'}`}>
                                <div className="flex gap-4 font-semibold">
                                  <span className="cursor-pointer hover:text-blue-500 transition">👍 {selectedPostData?.likesCount > 0 ? selectedPostData.likesCount : 'Like'}</span>
                                  <span className="cursor-pointer hover:text-blue-500 transition">💬 {selectedPostData?.commentsCount > 0 ? selectedPostData.commentsCount : 'Comment'}</span>
                                  <span className="cursor-pointer hover:text-blue-500 transition">⤴️ {selectedPostData?.sharesCount > 0 ? selectedPostData.sharesCount : 'Share'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* IG Feed Card */}
                          {previewMode === "ig_feed" && (
                            <div className={`w-[280px] shrink-0 rounded-2xl shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#000000] border-slate-800' : 'bg-white border-gray-200'}`}>
                              <div className={`p-3.5 flex justify-between items-center border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                                <div className="flex items-center gap-2.5">
                                  {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 bg-gray-400 rounded-full"></div>}
                                  <span className={`font-bold text-[12px] ${theme === 'dark' ? 'text-white' : 'text-[#262626]'}`}>{selectedPageData?.name || "Page Name"}</span>
                                </div>
                                <span className={`text-[16px] font-bold ${theme === 'dark' ? 'text-white' : 'text-[#262626]'}`}>⋮</span>
                              </div>
                              {selectedPostData?.full_picture ? (
                                <img src={selectedPostData.full_picture} className="w-full aspect-square object-cover" alt="Ad" />
                              ) : (
                                <div className={`w-full aspect-square flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#18191A] text-slate-500' : 'bg-gray-100 text-slate-400'}`}>No Image</div>
                              )}
                              <div className={`px-3.5 py-2.5 flex justify-between items-center border-y ${theme === 'dark' ? 'bg-[#121212] border-slate-800' : 'bg-[#F0F2F5] border-gray-200'}`}>
                                <span className={`font-bold text-[13px] flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>💬 Chat in Messenger</span>
                                <span className="text-[#1877F2] text-[14px] font-bold">›</span>
                              </div>
                              <div className={`p-3.5 ${theme === 'dark' ? 'bg-[#000000]' : 'bg-white'}`}>
                                <div className={`flex gap-3 text-[18px] mb-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}><span className="cursor-pointer">♡</span><span className="cursor-pointer">🗨</span><span className="cursor-pointer">↗</span></div>
                                <div className={`text-[12px] line-clamp-2 mt-1 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-300' : 'text-[#262626]'}`}><span className="font-bold">{selectedPageData?.name || "Page"}</span> {selectedPostData?.message}</div>
                              </div>
                            </div>
                          )}

                          {/* Stories & Reels Card */}
                          {previewMode === "stories" && (
                            <div className="w-[240px] h-[426px] shrink-0 bg-black rounded-2xl shadow-lg border border-slate-700 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200 mx-auto">
                                {selectedPostData?.full_picture ? (
                                  <img src={selectedPostData.full_picture} className="absolute inset-0 w-full h-full object-cover opacity-85" alt="Ad" />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">No Image</div>
                                )}
                                <div className="absolute top-0 left-0 right-0 p-3.5 flex items-center gap-2.5 bg-gradient-to-b from-black/60 to-transparent">
                                  {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-8 h-8 rounded-full object-cover border border-white/50" /> : <div className="w-8 h-8 bg-gray-400 rounded-full border border-white/50"></div>}
                                  <div className="text-white">
                                      <div className="font-bold text-[12px] shadow-sm">{selectedPageData?.name || "Page Name"}</div>
                                      <div className="text-[10px] font-medium opacity-80">Sponsored</div>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 pb-6">
                                  <div className="text-white text-[12px] line-clamp-3 leading-snug drop-shadow-md">
                                      {selectedPostData?.message || ""}
                                  </div>
                                  <div className="bg-white/25 backdrop-blur-md border border-white/30 text-white text-center py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-white/35 transition shadow-lg mt-1">
                                      Send Message
                                  </div>
                                </div>
                            </div>
                          )}

                          {/* Marketplace Card */}
                          {previewMode === "marketplace" && (
                            <div className={`w-[280px] shrink-0 rounded-2xl shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                                <div className={`p-3.5 flex items-center justify-between border-b ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-slate-50 border-gray-100'}`}>
                                  <span className={`font-bold text-[13px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Marketplace</span>
                                  <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Sponsored</span>
                                </div>
                                <div className="aspect-square w-full relative">
                                  {selectedPostData?.full_picture ? (
                                      <img src={selectedPostData.full_picture} className="w-full h-full object-cover" alt="Ad" />
                                  ) : (
                                      <div className={`w-full h-full flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#18191A] text-slate-500' : 'bg-gray-100 text-slate-400'}`}>No Image</div>
                                  )}
                                  <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white font-bold px-2.5 py-1 rounded-xl text-xs backdrop-blur-sm">$25</div>
                                </div>
                                <div className={`p-3.5 ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                                  <div className={`font-bold text-[14px] line-clamp-1 mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{selectedPageData?.name || "Product"}</div>
                                  <div className={`text-[12px] line-clamp-2 mb-3 leading-snug ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>{selectedPostData?.message || ""}</div>
                                  <button className={`w-full py-2 rounded-xl text-[13px] font-bold transition ${theme === 'dark' ? 'bg-[#3A3B3C] text-white hover:bg-[#4E4F50]' : 'bg-[#E4E6EB] text-[#050505] hover:bg-slate-200'}`}>Shop Now</button>
                                </div>
                            </div>
                          )}

                        </>
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${theme === 'dark' ? 'text-slate-600' : 'text-gray-400'}`}>
                          <span className="text-4xl mb-2">👁️</span>
                          <p className="text-sm font-medium">Select a post to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* --- Action Buttons (Close / Publish) នៅបាតខាងឆ្វេង --- */}
                  <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm w-full mt-2 mb-16 md:mb-4 relative z-30 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className="text-[12px] hidden sm:block opacity-80">
                      By clicking Publish, you acknowledge Meta's <span className="text-[#1877F2] cursor-pointer hover:underline">Terms and Conditions</span>.
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                      <button 
                        type="button" 
                        onClick={() => setActiveTab("MANAGE")}
                        className={`px-6 py-3 border rounded-xl font-bold text-[14px] transition shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      >
                        Close
                      </button>
                      
                      <button 
                        type="submit" 
                        disabled={loading || !selectedPost || isBudgetError} 
                        className={`px-10 py-3 rounded-xl font-bold text-[14px] transition shadow-md cursor-pointer ${
                          loading || !selectedPost || isBudgetError 
                            ? (theme === 'dark' ? 'bg-[#3A3B3C] text-slate-500 cursor-not-allowed' : 'bg-[#E4E6EB] text-[#BCC0C4] cursor-not-allowed') 
                            : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'
                        }`}
                      >
                        {loading ? "Publishing..." : "Publish"}
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            )}

            {/* ============================================== */}
            {/* 🌟 ផ្ទាំង Select Post Modal (រចនាបែប Facebook Ads Manager 100%) */}
            {/* ============================================== */}
            {isPostMenuOpen && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className={`rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] transform transition-all ${theme === 'dark' ? 'bg-[#242526] border border-slate-700 text-slate-100' : 'bg-white border border-slate-300 text-slate-900'}`}>
                  
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-[#F5F6F8]'}`}>
                    <div>
                      <h2 className="font-bold text-[18px]">Select posts</h2>
                      <p className="text-[13px] text-slate-500">Select up to 5 posts to display in your ad.</p>
                    </div>
                    <button type="button" onClick={() => setIsPostMenuOpen(false)} className="text-[24px] leading-none text-slate-400 hover:text-red-500 cursor-pointer">&times;</button>
                  </div>

                  <div className={`px-6 py-2.5 border-b flex items-center gap-6 text-[13px] font-bold ${theme === 'dark' ? 'border-slate-700 bg-[#18191A]' : 'border-slate-200 bg-white'}`}>
                    <span className="text-[#1877F2] border-b-[3px] border-[#1877F2] pb-2 cursor-pointer flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]"></span> Facebook</span>
                    <span className="text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E1306C]"></span> Instagram</span>
                    <span className="text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F5C33B]"></span> Partner Content</span>
                  </div>

                  {/* 🌟 ប្រអប់ Filter Dropdown និង Search ថ្មីដូច Facebook 100% */}
                  <div className={`px-4 py-2 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-slate-700 bg-[#242526]' : 'border-slate-200 bg-white'}`}>
                    <div className="text-[12px] text-slate-500 font-medium whitespace-nowrap">Filter by:</div>
                    
                    {/* Dropdown ជ្រើសរើសប្រភេទ Post (All, Published, Ads, Scheduled, Available) */}
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setIsPostFilterMenuOpen(!isPostFilterMenuOpen)}
                        className={`flex items-center justify-between border rounded p-1.5 px-3 text-[13px] font-semibold outline-none min-w-[160px] shadow-xs transition-colors cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] border-[#CED0D4] text-[#050505]'}`}
                      >
                        <span>{postFilterType}</span>
                        <span className="text-[10px] ml-2 text-slate-500">▼</span>
                      </button>
                      
                      {isPostFilterMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsPostFilterMenuOpen(false)}></div>
                          <div className={`absolute top-full left-0 mt-1 w-[220px] border rounded-lg shadow-xl z-50 py-1.5 ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-white border-[#CED0D4] text-[#050505]'}`}>
                            {['All post types', 'Published posts', 'Ads posts', 'Scheduled posts', 'Available posts only'].map((type) => (
                              <div 
                                key={type}
                                onClick={() => { setPostFilterType(type); setIsPostFilterMenuOpen(false); }}
                                className={`px-3 py-2 flex items-center gap-3 cursor-pointer text-[13px] transition-colors ${theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-[#F0F2F5]'}`}
                              >
                                <span className="w-4 flex justify-center text-[#1877F2] font-bold text-[14px]">
                                  {postFilterType === type ? '✓' : ''}
                                </span>
                                <span>{type}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* ប្រអប់ Search សម្រាប់ស្វែងរក Post តាម Keywords ឬ ID */}
                    <div className="relative w-full max-w-sm ml-2">
                      <span className="absolute left-3 top-2 text-slate-500 text-[12px] font-bold">🔍</span>
                      <input 
                        type="text" 
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        placeholder="Post, image or video IDs, or other keywords" 
                        className={`w-full border rounded p-1.5 pl-8 text-[12px] outline-none shadow-xs transition-colors focus:border-[#1877F2] ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white placeholder-slate-400' : 'bg-white hover:bg-[#F5F6F8] border-[#CED0D4] text-[#050505] placeholder-[#65676B]'}`} 
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto overflow-x-auto p-0 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                      <thead className={`sticky top-0 z-10 text-[11px] uppercase font-bold border-b ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-400' : 'bg-[#F0F2F5] border-slate-200 text-slate-500'}`}>
                        <tr>
                          <th className="p-3 w-10 text-center border-r border-slate-200 dark:border-slate-700">
                            <input type="checkbox" className="w-3.5 h-3.5 accent-[#1877F2]" />
                          </th>
                          <th className="p-3 min-w-[350px] border-r border-slate-200 dark:border-slate-700">Facebook post</th>
                          <th className="p-3 min-w-[150px] border-r border-slate-200 dark:border-slate-700">Post ID</th>
                          <th className="p-3 min-w-[100px] border-r border-slate-200 dark:border-slate-700">Source</th>
                          <th className="p-3 min-w-[100px] border-r border-slate-200 dark:border-slate-700">Media</th>
                          <th className="p-3 min-w-[120px]">Date created</th>
                        </tr>
                      </thead>
                      <tbody className={`text-[13px] ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'} divide-y`}>
                        {(() => {
                          // 🌟 រូបមន្ត Filter កាត់គ្រោះ (ធានាចេញ ១០០% ទោះ Facebook បោះទិន្នន័យមកទម្រង់ណាក៏ដោយ)
                          const filteredPosts = posts.filter(post => {
                            // បើអត់វាយអក្សរ Search ទេ គឺឱ្យវាបង្ហាញ Post ទាំងអស់មកមុនសិន
                            if (!postSearchQuery || postSearchQuery.trim() === "") return true;

                            // ការពារការគាំងពេលវាយ Search
                            const query = postSearchQuery.toLowerCase().trim();
                            const messageMatch = (post.message || "").toLowerCase().includes(query);
                            const storyMatch = (post.story || "").toLowerCase().includes(query);
                            const idMatch = (post.id || "").toLowerCase().includes(query);
                            
                            return messageMatch || storyMatch || idMatch;
                          });

                          return fetchingPosts ? (
                            <tr>
                              <td colSpan={6} className="text-center py-20 text-slate-500 font-medium text-[14px]">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                កំពុងទាញយកទិន្នន័យពី Facebook...
                              </td>
                            </tr>
                          ) : filteredPosts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-20 text-slate-400 font-medium">គ្មាន Post ណាមួយត្រូវបានរកឃើញទេ</td>
                            </tr>
                          ) : (
                            filteredPosts.map((post) => {
                              const isSelected = tempSelectedPost === post.id;
                              
                              let mediaType = "Photo";
                              if (post.full_picture?.includes(".mp4") || post.status_type === "added_video") mediaType = "Video";
                              else if (post.attachments?.data?.[0]?.subattachments) mediaType = "Album";

                              return (
                                <tr 
                                  key={post.id}
                                  onClick={() => setTempSelectedPost(post.id)}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected 
                                      ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-[#EBF5FF]') 
                                      : (theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-50')
                                  }`}
                                >
                                  <td className="p-3 text-center align-middle border-r border-slate-200 dark:border-slate-700">
                                    <input 
                                      type="radio" 
                                      name="modalPostRadio" 
                                      checked={isSelected}
                                      onChange={() => setTempSelectedPost(post.id)}
                                      className="w-4 h-4 text-[#1877F2] cursor-pointer accent-[#1877F2]"
                                    />
                                  </td>
                                  <td className="p-3 align-middle border-r border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                      {post.full_picture ? (
                                        <img src={post.full_picture} className="w-[50px] h-[50px] object-cover rounded shadow-sm shrink-0" alt="Thumbnail" />
                                      ) : (
                                        <div className="w-[50px] h-[50px] bg-slate-200 rounded shrink-0 flex items-center justify-center text-[10px] text-slate-500">No Img</div>
                                      )}
                                      <div className="flex flex-col min-w-0">
                                        <span className={`font-medium text-[13px] line-clamp-2 leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-[#050505]'}`}>
                                          {post.message || post.story || "[គ្មានអត្ថបទ]"}
                                        </span>

                                        <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500 mt-2">
                                          <span className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-[#F5C33B] text-white rounded-full flex items-center justify-center text-[9px] shadow-sm">👍</div>
                                            {post.likesCount || post.likes?.summary?.total_count || 0}
                                          </span>
                                          <span className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-slate-300 text-white rounded-full flex items-center justify-center text-[9px] shadow-sm transform scale-x-[-1]">💬</div>
                                            {post.commentsCount || post.comments?.summary?.total_count || 0}
                                          </span>
                                          <span className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-[10px] shadow-sm">➦</div>
                                            {post.sharesCount || post.shares?.count || 0}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className={`p-3 align-middle text-[12.5px] border-r border-slate-200 dark:border-slate-700 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{post.id}</td>
                                  <td className={`p-3 align-middle text-[12.5px] font-semibold border-r border-slate-200 dark:border-slate-700 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-800 text-white rounded-full flex items-center justify-center text-[8px]">f</span> Feed</span>
                                  </td>
                                  <td className={`p-3 align-middle text-[12.5px] font-semibold border-r border-slate-200 dark:border-slate-700 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>{mediaType}</td>
                                  <td className={`p-3 align-middle text-[12.5px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {post.created_time ? new Date(post.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                  </td>
                                </tr>
                              );
                            })
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div className={`p-4 flex justify-between items-center ${theme === 'dark' ? 'border-t border-slate-700 bg-[#3A3B3C]' : 'border-t border-slate-200 bg-[#F5F6F8]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-slate-500">
                        {tempSelectedPost ? '1 of 5 selected' : '0 of 5 selected'}
                      </span>
                      {tempSelectedPost && <span className="text-[13px] font-bold text-slate-400">Posts</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsPostMenuOpen(false)} className={`px-4 py-1.5 rounded-md font-bold text-[14px] transition cursor-pointer ${theme === 'dark' ? 'hover:bg-[#4E4F50] text-slate-300' : 'hover:bg-slate-200 text-slate-700'}`}>Cancel</button>
                      <button 
                        type="button" 
                        disabled={!tempSelectedPost}
                        onClick={() => {
                          if (postSelectionContext === 'duplicate') {
                            setDuplicatePostId(tempSelectedPost);
                          } else {
                            saveParam("selectedPost", tempSelectedPost, setSelectedPost);
                          }
                          setIsPostMenuOpen(false);
                        }} 
                        className="px-6 py-1.5 rounded-md font-bold text-[14px] text-white bg-[#1877F2] hover:bg-[#166FE5] disabled:bg-[#E4E6EB] disabled:text-[#BCC0C4] transition cursor-pointer shadow-sm"
                      >
                        Continue
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* ផ្ទាំងគ្រប់គ្រងយុទ្ធនាការ (MANAGE) - Full Dark/Light Mode Supported */}
            {/* ========================================================= */}
            {activeTab === "MANAGE" && (
              <div className={`shadow-sm border animate-in fade-in duration-300 h-full flex flex-col min-h-[750px] mb-8 font-sans transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                
                {/* របារឧបករណ៍ខាងលើ (Toolbar) */}
                <div className={`flex flex-col gap-3 p-3 border-b sticky top-[64px] z-10 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                  
                  {/* ជួរទី១៖ ប៊ូតុងបញ្ជាសកម្មភាព (Create, Duplicate, Edit, Delete) */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full">
                    <button 
                      onClick={() => setActiveTab("CREATE")}
                      className="bg-[#008060] hover:bg-[#006e52] text-white font-bold py-2 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border border-transparent"
                    >
                      <span>+</span> Create
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        // 🌟 ហៅមុខងារ Duplicate ឆ្លាតវៃថ្មីដែលបែងចែកតាម Tab នីមួយៗ
                        handleDuplicate();
                      }}
                      className="font-bold py-2 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                    >
                      {isDuplicating ? (
                        <>⏳ Duplicating...</>
                      ) : (
                        <><span className="text-sm">📄</span> Duplicate</>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        // ១. ឆែកមើលថាតើកំពុងនៅ Tab Ads មែនឬអត់?
                        if (activeManageTab === 'ADS') {
                          
                          // ២. ឆែកមើលថាមានទិន្នន័យ Ad ក្នុងតារាងឬអត់?
                          if (!adsList || adsList.length === 0) {
                            alert("⚠️ អត់ទាន់មានទិន្នន័យ Ad ក្នុងតារាងទេបង! សូមរង់ចាំឱ្យវាទាញទិន្នន័យចេញមកសិន។");
                            return;
                          }

                          // ៣. រៀបចំ Link ទាញយក ID
                          const adAccountClean = selectedAdAccount?.replace('act_', '');
                          const targetAdId = adsList[0].id; // ទាញយក Ad ID ទីមួយក្នុងតារាង
                          
                          if (!targetAdId) {
                            alert("⚠️ រកមិនឃើញ ID របស់ Ad នេះទេ!");
                            return;
                          }

                          // ៤. បង្កើត Link ទៅកាន់កន្លែងកែប្រែក្នុង Meta Ads Manager
                          const editUrl = `https://adsmanager.facebook.com/adsmanager/manage/ads/edit/standalone?act=${adAccountClean}&selected_ad_ids=${targetAdId}`;
                          
                          // ៥. សាកល្បងបើក Tab ថ្មី
                          const newWindow = window.open(editUrl, '_blank');
                          
                          // ៦. បើ Browser របស់បង Block មិនឱ្យបើក Tab ថ្មីទេ ឱ្យវាលោតទៅ Link ហ្នឹងក្នុង Tab ដើមតែម្ដង!
                          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                            alert("⚠️ Chrome របស់បងបានបិទមិនឱ្យលោត Tab ថ្មីទេ!\n\nប្រព័ន្ធនឹងបញ្ជូនបងទៅកាន់ Ads Manager នៅលើ Tab នេះតែម្ដង។");
                            window.location.href = editUrl; // បង្ខំឱ្យលោតទៅ
                          }

                        } else {
                          // បើនៅ Tab ផ្សេង (Campaigns ឬ Ad Sets) ឱ្យលោតផ្ទាំង Quick Edit
                          handleEditCampaign();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border border-transparent"
                    >
                      <span className="text-sm">✎</span> Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (activeManageTab === 'ADS') {
                          handleDeleteSelectedAds();
                        } else {
                          if (!selectedCampaigns || selectedCampaigns.length === 0) {
                            alert("⚠️ សូមធីកជ្រើសរើស Campaign ណាមួយជាមុនសិន!");
                            return;
                          }
                          setIsDeleteModalOpen(true);
                        }
                      }}
                      className={`font-bold py-2 px-3 rounded-lg text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border ${
                        (activeManageTab === 'ADS' ? selectedAds.length > 0 : selectedCampaigns.length > 0)
                          ? 'bg-red-600 hover:bg-red-700 text-white border-transparent'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">🗑️</span> Delete ({activeManageTab === 'ADS' ? selectedAds.length : selectedCampaigns.length})
                    </button>
                  </div>
                  
                  {/* ជួរទី២៖ "Updated just now", "Discard drafts" និង "Review & publish" ដាក់មួយជួរ 
                      ព្រមទាំងដាក់ hidden sm:flex ដើម្បីលាក់វាចោលនៅលើ Mobile App និងបង្ហាញតែលើ Web */}
                  <div className="hidden sm:flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700 w-full flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-[12px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Updated just now
                      </span>
                      <button 
                        type="button"
                        onClick={handleManualRefresh} 
                        disabled={isRefreshing}
                        className={`transition text-base p-1.5 rounded-lg cursor-pointer border shadow-xs flex items-center justify-center ${
                          theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`} 
                        title="Refresh data"
                      >
                        <span className={`inline-block ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
                      </button>
                    </div>
                    
                    {/* អា ៣ ហ្នឹងតម្រៀបជាជួរតែមួយ (រត់លើ Desktop ប៉ុណ្ណោះ លាក់លើ Mobile) */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] font-medium hidden md:inline ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Updated just now</span>
                      <button className={`font-semibold py-1.5 px-3 rounded-lg border text-xs transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] hover:bg-[#4E4F50] text-slate-200 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}>Discard drafts</button>
                      <button className="bg-[#1877F2] hover:bg-[#0054BD] text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition cursor-pointer shadow-sm border border-transparent">Review & publish</button>
                    </div>
                  </div>

                </div>

                {/* 🌟 ផ្ទាំង Tabs ៣, ប៊ូតុង AI Audit និង Columns/Breakdown ក្នុងកម្រិតស្តង់ដារ ១០០% គ្មាន Error */}
                <div className={`px-3 pt-2 border-b flex flex-col sm:flex-row justify-between items-start sm:items-end text-[13px] select-none gap-2 transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-300' : 'bg-[#F5F6F8] border-slate-200 text-slate-700'}`}>
                  
                  {/* ផ្នែកខាងឆ្វេង៖ Tabs និងប៊ូតុង AI Audit */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
                    
                    {/* 1. Tab: Campaigns */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer shrink-0 ${activeManageTab === 'CAMPAIGNS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => { setActiveManageTab('CAMPAIGNS'); localStorage.setItem('activeManageTab', 'CAMPAIGNS'); }} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-blue-500 font-bold">📁</span> Campaigns
                      </button>
                      {selectedCampaigns.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-[#1877F2] text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs">
                          {selectedCampaigns.length} selected
                          <span onClick={(e) => { e.stopPropagation(); handleEditCampaign(); }} className="hover:text-blue-200 cursor-pointer underline">Edit</span>
                        </span>
                      )}
                    </div>

                    {/* 2. Tab: Ad sets */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer shrink-0 ${activeManageTab === 'ADSETS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => { setActiveManageTab('ADSETS'); localStorage.setItem('activeManageTab', 'ADSETS'); }} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-indigo-500 font-bold">⊞</span> {selectedCampaigns.length > 0 ? `Ad sets (${selectedCampaigns.length})` : 'Ad sets'}
                      </button>
                    </div>

                    {/* 3. Tab: Ads */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer shrink-0 ${activeManageTab === 'ADS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => { setActiveManageTab('ADS'); localStorage.setItem('activeManageTab', 'ADS'); }} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-sky-500 font-bold">📄</span> {selectedCampaigns.length > 0 ? `Ads (${selectedCampaigns.length})` : 'Ads'}
                      </button>
                    </div>

                    {/* 🌟 ប៊ូតុង AI Audit ដាក់ជាប់ Tab Ads ពេលចុចនឹងនាំមក Tab Ads ភ្លាម */}
                    <button 
                      onClick={() => { setActiveManageTab('ADS'); localStorage.setItem('activeManageTab', 'ADS'); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg text-[11px] shadow-sm animate-pulse shrink-0 cursor-pointer transition mb-1"
                    >
                      <span>✨</span> <span>AI Audit</span>
                    </button>

                  </div>

                  {/* ផ្នែកខាងស្តាំ៖ ប៊ូតុង Columns និង Breakdown (បង្ហាញលើកុំព្យូទ័រ) */}
                  <div className="hidden sm:flex gap-2 pb-1.5 w-full sm:w-auto justify-end">
                    <button className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[12px] font-semibold shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Columns: Performance ▼</button>
                    <button className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[12px] font-semibold shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Breakdown ▼</button>
                  </div>

                </div>

                {/* 🌟 តារាងទិន្នន័យ (មានរុំដោយ overflow-x-auto ធានាមិនបែកប្លង់ទូរសព្ទ) */}
                <div className={`flex-1 overflow-x-auto relative transition-colors h-[500px] lg:h-[calc(100vh-230px)] custom-scrollbar ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                  {loadingCampaigns && (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center z-30 ${theme === 'dark' ? 'bg-[#242526]/80' : 'bg-white/80'}`}>
                      <div className="w-8 h-8 border-4 border-[#1877F2]/20 border-t-[#1877F2] rounded-full animate-spin mb-4"></div>
                      <p className={`font-bold text-[13px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Loading data...</p>
                    </div>
                  )}
                {/* ========================================================= */}
                {/* 1. TABLE: CAMPAIGNS */}
                {/* ========================================================= */}
                {activeManageTab === 'CAMPAIGNS' && (
                  <div className="w-full h-full flex flex-col justify-between min-w-full">
                    <div className="w-full overflow-x-auto flex-1 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[1650px]">
                        <thead className={`sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-[#F5F6F8] text-[#65676B]'}`}>
                          <tr className="text-[12px]">
                            <th className={`p-3 border-r w-10 text-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                              <input 
                                type="checkbox" 
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedCampaigns(campaignsList.map(c => c.id));
                                  else setSelectedCampaigns([]);
                                }}
                                checked={campaignsList.length > 0 && selectedCampaigns.length === campaignsList.length}
                                className={`w-3.5 h-3.5 rounded cursor-pointer accent-[#1877F2] ${theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}`} 
                              />
                            </th>
                            <th className={`p-3 border-r w-16 text-center font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Off / On</th>
                            <th onClick={() => handleSort('name')} className={`p-3 border-r min-w-[280px] font-bold cursor-pointer transition select-none ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C] hover:bg-[#4E4F50] text-slate-200' : 'border-slate-200 bg-[#ECEEF2] hover:bg-[#DEE1E6] text-slate-800'}`}>
                              <div className="flex items-center justify-between"><span>Campaign</span><span>{sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th onClick={() => handleSort('status')} className={`p-3 border-r min-w-[120px] font-bold cursor-pointer select-none ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-200'}`}>
                              <div className="flex items-center justify-between"><span>Delivery</span><span>{sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th className={`p-3 border-r min-w-[140px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Actions</th>
                            <th onClick={() => handleSort('results')} className={`p-3 border-r min-w-[150px] font-bold cursor-pointer select-none ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-200'}`}>
                              <div className="flex items-center justify-between"><span>Results</span><span>{sortField === 'results' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th className={`p-3 border-r min-w-[120px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Cost per result</th>
                            
                            {/* 🌟 ជួរឈរថ្មី៖ បង្ហាញការវាយតម្លៃ AI លើកម្រិត CPA */}
                            <th className={`p-3 border-r min-w-[150px] font-bold text-blue-600 dark:text-blue-400 ${theme === 'dark' ? 'border-slate-700 bg-blue-950/20' : 'border-slate-200 bg-blue-50/50'}`}>
                              ការវាយតម្លៃ AI (CPA)
                            </th>

                            <th onClick={() => handleSort('budget')} className={`p-3 border-r min-w-[100px] font-bold cursor-pointer select-none ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-200'}`}>
                              <div className="flex items-center justify-between"><span>Budget</span><span>{sortField === 'budget' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th onClick={() => handleSort('spend')} className={`p-3 border-r min-w-[120px] font-bold cursor-pointer transition ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C] hover:bg-[#4E4F50] text-slate-200' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                              <div className="flex items-center justify-between"><span>Amount spent</span><span>{sortField === 'spend' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th onClick={() => handleSort('impressions')} className={`p-3 border-r min-w-[100px] font-bold cursor-pointer select-none ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-200'}`}>
                              <div className="flex items-center justify-between"><span>Impressions</span><span>{sortField === 'impressions' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th onClick={() => handleSort('reach')} className={`p-3 border-r min-w-[100px] font-bold cursor-pointer select-none ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-200'}`}>
                              <div className="flex items-center justify-between"><span>Reach</span><span>{sortField === 'reach' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></div>
                            </th>
                            <th className="p-3 min-w-[100px] font-bold">Ends</th>
                          </tr>
                        </thead>
                        <tbody className={`text-[13px] ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                          {campaignsList.length === 0 && !loadingCampaigns ? (
                            <tr>
                              <td colSpan={13} className={`p-10 text-center font-medium ${theme === 'dark' ? 'bg-[#242526] text-slate-500' : 'bg-slate-50 text-slate-500'}`}>No campaigns found.</td>
                            </tr>
                          ) : (
                            campaignsList.map((c) => {
                              const ins = getInsights(c);
                              const results = getResults(ins, c.objective); 
                              const spend = ins ? ins.spend : null;
                              const cpa = (results !== "-" && spend && Number(results) > 0) ? (Number(spend) / Number(results)) : null;
                              const isSelected = selectedCampaigns.includes(c.id);

                              return (
                                <tr key={c.id} className={`border-b transition duration-150 group min-h-[48px] ${theme === 'dark' ? (isSelected ? 'bg-blue-900/30 border-slate-700' : 'border-slate-700 hover:bg-[#3A3B3C]') : (isSelected ? 'bg-[#EBF5FF] border-slate-200' : 'border-slate-200 hover:bg-[#F0F2F5]')}`}>
                                  <td className={`p-3 border-r text-center align-middle w-10 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <input 
                                      type="checkbox" 
                                      checked={selectedCampaigns.includes(c.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedCampaigns([...selectedCampaigns, c.id]);
                                        } else {
                                          setSelectedCampaigns(selectedCampaigns.filter(id => id !== c.id));
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer accent-[#1877F2]" 
                                    />
                                  </td>
                                  
                                  <td className={`p-3 border-r text-center align-middle w-16 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div onClick={() => handleToggleStatus(c.id, c.status)} className={`w-8 h-4 rounded-full mx-auto relative cursor-pointer ${c.status === 'ACTIVE' ? 'bg-[#1877F2]' : 'bg-[#BCC0C4]'}`}>
                                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] shadow-xs transition-all ${c.status === 'ACTIVE' ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                    </div>
                                  </td>

                                  <td className={`p-3 border-r align-middle min-w-[280px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="flex items-center justify-between group/name relative">
                                      <span 
                                        onClick={() => {
                                          setSelectedCampaigns([c.id]);
                                          setActiveManageTab('ADSETS');
                                          localStorage.setItem('activeManageTab', 'ADSETS'); // 🌟 ថែមបន្ទាត់នេះ
                                        }} 
                                        className="text-[#1877F2] font-semibold cursor-pointer hover:underline truncate max-w-[260px] block"
                                      >
                                        {c.name}
                                      </span>
                                      <div className={`hidden group-hover/name:flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded shadow-xs border absolute right-0 z-10 ${theme === 'dark' ? 'bg-[#18191A] text-slate-300 border-slate-600' : 'bg-[#E7F3FF] text-slate-700 border-blue-200'}`}>
                                          <span className="hover:text-blue-500 cursor-pointer">Charts</span> | 
                                          <span onClick={() => handleInlineEdit(c.id)} className="hover:text-blue-500 cursor-pointer">Edit</span> | 
                                          <span onClick={() => handleDeleteSingleCampaign(c.id, c.name)} className="text-red-500 hover:text-red-400 cursor-pointer">Delete</span>
                                      </div>
                                    </div>
                                  </td>

                                  <td className={`p-3 border-r align-middle min-w-[120px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    {(() => {
                              const ins = getInsights(c);
                              const hasAds = ins && (Number(ins.impressions) > 0 || Number(ins.spend) > 0 || Number(ins.reach) > 0);
                              
                              // 🌟 ចាប់យក Status ទាំងអស់ពី Facebook API មកទម្រង់អក្សរធំ
                              const status = (c.effective_status || c.status || "").toUpperCase();

                              // 1. ករណី Facebook កំពុងពិនិត្យ (Review)
                              if (status.includes('REVIEW') || status.includes('PENDING') || status === 'IN_REVIEW' || status === 'PENDING_REVIEW') {
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-amber-500">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> In review
                                  </span>
                                );
                              } 
                              // 2. ករណីលុបចោល
                              else if (status.includes('DELETED')) {
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-red-500">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Deleted
                                  </span>
                                );
                              } 
                              // 3. ករណីដំណើរការធម្មតា Active
                              else if (status === 'ACTIVE') {
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-[#31A24C]">
                                    <span className="w-2 h-2 rounded-full bg-[#31A24C]"></span> Active
                                  </span>
                                );
                              } 
                              // 4. ករណីបិទ Off
                              else if (status === 'PAUSED' || status === 'OFF') {
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-[#BCC0C4]"></span> Off
                                  </span>
                                );
                              } 
                              // 5. ករណីទូទៅផ្សេងទៀត
                              else {
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> {status ? status.toLowerCase() : 'Unknown'}
                                  </span>
                                );
                              }
                            })()}
                                  </td>

                                  <td className={`p-3 border-r align-middle min-w-[140px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <span className={`text-[11px] border px-2 py-0.5 rounded-full font-medium ${theme === 'dark' ? 'bg-[#18191A] text-slate-400 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>2 recommendations</span>
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle min-w-[150px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="font-semibold">{results === "-" ? "-" : formatNumber(results)}</div>
                                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">{c.objective === 'OUTCOME_ENGAGEMENT' ? 'Messaging Conversations' : 'Results'}</div>
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle min-w-[120px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="font-semibold">{cpa ? "$" + cpa.toFixed(2) : "-"}</div>
                                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Per Conversation</div>
                                  </td>

                                  {/* 🌟 ផ្ទាំងបង្ហាញ Badge វាយតម្លៃ CPA ស្វ័យប្រវត្តិតាមលក្ខខណ្ឌ */}
                                  <td className={`p-3 border-r align-middle min-w-[150px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    {cpa !== null ? getCpaBadge(cpa) : <span className="text-slate-400 text-xs">-</span>}
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle min-w-[100px] ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                    {c.daily_budget ? (
                                      <><div>{formatCurrency(c.daily_budget)}</div><div className="text-[10px] uppercase">Daily</div></>
                                    ) : c.lifetime_budget ? (
                                      <><div>{formatCurrency(c.lifetime_budget)}</div><div className="text-[10px] uppercase">Lifetime</div></>
                                    ) : (
                                      <div className="text-[11px] text-slate-500">Using ad set budget</div>
                                    )}
                                  </td>

                                  <td className={`p-3 border-r text-right font-bold align-middle min-w-[120px] ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C] text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                                    {spend ? "$" + Number(spend).toFixed(2) : "$0.00"}
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle min-w-[100px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(ins?.impressions)}</td>
                                  <td className={`p-3 border-r text-right align-middle min-w-[100px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(ins?.reach)}</td>
                                  <td className={`p-3 text-[12px] align-middle min-w-[100px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Ongoing</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>

                        {/* 🌟 Footer បូកសរុប (បានតម្រឹមបន្ថែម ១ ជួរឈរ សម្រាប់ CPA Status ឱ្យស្មើគ្នា ១០០%) */}
                        <tfoot className={`sticky bottom-0 z-20 font-bold text-[13px] border-t-2 ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-[#F5F6F8] border-slate-300 text-slate-900'}`}>
                          <tr>
                            <td colSpan={5} className="p-3 border-r border-slate-300 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded">Results</span>
                                <span>From {campaignsList.length} campaigns</span>
                              </div>
                            </td>
                            <td className="p-3 border-r text-right border-slate-300 dark:border-slate-700">
                              {formatNumber(campaignsList.reduce((acc, c) => {
                                const res = getResults(getInsights(c), c.objective);
                                return acc + (res !== "-" ? Number(res) : 0);
                              }, 0))}
                            </td>
                            <td className="p-3 border-r text-right border-slate-300 dark:border-slate-700">-</td>
                            <td className="p-3 border-r text-center border-slate-300 dark:border-slate-700">-</td>
                            <td className="p-3 border-r text-right border-slate-300 dark:border-slate-700">
                              {formatCurrency(campaignsList.reduce((acc, c) => {
                                const bgt = c.daily_budget || c.lifetime_budget || 0;
                                return acc + Number(bgt);
                              }, 0))}
                            </td>
                            <td className="p-3 border-r text-right font-black text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-700">
                              {formatCurrency(campaignsList.reduce((acc, c) => {
                                const ins = getInsights(c);
                                return acc + (ins?.spend ? Number(ins.spend) : 0);
                              }, 0) * 100)}
                            </td>
                            <td className="p-3 border-r text-right border-slate-300 dark:border-slate-700">
                              {formatNumber(campaignsList.reduce((acc, c) => acc + Number(getInsights(c)?.impressions || 0), 0))}
                            </td>
                            <td className="p-3 border-r text-right border-slate-300 dark:border-slate-700">
                              {formatNumber(campaignsList.reduce((acc, c) => acc + Number(getInsights(c)?.reach || 0), 0))}
                            </td>
                            <td className="p-3">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                  {/* ========================================================= */}
                  {/* 2. TABLE: AD SETS */}
                  {/* ========================================================= */}
                  {activeManageTab === 'ADSETS' && (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1800px]">
                        <thead className={`sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-[#F5F6F8] text-[#65676B]'}`}>
                          <tr className="text-[12px] uppercase">
                            <th className={`p-3 border-r w-10 text-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><input type="checkbox" className="w-3.5 h-3.5 accent-[#1877F2]" /></th>
                            <th className={`p-3 border-r w-16 text-center font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Off / On</th>
                            <th className={`p-3 border-r min-w-[250px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Ad set name</th>
                            <th className={`p-3 border-r min-w-[120px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Delivery</th>
                            <th className={`p-3 border-r min-w-[140px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Results</th>
                            <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Cost per result</th>
                            <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Budget</th>
                            <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Amount spent</th>
                            <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Impressions</th>
                            <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Reach</th>
                            <th className={`p-3 border-r min-w-[130px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Total messaging...</th>
                            <th className={`p-3 border-r min-w-[130px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>New messaging...</th>
                            <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Ends</th>
                            <th className={`p-3 border-r min-w-[130px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Bid strategy</th>
                            <th className="p-3 min-w-[150px] font-bold">Last significant edit</th>
                          </tr>
                        </thead>
                        <tbody className={`text-[13px] ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                          {loadingAdsets ? (
                            <tr><td colSpan={15} className="p-10 text-center text-slate-500">កំពុងទាញយកបញ្ជី Ad Sets...</td></tr>
                          ) : adsetsList.length === 0 ? (
                            <tr><td colSpan={15} className="p-10 text-center text-slate-500">រកមិនឃើញ Ad Sets ក្រោម Campaign នេះទេ</td></tr>
                          ) : (
                            adsetsList.map((adset) => {
                              const ins = getInsights(adset);
                              const parentCamp = campaignsList.find(c => c.id === selectedCampaigns[0]);
                              const objective = parentCamp?.objective || 'OUTCOME_ENGAGEMENT';
                              const results = getResults(ins, objective);
                              const spend = ins ? ins.spend : null;
                              const cpa = (results !== "-" && spend && Number(results) > 0) ? (Number(spend) / Number(results)) : null;

                              let budgetText = "Using campaign budget";
                              if (adset.daily_budget) budgetText = `$${(Number(adset.daily_budget) / 100).toFixed(2)} Daily`;
                              else if (adset.lifetime_budget) budgetText = `$${(Number(adset.lifetime_budget) / 100).toFixed(2)} Lifetime`;

                              let totalMsg = "-";
                              let newMsg = "-";
                              if (ins && ins.actions) {
                                const tMsgObj = ins.actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');
                                const nMsgObj = ins.actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_first_reply');
                                if (tMsgObj) totalMsg = tMsgObj.value;
                                if (nMsgObj) newMsg = nMsgObj.value;
                              }

                              const bidStrategy = adset.bid_strategy ? adset.bid_strategy.replace(/_/g, ' ').toLowerCase() : 'Highest volume';
                              const lastEditDate = adset.updated_time ? new Date(adset.updated_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                              const endDate = adset.end_time ? new Date(adset.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing';

                              return (
                                <tr key={adset.id} className={`border-b transition min-h-[48px] ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-50'}`}>
                                  <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><input type="checkbox" className="w-3.5 h-3.5 accent-[#1877F2] cursor-pointer" /></td>
                                  <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className={`w-8 h-4 rounded-full mx-auto relative cursor-pointer ${adset.status === 'ACTIVE' ? 'bg-[#1877F2]' : 'bg-[#BCC0C4]'}`}>
                                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] ${adset.status === 'ACTIVE' ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                    </div>
                                  </td>
                                  <td className={`p-3 border-r font-semibold text-[#1877F2] hover:underline cursor-pointer align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    {adset.name}
                                  </td>
                                  <td className={`p-3 border-r align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${adset.effective_status === 'ACTIVE' ? 'bg-[#31A24C]' : 'bg-slate-400'}`}></span> {adset.effective_status || adset.status}</span>
                                  </td>
                                  
                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="font-semibold">{results === "-" ? "-" : formatNumber(results)}</div>
                                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">{objective === 'OUTCOME_ENGAGEMENT' || objective === 'MESSAGES' ? 'Messaging Conversations' : 'Results'}</div>
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="font-semibold">{cpa ? "$" + cpa.toFixed(2) : "-"}</div>
                                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Per Result</div>
                                  </td>

                                  <td className={`p-3 border-r text-right align-middle text-slate-500 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="text-[12px]">{budgetText}</div>
                                  </td>
                                  
                                  <td className={`p-3 border-r text-right font-bold align-middle ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>
                                    {spend ? "$" + Number(spend).toFixed(2) : "$0.00"}
                                  </td>
                                  
                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(ins?.impressions)}</td>
                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(ins?.reach)}</td>
                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{totalMsg}</td>
                                  <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{newMsg}</td>
                                  <td className={`p-3 border-r text-[12px] align-middle ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>{endDate}</td>
                                  <td className={`p-3 border-r text-[12px] capitalize align-middle ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>{bidStrategy}</td>
                                  <td className={`p-3 text-[12px] align-middle ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{lastEditDate}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* 3. TABLE: ADS */}
                  {/* ========================================================= */}
                  {activeManageTab === 'ADS' && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1650px]">
                      <thead className={`sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-[#F5F6F8] text-[#65676B]'}`}>
                        <tr className="text-[12px]">
                          <th className={`p-3 border-r w-10 text-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                            <input 
                              type="checkbox" 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAds(adsList.map(ad => ad.id));
                                } else {
                                  setSelectedAds([]);
                                }
                              }}
                              checked={adsList.length > 0 && selectedAds.length === adsList.length}
                              className="w-3.5 h-3.5 accent-[#1877F2] cursor-pointer" 
                            />
                          </th>
                          <th className={`p-3 border-r w-16 text-center font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Off / On</th>
                          <th className={`p-3 border-r min-w-[300px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Ad name</th>
                          <th className={`p-3 border-r min-w-[120px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Delivery</th>
                          <th className={`p-3 border-r min-w-[140px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Results</th>
                          <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Cost per result</th>
                          
                          {/* 🌟 ជួរឈរ AI CPA Badge & Tooltip ៥ កម្រិត */}
                          <th className={`p-3 border-r min-w-[150px] font-bold text-blue-600 dark:text-blue-400 ${theme === 'dark' ? 'border-slate-700 bg-blue-950/20' : 'border-slate-200 bg-blue-50/50'}`}>
                            ការវាយតម្លៃ AI (CPA)
                          </th>

                          <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Budget</th>
                          <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Amount spent</th>
                          <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Impressions</th>
                          <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Reach</th>
                          <th className="p-3 min-w-[100px] font-bold">Ends</th>
                        </tr>
                      </thead>
                      <tbody className={`text-[13px] ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                        {loadingAds ? (
                          <tr><td colSpan={12} className="p-10 text-center text-slate-500">កំពុងទាញយកបញ្ជី Ads...</td></tr>
                        ) : adsList.length === 0 ? (
                          <tr><td colSpan={12} className="p-10 text-center text-slate-500">រកមិនឃើញ Ads ក្រោម Campaign នេះទេ</td></tr>
                        ) : (
                          adsList.map((ad) => {
                            const ins = ad.insights && ad.insights.data && ad.insights.data.length > 0 ? ad.insights.data[0] : null;
                            
                            const parentCamp = campaignsList.find(c => c.id === (ad.campaign_id || selectedCampaigns[0])) || campaignsList[0];
                            const objective = parentCamp?.objective || 'OUTCOME_ENGAGEMENT';
                            const results = getResults(ins, objective);

                            const spend = ins?.spend || 0;
                            const impressions = ins?.impressions || 0;
                            const reach = ins?.reach || 0;
                            
                            const cpa = (results !== "-" && spend && Number(results) > 0) ? (Number(spend) / Number(results)) : null;
                            const isAdSelected = selectedAds.includes(ad.id);

                            return (
                              <tr key={ad.id} className={`border-b transition min-h-[48px] ${theme === 'dark' ? (isAdSelected ? 'bg-blue-900/30 border-slate-700' : 'border-slate-700 hover:bg-[#3A3B3C]') : (isAdSelected ? 'bg-[#EBF5FF] border-slate-200' : 'border-slate-200 hover:bg-slate-50')}`}>
                                
                                {/* Checkbox */}
                                <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={isAdSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedAds([...selectedAds, ad.id]);
                                      } else {
                                        setSelectedAds(selectedAds.filter(id => id !== ad.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 accent-[#1877F2] cursor-pointer" 
                                  />
                                </td>
                                
                                {/* Status Toggle */}
                                <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <div 
                                    onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                                    className={`w-8 h-4 rounded-full mx-auto relative cursor-pointer transition-colors ${ad.status === 'ACTIVE' ? 'bg-[#1877F2]' : 'bg-[#BCC0C4]'}`}
                                  >
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] transition-all ${ad.status === 'ACTIVE' ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                  </div>
                                </td>

                                {/* 🌟 ជួរឈរ Ad Name (Update ធំចុងក្រោយ: ប្រព័ន្ធបូមរូបភាព Ultimate Grid 100%) */}
                                <td className={`p-3 border-r align-middle relative hover:z-[60] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <div className="flex items-center justify-between gap-3">
                                    
                                    <div className="relative group/preview flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-white text-xs overflow-hidden shrink-0 shadow-xs cursor-pointer border border-slate-300 dark:border-slate-600">
                                        {ad.creative?.thumbnail_url || ad.creative?.image_url ? (
                                          <img src={ad.creative.thumbnail_url || ad.creative.image_url} className="w-full h-full object-cover" alt="Ad thumb" />
                                        ) : (
                                          '👟'
                                        )}
                                      </div>

                                      <span className="font-semibold text-[#1877F2] hover:underline cursor-pointer truncate max-w-[180px]">
                                        {ad.name}
                                      </span>

                                      {/* 🚀 ផ្ទាំង Popover ធំលោតមកខាងស្តាំដៃ */}
                                      <div className="fixed top-1/2 right-[5%] transform -translate-y-1/2 hidden group-hover/preview:flex flex-col w-[340px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border overflow-hidden z-[999999] bg-white dark:bg-[#242526] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                        
                                        <div className="p-3.5 flex justify-between items-start bg-white dark:bg-[#242526]">
                                          <div className="flex items-center gap-2.5">
                                            {selectedPageData?.picture?.data?.url ? (
                                              <img src={selectedPageData.picture.data.url} className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-600" />
                                            ) : (
                                              <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">W</div>
                                            )}
                                            <div>
                                              <div className="font-bold text-[13px] leading-tight text-[#050505] dark:text-white">{selectedPageData?.name || "Wear Luxury Cambodia"}</div>
                                              <div className="text-[11px] flex items-center gap-1 text-[#65676B] dark:text-slate-400">Sponsored <span className="text-[5px]">●</span> 🌎</div>
                                            </div>
                                          </div>
                                          <span className="tracking-widest text-[16px] -mt-2 text-[#65676B] dark:text-slate-400">...</span>
                                        </div>

                                        <div className="px-3.5 pb-2 text-[13px] break-words whitespace-normal line-clamp-4 text-[#050505] dark:text-slate-300 bg-white dark:bg-[#242526]">
                                          {(() => {
                                            const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
                                            const matchedPost = (storyId && typeof posts !== 'undefined') ? posts.find((p: any) => p.id === storyId || (p.id && p.id.endsWith(storyId.split('_').pop() || ''))) : null;
                                            return ad.enriched_post?.message || matchedPost?.message || ad.creative?.body || ad.creative?.object_story_spec?.text || ad.creative?.name || "គ្មានអត្ថបទបង្ហាញ";
                                          })()}
                                        </div>

                                        {/* 3. 🌟 បូមយករូបភាព និងតម្រៀប Auto Grid */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex flex-col justify-center border-t border-b dark:border-slate-700">
                                          {(() => {
                                            let adImages: string[] = [];
                                            
                                            // ទី១៖ ឆែកមើលក្រែងលោវាជាប្រភេទ Carousel បង្កើតក្នុង Ads Manager ផ្ទាល់
                                            const childAtts = ad.creative?.object_story_spec?.link_data?.child_attachments || ad.creative?.object_story_spec?.template_data?.link?.child_attachments;
                                            if (childAtts && childAtts.length > 0) {
                                                adImages = childAtts.map((att: any) => att.image_url || att.picture || att.image_crops?.['100x100']?.[0]?.[0]);
                                            } 
                                            // ទី២៖ ឆែកមើលក្រែងលោវាជា Advantage+ Creative
                                            else if (ad.creative?.asset_feed_spec?.images) {
                                                adImages = ad.creative.asset_feed_spec.images.map((img: any) => img.url);
                                            }

                                            adImages = adImages.filter(Boolean);

                                            // ទី៣៖ បើអត់ទាន់មានរូប ឬមានតែ ១រូប ព្យាយាមទៅជីកកកាយក្នុង Page Post ដើមក្រែងមានច្រើន
                                            if (adImages.length <= 1) {
                                                const storyId = ad.creative?.effective_object_story_id || ad.creative?.object_story_id;
                                                let matchedPost = null;
                                                if (storyId && typeof posts !== 'undefined' && posts.length > 0) {
                                                    matchedPost = posts.find((p: any) => p.id === storyId || (p.id && p.id.endsWith(storyId.split('_').pop() || '')));
                                                }
                                                const sourcePost = ad.enriched_post || matchedPost;

                                                let postImages: string[] = [];
                                                if (sourcePost?.attachments?.data) {
                                                    for (const att of sourcePost.attachments.data) {
                                                        if (att.subattachments?.data) {
                                                            postImages.push(...att.subattachments.data.map((sub: any) => sub.media?.image?.src));
                                                        } else if (att.media?.image?.src) {
                                                            postImages.push(att.media.image.src);
                                                        }
                                                    }
                                                }
                                                postImages = postImages.filter(Boolean);
                                                
                                                // បើកកាយបានច្រើនជាង យកអាច្រើនជាងមកប្រើ
                                                if (postImages.length > adImages.length) {
                                                    adImages = postImages;
                                                } else if (adImages.length === 0 && sourcePost?.full_picture) {
                                                    adImages = [sourcePost.full_picture];
                                                }
                                            }

                                            // Fallback ចុងក្រោយបង្អស់ (Thumbnail)
                                            if (adImages.length === 0) {
                                                if (ad.creative?.image_url) adImages.push(ad.creative.image_url);
                                                else if (ad.creative?.thumbnail_url) adImages.push(ad.creative.thumbnail_url);
                                            }

                                            if (adImages.length === 0) {
                                              return <div className="w-full h-[200px] flex items-center justify-center text-xs text-slate-400">គ្មានរូបភាពបង្ហាញ</div>;
                                            }

                                            if (adImages.length === 1) return <img src={adImages[0]} className="w-full object-cover max-h-[300px]" alt="Ad Preview" />;
                                            
                                            if (adImages.length === 2) return (
                                                <div className="grid grid-cols-2 gap-0.5 w-full h-[300px]">
                                                  <img src={adImages[0]} className="w-full h-full object-cover" alt="Img 1"/>
                                                  <img src={adImages[1]} className="w-full h-full object-cover" alt="Img 2"/>
                                                </div>
                                            );

                                            if (adImages.length === 3) return (
                                                <div className="flex flex-col gap-0.5 w-full h-[300px]">
                                                  <img src={adImages[0]} className="w-full h-[150px] object-cover" alt="Img 1" />
                                                  <div className="grid grid-cols-2 gap-0.5 h-[148px]">
                                                    <img src={adImages[1]} className="w-full h-full object-cover" alt="Img 2" />
                                                    <img src={adImages[2]} className="w-full h-full object-cover" alt="Img 3" />
                                                  </div>
                                                </div>
                                            );

                                            if (adImages.length >= 4) return (
                                                <div className="grid grid-cols-2 gap-0.5 w-full h-[300px]">
                                                  <img src={adImages[0]} className="w-full h-[149px] object-cover" alt="Img 1" />
                                                  <img src={adImages[1]} className="w-full h-[149px] object-cover" alt="Img 2" />
                                                  <img src={adImages[2]} className="w-full h-[149px] object-cover" alt="Img 3" />
                                                  <div className="relative w-full h-[149px]">
                                                    <img src={adImages[3]} className="w-full h-full object-cover brightness-[0.55]" alt="Img 4" />
                                                    {adImages.length > 4 && (
                                                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-3xl drop-shadow-lg">
                                                        +{adImages.length - 3}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                            );
                                          })()}
                                        </div>

                                        <div className="px-3.5 py-2.5 flex justify-between items-center bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-[#65676B] dark:text-slate-400">CHAT IN MESSENGER</span>
                                            <span className="font-bold text-[14px] text-[#050505] dark:text-white">Send message</span>
                                          </div>
                                          <button type="button" className="px-4 py-1.5 rounded-xl text-[13px] font-bold bg-[#E4E6EB] text-[#050505] dark:bg-[#4E4F50] dark:text-white shadow-sm">Send</button>
                                        </div>

                                        <div className="px-3.5 py-2.5 flex justify-between text-[12px] border-t bg-white border-gray-200 text-[#65676B] dark:bg-[#242526] dark:border-slate-700 dark:text-slate-400">
                                          <div className="flex gap-4 font-semibold">
                                            <span>👍 Like</span>
                                            <span>💬 Comment</span>
                                            <span>⤴️ Share</span>
                                          </div>
                                        </div>

                                      </div>
                                    </div>

                                    <button 
                                      type="button"
                                      disabled={auditLoading}
                                      onClick={() => handleAiAudit(ad)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer shrink-0 disabled:opacity-50"
                                    >
                                      <span>✨</span> <span>AI Audit</span>
                                    </button>
                                  </div>
                                </td>

                                {/* Delivery */}
                                <td className={`p-3 border-r align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${ad.effective_status === 'ACTIVE' ? 'bg-[#31A24C]' : 'bg-slate-400'}`}></span> {ad.effective_status || ad.status}</span>
                                </td>
                                
                                {/* Results */}
                                <td className={`p-3 border-r text-right align-middle min-w-[140px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <div className="font-semibold">{results === "-" ? "-" : formatNumber(results)}</div>
                                  <div className="text-[10px] text-slate-500 uppercase mt-0.5">Results</div>
                                </td>

                                {/* Cost Per Result */}
                                <td className={`p-3 border-r text-right align-middle min-w-[120px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <div className="font-semibold">{cpa ? "$" + cpa.toFixed(2) : "-"}</div>
                                  <div className="text-[10px] text-slate-500 uppercase mt-0.5">Per Result</div>
                                </td>

                                {/* 🌟 AI CPA Badge & Tooltip ៥ កម្រិត */}
                                <td className={`p-3 border-r align-middle min-w-[150px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  {cpa !== null ? getCpaBadge(cpa) : <span className="text-slate-400 text-xs">-</span>}
                                </td>

                                {/* 🌟 Budget (ទាញយកទឹកប្រាក់ពិតប្រាកដពី Ad Set ឬ Campaign មេ) */}
                                <td className={`p-3 border-r text-right align-middle text-slate-500 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                  {(() => {
                                    // 1. ឆែកមើលថាតើ Ad នេះមាន Ad Set budget ផ្ទាល់ខ្លួនទេ
                                    if (ad.daily_budget) {
                                      return <div className="font-semibold">${(Number(ad.daily_budget) / 100).toFixed(2)} Daily</div>;
                                    } else if (ad.lifetime_budget) {
                                      return <div className="font-semibold">${(Number(ad.lifetime_budget) / 100).toFixed(2)} Lifetime</div>;
                                    } 
                                    // 2. ឆែកមើលថាតើមាន Budget មកពី Ad Set មេ (`adset` object ដែលយើងទើប fetch ចូល API) ដែរឬទេ
                                    else if (ad.adset?.daily_budget) {
                                      return <div className="font-semibold">${(Number(ad.adset.daily_budget) / 100).toFixed(2)} Daily</div>;
                                    } else if (ad.adset?.lifetime_budget) {
                                      return <div className="font-semibold">${(Number(ad.adset.lifetime_budget) / 100).toFixed(2)} Lifetime</div>;
                                    } 
                                    // 3. ឆែកមើល Campaign មេ
                                    else {
                                      if (parentCamp?.daily_budget) {
                                        return <div className="font-semibold">${(Number(parentCamp.daily_budget) / 100).toFixed(2)} Daily</div>;
                                      } else if (parentCamp?.lifetime_budget) {
                                        return <div className="font-semibold">${(Number(parentCamp.lifetime_budget) / 100).toFixed(2)} Lifetime</div>;
                                      }
                                    }
                                    
                                    return <div className="text-[11px] text-slate-500">Using ad set budget</div>;
                                  })()}
                                </td>
                                
                                {/* Amount Spent */}
                                <td className={`p-3 border-r text-right font-bold align-middle ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>
                                  ${Number(spend).toFixed(2)}
                                </td>
                                
                                {/* Impressions */}
                                <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(impressions)}</td>
                                
                                {/* Reach */}
                                <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(reach)}</td>
                                
                                {/* Ends */}
                                <td className={`p-3 text-[12px] align-middle min-w-[100px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Ongoing</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                </div>
              </div>
            )}
          
          </div>
        </main>
      </div>

      {/* ============================================== */}
      {/* 🌟 ផ្ទាំង Modal Editor សម្រាប់ Conversations (Facebook 100% Final Full Code) */}
      {/* ============================================== */}
      {isEditingConversations && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[1150px] flex flex-col overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#CED0D4] flex justify-between items-center bg-white shadow-sm z-10">
              <h2 className="font-bold text-[16px] text-[#050505]">Conversations</h2>
              <button type="button" onClick={() => setIsEditingConversations(false)} className="text-[#65676B] hover:text-[#050505] text-[24px] px-2 leading-none">&times;</button>
            </div>

            {/* Modal Body (2 Columns) */}
            <div className="flex flex-1 overflow-hidden bg-white">
              
              {/* Left Panel: Editing Form */}
              <div className="w-1/2 p-6 overflow-y-auto border-r border-[#CED0D4] flex flex-col gap-6 custom-scrollbar">
                
                {/* 1. Greeting Section */}
                <div>
                  <h3 className="font-bold text-[14px] text-[#050505] mb-1">Greeting</h3>
                  <p className="text-[13px] text-[#65676B] mb-3">Welcome people to the conversation after they tap on your ad. <span className="text-[#1877F2] cursor-pointer hover:underline">See tips and examples.</span></p>
                  
                  {/* Greeting Type Dropdown */}
                  <div className="relative w-[180px] mb-4">
                    <select 
                      value={greetingType} 
                      onChange={(e) => setGreetingType(e.target.value)}
                      className="w-full border border-[#CED0D4] rounded-md p-2 outline-none bg-white text-[13px] text-[#050505] cursor-pointer appearance-none focus:border-[#1877F2]"
                    >
                      <option value="text">Text only</option>
                      <option value="image">Text & image</option>
                      <option value="video">Text & video</option>
                    </select>
                    <span className="absolute right-3 top-2.5 text-[#65676B] pointer-events-none text-[12px]">▼</span>
                  </div>

                  {/* Upload Media */}
                  {greetingType !== 'text' && (
                    <div className="mb-4 p-3 bg-[#F0F2F5] border border-[#CED0D4] rounded-md">
                      <label className="block text-xs font-bold text-[#050505] mb-2">Upload {greetingType === 'image' ? 'Image' : 'Video'} for Greeting:</label>
                      <input 
                        type="file" 
                        accept={greetingType === 'image' ? 'image/*' : 'video/*'} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setGreetingMediaUrl(URL.createObjectURL(file));
                        }} 
                        className="text-[13px] text-[#050505] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[13px] file:font-semibold file:bg-[#E7F3FF] file:text-[#1877F2] hover:file:bg-[#DBE7F2] cursor-pointer"
                      />
                    </div>
                  )}

                  <label className="block text-[12px] font-bold text-[#65676B] mb-1">Text</label>
                  <div className="border border-[#CED0D4] rounded-md relative overflow-hidden focus-within:border-[#1877F2] transition bg-[#F5F6F8]">
                    <textarea 
                      value={msgGreeting} 
                      onChange={(e) => setMsgGreeting(e.target.value)}
                      className="w-full p-3 pr-14 text-[14px] text-[#050505] bg-transparent outline-none min-h-[85px] resize-none"
                    />
                    <div className="absolute right-2 bottom-2 text-[#65676B] flex gap-3 text-[16px]">
                       <span onClick={() => setMsgGreeting(prev => prev + " 😊")} className="cursor-pointer hover:text-[#050505] select-none">☻</span>
                       <span onClick={() => setMsgGreeting(prev => prev + " {{customer_name}}")} className="cursor-pointer hover:text-[#050505] select-none">👤</span>
                    </div>
                  </div>

                  {/* 🌟 មុខងារ Include images from ad (Ad Selection) */}
                  <div className="mt-4 border border-[#CED0D4] rounded-md p-3 bg-white">
                    <label className="flex items-start gap-2 cursor-pointer mb-3">
                      <input 
                        type="checkbox" 
                        checked={includeAdImages} 
                        onChange={(e) => setIncludeAdImages(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-[#1877F2] border-[#CED0D4] rounded focus:ring-[#1877F2] cursor-pointer" 
                      />
                      <span className="text-[13px] text-[#050505] font-semibold">Include images from your ad and optional automated response <span className="text-[#65676B] font-normal cursor-help" title="Info">ⓘ</span></span>
                    </label>

                    {includeAdImages && (
                      <div className="pl-6 border-l-2 border-[#E4E6EB] ml-2 pb-1">
                        <label className="block font-bold text-[12px] text-[#050505] mb-1">Button <span className="text-[#65676B] font-normal cursor-help">ⓘ</span></label>
                        <div className="relative w-full mb-4">
                          <select 
                            value={adButtonText}
                            onChange={(e) => setAdButtonText(e.target.value)}
                            className="w-full border border-[#CED0D4] rounded-md p-2 outline-none bg-white text-[13px] text-[#050505] cursor-pointer appearance-none focus:border-[#1877F2]"
                          >
                            <option value="Ask for availability">Ask for availability</option>
                            <option value="Learn more">Learn more</option>
                            <option value="Shop now">Shop now</option>
                            <option value="Get offer">Get offer</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[#65676B] pointer-events-none text-[12px]">▼</span>
                        </div>

                        <label className="block font-bold text-[12px] text-[#050505] mb-1">Automated Response (Optional)</label>
                        <div className="relative border border-[#CED0D4] rounded-md overflow-hidden focus-within:border-[#1877F2] transition bg-[#F5F6F8]">
                          <textarea 
                            value={adAutoResponse} 
                            onChange={(e) => setAdAutoResponse(e.target.value)}
                            rows={2} 
                            className="w-full p-2.5 pr-14 text-[13px] text-[#050505] bg-transparent outline-none resize-none" 
                          />
                          <div className="absolute right-2 bottom-2 text-[#65676B] flex gap-3 text-[16px]">
                             <span onClick={() => setAdAutoResponse(prev => prev + " 😊")} className="cursor-pointer hover:text-[#050505] select-none">☻</span>
                             <span onClick={() => setAdAutoResponse(prev => prev + " {{customer_name}}")} className="cursor-pointer hover:text-[#050505] select-none">👤</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Phone Number Section */}
                <div className="border-t border-[#CED0D4] pt-5">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-[14px] text-[#050505]">Include phone number</h3>
                    <div onClick={() => setIsPhoneEnabled(!isPhoneEnabled)} className={`w-10 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors ${isPhoneEnabled ? 'bg-[#1877F2]' : 'bg-[#BEC3C9]'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isPhoneEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#65676B]">Show your business phone number so that people can call you.</p>
                </div>

                {/* 3. Customer Actions Section */}
                <div className="border-t border-[#CED0D4] pt-5">
                  <h3 className="font-bold text-[14px] text-[#050505] mb-1">Customer actions ⓘ</h3>
                  <p className="text-[13px] text-[#65676B] mb-3">Suggest up to 5 questions or replies for customers to tap, or use a button to send people to your site.</p>
                  
                  {/* Action Dropdown Menu */}
                  <div className="relative w-[240px] mb-4">
                    <div onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)} className="border border-[#CED0D4] rounded-md p-2.5 flex justify-between items-center cursor-pointer bg-white text-[14px] font-semibold text-[#050505] shadow-sm hover:bg-slate-50 transition">
                      <span>{selectedActionType}</span>
                      <span className={`text-[12px] text-[#65676B] transition-transform duration-200 ${isActionDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    {isActionDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#CED0D4] rounded-md shadow-lg z-20 py-1 overflow-hidden">
                        {['Frequently asked questions', 'Quick replies', 'Buttons'].map((type, idx) => (
                          <div key={idx} onClick={() => { setSelectedActionType(type); setIsActionDropdownOpen(false); }} className="px-3.5 py-2 text-[14px] text-[#050505] hover:bg-[#E7F3FF] hover:text-[#1877F2] cursor-pointer font-medium transition">{type}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Questions List */}
                  <div className="flex flex-col gap-4">
                    {msgQuestions.map((q, index) => (
                      <div key={index} className="bg-[#F5F6F8] p-4 rounded-md border border-[#CED0D4] relative group">
                        <button type="button" onClick={() => handleRemoveQuestion(index)} className="absolute right-3 top-3 text-[#65676B] hover:text-[#050505] text-[18px] leading-none">&times;</button>
                        
                        <label className="block font-bold text-[12px] text-[#050505] mb-1">Question #{index + 1}</label>
                        <div className="relative border border-[#CED0D4] rounded-md bg-white overflow-hidden mb-4 focus-within:border-[#1877F2] transition">
                           <input type="text" value={q.q} onChange={(e) => handleQuestionChange(index, e.target.value)} className="w-full p-2 pr-12 text-[14px] text-[#050505] outline-none" placeholder="Add a question..." />
                           <span className="absolute right-3 top-2 text-[#65676B] text-[12px]">{q.q.length}/80</span>
                        </div>
                        
                        <label className="block font-bold text-[12px] text-[#050505] mb-1">Automated response <span className="font-normal text-[#65676B]">· Optional</span></label>
                        <div className="relative border border-[#CED0D4] rounded-md bg-white overflow-hidden mb-4 focus-within:border-[#1877F2] transition">
                           <textarea value={q.a} onChange={(e) => handleAutoResponseChange(index, e.target.value)} rows={2} className="w-full p-2 pr-14 text-[14px] text-[#050505] outline-none resize-none" placeholder="Enter the answer to this question." />
                           <div className="absolute right-2 bottom-2 text-[#65676B] flex gap-3 text-[16px]">
                              <span onClick={() => { const updated = [...msgQuestions]; updated[index].a += " 😊"; setMsgQuestions(updated); }} className="cursor-pointer hover:text-[#050505] select-none">☻</span>
                              <span onClick={() => { const updated = [...msgQuestions]; updated[index].a += " {{customer_name}}"; setMsgQuestions(updated); }} className="cursor-pointer hover:text-[#050505] select-none">👤</span>
                           </div>
                        </div>

                        <label className="block font-bold text-[12px] text-[#050505] mb-1">Attachments <span className="font-normal text-[#65676B]">· Optional</span></label>
                        <div className="relative w-full">
                          <select className="w-full border border-[#CED0D4] rounded-md p-2 outline-none bg-white text-[14px] text-[#050505] cursor-pointer appearance-none focus:border-[#1877F2]">
                            <option>None</option>
                            <option>Image</option>
                            <option>Video</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[#65676B] pointer-events-none text-[12px]">▼</span>
                        </div>
                      </div>
                    ))}
                    {msgQuestions.length < 5 && (
                      <button type="button" onClick={handleAddQuestion} className="text-[#1877F2] text-[14px] font-semibold hover:underline flex items-center gap-1 self-start mt-1">+ Add a question</button>
                    )}
                  </div>
                </div>

                {/* 4. Follow-up Message Section */}
                <div className="border-t border-[#CED0D4] pt-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[14px] text-[#050505]">Follow-up message</h3>
                      <p className="text-[13px] text-[#65676B] pr-6">Follow up with potential high-intent customers who tapped on your ad but haven't sent a message after approximately 1 day.</p>
                    </div>
                    <div onClick={() => setIsFollowUpEnabled(!isFollowUpEnabled)} className={`w-10 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors mt-1 ${isFollowUpEnabled ? 'bg-[#1877F2]' : 'bg-[#BEC3C9]'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isFollowUpEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  
                  {isFollowUpEnabled && (
                    <div className="mt-3 bg-[#F5F6F8] p-4 rounded-md border border-[#CED0D4]">
                       <label className="block font-bold text-[12px] text-[#050505] mb-1">Text</label>
                       <div className="relative border border-[#CED0D4] rounded-md bg-white overflow-hidden focus-within:border-[#1877F2] transition">
                          <textarea value={msgFollowUp} onChange={(e) => setMsgFollowUp(e.target.value)} rows={3} className="w-full p-2 pr-14 text-[14px] text-[#050505] outline-none resize-none" />
                          <div className="absolute right-2 top-2 text-[#65676B] flex gap-3 text-[16px]">
                             <span onClick={() => setMsgFollowUp(prev => prev + " 😊")} className="cursor-pointer hover:text-[#050505] select-none">☻</span>
                             <span onClick={() => setMsgFollowUp(prev => prev + " {{customer_name}}")} className="cursor-pointer hover:text-[#050505] select-none">👤</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* 5. Template Name */}
                <div className="border-t border-[#CED0D4] pt-5 pb-4">
                   <h3 className="font-bold text-[14px] text-[#050505] mb-2">Template name</h3>
                   <div className="relative border border-[#CED0D4] rounded-md bg-white overflow-hidden focus-within:border-[#1877F2] transition">
                      <input type="text" value={msgTemplateName} onChange={(e) => setMsgTemplateName(e.target.value)} className="w-full p-2 pr-12 text-[14px] text-[#050505] outline-none" />
                      <span className="absolute right-3 top-2 text-[#65676B] text-[12px]">{msgTemplateName.length}/80</span>
                   </div>
                </div>

              </div>

              {/* Right Panel: Messenger Live Interactive Preview */}
              <div className="w-1/2 p-6 bg-[#F0F2F5] flex flex-col items-center justify-start relative overflow-y-auto">
                 
                 {/* Mobile Device Frame */}
                 <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col font-sans border border-[#E4E6EB] mt-4">
                    
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
                      <div className="flex items-center gap-2.5 min-w-0">
                         <div className="relative shrink-0">
                           {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-8 h-8 rounded-full object-cover border border-slate-100" /> : <div className="w-8 h-8 bg-slate-200 rounded-full"></div>}
                           <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31A24C] border-[1.5px] border-white rounded-full"></div>
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[13px] text-[#050505] leading-tight flex items-center gap-1 truncate">
                               {selectedPageData?.name || "Page Name"}
                               <svg className="w-3.5 h-3.5 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            </span>
                            <span className="text-[#65676B] text-[11.5px]">Business chat</span>
                         </div>
                      </div>
                      <div className="flex gap-4 text-[#1877F2] text-[18px] shrink-0 items-center">
                         {isPhoneEnabled && <span className="cursor-pointer">📞</span>}
                         <span className="cursor-pointer">📹</span>
                      </div>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 bg-white p-3 flex flex-col gap-3 h-[450px] overflow-y-auto">
                      <p className="text-center text-[10px] text-[#65676B] mb-2 leading-relaxed px-4">
                        You opened this conversation through an ad. When you reply, {selectedPageData?.name || "the business"} will be able to see your public info and which ad you clicked.
                      </p>
                      
                      {/* Greeting Message Bubble */}
                      <div className="flex items-end gap-2 mt-1">
                         {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-6 h-6 rounded-full object-cover shrink-0" /> : <div className="w-6 h-6 bg-slate-200 rounded-full shrink-0"></div>}
                         <div className="flex flex-col gap-1.5 max-w-[80%]">
                           <div className="bg-[#E4E6EB] text-[#050505] text-[13.5px] px-3.5 py-2.5 rounded-2xl rounded-bl-sm leading-[1.4] break-words whitespace-pre-wrap">
                              {msgGreeting ? (
                                msgGreeting.includes('{{customer_name}}') ? 
                                  <span>Hi <span className="bg-[#D8DADF] px-1.5 py-0.5 rounded text-[#050505] mx-0.5">Seng</span>{msgGreeting.split('{{customer_name}}')[1]}</span> 
                                  : msgGreeting
                              ) : "..."}
                           </div>
                           
                           {/* Greeting Uploaded Media */}
                           {greetingType !== 'text' && greetingMediaUrl && (
                             <div className="rounded-xl overflow-hidden border border-[#CED0D4]">
                               {greetingType === 'image' ? (
                                 <img src={greetingMediaUrl} alt="Media" className="w-full h-auto object-cover max-h-[160px]" />
                               ) : (
                                 <video src={greetingMediaUrl} className="w-full h-auto object-cover max-h-[160px]" controls />
                               )}
                             </div>
                           )}
                         </div>
                      </div>

                      {/* 🌟 Live Preview: Ad Image Carousel Card */}
                      {includeAdImages && (
                        <div className="mt-1 w-[85%] self-end bg-white border border-[#CED0D4] rounded-xl overflow-hidden shadow-sm relative group cursor-pointer">
                          <div className="h-[140px] flex w-full relative">
                            <div className="w-1/2 bg-black flex items-center justify-center overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80" className="object-cover h-full w-full opacity-90" alt="Ad 1" />
                            </div>
                            <div className="w-1/2 bg-black flex items-center justify-center overflow-hidden border-l border-white/20">
                                <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&q=80" className="object-cover h-full w-full opacity-90" alt="Ad 2" />
                            </div>
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center">
                               <span className="text-[#050505] text-[10px] ml-0.5">▶</span>
                            </div>
                          </div>
                          <div className="p-3 text-center border-t border-[#CED0D4] hover:bg-slate-50 transition">
                            <span className="text-[14px] text-[#050505] font-semibold block truncate">{adButtonText}</span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Chat History */}
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`flex flex-col gap-2 mt-2 ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                          {chat.sender === 'user' ? (
                            <div className="bg-[#0084FF] text-white text-[13.5px] px-3.5 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] break-words">{chat.text}</div>
                          ) : (
                            <div className="flex items-end gap-2.5">
                              {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-6 h-6 rounded-full object-cover shrink-0" /> : <div className="w-6 h-6 bg-slate-200 rounded-full shrink-0"></div>}
                              <div className="bg-[#E4E6EB] text-[#050505] text-[13.5px] px-3.5 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%] break-words">{chat.text}</div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Question Chips */}
                      <div className="flex flex-col gap-2 mt-3 items-end w-full pb-2">
                         {msgQuestions.filter(q => q.q.trim() !== "").map((q, idx) => (
                           <div key={idx} onClick={() => {
                               const newHistory = [...chatHistory, { sender: 'user', text: q.q }];
                               setChatHistory(newHistory);
                               setTimeout(() => { setChatHistory([...newHistory, { sender: 'bot', text: q.a || "Thanks for reaching out! We'll get back to you shortly." }]); }, 500);
                             }} className="border-[1.5px] border-[#1877F2] text-[#1877F2] font-semibold text-[13px] px-4 py-1.5 rounded-full max-w-[85%] text-center cursor-pointer hover:bg-[#F0F8FF] break-words shadow-sm">
                              {q.q}
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Footer Input */}
                   <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-3 text-[#1877F2]">
                      <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                      <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/></svg>
                      <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
                      <div className="flex-1 bg-[#F0F2F5] h-[34px] rounded-full px-3 flex items-center text-[13px] text-[#65676B]">Aa</div>
                      <svg className="w-5 h-5 cursor-pointer text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                   </div>
                 </div>
                 <div className="mt-4 text-[#65676B] text-[12px]">This message may look different across devices.</div>
              </div>

            </div>

            {/* Modal Footer (មានផ្ទុកប៊ូតុង Save ដែលតភ្ជាប់ជាមួយ API ត្រឹមត្រូវ) */}
            <div className="p-4 border-t border-[#CED0D4] flex justify-end items-center bg-white z-10">
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditingConversations(false)} 
                  className="px-5 py-2 border border-[#CED0D4] rounded-md font-semibold text-[14px] text-[#050505] hover:bg-[#F0F2F5] transition"
                >
                  Cancel
                </button>
                
                <button 
                  type="button" 
                  onClick={handleSaveToFacebook} 
                  disabled={isSavingToFb}
                  className="px-8 py-2 rounded-md font-semibold text-[14px] text-white bg-[#1877F2] hover:bg-[#166FE5] transition shadow-sm disabled:opacity-50 flex items-center gap-2 justify-center min-w-[100px]"
                >
                  {isSavingToFb ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 Create Post Modal (រចនាថ្មី ដូច Facebook 100%) */}
      {/* ============================================== */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col scale-100 transition-transform">
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 relative">
              <div className="w-8"></div>
              <h3 className="font-bold text-[17px] text-slate-800">បង្កើត Post ថ្មី</h3>
              <button 
                onClick={() => { setIsCreatePostOpen(false); setSelectedFile(null); setPreviewUrl(""); setNewPostImage(""); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Profile Context */}
              <div className="flex items-center gap-3">
                {selectedPageData?.picture?.data?.url ? (
                  <img src={selectedPageData.picture.data.url} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="Page Profile" />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                )}
                <div className="flex flex-col">
                   <div className="font-bold text-[14px] text-slate-800 leading-tight">{selectedPageData?.name || "Page Name"}</div>
                   <div className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 mt-0.5 w-fit">
                     🌎 Public <span className="text-[8px]">▼</span>
                   </div>
                </div>
              </div>

              {/* Text Area */}
              <textarea 
                rows={3}
                value={newPostMessage}
                onChange={(e) => setNewPostMessage(e.target.value)}
                placeholder="តើអ្នកកំពុងគិតអ្វី? (What's on your mind?)"
                className="w-full text-[16px] text-slate-800 outline-none resize-none placeholder-slate-400 mt-2"
              />

              {/* 🌟 ផ្ទាំងបង្ហាញរូបភាព ឬវីដេអូដែលបានជ្រើសរើស */}
              {previewUrl && (
                <div className="relative mt-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  {selectedFile?.type.startsWith("video/") ? (
                    <video src={previewUrl} controls className="w-full max-h-[250px] object-contain rounded-md" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full max-h-[250px] object-contain rounded-md" />
                  )}
                  <button 
                    onClick={() => { setPreviewUrl(""); setSelectedFile(null); }} 
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* បង្ហាញរូបពី Link ប្រសិនបើមាន */}
              {!previewUrl && newPostImage && (
                <div className="relative mt-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <img src={newPostImage} alt="Preview Link" className="w-full max-h-[250px] object-contain rounded-md" />
                  <button 
                    onClick={() => setNewPostImage("")} 
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 🌟 Input លាក់សម្រាប់ Upload File */}
              <input 
                type="file" 
                id="media-upload" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    setNewPostImage(""); 
                  }
                }}
              />

              {/* Add to your post Bar */}
              <div className="border border-slate-300 rounded-lg p-2.5 flex items-center justify-between shadow-sm mt-2">
                <span className="text-[14px] font-bold text-slate-700 ml-2">Add to your post</span>
                <div className="flex gap-1">
                   <button 
                     onClick={() => document.getElementById('media-upload')?.click()} 
                     className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-[#45BD62] text-[22px]" 
                     title="Add Media from computer"
                   >
                     🖼️
                   </button>
                   <button 
                     onClick={() => { const url = prompt("សូមបញ្ចូលតំណភ្ជាប់មេឌៀ (URL):"); if(url) setNewPostImage(url); }} 
                     className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-[#1877F2] text-[22px]" 
                     title="Add Media from Link"
                   >
                     🔗
                   </button>
                   <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-[#F7B928] text-[22px] cursor-pointer">😊</button>
                   <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-[#F5533D] text-[22px] cursor-pointer">📍</button>
                </div>
              </div>

            </div>

            {/* Footer Publish Button (ប្តូរទៅជា Save Draft) */}
            <div className="px-4 pb-4">
              <button 
                type="button"
                disabled={(!newPostMessage && !selectedFile && !newPostImage)}
                onClick={() => {
                   // 🌟 បង្កើត Draft ID
                   const draftId = `draft_${Date.now()}`;
                   const newDraft = {
                     id: draftId,
                     message: newPostMessage,
                     full_picture: previewUrl || newPostImage,
                     file: selectedFile, // រក្សា File ទុកសម្រាប់ Upload ពេលចុច Publish ធំ
                     isDraft: true, // Mark ជា Draft
                     created_time: new Date().toISOString(),
                     likesCount: 0,
                     commentsCount: 0,
                     sharesCount: 0
                   };
                   
                   // បញ្ចូលទៅក្នុង State Posts (List ក្នុង Modal ជ្រើសរើស Post)
                   setPosts([newDraft, ...posts]);
                   setSelectedPost(draftId);
                   localStorage.setItem("selectedPost", draftId);
                   
                   setIsCreatePostOpen(false);
                   setNewPostMessage("");
                   setNewPostImage("");
                   setSelectedFile(null);
                   setPreviewUrl("");
                   alert("✅ បានរក្សាទុក (Save) Post ជា Draft ក្នុងតារាងរួចរាល់! សូមបន្តរៀបចំការ Boost រួចចុច Publish នៅខាងក្រោមបង្អស់។");
                }}
                className="w-full py-2.5 rounded-lg bg-[#1877F2] text-white text-[15px] font-bold hover:bg-blue-600 transition shadow-sm disabled:opacity-50 disabled:bg-[#E4E6EB] disabled:text-[#BCC0C4]"
              >
                Save Post
              </button>
            </div>

          </div>
        </div>
      )}

      

    {/* 🌟 ផ្ទាំង Loading & Success Modal */}
      {(loading || isSuccessModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 transform transition-transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            
            {loading ? (
              <>
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#1877F2] border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#1877F2] text-xl">🚀</span>
                  </div>
                </div>
                <h3 className="text-[18px] font-bold text-slate-800 mb-2">កំពុងបញ្ជូនទិន្នន័យ...</h3>
                <p className="text-[13px] text-slate-500 text-center leading-relaxed">
                  ប្រព័ន្ធកំពុងរៀបចំ Campaign និងភ្ជាប់ទៅកាន់<br />
                  <strong className="text-slate-700">Facebook Ads Manager</strong><br />
                  សូមមេត្តារង់ចាំបន្តិច...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner">
                  ✓
                </div>
                <h3 className="text-[18px] font-bold text-slate-800 mb-2">ជោគជ័យយ៉ាងរលូន!</h3>
                <p className="text-[13px] text-slate-500 text-center leading-relaxed mb-6">
                  យុទ្ធនាការផ្សាយពាណិជ្ជកម្មរបស់អ្នកត្រូវបានបង្កើត និងបញ្ជូនចូលទៅកាន់ <strong className="text-slate-700">Ads Manager</strong> ដោយជោគជ័យ។
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModal(false);
                    setActiveTab("MANAGE");
                  }}
                  className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-[15px] transition shadow-md cursor-pointer"
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 ផ្ទាំង Pop-up សម្រាប់ Quick Edit (ស្តង់ដារ Facebook & Responsive) */}
      {/* ============================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col transform transition-all ${theme === 'dark' ? 'bg-[#242526] border border-slate-700' : 'bg-white border border-slate-100'}`}>
            
            <div className={`px-5 py-3.5 border-b flex justify-between items-center sticky top-0 z-10 ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <h2 className={`font-bold text-base sm:text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">✏️</span> កែប្រែយុទ្ធនាការរហ័ស
              </h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[22px] leading-none text-slate-400 hover:text-red-500 cursor-pointer p-1">&times;</button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
              <div>
                <label className={`block text-[13px] sm:text-[14px] font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>១. ចំណងជើងយុទ្ធនាការ (Campaign Name)</label>
                <input type="text" value={editCampaignName} onChange={(e) => setEditCampaignName(e.target.value)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold text-sm ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>

              <div>
                <label className={`block text-[13px] sm:text-[14px] font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>២. ថវិកា (Budget)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 font-bold text-slate-500">$</span>
                  <input type="number" min="1" step="0.5" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className={`w-full border rounded-xl p-3 pl-8 outline-none focus:border-blue-500 font-bold text-sm sm:text-[15px] ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                </div>
              </div>

              <div className={`p-3.5 sm:p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <label className={`block text-[13px] sm:text-[14px] font-bold mb-2.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>៣. កាលវិភាគ (Schedule)</label>
                 <div className="flex flex-col gap-3">
                    <div className="flex-1">
                       <span className="block text-[11px] mb-1 text-slate-500 font-bold uppercase">ថ្ងៃចាប់ផ្តើម (Start)</span>
                       <input type="datetime-local" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className={`w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 text-xs sm:text-[13.5px] cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`} />
                    </div>
                    <div className="flex-1">
                       <span className="block text-[11px] mb-1 text-[#1877F2] font-bold uppercase">ថ្ងៃបញ្ចប់ (End)</span>
                       <input type="datetime-local" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] text-xs sm:text-[13.5px] font-bold cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-[#1877F2]/50 text-white' : 'bg-white border-[#1877F2]/30 text-slate-900'}`} />
                    </div>
                 </div>
              </div>
            </div>

            <div className={`p-4 border-t flex flex-row justify-end gap-2.5 sticky bottom-0 z-10 ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-[14px] border transition cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-[#18191A]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>បោះបង់</button>
              <button type="button" onClick={handleSaveQuickEdit} disabled={isSavingEdit || !editCampaignName} className="px-6 sm:px-8 py-2.5 rounded-xl font-bold text-xs sm:text-[14px] text-white bg-[#1877F2] hover:bg-[#166FE5] shadow-sm disabled:opacity-50 cursor-pointer">
                {isSavingEdit ? 'កំពុងរក្សាទុក...' : '✓ រក្សាទុក'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 Custom Reset Placements Modal (ទំនើប និងស្អាត) */}
      {/* ============================================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 transform transition-all scale-100 ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0 font-bold">
                🔄
              </div>
              <div>
                <h3 className="font-bold text-base">កំណត់ឡើងវិញ (Restart)</h3>
                <p className="text-xs text-slate-400">តើបងចង់សម្រេចចិត្តកំណត់ Placements ឡើងវិញមែនទេ?</p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed mb-6 p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              សកម្មភាពនេះនឹងលុបការកំណត់ Manual Placements ទាំងអស់ ហើយទម្លាក់វាឱ្យត្រឡប់ទៅទម្រង់ដើម (Default) វិញភ្លាមៗ។
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsResetModalOpen(false)} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                បោះបង់
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  // 1. លុបទិន្នន័យចេញពី localStorage
                  localStorage.removeItem("placementType");
                  localStorage.removeItem("platforms");
                  localStorage.removeItem("detailedPlacements");
                  localStorage.removeItem("deviceType");

                  // 2. កំណត់តម្លៃដើម (Default States) មកវិញ
                  setPlacementType("ADVANTAGE");
                  setDeviceType("MOBILE"); 
                  setPlatforms({
                    facebook: true, 
                    instagram: false, 
                    audienceNetwork: false, 
                    messenger: true, 
                    whatsapp: false, 
                    threads: false
                  });
                  setDetailedPlacements({
                    fb_feed: true, fb_profile: true, ig_feed: true, ig_profile: true, fb_marketplace: true, fb_right_col: true, ig_explore: true, fb_business: true, threads_feed: true, fb_notifications: true,
                    ig_stories: true, fb_stories: true, msg_stories: true, ig_reels: true, fb_reels: true, wa_status: false,
                    instream_reels: true, fb_reels_ads: true,
                    fb_search: true, ig_search: true,
                    wa_messages: false,
                    an_native: true, an_rewarded: true
                  });

                  // 3. បិទ Modal ភ្លាម (គ្មាន alert មកខ្វល់ខ្វាយទៀតទេ)
                  setIsResetModalOpen(false);
                }} 
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-sm cursor-pointer"
              >
                យល់ព្រម (OK)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 1. ផ្ទាំង Duplicate Ad Modal (Z-Index: 50) */}
      {/* ============================================== */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          {/* 🌟 កែប្រែត្រង់នេះ៖ បន្ថែម max-h-[90vh] និង overflow-y-auto ដើម្បីឱ្យវាមាន Scrollbar អូសចុះអូសឡើង និងមិនបាត់ប៊ូតុង */}
          <div className={`rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all custom-scrollbar ${theme === 'dark' ? 'bg-[#242526] border border-slate-700 text-white' : 'bg-white border border-slate-100 text-slate-900'}`}>
            
            {/* Header */}
            <div className={`px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20 ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <h2 className="font-bold text-lg flex items-center gap-2.5">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">📄</span> Duplicate & Edit Ad
              </h2>
              <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className="text-[24px] leading-none text-slate-400 hover:text-red-500 cursor-pointer">&times;</button>
            </div>

            {/* Body Content */}
            <div className="p-6 flex flex-col gap-6">
              <div>
                <label className="block text-[14px] font-bold mb-2">Ad name (ឈ្មោះការផ្សាយ)</label>
                <input type="text" value={duplicateAdName} onChange={(e) => setDuplicateAdName(e.target.value)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>

              {/* Ad Creative Preview (ដែលយើងទើបតែធ្វើឱ្យធំស្អាត) */}
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <label className="block text-[14px] font-bold mb-3">Ad creative (ជ្រើសរើស Post ថ្មី)</label>
                
                {/* 🌟 ប្រអប់ Preview Post ធំពេញទម្រង់ */}
                <div className={`w-full border rounded-2xl overflow-hidden mb-4 shadow-sm ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                  
                  {/* Header Page */}
                  <div className="p-3.5 flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      {selectedPageData?.picture?.data?.url ? (
                        <img src={selectedPageData.picture.data.url} className="w-9 h-9 rounded-full object-cover border" alt="Page Logo" />
                      ) : (
                        <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">f</div>
                      )}
                      <div>
                        <div className="font-bold text-[13px] leading-tight">{selectedPageData?.name || fbPageName || "Page Name"}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">Sponsored ● 🌎</div>
                      </div>
                    </div>
                    <span className="text-slate-400 font-bold">...</span>
                  </div>

                  {/* Message */}
                  <div className="px-3.5 pb-2 text-[13px] line-clamp-3 leading-snug">
                    {posts.find(p => p.id === duplicatePostId)?.message || posts.find(p => p.id === duplicatePostId)?.story || "[គ្មានអត្ថបទបង្ហាញ ឬមិនទាន់ជ្រើសរើស Post]"}
                  </div>

                  {/* Media */}
                  {(() => {
                    const matchedPost = posts.find(p => p.id === duplicatePostId);
                    if (!matchedPost) return <div className="w-full h-[180px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">គ្មានរូបភាព</div>;

                    const subAtts = matchedPost.attachments?.data?.[0]?.subattachments?.data;
                    if (subAtts && subAtts.length > 0) {
                      return (
                        <div className="grid grid-cols-2 gap-0.5 w-full max-h-[260px] overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                          {subAtts.slice(0, 3).map((sub: any, idx: number) => (
                            <img key={idx} src={sub.media?.image?.src || matchedPost.full_picture} className="w-full h-[125px] object-cover" alt="Sub" />
                          ))}
                          {subAtts.length > 3 ? (
                            <div className="relative w-full h-[125px]">
                              <img src={subAtts[3].media?.image?.src || matchedPost.full_picture} className="w-full h-full object-cover brightness-75" alt="Extra" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-xl">
                                +{subAtts.length - 3}
                              </div>
                            </div>
                          ) : (
                            subAtts[2] && <img src={subAtts[2].media?.image?.src} className="w-full h-[125px] object-cover" alt="Img 3" />
                          )}
                        </div>
                      );
                    } else if (matchedPost.full_picture) {
                      return <img src={matchedPost.full_picture} className="w-full object-cover max-h-[260px]" alt="Full picture" />;
                    } else {
                      return <div className="w-full h-[160px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">No Image</div>;
                    }
                  })()}

                  {/* Messenger Bar */}
                  <div className="px-3.5 py-2.5 flex justify-between items-center bg-[#F0F2F5] dark:bg-[#3A3B3C]">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500">CHAT IN MESSENGER</span>
                      <span className="font-bold text-[13px]">Send message</span>
                    </div>
                    <button type="button" className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E4E6EB] text-[#050505] dark:bg-[#4E4F50] dark:text-white">Send</button>
                  </div>

                  {/* Footer Stats */}
                  <div className="px-3.5 py-2 flex justify-between text-[12px] border-t border-slate-200 dark:border-slate-700 text-slate-500">
                    <div className="flex gap-4 font-semibold">
                      <span>👍 {posts.find(p => p.id === duplicatePostId)?.likesCount || 0}</span>
                      <span>💬 {posts.find(p => p.id === duplicatePostId)?.commentsCount || 0}</span>
                      <span>⤴️ {posts.find(p => p.id === duplicatePostId)?.sharesCount || 0}</span>
                    </div>
                  </div>

                </div>

                <button 
                  type="button" 
                  onClick={() => { setPostSelectionContext('duplicate'); setIsPostMenuOpen(true); }} 
                  className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition shadow-md cursor-pointer"
                >
                  <span className="text-lg leading-none mb-0.5">📄</span> Select new post
                </button>
              </div>
            </div>

            {/* Footer Buttons (ប៊ូតុងបោះបង់ និង Duplicate ដាក់ជាប់ស្អិតខាងក្រោម មាន z-20 មិនឱ្យបាត់) */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 sticky bottom-0 z-20 shadow-md ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className={`px-5 py-2.5 rounded-xl font-bold text-[14px] border transition cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-[#18191A]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>បោះបង់</button>
              <button type="button" onClick={executeDuplicate} className="px-8 py-2.5 rounded-xl font-bold text-[14px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {isDuplicating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Duplicating...</> : '📄 Duplicate Ad'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 Modal សម្រាប់កែប្រែព័ត៌មានអតិថិជន (Edit Client Modal) */}
      {/* 🌟 Modal សម្រាប់កែប្រែព័ត៌មានអតិថិជន (Edit Client Modal) */}
      {isEditClientModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            
            <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-slate-700">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>✏️</span> កែប្រែព័ត៌មានអតិថិជន
              </h3>
              <button onClick={() => setIsEditClientModalOpen(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-500 uppercase">ឈ្មោះអតិថិជន / ហាង</label>
                <input 
                  type="text" 
                  value={editClientName} 
                  onChange={(e) => setEditClientName(e.target.value)} 
                  required 
                  className={`w-full p-3 rounded-xl border text-sm outline-none font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500 uppercase">អ៊ីមែល (Email)</label>
                <input 
                  type="email" 
                  value={editClientEmail} 
                  onChange={(e) => setEditClientEmail(e.target.value)} 
                  required 
                  className={`w-full p-3 rounded-xl border text-sm outline-none font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500 uppercase">លេខសម្ងាត់ (Password)</label>
                <input 
                  type="text" 
                  value={editClientPassword} 
                  onChange={(e) => setEditClientPassword(e.target.value)} 
                  required 
                  className={`w-full p-3 rounded-xl border text-sm outline-none font-bold text-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-blue-400' : 'bg-white border-slate-300 text-blue-600'}`} 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-500 uppercase">លេខទូរស័ព្ទ (Phone)</label>
                <input 
                  type="text" 
                  value={editClientPhone} 
                  onChange={(e) => setEditClientPhone(e.target.value)} 
                  className={`w-full p-3 rounded-xl border text-sm outline-none font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-500 uppercase">កញ្ចប់សេវា</label>
                  <input 
                    type="text" 
                    value={editPackageName} 
                    onChange={(e) => setEditPackageName(e.target.value)} 
                    className={`w-full p-3 rounded-xl border text-sm outline-none font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500 uppercase">ទឹកប្រាក់ ($)</label>
                  <input 
                    type="number" 
                    value={editAmountPaid} 
                    onChange={(e) => setEditAmountPaid(e.target.value)} 
                    className={`w-full p-3 rounded-xl border text-sm outline-none font-bold text-emerald-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                  />
                </div>
              </div>

              {/* 🌟 ផ្នែកបន្ថែមថ្មី៖ ប្រអប់សារ៉េថ្ងៃខែចាប់ផ្តើម និងថ្ងៃខែផុតកំណត់ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-500 uppercase">ថ្ងៃខែចាប់ផ្តើម (Start Date)</label>
                  <input 
                    type="date" 
                    value={editStartDate} 
                    onChange={(e) => setEditStartDate(e.target.value)} 
                    className={`w-full p-3 rounded-xl border text-sm outline-none font-medium cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500 uppercase">ថ្ងៃខែផុតកំណត់ (Expiry Date)</label>
                  <input 
                    type="date" 
                    value={editExpiryDate} 
                    onChange={(e) => setEditExpiryDate(e.target.value)} 
                    className={`w-full p-3 rounded-xl border text-sm outline-none font-bold text-red-500 cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditClientModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition cursor-pointer"
                >
                  ✓ រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🌟 Mobile Bottom Navigation Bar (Floating Puffy & Rounded Style) */}
      <nav className={`md:hidden fixed bottom-3 left-4 right-4 z-[99999] flex justify-around items-center h-[64px] px-3 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#242526]/95 border border-slate-700/60 text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)]' 
          : 'bg-white/95 border border-slate-100 text-slate-700'
      }`}>
         
         {/* Tab 1: Create */}
         <button 
            type="button"
            onClick={() => handleTabChange("CREATE")}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 cursor-pointer group`}
         >
            <div className={`px-4 py-1 rounded-[20px] flex items-center justify-center transition-all duration-300 ${
               activeTab === "CREATE" 
                  ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)] scale-105' 
                  : 'hover:bg-slate-500/10'
            }`}>
               <span className="text-[18px] leading-none">📝</span>
            </div>
            <span className={`text-[10px] tracking-tight font-bold ${activeTab === "CREATE" ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : 'opacity-70'}`}>បង្កើត</span>
         </button>

         {/* Tab 2: Manage */}
         <button 
            type="button"
            onClick={() => handleTabChange("MANAGE")}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 cursor-pointer group`}
         >
            <div className={`px-4 py-1 rounded-[20px] flex items-center justify-center transition-all duration-300 ${
               activeTab === "MANAGE" 
                  ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)] scale-105' 
                  : 'hover:bg-slate-500/10'
            }`}>
               <span className="text-[18px] leading-none">📊</span>
            </div>
            <span className={`text-[10px] tracking-tight font-bold ${activeTab === "MANAGE" ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : 'opacity-70'}`}>គ្រប់គ្រង</span>
         </button>

         {/* Tab 3: AI Copy */}
         <button 
            type="button"
            onClick={() => handleTabChange("AI")}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 cursor-pointer group`}
         >
            <div className={`px-4 py-1 rounded-[20px] flex items-center justify-center transition-all duration-300 ${
               activeTab === "AI" 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)] scale-105' 
                  : 'hover:bg-slate-500/10'
            }`}>
               <span className="text-[18px] leading-none">✨</span>
            </div>
            <span className={`text-[10px] tracking-tight font-bold ${activeTab === "AI" ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70'}`}>AI Copy</span>
         </button>

      </nav>
      {/* 🚀 AI Audit Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>

            <div className="flex justify-between items-center border-b pb-3 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span>🤖</span> វិភាគការផ្សាយពាណិជ្ជកម្ម (AI Audit)
                </h3>
                {auditResult && !auditLoading && (
                  <button 
                    type="button"
                    onClick={() => speakKhmerText(`${auditResult.title}។ ${auditResult.analysis}។ ${auditResult.recommendation}`)}
                    className={`p-2 rounded-full border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      isSpeaking ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                    }`}
                  >
                    <span>🔊</span> <span>{isSpeaking ? "ឈប់អាន" : "ស្តាប់សំឡេង"}</span>
                  </button>
                )}
              </div>
              <button onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setIsAuditModalOpen(false); }} className="text-xl font-bold text-slate-400 hover:text-red-500 cursor-pointer">&times;</button>
            </div>

            {/* 🏷️ Source Badge: បង្ហាញច្បាស់ៗថាប្រើ Gemini Key ទីប៉ុន្មាន */}
            {auditResult && !auditLoading && auditResult.source && (
              <div className="mb-4 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span>📌</span> <span>{auditResult.source}</span>
              </div>
            )}

            {auditLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">🤖 AI កំពុងវិភាគទិន្នន័យ Ad នេះជូនបង សូមរង់ចាំបន្តិច...</p>
              </div>
            ) : auditResult ? (
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  auditResult.statusColor === 'green' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                  auditResult.statusColor === 'yellow' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                  'bg-red-500/10 border-red-500/30 text-red-500'
                }`}>
                  <div className="text-3xl">
                    {auditResult.statusColor === 'green' ? '🟢' : auditResult.statusColor === 'yellow' ? '🟡' : '🔴'}
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider opacity-80">ចំណាត់ថ្នាក់ពាណិជ្ជកម្ម</div>
                    <div className="font-bold text-base">{auditResult.title}</div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">📊 ការវិភាគស៊ីជម្រៅ៖</div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{auditResult.analysis}</p>
                </div>

                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-blue-950/20 border-blue-900/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  <div className="text-xs font-bold uppercase mb-1">💡 យោបល់ណែនាំសម្រាប់អ្នកគ្រប់គ្រង៖</div>
                  <p className="text-sm font-semibold">{auditResult.recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-red-500 font-medium">បរាជ័យក្នុងការទាញយកលទ្ធផលវិភាគ។</div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setIsAuditModalOpen(false); }} className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition cursor-pointer">
                បិទ (Close)
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ============================================== */}
      {/* 🌟 ផ្ទាំង Pop-up (Modal) ទំនើបសម្រាប់ Restart Placements */}
      {/* ============================================== */}
      {isRestartModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center transform transition-all ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            {/* Icon ព្រមាន */}
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
              🔄
            </div>

            <h3 className="text-lg font-bold mb-2">តើបងចង់ Restart ដែរឬទេ?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              សកម្មភាពនេះនឹងកំណត់ការកំណត់ Placements ទាំងអស់ឱ្យត្រឡប់ទៅទម្រង់ដើម (Default) វិញ។
            </p>

            {/* ប៊ូតុងបញ្ជា */}
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsRestartModalOpen(false)} 
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-300 hover:bg-[#4E4F50]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                បោះបង់
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  localStorage.removeItem("placementType");
                  localStorage.removeItem("platforms");
                  localStorage.removeItem("detailedPlacements");
                  localStorage.removeItem("deviceType");

                  setPlacementType("ADVANTAGE");
                  setDeviceType("MOBILE"); 
                  setPlatforms({
                    facebook: true, 
                    instagram: false, 
                    audienceNetwork: false, 
                    messenger: true, 
                    whatsapp: false, 
                    threads: false
                  });
                  setDetailedPlacements({
                    fb_feed: true, fb_profile: true, ig_feed: true, ig_profile: true, fb_marketplace: true, fb_right_col: true, ig_explore: true, fb_business: true, threads_feed: true, fb_notifications: true,
                    ig_stories: true, fb_stories: true, msg_stories: true, ig_reels: true, fb_reels: true, wa_status: false,
                    instream_reels: true, fb_reels_ads: true,
                    fb_search: true, ig_search: true,
                    wa_messages: false,
                    an_native: true, an_rewarded: true
                  });

                  setIsRestartModalOpen(false);
                  alert("🔄 បាន Restart ការកំណត់ Placements ត្រឡប់ទៅទម្រង់ដើមវិញដោយជោគជ័យ!");
                }} 
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition shadow-sm cursor-pointer"
              >
                យល់ព្រម (OK)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 🌟 Custom Modal សម្រាប់ Boost រូបភាព និង វីដេអូ */}
      {/* ============================================== */}
      {presetModalOpen !== 'none' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 transform transition-all scale-100 ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 font-bold shadow-inner ${presetModalOpen === 'photo' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                {presetModalOpen === 'photo' ? '🖼️' : '🎬'}
              </div>
              <div>
                <h3 className="font-bold text-[15px]">
                  {presetModalOpen === 'photo' ? 'កំណត់ស្តង់ដាររូបភាព' : 'កំណត់ស្តង់ដារវីដេអូ'}
                </h3>
                <p className="text-xs text-slate-400">អនុវត្តការកំណត់ Placements ស្វ័យប្រវត្តិ</p>
              </div>
            </div>

            <p className={`text-[13px] leading-relaxed mb-6 p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              តើបងពិតជាចង់រៀបចំការកំណត់ស្តង់ដារពិសេសសម្រាប់ <strong>{presetModalOpen === 'photo' ? 'ការ Boost រូបភាព' : 'ការ Boost វីដេអូ'}</strong> នេះមែនទេ?
            </p>

            <div className="flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setPresetModalOpen('none')} 
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer border ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              >
                បោះបង់
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  if (presetModalOpen === 'photo') {
                    handleBoostPhotos();
                  } else {
                    handleBoostVideos();
                  }
                }} 
                className={`px-6 py-2.5 rounded-xl text-[13px] font-bold text-white transition shadow-md cursor-pointer ${presetModalOpen === 'photo' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                យល់ព្រម (OK)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 Custom Error Modal: ពេលចុច OK វានឹងបើកផ្ទាំង Meta Ads Manager ដូចរូបភាពទី ២ */}
      {customError && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
              ⚠️
            </div>

            <h3 className="text-lg font-bold mb-2">តម្រូវឱ្យកែសម្រួលការផ្សាយពាណិជ្ជកម្ម</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-wrap">
              {customError}
            </p>

            <div className="flex flex-col gap-2.5">
              {errorActionUrl && (
                <a 
                  href={errorActionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => { setCustomError(null); setErrorActionUrl(null); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#1877F2] hover:bg-blue-600 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✅</span> <span>OK (បើកទៅកាន់ Meta Ads Manager)</span>
                </a>
              )}

              <button 
                type="button" 
                onClick={() => { setCustomError(null); setErrorActionUrl(null); }} 
                className={`w-full py-2.5 rounded-xl font-bold text-sm border transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-300 hover:bg-[#4E4F50]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                បោះបង់ (Cancel)
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 Footer Section (មានភ្ជាប់ Privacy Policy & Terms) */}
      <footer className={`mt-auto py-8 px-4 sm:px-8 border-t text-center transition-colors ${
        theme === 'dark' 
          ? 'bg-[#18191A] border-slate-800 text-slate-400' 
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Copyright */}
          <div className="text-xs sm:text-sm font-medium">
            © 2026 Ads Manager Pro (UrbanGarbs). All rights reserved.
          </div>

          {/* Policy Links */}
          <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold">
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition underline cursor-pointer"
            >
              Privacy Policy
            </a>
            <span className="opacity-40">|</span>
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition underline cursor-pointer"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
      {/* ============================================== */}
      {/* 🌟 Custom Modern Delete Confirmation Modal     */}
      {/* ============================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-center ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
              🗑️
            </div>

            <h3 className="text-lg font-bold mb-2">តើបងពិតជាចង់លុបមែនទេ?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              យុទ្ធនាការចំនួន <strong className="text-red-500 font-bold">{selectedCampaigns.length}</strong> ដែលបានជ្រើសរើសនឹងត្រូវលុបចេញពី Facebook Ads Manager ទាំងស្រុង។ សកម្មភាពនេះមិនអាច វេញត្រឡប់ក្រោយវិញបានទេ។
            </p>

            <div className="flex gap-3">
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)} 
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-300 hover:bg-[#4E4F50]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              >
                បោះបង់ (Cancel)
              </button>
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const token = localStorage.getItem('fb_user_token');
                    if (!token) {
                      throw new Error("រកមិនឃើញ Token ទេ សូម Login ម្ដងទៀត។");
                    }

                    for (const campaignId of selectedCampaigns) {
                      const res = await fetch(`/api/campaigns?id=${campaignId}&access_token=${token}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await res.json();
                      if (!data.success) {
                        throw new Error(data.error || "លុបមិនបានសម្រេច");
                      }
                    }

                    setIsDeleteModalOpen(false);
                    // 🌟 បើកផ្ទាំង Success Modal ទំនើបជំនួសឱ្យការប្រើ alert() ធម្មតា
                    setIsDeleteSuccessModal(true);
                    fetchCampaigns(); 
                    setSelectedCampaigns([]); 
                  } catch (error: any) {
                    alert("❌ មានបញ្ហាក្នុងការលុប: " + error.message);
                  } finally {
                    setIsDeleting(false);
                  }
                }} 
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>កំពុងលុប...</span></>
                ) : (
                  <span>យល់ព្រមលុប (Delete)</span>
                )}
              </button>
            </div>

          </div>
        </div>
        
      )}
      {/* ============================================== */}
      {/* 🌟 Custom Modern Delete Success Modal          */}
      {/* ============================================== */}
      {isDeleteSuccessModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center transform transition-all scale-100 ${theme === 'dark' ? 'bg-[#242526] text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
            
            {/* Icon  ടിកសញ្ញាគ្រីសបៃតង */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-inner">
              ✓
            </div>

            <h3 className="text-lg font-bold mb-2">លុបបានជោគជ័យ!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              យុទ្ធនាការដែលបានជ្រើសរើសត្រូវបានលុបចេញពី Facebook Ads Manager ដោយជោគជ័យ។
            </p>

            <button
              type="button"
              onClick={() => setIsDeleteSuccessModal(false)}
              className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-sm transition shadow-md cursor-pointer"
            >
              OK
            </button>

          </div>
        </div>
      )}
      
      {/* 🌟 Popup ជូនដំណឹងដល់ Client ពេលគណនីជិតផុតកំណត់ (≤ 7 ថ្ងៃ) */}
      {showExpiryAlertModal && clientExpiryDaysLeftModal !== null && !isAdmin && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border text-center transform transition-all scale-100 ${
            theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner animate-bounce">
              ⚠️
            </div>

            <h3 className="text-xl font-black mb-2">សេចក្តីជូនដំណឹងផុតកំណត់សេវា!</h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              គណនីប្រើប្រាស់ប្រព័ន្ធ Ads Manager Pro របស់អ្នកនឹងត្រូវផុតកំណត់ក្នុងរយៈពេល <strong className="text-orange-500 font-bold">{clientExpiryDaysLeftModal} ថ្ងៃទៀត</strong>។ សូមធ្វើការទូទាត់ប្រាក់បន្តសេវាកម្មជាបន្ទាន់ ដើម្បីជៀសវាងការផ្អាកដំណើរការគណនី។
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExpiryAlertModal(false);
                  setActiveTab("PAYMENTS"); // 👈 Load ទៅកាន់ Tab ទូទាត់ Payment ស្វ័យប្រវត្តិ
                  if (typeof window !== "undefined") {
                    localStorage.setItem("activeTab", "PAYMENTS");
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm transition shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💳</span> <span>ទៅកាន់ទំព័រទូទាត់ប្រាក់ (Payments)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExpiryAlertModal(false)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-300 hover:bg-[#4E4F50]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                បិទជាបណ្ដោះអាសន្ន (Close)
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 🌟 ផ្ទាំង Pop-up ទំនើបសម្រាប់កែប្រែប្រាក់ចំណូលសរុប (Revenue Modal) */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`rounded-3xl max-w-sm w-full p-6 shadow-2xl border text-center transform transition-all ${
            theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-orange-500/20">
              ✏️
            </div>

            <h3 className="text-lg font-black mb-1">កែប្រែប្រាក់ចំណូលសរុប</h3>
            <p className="text-xs text-slate-400 mb-5">បញ្ចូលទឹកប្រាក់ចំណូលសរុបថ្មី (រួមទាំងការ Discount)</p>

            <div className="relative mb-6">
              <span className="absolute left-4 top-3.5 text-emerald-500 font-black text-base">$</span>
              <input 
                type="number" 
                step="0.01"
                value={customRevenueInput} 
                onChange={(e) => setCustomRevenueInput(e.target.value)} 
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-base outline-none font-black text-emerald-500 shadow-inner ${
                  theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRevenueModalOpen(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-300 hover:bg-[#4E4F50]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                បោះបង់
              </button>

              <button
                type="button"
                onClick={() => {
                  if (customRevenueInput !== "" && !isNaN(Number(customRevenueInput))) {
                    localStorage.setItem("admin_custom_revenue", customRevenueInput);
                    setIsRevenueModalOpen(false);
                    showToast("✅ បានកែប្រែប្រាក់ចំណូលសរុបដោយជោគជ័យ!", "success");
                    setTimeout(() => window.location.reload(), 500); // Refresh ឱ្យបង្ហាញតម្លៃថ្មី
                  } else {
                    alert("⚠️ សូមបញ្ចូលទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!");
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-md cursor-pointer"
              >
                ✓ រក្សាទុក
              </button>
            </div>

          </div>
        </div>
      )}
      
      
    </div>
  );
}