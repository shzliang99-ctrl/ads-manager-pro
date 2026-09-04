"use client";

import { useState, useEffect } from "react";

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
  // 🌟 [កែប្រែត្រង់នេះ៖ ដាក់ state activeTab ឱ្យស្ថិតក្នុង Component Home() ត្រឹមត្រូវ]
  const [activeTab, setActiveTab] = useState("CREATE");
  const [isMounted, setIsMounted] = useState(false);

  // 👈 យកកូដ useEffect សម្រាប់ Load saved_autoreply_configs មកដាក់នៅត្រង់ចន្លោះនេះបានយ៉ាងស្រួល
  useEffect(() => {
    try {
      const savedConfigs = localStorage.getItem("saved_autoreply_configs");
      if (savedConfigs) {
        const parsedConfigs = JSON.parse(savedConfigs);
        let configsObj: Record<string, any> = {};
        let pageIds: string[] = [];
        
        parsedConfigs.forEach((item: any) => {
          configsObj[item.pageId] = item.config;
          pageIds.push(item.pageId);
        });

        setAutoReplyConfigs(configsObj);
        setSavedPagesList(pageIds);
      }
    } catch (e) {
      console.error("Error loading saved configs", e);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("activeTab");
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

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
      
      // ហៅ Function ទាញយក Ad Accounts ចូលមកប្រើប្រាស់ផ្ទាល់នៅទីនេះเลย
      fetchAdAccounts();

      // ទាញយកឈ្មោះ Page មកបង្ហាញលើប៊ូតុងបៃតង
      fetch(`/api/auth/facebook/pages?access_token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.pages && data.pages.length > 0) {
            setFbPageName(data.pages[0].name);
          }
        })
        .catch(err => console.log("API Error:", err));
    }
  }, []);

  const [isFbConnected, setIsFbConnected] = useState(false);
  const [fbPageName, setFbPageName] = useState("");

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
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
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

  // 🌟 វចនានុក្រម (Dictionary) រួមបញ្ចូលគ្នាទាំង Auto-Reply និង Menu ខាងឆ្វេង (មិនឱ្យជាន់គ្នា)
  const langText = {
    kh: {
      botTitle: "🤖 Facebook Auto-Reply Bot Pro",
      botDesc: "កំណត់លក្ខខណ្ឌ React, Comment, Inbox, Delay និងលាក់ខំមិនជាមួយ Logo ផេកយ៉ាងទំនើប។",
      status: "ស្ថានភាព Bot:",
      step1: "១. ជ្រើសរើស Facebook Page៖",
      noPage: "មិនទាន់មាន Page ទេ...",
      delayLabel: "⏱️ រង់ចាំមុនតប៖",
      delay0: "⚡ តបភ្លាមៗ (0s)",
      delay5: "⏳ រង់ចាំ ៥ វិនាទី",
      delay30: "⏳ រង់ចាំ ៣០ វិនាទី",
      delay60: "⏳ រង់ចាំ ១ នាទី",
      step2: "២. ជ្រើសរើស Emoji React",
      replyRule: "លក្ខខណ្ឌនៃការឆ្លើយតប",
      replyAll: "តបគ្រប់ Comment",
      replyKeyword: "តាម Keyword",
      step3: "៣. អត្ថបទតបខំមិន (Auto Comment)",
      step3Desc: "បង្កើតម៉ូតសារឆ្លាស់គ្នា ការពារ Facebook Block",
      addMsgBtn: "+ ថែមម៉ូតសារ",
      step4: "៤. អត្ថបទផ្ញើចូល Inbox (Auto Inbox)",
      hideCmtTitle: "🛡️ លាក់ខំមិនអវិជ្ជមានស្វ័យប្រវត្តិ",
      hideAfterReply: "🙈 លាក់ខំមិនក្រោយពេលតបរួច",
      saveBtn: "រក្សាទុកការកំណត់",
      savedList: "ផេកដែលបានរក្សាទុកការកំណត់រួច",
      menuCreate: "បង្កើតយុទ្ធនាការ",
      menuManage: "គ្រប់គ្រងយុទ្ធនាការ",
      menuAutoReply: "ឆ្លើយតបស្វ័យប្រវត្តិ",
      tools: "Tools",
      menuAI: "ជំនួយការ AI Copywriter",
    },
    en: {
      botTitle: "🤖 Facebook Auto-Reply Bot Pro",
      botDesc: "Configure React, Comment, Inbox, Delay, and Hide Negative comments with modern UI.",
      status: "Bot Status:",
      step1: "1. Select Facebook Page:",
      noPage: "No Pages available...",
      delayLabel: "⏱️ Reply Delay:",
      delay0: "⚡ Instant (0s)",
      delay5: "⏳ Wait 5 seconds",
      delay30: "⏳ Wait 30 seconds",
      delay60: "⏳ Wait 1 minute",
      step2: "2. Choose Emoji React",
      replyRule: "Reply Conditions",
      replyAll: "Reply to All",
      replyKeyword: "By Keyword",
      step3: "3. Auto Comment Text",
      step3Desc: "Create spintax messages to prevent Facebook Blocks",
      addMsgBtn: "+ Add Message",
      step4: "4. Auto Inbox Text",
      hideCmtTitle: "🛡️ Auto-Hide Negative Comments",
      hideAfterReply: "🙈 Hide comment after reply",
      saveBtn: "Save Configurations",
      savedList: "Saved Page Configurations",
      menuCreate: "Create Campaign",
      menuManage: "Manage Campaigns",
      menuAutoReply: "Auto-Reply Bot",
      tools: "Tools",
      menuAI: "AI Copywriter",
    }
  };
  
// ប្រើប្រាស់ t ដើម្បីទាញយកភាសាដែលកំពុងជ្រើសរើស
  const t = langText[lang];

  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState("");
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false); // 🌟 បន្ថែម State សម្រាប់បង្ហាញផ្ទាំងជោគជ័យ និងប៊ូតុង OK
  const [activeManageTab, setActiveManageTab] = useState('CAMPAIGNS'); // មាន ៣ ជម្រើស: 'CAMPAIGNS', 'ADSETS', 'ADS'
  
  // 🌟 create-post
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostMessage, setNewPostMessage] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // 🌟 States សម្រាប់ Ad Account Dropdown
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState("1013142813637440");
  const [adAccountsList, setAdAccountsList] = useState<any[]>([
    { account_id: "1013142813637440", name: "Personal Account" },
    { account_id: "1445624587438136", name: "Business Account" }
  ]);
  
  // Function សម្រាប់ហៅ API ទាញ Ad Accounts របស់អតិថិជនម្នាក់ៗ
  const fetchAdAccounts = async () => {
    const token = localStorage.getItem('fb_user_token');
    
    if (!token) {
      console.log("គ្មាន Token ទេ, អត់ទាន់ Login!");
      return;
    }

    try {
      const response = await fetch(`/api/adaccounts?access_token=${token}`);
      const data = await response.json();

      if (data.success && data.accounts) {
        setAdAccountsList(data.accounts); // ដូរពី data.adAccounts មកជា data.accounts
        
        if (data.accounts.length > 0) {
          const firstAccountId = data.accounts[0].account_id;
          if (!localStorage.getItem('selectedAdAccount')) {
            setSelectedAdAccount(firstAccountId);
            localStorage.setItem('selectedAdAccount', firstAccountId);
          }
        }
      } else {
        console.error("បរាជ័យក្នុងការទាញ Ad Accounts:", data.error);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  // 🌟 1. ດຶງຂໍ້ມູນ Pages ໂດຍອັດຕະໂນມັດ ພ້ອມទាំងទាញយក Page ដែលធ្លាប់ Save ទុកក្នុង localStorage មកវិញភ្លាមៗ
  useEffect(() => {
    const token = localStorage.getItem('fb_user_token');
    const tokenParam = token ? `?access_token=${token}` : '';

    fetch(`/api/pages${tokenParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pages && data.pages.length > 0) {
          setPages(data.pages);
          
          // 🔍 ឆែកមើលក្នុង localStorage ថាតើធ្លាប់ Save Page ណាទុកមុនពេល Refresh ទេ?
          const savedPage = localStorage.getItem("selectedPage");
          
          // បើមាន Save ទុក ហើយ Page នោះមានក្នុង List របស់ Meta គឺទាញយកមកដាក់វិញភ្លាម
          if (savedPage && data.pages.find((p: any) => p.id === savedPage)) {
            setSelectedPage(savedPage);
          } else {
            // បើអត់ទាន់មាន ទើបយក Page ទីមួយ
            setSelectedPage(data.pages[0].id);
            localStorage.setItem("selectedPage", data.pages[0].id);
          }
        }
      })
      .catch(err => console.log("Error fetching pages:", err));
  }, [isFbConnected]);

  // 🌟 2. ດຶງຂໍ້ມູນ Ad Accounts ໂດຍອັດຕະໂນມັດ
  useEffect(() => {
    const token = localStorage.getItem('fb_user_token');
    const tokenParam = token ? `?access_token=${token}` : '';

    fetch(`/api/adaccounts${tokenParam}`)
      .then(res => res.json())
      .then(data => {
        // ຮັບຮອງທັງສອງແບບ ບໍ່ວ່າ API ຈະສົ່ງ 'accounts' ຫຼື 'adAccounts' ມາ
        const accList = data.accounts || data.adAccounts;
        if (data.success && accList && accList.length > 0) {
          setAdAccountsList(accList);
          const savedAccount = localStorage.getItem("selectedAdAccount");
          if (savedAccount && accList.find((acc: any) => acc.account_id === savedAccount)) {
            setSelectedAdAccount(savedAccount);
          } else {
            setSelectedAdAccount(accList[0].account_id);
          }
        }
      })
      .catch(err => console.log("Error fetching ad accounts:", err));
  }, [isFbConnected]);

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

  const [campaignName, setCampaignName] = useState("New Engagement Campaign");
  const [adsetName, setAdsetName] = useState("New Engagement Ad Set");
  const [adName, setAdName] = useState("New Engagement Ad");

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

  const [placementType, setPlacementType] = useState("ADVANTAGE");
  const [deviceType, setDeviceType] = useState("ALL");
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

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

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
    facebook: true, instagram: true, audienceNetwork: true, messenger: true, whatsapp: false, threads: false
  });

  const [expandedPlacements, setExpandedPlacements] = useState({
    feeds: false, stories: false, instream: false, search: false, messages: false, apps: false
  });

  const [detailedPlacements, setDetailedPlacements] = useState({
    fb_feed: true, fb_profile: true, ig_feed: true, ig_profile: true, fb_marketplace: true, fb_right_col: false, ig_explore: true, fb_business: false, threads_feed: false, fb_notifications: true,
    ig_stories: true, fb_stories: true, msg_stories: false, ig_reels: true, fb_reels: true, wa_status: false,
    instream_reels: true, fb_reels_ads: true,
    fb_search: true, ig_search: false,
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

  // 🌟 State សម្រាប់រក្សាទុកបញ្ជី Page ណាខ្លះដែលបាន Save ជោគជ័យ
  const [savedPagesList, setSavedPagesList] = useState<string[]>([]);

  // 🌟 State ថ្មីសម្រាប់គ្រប់គ្រងលក្ខខណ្ឌមុខងារទាំងអស់ ដាច់ដោយឡែកតាម Page នីមួយៗ
  const [autoReplyConfigs, setAutoReplyConfigs] = useState<Record<string, { 
    enabled: boolean; 
    reaction: string; 
    replyMode: string; 
    triggerKeywords: string; 
    commentTexts: string[]; 
    inboxText: string; 
    delayTimer: string; 
    hideNegative: boolean; 
    bannedKeywords: string; 
    hideAfterReply: boolean; // 🌟 មុខងារលាក់ខំមិនក្រោយពេលតបរួច
  }>>({});

  // ទាញយកកាលកំណត់របស់ Page ដែលកំពុងជ្រើសរើសបច្ចុប្បន្ន
  const currentConfig = autoReplyConfigs[selectedPage] || {
    enabled: true,
    reaction: 'LIKE',
    replyMode: 'ALL',
    triggerKeywords: "តម្លៃ, តម្លៃប៉ុន្មាន, price, លុយ, ទីតាំង, map",
    commentTexts: ["ជម្រាបសួរ {{customer_name}}! សូមឆែកប្រអប់សារ (Inbox) ខាងយើងខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនហើយ។ អរគុណបង! 🙏"],
    inboxText: "សួស្តីបង {{customer_name}}! តើបងចាប់អារម្មណ៍ស្បែកជើងម៉ូដមួយណាដែរ? អាចសួរខាងហាង {{page_name}} បានណា៎! 😊",
    delayTimer: "0",
    hideNegative: false,
    bannedKeywords: "ថ្លៃម៉្លេះ, ថ្លៃ, បោក, មិនល្អ, fake",
    hideAfterReply: false // Default មិនទាន់លាក់ ავတို
  };

  // មុខងារសម្រាប់ Update តម្លៃពេលភ្ញៀវវាយអក្សរ ឬដូរតម្លៃផ្សេងៗសម្រាប់ Page ហ្នឹងជាក់ស្ដែង
  const updateCurrentPageConfig = (key: string, value: any) => {
    setAutoReplyConfigs(prev => ({
      ...prev,
      [selectedPage]: {
        ...currentConfig,
        [key]: value
      }
    }));
  };

  // មុខងារជំនួយសម្រាប់ចុចបញ្ចូលអថេរ (Variables) ចូលក្នុងប្រអប់អក្សរលឿនៗ
  const appendVariable = (field: 'inbox' | 'comment', variable: string, index?: number) => {
    if (field === 'inbox') {
      updateCurrentPageConfig('inboxText', currentConfig.inboxText + variable);
    } else if (field === 'comment' && index !== undefined) {
      const newTexts = [...currentConfig.commentTexts];
      newTexts[index] = newTexts[index] + variable;
      updateCurrentPageConfig('commentTexts', newTexts);
    }
  };

  // បញ្ជី Emoji ទាំង ៧ របស់ Facebook
  const fbReactions = [
    { id: 'LIKE', emoji: '👍', label: 'Like' },
    { id: 'LOVE', emoji: '❤️', label: 'Love' },
    { id: 'CARE', emoji: '🥰', label: 'Care' },
    { id: 'HAHA', emoji: '😆', label: 'Haha' },
    { id: 'WOW', emoji: '😮', label: 'Wow' },
    { id: 'SAD', emoji: '😢', label: 'Sad' },
    { id: 'ANGRY', emoji: '😡', label: 'Angry' }
  ];

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

    if (localStorage.getItem("platforms")) {
      try { setPlatforms(JSON.parse(localStorage.getItem("platforms")!)); } catch(e) {}
    }
    if (localStorage.getItem("detailedPlacements")) {
      try { setDetailedPlacements(JSON.parse(localStorage.getItem("detailedPlacements")!)); } catch(e) {}
    }
    if (localStorage.getItem("selectedDatePreset")) {
      setSelectedDatePreset(localStorage.getItem("selectedDatePreset")!);
    }

    fetch('/api/pages').then(res => res.json()).then(data => {
      if (data.success && data.pages.length > 0) {
        setPages(data.pages);
        const savedPage = localStorage.getItem("selectedPage");
        if (savedPage && data.pages.find((p: any) => p.id === savedPage)) setSelectedPage(savedPage);
        else setSelectedPage(data.pages[0].id);
      }
    }).catch(err => console.log("Error fetching pages:", err));

  }, []);
  
  useEffect(() => {
    fetch('/api/adaccounts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.accounts && data.accounts.length > 0) {
          setAdAccountsList(data.accounts);
          const savedAccount = localStorage.getItem("selectedAdAccount");
          if (savedAccount && data.accounts.find((acc: any) => acc.account_id === savedAccount)) {
            setSelectedAdAccount(savedAccount);
          } else {
            setSelectedAdAccount(data.accounts[0].account_id);
          }
        }
      })
      .catch(err => console.log("Error fetching ad accounts:", err));
  }, []);

  useEffect(() => {
    if (selectedAdAccount && activeTab === "MANAGE") {
      fetchCampaigns();
    }
  }, [selectedAdAccount, selectedDatePreset, activeTab]);

  useEffect(() => {
    if (!selectedPage) return;
    localStorage.setItem("selectedPage", selectedPage);
    const pageInfo = pages.find(p => p.id === selectedPage);
    if (!pageInfo) return;

    setFetchingPosts(true);
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: pageInfo.id, pageToken: pageInfo.access_token })
    }).then(res => res.json()).then(data => {
      setFetchingPosts(false);
      
      if (data.success && data.posts.length > 0) {
        // 🌟 លែងត្រូវការ Promise.all() និងមិនបាច់ហៅ fetchPostEngagement នាំឱ្យគាំងទៀតទេ 
        // ព្រោះ API ថ្មីបាញ់ទិន្នន័យមកមានស្រាប់គ្រប់គ្រាន់ទាំងអស់ហើយ ១០០%
        setPosts(data.posts);

        const savedPost = localStorage.getItem("selectedPost");
        if (savedPost && data.posts.find((p: any) => p.id === savedPost)) {
          setSelectedPost(savedPost);
        } else {
          setSelectedPost(data.posts[0].id);
        }
      } else {
        setPosts([]);
        setSelectedPost("");
      }
    }).catch((err) => {
      console.error("Fetch Posts Error:", err);
      setFetchingPosts(false);
    });
  }, [selectedPage, pages]);

  const isBudgetError = budgetType === "LIFETIME" && Number(budget) < Number(duration);

  // 🌟 ដាក់ Function searchInterests ដែលកែត្រូវ Token ស្អាត
  const searchInterests = async (keyword: string) => {
    if (!keyword.trim()) {
      setInterestResults([]);
      return;
    }
    try {
      const pageInfo = pages.find(p => p.id === selectedPage);
      const token = pageInfo?.access_token || "";
      
      const res = await fetch(`/api/interests?q=${keyword}&token=${token}`);
      const result = await res.json();
      
      if (result.success) {
        setInterestResults(result.data || []);
      } else {
        console.error("API Error:", result.error);
      }
    } catch (err) {
      console.error("Error searching interests:", err);
    }
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
        alert("❌ បរាជ័យពី Facebook ក្នុងការ Boost:\n\n" + data.error);
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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setCampaignsList(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, effective_status: newStatus } : c));
    try {
      await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      alert("❌ មានបញ្ហាក្នុងការ Update Status");
      fetchCampaigns();
    }
  };

  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    // ធ្វើការ Update UI ទុកជាមុន (Optimistic Update) ឱ្យវាដូរពណ៌ភ្លាមៗរហ័ស
    setAdsList(prev => prev.map(ad => ad.id === adId ? { ...ad, status: newStatus, effective_status: newStatus } : ad));

    try {
      const res = await fetch('/api/ads', { // หรือ API route សម្រាប់ Update status
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adId, status: newStatus })
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

  const fetchAds = async () => {
    if (selectedCampaigns.length === 0) return;
    setLoadingAds(true);
    try {
      // 🌟 ទាញយក Token ពី localStorage
      const token = localStorage.getItem('fb_user_token');
      const tokenParam = token ? `&access_token=${token}` : '';

      const targetCampaignId = selectedCampaigns[0];
      
      let apiDatePreset = selectedDatePreset.toLowerCase();
      if (apiDatePreset === 'lifetime') apiDatePreset = 'maximum';
      
      const res = await fetch(`/api/ads?campaignId=${targetCampaignId}&datePreset=${apiDatePreset}${tokenParam}`);
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

  const fetchAdsets = async () => {
    if (selectedCampaigns.length === 0) return;
    setLoadingAdsets(true);
    try {
      // 🌟 ទាញយក Token ពី localStorage
      const token = localStorage.getItem('fb_user_token');
      const tokenParam = token ? `&access_token=${token}` : '';

      const targetCampaignId = selectedCampaigns[0];
      const res = await fetch(`/api/adsets?campaignId=${targetCampaignId}&datePreset=${selectedDatePreset}${tokenParam}`);
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

  // 🌟 1. មុខងារសម្រាប់បើក Pop-up Duplicate
  const handleOpenDuplicateModal = () => {
    if (selectedCampaigns.length === 0) {
      alert("⚠️ សូមជ្រើសរើស Campaign ណាមួយជាមុនសិន!");
      return;
    }
    // រៀបចំឈ្មោះ និង Post ដើមមុនពេលបើក Pop-up
    setDuplicateAdName("New Ad - Copy");
    setDuplicatePostId(selectedPost); 
    setIsDuplicateModalOpen(true);
  };

  // 🌟 2. មុខងារបញ្ជូនទិន្នន័យ Duplicate ពិតប្រាកដទៅកាន់ API
  const executeDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const targetCampaignId = selectedCampaigns[0];
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: targetCampaignId,
          newName: duplicateAdName,
          newPostId: duplicatePostId,
          pageId: selectedPage // បញ្ជូន Page ID ទៅដើម្បីបង្កើត Creative ថ្មី
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ " + data.message);
        setIsDuplicateModalOpen(false);
        setActiveManageTab('ADS');
        fetchCampaigns();
      } else {
        alert("❌ ការ Duplicate បរាជ័យ:\n\n" + data.error);
      }
    } catch (err) {
      alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server!");
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
      
      {/* Global Header */}
      <header className={`${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-sm h-16 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-30 border-b transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md">f</div>
          <h1 className="text-xl font-black text-blue-600 hidden sm:block">Ads Manager Pro</h1>
        </div>

        {/* 🔗 ប៊ូតុង Connect / Connected Status */}
          {isFbConnected ? (
            <div className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg flex items-center gap-2 text-xs shadow-md shrink-0 cursor-default">
              <span>✅</span> <span className="hidden md:inline">{fbPageName || "Connected (Active)"}</span>
            </div>
          ) : (
            <button 
              onClick={() => {
                const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
                // ប្រើ window.location.origin ដើម្បីឱ្យវាស្គាល់ទាំង Localhost និង Vercel
                const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/facebook/callback`);
                const scope = 'public_profile,ads_management,ads_read,pages_read_engagement,pages_show_list,pages_manage_ads';
                window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
              }}
              className="px-4 py-2 bg-[#1877F2] text-white font-bold rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-xs shadow-md shrink-0"
              title="Connect with Facebook"
            >
              <span>🔄</span> <span className="hidden md:inline">Connect Facebook</span>
            </button>
          )}

        <div className="flex items-center gap-3">
          
          {/* 🌟 ប៊ូតុងប្តូរភាសាទំនើប ទាន់សម័យ (Modern Language Selector) */}
          <button 
            onClick={() => setLang(lang === 'kh' ? 'en' : 'kh')} 
            className={`px-3.5 h-9 flex items-center gap-2.5 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer border group ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-[#242526] to-[#3A3B3C] border-slate-600 text-slate-100 hover:border-blue-500 shadow-blue-500/10' 
                : 'bg-gradient-to-r from-white to-slate-50 border-slate-300 text-slate-700 hover:border-blue-500 shadow-slate-200/50'
            }`}
            title="ប្តូរភាសា / Change Language"
          >
            {/* រូបតំណាងសកលលោក (Globe Icon) មានចលនាបន្តិចពេល Hover */}
            <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs group-hover:rotate-45 transition-transform duration-300">
              🌐
            </div>
            
            {/* អក្សរបង្ហាញភាសា */}
            <span className="tracking-wide font-extrabold">
              {lang === 'kh' ? 'ភាសាខ្មែរ (KH)' : 'English (EN)'}
            </span>

            {/* សញ្ញាลูกศรទម្លាក់ចុះតូចមួយ */}
            <span className="text-[10px] opacity-60 ml-[-2px]">▼</span>
          </button>

          {/* 🌟 ប៊ូតុងផ្លាស់ប្តូរ យប់/ថ្ងៃ (Theme Toggle) */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className={`w-9 h-9 flex items-center justify-center rounded-full text-lg shadow-sm transition-all mr-2 ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}
            title="ប្តូរទម្រង់ យប់/ថ្ងៃ"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

           {/* Ad Account Dropdown */}
           <div className="relative">
             <div 
               onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
               className={`${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white hover:bg-[#3A3B3C]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'} border rounded-lg px-3 py-1.5 flex items-center gap-3 cursor-pointer shadow-sm transition min-w-[200px] lg:min-w-[260px] justify-between h-[45px]`}
             >
               <div className="flex items-center gap-2 text-left">
                 <span className="text-base hidden lg:inline-block">🖥️</span>
                 <div className="flex flex-col truncate">
                   <span className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{adAccountsList.find(acc => acc.account_id === selectedAdAccount)?.name || "Select Account"}</span>
                   <span className="text-[10px] text-slate-400">ID: {selectedAdAccount}</span>
                 </div>
               </div>
               <span className="text-xs text-slate-400 ml-1">▼</span>
             </div>

             {isAccountMenuOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)}></div>
                 <div className={`absolute top-[110%] right-0 w-[320px] border rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                   <div className="text-xs font-bold text-slate-400 px-3 py-1">{adAccountsList.length} ad accounts</div>
                   <div className="max-h-[300px] overflow-y-auto">
                     {adAccountsList.map((acc: any) => (
                       <div 
                         key={acc.account_id}
                         onClick={() => {
                           setSelectedAdAccount(acc.account_id);
                           setIsAccountMenuOpen(false);
                           localStorage.setItem("selectedAdAccount", acc.account_id);
                         }}
                         className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition mb-1 ${selectedAdAccount === acc.account_id ? (theme === 'dark' ? 'bg-blue-900/40 border-blue-600' : 'bg-blue-50/60 border-blue-300') : (theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-50')}`}
                       >
                         <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                           <input type="radio" checked={selectedAdAccount === acc.account_id} readOnly className="text-blue-600 w-4 h-4 shrink-0" />
                           <div className="text-left flex-1 min-w-0">
                             <div className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{acc.name}</div>
                             <div className="text-[10px] text-slate-400 truncate">ID: {acc.account_id}</div>
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
               className={`${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white hover:bg-[#3A3B3C]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'} border rounded-lg px-3 py-1.5 flex items-center gap-2.5 cursor-pointer shadow-sm transition min-w-[140px] lg:min-w-[170px] h-[45px] justify-between`}
             >
               <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reporting</span>
                  <span className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{getSelectedDateLabel()}</span>
               </div>
               <span className="text-xs text-slate-400">▼</span>
             </div>

             {isDateMenuOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsDateMenuOpen(false)}></div>
                 <div className={`absolute top-[110%] right-0 w-[230px] border rounded-xl shadow-2xl z-50 p-1.5 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                   {datePresetOptions.map((option) => (
                     <div 
                       key={option.value}
                       onClick={() => {
                         setSelectedDatePreset(option.value);
                         setIsDateMenuOpen(false);
                         localStorage.setItem("selectedDatePreset", option.value);
                       }}
                       className={`p-2.5 rounded-lg text-sm cursor-pointer transition flex items-center justify-between ${selectedDatePreset === option.value ? 'bg-blue-600 text-white font-bold' : (theme === 'dark' ? 'text-slate-200 hover:bg-[#3A3B3C]' : 'text-slate-700 hover:bg-slate-100 font-medium')}`}
                     >
                       {option.label}
                       {selectedDatePreset === option.value && <span className="text-xs">✓</span>}
                     </div>
                   ))}
                   <div className="border-t border-slate-700 mt-1.5 pt-1.5 p-2 text-xs text-slate-500 font-medium cursor-not-allowed opacity-60">Custom Range... (Not enabled)</div>
                 </div>
               </>
             )}
           </div>

        </div>
      </header>

      {/* 🌟 Layout Main + Left Sidebar */}
      <div className="flex flex-1 w-full items-stretch">
        
        {/* 🌟 Layout Main + Left Sidebar (Multi-Language & Dark Mode Supported) */}
        <aside className={`hidden md:flex flex-col w-[260px] shrink-0 border-r min-h-[calc(100vh-64px)] shadow-sm z-10 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
         <div className="sticky top-[64px] p-4 flex flex-col gap-2 pt-6">
             <div className="text-[11px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-widest">{lang === 'kh' ? 'Main Menu' : 'Main Menu'}</div>
             
             <button 
               onClick={() => handleTabChange("CREATE")}
               className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "CREATE" ? "bg-blue-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
             >
               <span className="text-lg leading-none">✍️</span> <span className="text-[13.5px]">{t.menuCreate}</span>
             </button>

             <button 
               onClick={() => handleTabChange("MANAGE")}
               className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "MANAGE" ? "bg-blue-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
             >
               <span className="text-lg leading-none">📊</span> <span className="text-[13.5px]">{t.menuManage}</span>
             </button>

             {/* 👇 Tab ឆ្លើយតបស្វ័យប្រវត្តិ (Auto-Reply) */}
             <button 
               onClick={() => handleTabChange("AUTO_REPLY")}
               className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "AUTO_REPLY" ? "bg-blue-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
             >
               <span className="text-lg leading-none">🤖</span> <span className="text-[13.5px]">{t.menuAutoReply}</span>
             </button>
             
             {/* 🌟 ផ្នែក Tools: ប៊ូតុង AI Copywriter */}
             <div className={`border-t my-2 mt-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
             <div className="text-[11px] font-bold text-slate-400 mb-2 px-3 uppercase tracking-widest">{t.tools}</div>
             <button 
               onClick={() => handleTabChange("AI")}
               className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 cursor-pointer ${activeTab === "AI" ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" : (theme === 'dark' ? 'text-slate-300 hover:bg-[#3A3B3C] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}`}
             >
               <span className="text-lg leading-none">✨</span> <span className="text-[13.5px]">{t.menuAI}</span>
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

                {/* AI Results Display */}
                {aiResults.length > 0 && (
                  <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    <h3 className={`font-bold text-[15px] border-b pb-2 ${theme === 'dark' ? 'text-white border-slate-700' : 'text-slate-800 border-slate-200'}`}>ជម្រើសអត្ថបទដែល AI បានបង្កើត៖</h3>
                    {aiResults.map((res, idx) => (
                      <div key={idx} className={`border p-5 rounded-xl shadow-sm hover:shadow-md transition relative group ${theme === 'dark' ? 'bg-[#3A3B3C] border-indigo-900/50 text-white' : 'bg-[#F8F9FE] border-indigo-100 text-slate-800'}`}>
                        <p className="text-[14px] leading-relaxed pr-8 whitespace-pre-wrap">{res}</p>
                        <button 
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(res); alert("✅ បានចម្លងអត្ថបទ (Copied!)"); }} 
                          className={`absolute top-4 right-4 p-2 border rounded-md transition shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:text-purple-400' : 'bg-white border-slate-200 text-slate-400 hover:text-purple-600'}`}
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* 🌟 ផ្ទាំងគ្រប់គ្រង Auto Reply Bot Pro (Modern UI with All Features & Custom Page Dropdown) */}
            {activeTab === 'AUTO_REPLY' && (
              <div className={`p-6 min-h-screen rounded-xl shadow-sm border animate-in fade-in duration-300 transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-800' : 'bg-[#F0F2F5] border-slate-200'}`}>
                <div className={`rounded-xl shadow-sm border p-6 max-w-4xl mx-auto transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                  
                  {/* Header */}
                  <div className={`flex items-center justify-between mb-6 border-b pb-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div>
                      <h2 className={`text-[20px] font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>
                        🤖 Facebook Auto-Reply Bot Pro <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ultimate</span>
                      </h2>
                      <p className={`text-[14px] ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>កំណត់លក្ខខណ្ឌ React, Comment, Inbox, Delay និងលាក់ខំមិនជាមួយ Logo ផេកយ៉ាងទំនើប។</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[14px] font-semibold">ស្ថានភាព Bot:</span>
                       <div 
                         onClick={() => updateCurrentPageConfig('enabled', !currentConfig.enabled)} 
                         className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 ${currentConfig.enabled ? 'bg-[#31A24C]' : 'bg-slate-400'}`}
                       >
                         <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${currentConfig.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                       </div>
                    </div>
                  </div>

                  <div className={`flex flex-col gap-6 transition-opacity duration-300 ${!currentConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    
                    {/* ១. មុខងារជ្រើសរើស Page (Custom Dropdown ជាមួយ Logo គ្រប់ Page) */}
                    <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/50 border-blue-100'}`}>
                      <div className="flex-1 w-full">
                        <label className="block font-bold text-[14px] mb-2">១. ជ្រើសរើស Facebook Page៖</label>
                        
                        {/* Custom Select Box */}
                        <div className="relative">
                          <div
                            onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}
                            className={`w-full border rounded-xl p-3 pl-12 pr-10 flex items-center justify-between cursor-pointer shadow-sm transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-blue-200 text-slate-800'}`}
                          >
                            <div className="absolute left-3 top-2.5 pointer-events-none">
                              {selectedPageData?.picture?.data?.url ? (
                                <img src={selectedPageData.picture.data.url} className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-xs" />
                              ) : (
                                <div className="w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-[10px] text-white">Page</div>
                              )}
                            </div>
                            <span className="text-[14px] font-bold truncate">{selectedPageData ? selectedPageData.name : "Select a Page..."}</span>
                            <span className="text-xs text-[#1877F2] font-bold">▼</span>
                          </div>

                          {/* Dropdown Menu ពេលចុចបើក */}
                          {isPageMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsPageMenuOpen(false)}></div>
                              <div className={`absolute top-[110%] left-0 w-full border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                                {pages.map(p => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      setSelectedPage(p.id);
                                      localStorage.setItem("selectedPage", p.id); // 👈 រក្សាទុកទីនេះ ដើម្បីកុំឱ្យបាត់ពេល Refresh
                                      setIsPageMenuOpen(false);
                                    }}
                                    className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition ${selectedPage === p.id ? (theme === 'dark' ? 'bg-blue-900/50 text-white font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (theme === 'dark' ? 'hover:bg-[#3A3B3C]' : 'hover:bg-slate-100 text-slate-700')}`}
                                  >
                                    {p.picture?.data?.url ? (
                                      <img src={p.picture.data.url} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 bg-slate-300 rounded-full shrink-0 flex items-center justify-center text-[10px]">Page</div>
                                    )}
                                    <span className="text-[14px] truncate">{p.name}</span>
                                    {selectedPage === p.id && <span className="ml-auto text-xs text-[#1877F2]">✓</span>}
                                  </div>
                                ))}
                                {pages.length === 0 && <div className="p-3 text-center text-slate-400 text-xs">មិនទាន់មាន Page ទេ...</div>}
                              </div>
                            </>
                          )}
                        </div>

                      </div>

                      {/* ⏱️ ពេលវេលារង់ចាំ (Delay Timer) */}
                      <div className="w-full md:w-[220px]">
                        <label className="block font-bold text-[14px] mb-2">⏱️ រង់ចាំមុនតប៖</label>
                        <div className="relative">
                          <select 
                            value={currentConfig.delayTimer} 
                            onChange={(e) => updateCurrentPageConfig('delayTimer', e.target.value)} 
                            className={`w-full appearance-none border rounded-xl p-3 outline-none focus:border-[#1877F2] text-[14px] font-bold cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-blue-200 text-slate-800'}`}
                          >
                            <option value="0">⚡ តបភ្លាមៗ (0s)</option>
                            <option value="5">⏳ រង់ចាំ ៥ វិនាទី</option>
                            <option value="30">⏳ រង់ចាំ ៣០ វិនាទី</option>
                            <option value="60">⏳ រង់ចាំ ១ នាទី</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#1877F2] font-bold text-xs">▼</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ២. មុខងារជ្រើសរើស Emoji */}
                      <div className={`p-4 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-white border-slate-200'}`}>
                        <label className="block font-bold text-[14px] mb-3">២. ជ្រើសរើស Emoji React</label>
                        <div className="flex flex-wrap gap-2">
                          {fbReactions.map(react => (
                            <div
                              key={react.id}
                              onClick={() => updateCurrentPageConfig('reaction', react.id)}
                              className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-[55px] h-[60px] rounded-lg transition-all duration-200 ${
                                currentConfig.reaction === react.id 
                                  ? (theme === 'dark' ? 'bg-blue-900/50 border-2 border-[#1877F2] scale-105' : 'bg-blue-50 border-2 border-[#1877F2] scale-105') 
                                  : (theme === 'dark' ? 'hover:bg-slate-700 border border-transparent' : 'hover:bg-slate-100 border border-transparent')
                              }`}
                            >
                              <span className="text-[24px] leading-none drop-shadow-sm">{react.emoji}</span>
                              <span className={`text-[10px] font-bold ${currentConfig.reaction === react.id ? 'text-[#1877F2]' : 'text-slate-400'}`}>{react.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* លក្ខខណ្ឌពាក្យគន្លឹះ (Keyword Rules) */}
                      <div className={`p-4 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-white border-slate-200'}`}>
                        <label className="block font-bold text-[14px] mb-3">លក្ខខណ្ឌនៃការឆ្លើយតប</label>
                        <div className="flex gap-4 mb-3">
                          <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold">
                            <input type="radio" name="replyMode" checked={currentConfig.replyMode === 'ALL'} onChange={() => updateCurrentPageConfig('replyMode', 'ALL')} className="w-4 h-4 accent-[#1877F2]" /> តបគ្រប់ Comment
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold">
                            <input type="radio" name="replyMode" checked={currentConfig.replyMode === 'KEYWORD'} onChange={() => updateCurrentPageConfig('replyMode', 'KEYWORD')} className="w-4 h-4 accent-[#1877F2]" /> តាម Keyword
                          </label>
                        </div>
                        {currentConfig.replyMode === 'KEYWORD' && (
                          <div className="animate-in fade-in slide-in-from-top-2">
                            <input 
                              type="text" 
                              value={currentConfig.triggerKeywords} 
                              onChange={(e) => updateCurrentPageConfig('triggerKeywords', e.target.value)} 
                              placeholder="ឧ: តម្លៃ, price, ទីតាំង" 
                              className={`w-full border rounded-lg p-2.5 text-[13px] outline-none focus:border-[#1877F2] ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`} 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ៣. Auto Comment (Spintax & Variables & Hide After Reply) */}
                    <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <label className="block font-bold text-[14px]">៣. អត្ថបទតបខំមិន (Auto Comment)</label>
                          <p className="text-[12px] text-slate-400 mt-0.5">បង្កើតម៉ូតសារឆ្លាស់គ្នា ការពារ Facebook Block</p>
                        </div>
                        <button onClick={() => { if(currentConfig.commentTexts.length < 5) updateCurrentPageConfig('commentTexts', [...currentConfig.commentTexts, ""]); }} className="text-[#1877F2] text-[12px] font-bold hover:bg-blue-50/10 px-3 py-1.5 rounded-lg transition">+ ថែមម៉ូតសារ</button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {currentConfig.commentTexts.map((text, idx) => (
                          <div key={idx} className={`relative border rounded-xl overflow-hidden focus-within:border-[#1877F2] transition ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-[#F9FAFB] border-slate-300'}`}>
                            <div className={`border-b px-2 py-1.5 flex gap-2 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                              <button onClick={() => appendVariable('comment', '{{customer_name}}', idx)} className="text-[11px] font-bold text-[#1877F2] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100">+ ឈ្មោះភ្ញៀវ</button>
                              <button onClick={() => appendVariable('comment', '{{page_name}}', idx)} className={`text-[11px] font-bold border px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-600'}`}>+ ឈ្មោះផេក</button>
                            </div>
                            <textarea 
                              rows={2} 
                              value={text}
                              onChange={(e) => {
                                const newTexts = [...currentConfig.commentTexts];
                                newTexts[idx] = e.target.value;
                                updateCurrentPageConfig('commentTexts', newTexts);
                              }}
                              placeholder={`សារទី ${idx + 1}...`}
                              className="w-full p-3 pr-10 text-[13px] bg-transparent outline-none resize-none" 
                            />
                            {currentConfig.commentTexts.length > 1 && (
                              <button onClick={() => updateCurrentPageConfig('commentTexts', currentConfig.commentTexts.filter((_, i) => i !== idx))} className="absolute right-3 top-10 text-red-400 hover:text-red-600 text-lg">✕</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 🌟 មុខងារលាក់ខំមិនក្រោយពេលតបរួច */}
                      <div className={`mt-5 pt-4 border-t flex justify-between items-center p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-[#F8FAFC] border-slate-200'}`}>
                        <div>
                          <label className="font-bold text-[13px] flex items-center gap-1.5">
                            <span>🙈</span> លាក់ខំមិនក្រោយពេលតបរួច (Hide after reply)
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">រាល់ខំមិនដែល Bot បានតបរួច នឹងត្រូវលាក់ (Hide) មិនឱ្យអ្នកផ្សេងឃើញឡើយ។</p>
                        </div>
                        <div 
                          onClick={() => updateCurrentPageConfig('hideAfterReply', !currentConfig.hideAfterReply)} 
                          className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 shrink-0 ${currentConfig.hideAfterReply ? 'bg-[#1877F2]' : 'bg-slate-400'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${currentConfig.hideAfterReply ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>

                    </div>

                    {/* ៤. Auto Inbox ជាមួយ Variables */}
                    <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-white border-slate-200'}`}>
                      <label className="block font-bold text-[14px] mb-1">៤. អត្ថបទផ្ញើចូល Inbox (Auto Inbox)</label>
                      <div className={`relative border rounded-xl overflow-hidden focus-within:border-[#1877F2] transition mt-2 ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-[#F9FAFB] border-slate-300'}`}>
                        <div className={`border-b px-2 py-1.5 flex gap-2 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                          <button onClick={() => appendVariable('inbox', '{{customer_name}}')} className="text-[11px] font-bold text-[#1877F2] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100">+ ឈ្មោះភ្ញៀវ</button>
                          <button onClick={() => appendVariable('inbox', '{{page_name}}')} className={`text-[11px] font-bold border px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-600'}`}>+ ឈ្មោះផេក</button>
                        </div>
                        <textarea 
                          rows={4} 
                          value={currentConfig.inboxText}
                          onChange={(e) => updateCurrentPageConfig('inboxText', e.target.value)}
                          className="w-full p-3 text-[13px] bg-transparent outline-none resize-none" 
                        />
                      </div>
                    </div>

                    {/* លាក់ខំមិនអវិជ្ជមានស្វ័យប្រវត្តិ (Auto-Hide Negative) */}
                    <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50/50 border-red-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-bold text-[14px] text-red-500">🛡️ លាក់ខំមិនអវិជ្ជមានស្វ័យប្រវត្តិ (Auto-Hide Negative)</label>
                        <div onClick={() => updateCurrentPageConfig('hideNegative', !currentConfig.hideNegative)} className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 ${currentConfig.hideNegative ? 'bg-red-500' : 'bg-slate-400'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${currentConfig.hideNegative ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                      </div>
                      {currentConfig.hideNegative && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                          <input 
                            type="text" 
                            value={currentConfig.bannedKeywords} 
                            onChange={(e) => updateCurrentPageConfig('bannedKeywords', e.target.value)} 
                            placeholder="ឧ: ថ្លៃ, បោក, មិនល្អ" 
                            className={`w-full border rounded-lg p-2.5 text-[13px] outline-none focus:border-red-400 shadow-sm ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-white border-red-200'}`} 
                          />
                        </div>
                      )}
                    </div>

                    {/* ប៊ូតុង Save */}
                    <div className="flex justify-end mt-2">
                      // ចាប់ផ្តើមជំនួសត្រង់ប៊ូតុង Save នេះ៖
                      <button 
                        type="button"
                        onClick={() => {
                          // ១. បង្កើតទម្រង់ទិន្នន័យសម្រាប់ Page នេះ
                          const pageDataToSave = {
                            pageId: selectedPage,
                            pageName: selectedPageData?.name || "Unknown Page",
                            config: currentConfig
                          };

                          // ២. ទាញយកបញ្ជីដែលធ្លាប់ Save ទុកពីមុនមកផ្ទៀងផ្ទាត់
                          let existingSavedConfigs = [];
                          try {
                            const savedLocal = localStorage.getItem("saved_autoreply_configs");
                            if (savedLocal) existingSavedConfigs = JSON.parse(savedLocal);
                          } catch (e) {
                            console.error(e);
                          }

                          // ៣. ពិនិត្យមើលថាតើ Page នេះធ្លាប់ Save រួចហើយឬยัง? បើមានហើយ Update ថ្មី បើអត់ទាន់មាន Add ចូល
                          const index = existingSavedConfigs.findIndex((item: any) => item.pageId === selectedPage);
                          if (index >= 0) {
                            existingSavedConfigs[index] = pageDataToSave;
                          } else {
                            existingSavedConfigs.push(pageDataToSave);
                          }

                          // ៤. រក្សាទុកចូលក្នុង localStorage ជាផ្លូវការ
                          localStorage.setItem("saved_autoreply_configs", JSON.stringify(existingSavedConfigs));

                          // ៥. Update State ក្នុង Screen ឱ្យលោតបង្ហាញបញ្ជីខាងក្រោមភ្លាមៗ
                          if (!savedPagesList.includes(selectedPage)) {
                            setSavedPagesList([...savedPagesList, selectedPage]);
                          }

                          alert(`✅ បានរក្សាទុកការកំណត់ Pro សម្រាប់ Page "${selectedPageData?.name}" ចូលក្នុងប្រព័ន្ធដោយជោគជ័យ!`);
                        }}
                        className="px-8 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <span>💾</span> រក្សាទុកការកំណត់សម្រាប់ Page នេះ
                      </button>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 🌟 ផ្នែកបង្ហាញបញ្ជី Page ដែលបាន Save ជាប់ខាងក្រោម (Saved Pages List) */}
                  {/* ========================================================= */}
                  <div className={`mt-10 pt-6 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-[16px] font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      <span>📌</span> ផេកដែលបានរក្សាទុកការកំណត់រួច ({savedPagesList.length})
                    </h3>

                    {savedPagesList.length === 0 ? (
                      <div className={`p-6 border border-dashed rounded-xl text-center text-[13px] ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-500'}`}>
                        មិនទាន់មាន Page ណាត្រូវបាន Save ទេ។ សូមជ្រើសរើស Page ហើយចុចប៊ូតុង Save ខាងលើ។
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedPagesList.map(pageId => {
                          const pData = pages.find(p => p.id === pageId);
                          const pConfig = autoReplyConfigs[pageId];
                          const selectedEmojiObj = fbReactions.find(r => r.id === pConfig?.reaction);

                          return (
                            <div key={pageId} className={`flex items-center justify-between p-3.5 border rounded-xl shadow-xs hover:shadow-md transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                {pData?.picture?.data?.url ? (
                                  <img src={pData.picture.data.url} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0 flex items-center justify-center text-xs">Page</div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className={`font-bold text-[14px] truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{pData?.name || "Unknown Page"}</span>
                                  <div className="flex items-center gap-2 text-[12px] text-slate-400">
                                    <span>Emoji: <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>{selectedEmojiObj?.emoji || '👍'}</strong></span>
                                    <span>•</span>
                                    <span className={pConfig?.enabled ? "text-emerald-500 font-bold" : "text-slate-400"}>
                                      {pConfig?.enabled ? "Active" : "Paused"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={() => setSavedPagesList(savedPagesList.filter(id => id !== pageId))}
                                className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50/10 transition shrink-0 cursor-pointer"
                                title="លុបចេញពីបញ្ជី"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* ផ្ទាំងបង្កើតយុទ្ធនាការ (CREATE) - Dark Mode Supported */}
            {/* ========================================================= */}
            {activeTab === "CREATE" && (
              <form onSubmit={handleAutoBoost} className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
                
                {/* Campaign Details */}
                <div className={`p-6 rounded-xl shadow-sm border flex flex-col gap-5 h-fit w-full min-w-0 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <h3 className={`font-bold border-b pb-2 flex items-center gap-2 ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                    <span className={`p-1 rounded ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>📁</span> ១. Campaign Details
                  </h3>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Campaign name (ឈ្មោះយុទ្ធនាការ)</label>
                    <input type="text" value={campaignName} onChange={(e) => saveParam("campaignName", e.target.value, setCampaignName)} className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Objective</label>
                      <select value={objective} onChange={(e) => saveParam("obj", e.target.value, setObjective)} className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                        <option value="ENGAGEMENT">💬 Engagement</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Conversion Location</label>
                      <select value={conversionLocation} onChange={(e) => saveParam("conversionLoc", e.target.value, setConversionLocation)} className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                        <option value="MESSAGES">📨 Message destinations</option>
                        <option value="ON_AD">👍 On your ad</option>
                      </select>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border mt-1 ${theme === 'dark' ? 'bg-blue-950/20 border-blue-900' : 'bg-[#f2f6fc] border-blue-100'}`}>
                    <label className={`block text-sm font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Performance goal</label>
                    <p className={`text-[12px] mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>How you measure success for your ads.</p>
                    <select value={performanceGoal} onChange={(e) => saveParam("performanceGoal", e.target.value, setPerformanceGoal)} className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 shadow-sm font-semibold cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                        <option value="CONVERSATIONS">💬 Maximize number of conversations</option>
                        <option value="LEAD_GENERATION">📝 Maximize number of leads through messaging</option>
                        <option value="LINK_CLICKS">🔗 Maximize number of link clicks</option>
                        <option value="POST_ENGAGEMENT">👍 Maximize engagement with a post</option>
                    </select>
                  </div>
                  
                  <div className={`p-4 rounded-xl border mt-1 ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Budget strategy</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <select value={budgetType} onChange={(e) => saveParam("budgetType", e.target.value, setBudgetType)} className={`w-full border rounded-lg p-2.5 text-sm outline-none font-medium cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                          <option value="DAILY">Daily budget</option>
                          <option value="LIFETIME">Lifetime budget</option>
                        </select>
                      </div>
                      <div className="flex-1 relative min-w-0">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-500">$</span>
                        <input type="number" min="1" step="0.5" value={budget} onChange={(e) => saveParam("budget", e.target.value, setBudget)} className={`w-full border rounded-lg p-2.5 pl-8 text-sm outline-none font-bold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`} />
                      </div>
                    </div>

                    {budgetType === "LIFETIME" && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>ដំណើរការរយៈពេល (ថ្ងៃ)៖</label>
                          <input type="number" min="1" value={duration} onChange={(e) => saveParam("duration", e.target.value, setDuration)} className={`w-24 border rounded-lg p-2 text-sm outline-none text-center font-bold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                        </div>
                        
                        <div className={`text-[13px] p-3 rounded-lg border flex flex-col gap-1 shadow-sm ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800 text-slate-300' : 'bg-blue-50 border-blue-100 text-slate-700'}`}>
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

                    {budgetType === "DAILY" && (
                      <div className="mt-2 text-[12px] text-slate-500 font-medium">
                        ℹ️ ថវិកាប្រចាំថ្ងៃនឹងត្រូវកាត់ជារៀងរាល់ថ្ងៃ រហូតទាល់តែបងចូលទៅបិទវាដោយខ្លួនឯង។
                      </div>
                    )}

                    {isBudgetError && (
                      <div className={`mt-3 px-4 py-3 rounded-lg text-[13px] flex items-start gap-2 shadow-sm animate-in fade-in border ${theme === 'dark' ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        <span className="text-base leading-none mt-0.5">⚠️</span>
                        <span><strong>ការព្រមាន៖</strong> ថវិកាសរុបរបស់អ្នកតិចជាងចំនួនថ្ងៃដែលត្រូវរត់។ សូមដំឡើងថវិកា ឬកាត់បន្ថយចំនួនថ្ងៃ យ៉ាងហោចណាស់ $1 ក្នុងមួយថ្ងៃ។</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Set Details */}
                <div className={`p-6 rounded-xl shadow-sm border flex flex-col gap-5 w-full min-w-0 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <h3 className={`font-bold border-b pb-2 flex items-center gap-2 ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                    <span className={`p-1 rounded ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>🎯</span> ២. Ad Set (Targeting & Placements)
                  </h3>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ad set name</label>
                    <input type="text" value={adsetName} onChange={(e) => saveParam("adsetName", e.target.value, setAdsetName)} className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Locations</label>
                      <select value={location} onChange={(e) => saveParam("location", e.target.value, setLocation)} className={`w-full border rounded-lg p-2.5 outline-none text-sm font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
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
                      <select value={gender} onChange={(e) => saveParam("gender", e.target.value, setGender)} className={`w-full border rounded-lg p-2.5 outline-none text-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                        <option value="ALL">All genders</option>
                        <option value="MALE">Men</option>
                        <option value="FEMALE">Women</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Age</label>
                    <div className="flex items-center gap-3">
                      <input type="number" min="13" max="65" value={ageMin} onChange={(e) => saveParam("ageMin", e.target.value, setAgeMin)} className={`w-full border rounded-lg p-2.5 outline-none text-center ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                      <span className="text-slate-400 font-bold">-</span>
                      <input type="number" min="13" max="65" value={ageMax} onChange={(e) => saveParam("ageMax", e.target.value, setAgeMax)} className={`w-full border rounded-lg p-2.5 outline-none text-center ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
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
                         className={`w-full border rounded-lg p-3 text-sm outline-none focus:border-blue-500 shadow-sm font-medium ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-800'}`}
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
                         className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:from-emerald-700 hover:to-teal-700 transition shrink-0 cursor-pointer shadow-sm"
                       >
                         AI Pro - Fill
                       </button>

                       <button
                         type="button"
                         onClick={() => { setTargeting(""); localStorage.removeItem("targeting"); }}
                         className={`px-3 py-2 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                       >
                         Clear
                       </button>
                     </div>

                     <textarea 
                       rows={3}
                       value={targeting} 
                       onChange={(e) => { setTargeting(e.target.value); localStorage.setItem("targeting", e.target.value); }} 
                       className={`w-full border rounded-lg p-3 mt-2 outline-none focus:border-blue-500 text-sm font-medium resize-y shadow-inner ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700'}`} 
                       placeholder="Selected keywords will appear here and sync to Ad Set..."
                     />
                  </div>

                  <div className={`border rounded-xl overflow-visible mt-2 flex-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`p-3 border-b ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                      <label className={`block text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Placements</label>
                    </div>
                    <div className={`p-4 flex flex-col gap-4 ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                      <select value={placementType} onChange={(e) => saveParam("placementType", e.target.value, setPlacementType)} className={`w-full border rounded-lg p-2.5 text-sm outline-none font-medium cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}>
                        <option value="ADVANTAGE">✨ Advantage+ placements</option>
                        <option value="MANUAL">⚙️ Manual placements</option>
                      </select>

                      {placementType === "MANUAL" && (
                        <div className={`flex flex-col gap-4 pt-4 border-t animate-in fade-in text-sm ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                          
                          {/* Devices and OS */}
                          <div className={`rounded-lg border shadow-sm transition-all ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                             <div className="flex justify-between items-center p-3 cursor-pointer select-none" onClick={() => setShowDevices(!showDevices)}>
                                <h4 className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Devices and operating systems</h4>
                                <span className="text-slate-500 font-black text-xs">{showDevices ? '▲' : '▼'}</span>
                             </div>
                             
                             {showDevices && (
                                <div className="flex flex-col gap-3 px-3 pb-4 animate-in fade-in slide-in-from-top-2">
                                   <select value={deviceType} onChange={(e) => saveParam("deviceType", e.target.value, setDeviceType)} className={`w-full border rounded-md p-2 outline-none cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                                       <option value="ALL">All devices (recommended)</option>
                                       <option value="MOBILE">Mobile</option>
                                       <option value="DESKTOP">Desktop</option>
                                   </select>
                                   <select value={osType} onChange={(e) => saveParam("osType", e.target.value, setOsType)} className={`w-full border rounded-md p-2 outline-none cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                                       <option value="ALL">All mobile devices</option>
                                       <option value="ANDROID">Android devices only</option>
                                       <option value="IOS">iOS devices only</option>
                                       <option value="FEATURE">Feature phones only</option>
                                   </select>
                                   {/* Wi-Fi Toggle */}
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
                          <div className={`border rounded-lg shadow-sm transition-all ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`p-3 font-bold flex justify-between cursor-pointer select-none ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-200' : 'bg-slate-50 text-slate-700'}`} onClick={() => setShowPlatforms(!showPlatforms)}>
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
                          <div className={`border rounded-lg shadow-sm mb-2 transition-all ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`p-3 font-bold flex justify-between items-center cursor-pointer select-none ${theme === 'dark' ? 'bg-[#3A3B3C] text-slate-200' : 'bg-slate-50 text-slate-700'}`} onClick={() => setShowPlacementCtrls(!showPlacementCtrls)}>
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
                  </div>
                </div>

                {/* Ad Setup Area */}
                <div className="xl:col-span-2 flex flex-col lg:flex-row gap-6 mb-8 w-full min-w-0">
                  <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <div className={`p-6 rounded-xl shadow-sm border transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                      <h3 className={`font-bold border-b pb-3 mb-5 flex items-center gap-2 ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                        <span className={`p-1.5 rounded ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-slate-100'}`}>🖼️</span> ៣. Ad Setup
                      </h3>

                      <div className="mb-5">
                        <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ad name (ឈ្មោះការផ្សាយ)</label>
                        <input type="text" value={adName} onChange={(e) => saveParam("adName", e.target.value, setAdName)} className={`w-full border rounded-lg p-3 outline-none focus:border-blue-500 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} placeholder="New Engagement Ad" />
                      </div>

                      <div className="mb-5">
                        <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Identity</label>
                        <div className={`border rounded-lg overflow-visible relative ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                          <div className={`p-3 border-b text-sm font-bold ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>Facebook Page</div>
                          
                          <div onClick={() => setIsPageMenuOpen(!isPageMenuOpen)} className={`p-3 flex justify-between items-center cursor-pointer transition relative overflow-hidden ${theme === 'dark' ? 'bg-[#242526] hover:bg-[#3A3B3C]' : 'bg-white hover:bg-blue-50'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                              {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className={`w-8 h-8 rounded-full object-cover border shrink-0 ${theme === 'dark' ? 'border-slate-600' : 'border-slate-100'}`} /> : <div className="w-8 h-8 bg-slate-400 rounded-full shrink-0"></div>}
                              <span className={`font-bold text-sm truncate block flex-1 min-w-0 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedPageData ? selectedPageData.name : "Select a Page..."}</span>
                            </div>
                            <span className="text-xs text-[#1877F2] shrink-0">▼</span>
                          </div>
                          {isPageMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => {e.stopPropagation(); setIsPageMenuOpen(false)}}></div>
                                <div className={`absolute top-[100%] left-0 w-full border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto mt-1 ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                                  {pages.map(p => (
                                    <div key={p.id} onClick={(e) => { e.stopPropagation(); setSelectedPage(p.id); setIsPageMenuOpen(false); }} className={`p-3 flex items-center gap-3 cursor-pointer border-b transition ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-50 hover:bg-blue-50'}`}>
                                      {p.picture?.data?.url ? <img src={p.picture.data.url} className="w-9 h-9 rounded-full object-cover shrink-0" /> : <div className="w-9 h-9 bg-slate-400 rounded-full shrink-0"></div>}
                                      <span className="text-sm font-bold truncate">{p.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                          )}
                        </div>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full border border-[#1877F2] flex items-center justify-center shrink-0">
                             <div className="w-2.5 h-2.5 bg-[#1877F2] rounded-full"></div>
                          </div>
                          <span className={`font-bold text-[15px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Ad setup</span>
                        </div>
                        <div className={`border rounded-lg p-4 shadow-sm ${theme === 'dark' ? 'border-slate-700 bg-[#18191A]' : 'border-slate-200 bg-white'}`}>
                          <select disabled className={`w-full border rounded-md p-2.5 text-sm outline-none cursor-not-allowed mb-3 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                            <option>Use existing posts</option>
                          </select>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked readOnly className={`mt-1 w-4 h-4 rounded text-blue-600 ${theme === 'dark' ? 'border-slate-600 bg-[#3A3B3C]' : 'border-slate-300'}`} />
                            <div className={`text-[13px] leading-snug ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              <span className={`font-bold block mb-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Multi-advertiser ads</span>
                              Your ad can appear with others in the same ad unit to help promote discoverability.
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full border border-[#1877F2] flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 bg-[#1877F2] rounded-full"></div>
                          </div>
                          <span className={`font-bold text-[15px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Ad creative</span>
                        </div>
                        <p className={`text-[13px] mb-3 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Select and optimize your ad text, media and enhancements.</p>
                        
                        <div className={`border rounded-lg overflow-visible shadow-sm relative ${theme === 'dark' ? 'border-slate-700 bg-[#18191A]' : 'border-slate-200 bg-white'}`}>
                          <div className={`p-4 border-b flex items-start gap-3 ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-slate-500 text-lg leading-none shrink-0">ⓘ</span>
                            <div className={`text-[13px] flex-1 min-w-0 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                              <span className={`font-bold block mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Expand each post to customize its text</span>
                              Edit primary text and add a headline to help ads perform better. Original text is used by default.
                            </div>
                            <span className="text-slate-500 cursor-pointer text-xl hover:text-red-400 shrink-0 leading-none">&times;</span>
                          </div>
                          
                          <div className="p-4">
                            
                            {/* 🌟 Selected Post Preview UI ក្នុង Ad Creative */}
                            <div className={`w-full border rounded-lg p-3 flex items-center justify-between mb-4 shadow-sm relative overflow-hidden group ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-white border-slate-300'}`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                {fetchingPosts ? <span className="text-slate-500 font-medium text-sm truncate block flex-1 min-w-0">⏳ កំពុងទាញយក...</span> : !selectedPostData ? <span className="text-slate-500 font-medium text-sm truncate block flex-1 min-w-0">❌ គ្មាន Post ដែលបានជ្រើសរើស</span> : (
                                  <>
                                    {selectedPostData?.full_picture ? <img src={selectedPostData.full_picture} className={`w-12 h-12 object-cover rounded-md shrink-0 border ${theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`} /> : <div className={`w-12 h-12 rounded-md shrink-0 flex items-center justify-center text-[10px] border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>No Img</div>}
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className={`font-medium text-[13px] line-clamp-2 leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedPostData?.message || "[គ្មានចំណងជើង]"}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-[#1877F2] shrink-0 px-2 font-bold">▼</span>
                            </div>
                              
                            {/* 🌟 ផ្នែកប៊ូតុងទាំង ៣ តម្រៀបគ្នារួមទាំងប៊ូតុង ជួសជុលផុស (Fix) */}
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              
                              {/* ប៊ូតុងទី១: Select Post */}
                              <button 
                                type="button" 
                                onClick={() => { setPostSelectionContext('create'); setIsPostMenuOpen(true); }} 
                                className={`flex-1 border rounded-md py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                              >
                                <span className="text-lg leading-none mb-0.5">📄</span> Select post
                              </button>

                              {/* ប៊ូតុងទី២: Create Post */}
                              <button 
                                type="button" 
                                onClick={() => setIsCreatePostOpen(true)}
                                className={`flex-1 border rounded-md py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                              >
                                + Create post
                              </button>
                            </div>
                            
                            {/* 🌟 Enter Post ID Button */}
                            <div className="mt-4">
                              <span onClick={() => setIsEnterPostIdModalOpen(true)} className="text-[#1877F2] text-[13px] font-semibold cursor-pointer hover:underline inline-block">Enter post ID</span>
                            </div>
                            
                            {/* 🌟 Call to Action Dropdown */}
                            <div className="mb-4 mt-4">
                              <label className={`block text-[13px] font-bold mb-1.5 flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                Call to action <span className={`w-3.5 h-3.5 rounded-full text-[10px] flex items-center justify-center font-bold cursor-pointer ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>i</span>
                              </label>
                              <select 
                                value={callToAction} 
                                onChange={(e) => saveParam("callToAction", e.target.value, setCallToAction)}
                                className={`w-full border rounded-md p-2.5 text-[14px] font-medium outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`}
                              >
                                <option value="SEND_MESSAGE">Send message</option>
                                <option value="LEARN_MORE">Learn more</option>
                                <option value="SHOP_NOW">Shop now</option>
                                <option value="NO_BUTTON">No button</option>
                              </select>
                            </div>

                          </div>
                        </div>
                      </div>

                      <div className={`mt-2 border-t pt-6 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full border border-[#1877F2] flex items-center justify-center shrink-0">
                             <div className="w-2.5 h-2.5 bg-[#1877F2] rounded-full"></div>
                          </div>
                          <span className={`font-bold text-[15px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Conversations</span>
                        </div>
                        <p className={`text-[13px] mb-4 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Create the messaging experience people see after they tap on your ad. <span className="text-[#1877F2] cursor-pointer hover:underline">Learn more</span></p>

                        <div className="flex gap-2 mb-4">
                           <button type="button" onClick={() => setTemplateTab("suggested")} className={`px-4 py-2 rounded-md text-[13px] font-bold transition ${templateTab === "suggested" ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-[#1877F2]') : (theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-slate-600 hover:bg-slate-100')}`}>Suggested template</button>
                           <button type="button" onClick={() => setTemplateTab("saved")} className={`px-4 py-2 rounded-md text-[13px] font-bold transition ${templateTab === "saved" ? (theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-[#1877F2]') : (theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-slate-600 hover:bg-slate-100')}`}>Saved templates</button>
                        </div>

                        <div className={`border rounded-lg p-5 mb-4 shadow-sm min-w-0 ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                           <div className={`font-bold text-sm mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Greeting</div>
                           <div className={`text-[13px] mb-4 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>{msgGreeting}</div>

                           <div className={`font-bold text-sm mb-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Questions and responses</div>
                           <div className={`text-[13px] flex flex-col gap-1.5 mb-4 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                             {msgQuestions.filter(q => q.q.trim() !== "").map((item, idx) => (
                               <div key={idx}>{idx + 1}. {item.q}</div>
                             ))}
                           </div>

                           <div className="text-[#1877F2] text-[13px] font-semibold cursor-pointer hover:underline inline-block">Add responses</div>
                        </div>

                        <div className="flex gap-3">
                           <button type="button" onClick={() => setIsEditingConversations(true)} className={`border rounded-md px-5 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                             <span>✎</span> Edit
                           </button>
                           <button type="button" className={`border rounded-md px-5 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 transition ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                             <span>+</span> Create template
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ខាងស្ដាំ៖ Ad Preview Toolbar & Cards */}
                  <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-4">
                    {/* Campaign Score */}
                    <div className={`border rounded-lg p-3 flex items-center gap-3 w-full ${theme === 'dark' ? 'bg-blue-950/30 border-blue-800' : 'bg-[#E7F3FF] border-[#1877F2]'}`}>
                      <div className="w-10 h-10 shrink-0 rounded-full bg-white border-[3px] border-[#31A24C] flex items-center justify-center text-[13px] font-bold text-[#050505]">100</div>
                      <div className="min-w-0">
                        <div className={`font-semibold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Campaign score ⓘ</div>
                        <div className={`text-[12px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>You're using our recommended setup.</div>
                      </div>
                    </div>

                    {/* Preview Area */}
                    <div className={`rounded-lg border overflow-hidden shadow-inner flex flex-col h-full w-full ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-[#F0F2F5] border-gray-300'}`}>
                      <div className={`border-b ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                        <div className={`flex justify-between items-center p-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-5 bg-[#1877F2] rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div></div>
                            <span className={`font-semibold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Ad preview</span>
                          </div>
                          <div className={`flex rounded p-0.5 border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-[#F5F6F8] border-gray-200'}`}>
                            <button type="button" className={`px-3 py-1 rounded shadow-sm text-[12px] font-semibold text-[#1877F2] ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-white'}`}>Ad</button>
                            <button type="button" className={`px-3 py-1 text-[12px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Destination</button>
                          </div>
                        </div>
                        
                        {/* 🌟 Real Placement Switcher (Dropdown) */}
                        <div className={`flex items-center justify-between p-2 overflow-x-auto min-w-0 shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" className={`w-8 h-8 rounded flex items-center justify-center border border-transparent ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C] hover:border-slate-600' : 'text-[#65676B] hover:bg-gray-100 hover:border-gray-200'}`}>💻</button>
                            <button type="button" className={`w-12 h-8 rounded flex items-center justify-center gap-1 text-[10px] border border-transparent ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C] hover:border-slate-600' : 'text-[#65676B] hover:bg-gray-100 hover:border-gray-200'}`}>📱 ▼</button>
                            <div className={`h-4 w-px mx-2 ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                            
                            <div className="relative group">
                              <select value={previewMode} onChange={(e) => setPreviewMode(e.target.value)} className={`appearance-none border rounded-md px-3 py-1.5 pr-8 text-[12px] font-bold outline-none cursor-pointer transition shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                                  <option value="fb_feed">Facebook Feed</option>
                                  <option value="ig_feed">Instagram Feed</option>
                                  <option value="stories">Stories & Reels</option>
                                  <option value="marketplace">Marketplace</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 text-xs">▼</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" className={`w-8 h-8 rounded flex items-center justify-center text-[14px] ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>⤢</button>
                            <button type="button" className={`w-8 h-8 rounded flex items-center justify-center text-[14px] ${theme === 'dark' ? 'text-slate-400 hover:bg-[#3A3B3C]' : 'text-[#65676B] hover:bg-gray-100'}`}>➦ ▼</button>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 flex gap-4 overflow-x-auto items-start min-h-[450px] justify-center ${theme === 'dark' ? 'bg-[#18191A]' : 'bg-[#F0F2F5]'}`}>
                        {selectedPostData ? (
                          <>
                            {/* 🌟 FB Feed Card */}
                            {previewMode === "fb_feed" && (
                              <div className={`w-[280px] shrink-0 rounded-lg shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                                <div className="p-3 flex justify-between items-start">
                                  <div className="flex items-center gap-2.5">
                                    {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className={`w-9 h-9 rounded-full object-cover border ${theme === 'dark' ? 'border-slate-600' : 'border-gray-100'}`} /> : <div className="w-9 h-9 bg-gray-400 rounded-full"></div>}
                                    <div>
                                      <div className={`font-bold text-[13px] leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{selectedPageData?.name || "Page Name"}</div>
                                      <div className={`text-[11px] flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Sponsored <span className="text-[5px]">●</span> 🌎</div>
                                    </div>
                                  </div>
                                  <span className={`tracking-widest text-[16px] -mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>...</span>
                                </div>
                                <div className={`px-3 pb-2 text-[13px] break-words whitespace-normal line-clamp-3 ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                                  {selectedPostData?.message || ""}
                                </div>
                                
                                {/* 🌟 Dynamic Multi-image Grid Preview Layout */}
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

                                <div className={`px-3 py-2 flex justify-between items-center ${theme === 'dark' ? 'bg-[#3A3B3C]' : 'bg-[#F0F2F5]'}`}>
                                  <div className="flex flex-col">
                                      <span className={`text-[10px] uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>CHAT IN MESSENGER</span>
                                      <span className={`font-bold text-[14px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{callToAction === 'SEND_MESSAGE' ? 'Send message' : callToAction === 'LEARN_MORE' ? 'Learn more' : callToAction === 'SHOP_NOW' ? 'Shop now' : 'Learn more'}</span>
                                  </div>
                                  {callToAction !== 'NO_BUTTON' && (
                                    <button type="button" className={`px-3 py-1.5 rounded-md text-[13px] font-bold ${theme === 'dark' ? 'bg-[#4E4F50] text-white' : 'bg-[#E4E6EB] text-[#050505]'}`}>{callToAction === 'SEND_MESSAGE' ? 'Send' : 'More'}</button>
                                  )}
                                </div>

                                <div className={`px-3 py-2 flex justify-between text-[12px] border-t ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-[#65676B]'}`}>
                                  <div className="flex gap-4 font-semibold">
                                    <span className="cursor-pointer hover:text-blue-500 transition">👍 {selectedPostData?.likesCount > 0 ? selectedPostData.likesCount : 'Like'}</span>
                                    <span className="cursor-pointer hover:text-blue-500 transition">💬 {selectedPostData?.commentsCount > 0 ? selectedPostData.commentsCount : 'Comment'}</span>
                                    <span className="cursor-pointer hover:text-blue-500 transition">⤴️ {selectedPostData?.sharesCount > 0 ? selectedPostData.sharesCount : 'Share'}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 🌟 IG Feed Card */}
                            {previewMode === "ig_feed" && (
                              <div className={`w-[280px] shrink-0 rounded-lg shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#000000] border-slate-800' : 'bg-white border-gray-200'}`}>
                                <div className={`p-3 flex justify-between items-center border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                                  <div className="flex items-center gap-2">
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
                                <div className={`px-3 py-2 flex justify-between items-center border-y ${theme === 'dark' ? 'bg-[#121212] border-slate-800' : 'bg-[#F0F2F5] border-gray-200'}`}>
                                  <span className={`font-bold text-[13px] flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>💬 Chat in Messenger</span>
                                  <span className="text-[#1877F2] text-[14px] font-bold">›</span>
                                </div>
                                <div className={`p-3 ${theme === 'dark' ? 'bg-[#000000]' : 'bg-white'}`}>
                                  <div className={`flex gap-3 text-[18px] mb-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}><span className="cursor-pointer">♡</span><span className="cursor-pointer">🗨</span><span className="cursor-pointer">↗</span></div>
                                  <div className={`text-[12px] line-clamp-2 mt-1 break-words whitespace-normal ${theme === 'dark' ? 'text-slate-300' : 'text-[#262626]'}`}><span className="font-bold">{selectedPageData?.name || "Page"}</span> {selectedPostData?.message}</div>
                                </div>
                              </div>
                            )}

                            {/* 🌟 Stories & Reels Card */}
                            {previewMode === "stories" && (
                              <div className="w-[240px] h-[426px] shrink-0 bg-black rounded-lg shadow-lg border border-slate-700 overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200 mx-auto">
                                  {selectedPostData?.full_picture ? (
                                    <img src={selectedPostData.full_picture} className="absolute inset-0 w-full h-full object-cover opacity-85" alt="Ad" />
                                  ) : (
                                    <div className="absolute inset-0 w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">No Image</div>
                                  )}
                                  <div className="absolute top-0 left-0 right-0 p-3 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent">
                                    {selectedPageData?.picture?.data?.url ? <img src={selectedPageData.picture.data.url} className="w-8 h-8 rounded-full object-cover border border-white/50" /> : <div className="w-8 h-8 bg-gray-400 rounded-full border border-white/50"></div>}
                                    <div className="text-white">
                                        <div className="font-bold text-[12px] shadow-sm">{selectedPageData?.name || "Page Name"}</div>
                                        <div className="text-[10px] font-medium opacity-80">Sponsored</div>
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 pb-6">
                                    <div className="text-white text-[12px] line-clamp-3 leading-snug drop-shadow-md">
                                        {selectedPostData?.message || ""}
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-center py-2 rounded-full font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer hover:bg-white/30 transition shadow-lg mt-1">
                                        Send Message
                                    </div>
                                  </div>
                              </div>
                            )}

                            {/* 🌟 Marketplace Card */}
                            {previewMode === "marketplace" && (
                              <div className={`w-[280px] shrink-0 rounded-lg shadow border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 mx-auto ${theme === 'dark' ? 'bg-[#242526] border-slate-700' : 'bg-white border-gray-200'}`}>
                                  <div className={`p-3 flex items-center justify-between border-b ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-700' : 'bg-slate-50 border-gray-100'}`}>
                                    <span className={`font-bold text-[13px] ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>Marketplace</span>
                                    <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>Sponsored</span>
                                  </div>
                                  <div className="aspect-square w-full relative">
                                    {selectedPostData?.full_picture ? (
                                        <img src={selectedPostData.full_picture} className="w-full h-full object-cover" alt="Ad" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#18191A] text-slate-500' : 'bg-gray-100 text-slate-400'}`}>No Image</div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white font-bold px-2 py-1 rounded text-xs backdrop-blur-sm">$25</div>
                                  </div>
                                  <div className={`p-3 ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
                                    <div className={`font-bold text-[14px] line-clamp-1 mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>{selectedPageData?.name || "Product"}</div>
                                    <div className={`text-[12px] line-clamp-2 mb-3 leading-snug ${theme === 'dark' ? 'text-slate-400' : 'text-[#65676B]'}`}>{selectedPostData?.message || ""}</div>
                                    <button className={`w-full py-1.5 rounded-md text-[13px] font-bold transition ${theme === 'dark' ? 'bg-[#3A3B3C] text-white hover:bg-[#4E4F50]' : 'bg-[#E4E6EB] text-[#050505] hover:bg-slate-200'}`}>Shop Now</button>
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
                  </div>

                </div>

                {/* Bottom Sticky Action Bar */}
                <div className={`fixed bottom-0 left-0 md:left-[260px] right-0 border-t p-4 flex justify-between items-center z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-white border-slate-300'}`}>
                   <div className={`text-[13px] hidden sm:block ml-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>By clicking Publish, you acknowledge that your use of Meta's ad tools is subject to our <span className="text-[#1877F2] cursor-pointer hover:underline">Terms and Conditions</span>.</div>
                   <div className="flex gap-3 w-full sm:w-auto justify-end mr-4">
                      <button type="button" className={`px-6 py-2 border rounded-lg font-bold text-[14px] transition shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Close</button>
                      <button 
                        type="submit" 
                        disabled={loading || !selectedPost || isBudgetError}
                        className={`px-10 py-2 rounded-lg text-white font-bold text-[14px] transition shadow-md ${loading || !selectedPost || isBudgetError ? (theme === 'dark' ? 'bg-[#3A3B3C] text-slate-500' : 'bg-[#E4E6EB] text-[#BCC0C4]') : 'bg-[#1877F2] hover:bg-[#166FE5]'}`}
                      >
                        {loading ? "Publishing..." : "Publish"}
                      </button>
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

                  <div className={`px-4 py-2 border-b flex items-center gap-2 ${theme === 'dark' ? 'border-slate-700 bg-[#242526]' : 'border-slate-200 bg-white'}`}>
                    <div className="text-[12px] text-slate-500 font-medium whitespace-nowrap">Filter by:</div>
                    <select className={`border rounded p-1.5 text-[12px] font-semibold outline-none ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}>
                      <option>Published posts</option>
                    </select>
                    <div className="relative w-full max-w-sm ml-2">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                      <input type="text" placeholder="Post, image or video IDs, or other keywords" className={`w-full border rounded p-1.5 pl-7 text-[12px] outline-none ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} />
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
                        {fetchingPosts ? (
                          <tr>
                            <td colSpan={6} className="text-center py-20 text-slate-500 font-medium text-[14px]">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                              កំពុងទាញយកទិន្នន័យពី Facebook...
                            </td>
                          </tr>
                        ) : posts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-20 text-slate-400 font-medium">គ្មាន Post ណាមួយត្រូវបានរកឃើញទេ។</td>
                          </tr>
                        ) : (
                          posts.map((post) => {
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
                                        {post.message || "[គ្មានអត្ថបទ]"}
                                      </span>
                                      {/* 🌟 ទិន្នន័យ Like, Comment, Share រស់រវើក */}
                                      <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500 mt-2">
                                        <span className="flex items-center gap-1.5">
                                          <div className="w-3.5 h-3.5 bg-[#F5C33B] text-white rounded-full flex items-center justify-center text-[8px]">👍</div> 
                                          {post.likesCount}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <div className="w-3.5 h-3.5 bg-slate-300 text-white rounded-full flex items-center justify-center text-[8px] transform scale-x-[-1]">💬</div> 
                                          {post.commentsCount}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <div className="w-3.5 h-3.5 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-[9px]">➦</div> 
                                          {post.sharesCount}
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
                        )}
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

            {/* 🌟 Enter Post ID Modal (Feature ថ្មីទី ២) */}
            {isEnterPostIdModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-100">
                  <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h2 className="font-bold text-lg text-slate-800">Enter post ID</h2>
                    <button type="button" onClick={() => setIsEnterPostIdModalOpen(false)} className="text-slate-400 hover:text-slate-800 text-[24px] px-2 leading-none transition">&times;</button>
                  </div>
                  <div className="p-6 bg-slate-50">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Paste the Facebook Post ID here:</label>
                    <input 
                      type="text" 
                      value={manualPostId} 
                      onChange={(e) => setManualPostId(e.target.value)} 
                      placeholder="e.g. 1528587352398698" 
                      className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition text-[14px] bg-white shadow-sm"
                    />
                    <p className="text-[12px] text-slate-500 mt-3">Enter the ID of an existing post on your Facebook Page to use it as an ad.</p>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsEnterPostIdModalOpen(false)} className="px-5 py-2 border border-slate-300 rounded-md font-bold text-[14px] text-slate-700 hover:bg-slate-50 transition shadow-sm">Cancel</button>
                      <button 
                        type="button" 
                        disabled={!manualPostId.trim()}
                        onClick={handleEnterPostIdSubmit} 
                        className="px-6 py-2 rounded-md font-bold text-[14px] text-white bg-[#0064E0] hover:bg-[#0054BD] disabled:bg-[#E4E6EB] disabled:text-[#BCC0C4] transition shadow-md"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🌟 Enter Post ID Modal (Feature ថ្មីទី ២) */}
            {isEnterPostIdModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-100">
                  <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h2 className="font-bold text-lg text-slate-800">Enter post ID</h2>
                    <button type="button" onClick={() => setIsEnterPostIdModalOpen(false)} className="text-slate-400 hover:text-slate-800 text-[24px] px-2 leading-none transition">&times;</button>
                  </div>
                  <div className="p-6 bg-slate-50">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Paste the Facebook Post ID here:</label>
                    <input 
                      type="text" 
                      value={manualPostId} 
                      onChange={(e) => setManualPostId(e.target.value)} 
                      placeholder="e.g. 1528587352398698" 
                      className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition text-[14px] bg-white shadow-sm"
                    />
                    <p className="text-[12px] text-slate-500 mt-3">Enter the ID of an existing post on your Facebook Page to use it as an ad.</p>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex justify-end items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsEnterPostIdModalOpen(false)} className="px-5 py-2 border border-slate-300 rounded-md font-bold text-[14px] text-slate-700 hover:bg-slate-50 transition shadow-sm">Cancel</button>
                      <button 
                        type="button" 
                        disabled={!manualPostId.trim()}
                        onClick={handleEnterPostIdSubmit} 
                        className="px-6 py-2 rounded-md font-bold text-[14px] text-white bg-[#0064E0] hover:bg-[#0054BD] disabled:bg-[#E4E6EB] disabled:text-[#BCC0C4] transition shadow-md"
                      >
                        Submit
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
                <div className={`flex justify-between items-center p-2.5 border-b sticky top-[64px] z-10 transition-colors ${theme === 'dark' ? 'bg-[#242526] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveTab("CREATE")}
                      className="bg-[#008060] hover:bg-[#006e52] text-white font-bold py-1.5 px-3.5 rounded text-[13px] flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-transparent"
                    >
                      <span>+</span> Create
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedCampaigns.length === 0) {
                          alert("⚠️ សូមជ្រើសរើស Campaign យ៉ាងហោចណាស់ ១ ជាមុនសិន!");
                          return;
                        }
                        handleOpenDuplicateModal();
                      }}
                      className="font-bold py-1.5 px-3.5 rounded text-[13px] flex items-center gap-1.5 transition shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                    >
                      {isDuplicating ? (
                        <>⏳ Duplicating...</>
                      ) : (
                        <><span className="text-sm">📄</span> Duplicate</>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleEditCampaign()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3.5 rounded text-[13px] flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-transparent"
                    >
                      <span className="text-sm">✎</span> Edit
                    </button>
                    <button onClick={handleDeleteCampaigns} disabled={selectedCampaigns.length === 0} className={`font-semibold py-1.5 px-2.5 rounded text-[13px] flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 border cursor-pointer ${theme === 'dark' ? 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-900/40' : 'bg-white border-slate-300 text-red-600 hover:bg-red-50'}`}>
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}><span className="w-2 h-2 rounded-full bg-slate-400"></span> Updated just now</span>
                    <button onClick={fetchCampaigns} className={`transition text-base p-1 cursor-pointer ${theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-800'}`} title="Refresh">🔄</button>
                    <button className={`font-semibold py-1.5 px-3 rounded border transition cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] hover:bg-[#4E4F50] text-slate-200 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}>Discard drafts</button>
                    <button className="bg-[#1877F2] hover:bg-[#0054BD] text-white font-bold py-1.5 px-3 rounded transition cursor-pointer shadow-sm border border-transparent">Review and publish</button>
                  </div>
                </div>

                {/* 🌟 ផ្ទាំង Tabs ៣ ដូច Facebook Ads Manager */}
                <div className={`px-3 pt-2 border-b flex justify-between items-end text-[13px] select-none transition-colors ${theme === 'dark' ? 'bg-[#18191A] border-slate-700 text-slate-300' : 'bg-[#F5F6F8] border-slate-200 text-slate-700'}`}>
                  <div className="flex items-center gap-1">
                    
                    {/* 1. Tab: Campaigns */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer ${activeManageTab === 'CAMPAIGNS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => setActiveManageTab('CAMPAIGNS')} className="flex items-center gap-1.5 cursor-pointer">
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
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer ${activeManageTab === 'ADSETS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => setActiveManageTab('ADSETS')} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-indigo-500 font-bold">⊞</span> {selectedCampaigns.length > 0 ? `Ad sets for ${selectedCampaigns.length} Campaign` : 'Ad sets'}
                      </button>
                    </div>

                    {/* 3. Tab: Ads */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 border-t border-l border-r rounded-t-md transition cursor-pointer ${activeManageTab === 'ADS' ? (theme === 'dark' ? 'bg-[#242526] border-slate-700 border-b-[#242526] font-bold text-white -mb-[1px] shadow-sm' : 'bg-white border-slate-300 border-b-white font-bold text-slate-900 -mb-[1px] shadow-sm') : (theme === 'dark' ? 'border-transparent hover:bg-[#3A3B3C]' : 'border-transparent hover:bg-slate-200/60')}`}>
                      <button onClick={() => setActiveManageTab('ADS')} className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-sky-500 font-bold">📄</span> {selectedCampaigns.length > 0 ? `Ads for ${selectedCampaigns.length} Campaign` : 'Ads'}
                      </button>
                    </div>

                  </div>

                  <div className="flex gap-2 pb-1.5">
                    <button className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[12px] font-semibold shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Columns: Performance ▼</button>
                    <button className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-[12px] font-semibold shadow-xs cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-slate-200 hover:bg-[#4E4F50]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Breakdown ▼</button>
                  </div>
                </div>

                {/* 🌟 តារាងទិន្នន័យ (ឆ្លាស់គ្នាទៅតាម Tab) */}
                <div className={`flex-1 overflow-auto relative transition-colors h-[500px] lg:h-[calc(100vh-230px)] ${theme === 'dark' ? 'bg-[#242526]' : 'bg-white'}`}>
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
                    <table className="w-full text-left border-collapse min-w-[1500px]">
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
                            <td colSpan={12} className={`p-10 text-center font-medium ${theme === 'dark' ? 'bg-[#242526] text-slate-500' : 'bg-slate-50 text-slate-500'}`}>No campaigns found.</td>
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
                                        // ថែម ID ចូលទៅក្នុង List ដែលបានជ្រើសរើសស្រាប់
                                        setSelectedCampaigns([...selectedCampaigns, c.id]);
                                      } else {
                                        // ដក ID ចេញពី List ពេលយើង Uncheck
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
                                  {c.effective_status === 'ACTIVE' ? (
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#31A24C]"></span> Active</span>
                                  ) : c.effective_status === 'PAUSED' ? (
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#BCC0C4]"></span> Off</span>
                                  ) : (
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> {c.effective_status || c.status}</span>
                                  )}
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
                    </table>
                  )}

                  {/* ========================================================= */}
                  {/* 2. TABLE: AD SETS */}
                  {/* ========================================================= */}
                  {activeManageTab === 'ADSETS' && (
                    <div className="w-full">
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

                  {activeManageTab === 'ADS' && (
                  <table className="w-full text-left border-collapse min-w-[1500px]">
                    <thead className={`sticky top-0 z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] ${theme === 'dark' ? 'bg-[#18191A] text-slate-400' : 'bg-[#F5F6F8] text-[#65676B]'}`}>
                      <tr className="text-[12px]">
                        <th className={`p-3 border-r w-10 text-center ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><input type="checkbox" className="w-3.5 h-3.5 accent-[#1877F2]" /></th>
                        <th className={`p-3 border-r w-16 text-center font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Off / On</th>
                        <th className={`p-3 border-r min-w-[280px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Ad name</th>
                        <th className={`p-3 border-r min-w-[120px] font-bold ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Delivery</th>
                        <th className={`p-3 border-r min-w-[140px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Results</th>
                        <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Cost per result</th>
                        <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Budget</th>
                        <th className={`p-3 border-r min-w-[120px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Amount spent</th>
                        <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Impressions</th>
                        <th className={`p-3 border-r min-w-[100px] font-bold text-right ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Reach</th>
                        <th className="p-3 min-w-[100px] font-bold">Ends</th>
                      </tr>
                    </thead>
                    <tbody className={`text-[13px] ${theme === 'dark' ? 'text-slate-300' : 'text-[#050505]'}`}>
                      {loadingAds ? (
                        <tr><td colSpan={11} className="p-10 text-center text-slate-500">កំពុងទាញយកបញ្ជី Ads...</td></tr>
                      ) : adsList.length === 0 ? (
                        <tr><td colSpan={11} className="p-10 text-center text-slate-500">រកមិនឃើញ Ads ក្រោម Campaign នេះទេ</td></tr>
                      ) : (
                        adsList.map((ad) => {
                          // 🌟 គន្លឹះសំខាន់: ចាប់យកទិន្នន័យឱ្យត្រូវរចនាសម្ព័ន្ធពិតប្រាកដរបស់ Facebook
                          const ins = ad.insights && ad.insights.data && ad.insights.data.length > 0 ? ad.insights.data[0] : null;
                          
                          // ទាញយក Results
                          let results: string | number = "-";
                          if (ins && ins.actions) {
                            const actionObj = ins.actions.find((a: any) => 
                                a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || 
                                a.action_type === 'onsite_conversion.messaging_first_reply' || 
                                a.action_type === 'post_engagement' || 
                                a.action_type === 'link_click'
                            );
                            if (actionObj) results = actionObj.value;
                          }

                          const spend = ins?.spend || 0;
                          const impressions = ins?.impressions || 0;
                          const reach = ins?.reach || 0;
                          const cpa = (results !== "-" && spend && Number(results) > 0) ? (Number(spend) / Number(results)) : null;

                          return (
                            <tr key={ad.id} className={`border-b transition min-h-[48px] ${theme === 'dark' ? 'border-slate-700 hover:bg-[#3A3B3C]' : 'border-slate-200 hover:bg-slate-50'}`}>
                              <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}><input type="checkbox" className="w-3.5 h-3.5 accent-[#1877F2] cursor-pointer" /></td>
                              
                              {/* 🌟 ប៊ូតុង Toggle Switch (Off/On) អាចចុចបាន */}
                              <td className={`p-3 border-r text-center align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div 
                                  onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                                  className={`w-8 h-4 rounded-full mx-auto relative cursor-pointer transition-colors ${ad.status === 'ACTIVE' ? 'bg-[#1877F2]' : 'bg-[#BCC0C4]'}`}
                                >
                                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] transition-all ${ad.status === 'ACTIVE' ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                </div>
                              </td>

                              <td className={`p-3 border-r font-semibold text-[#1877F2] hover:underline cursor-pointer align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded bg-slate-800 flex items-center justify-center text-white text-xs overflow-hidden shrink-0 shadow-xs">
                                    {ad.creative?.thumbnail_url ? <img src={ad.creative.thumbnail_url} className="w-full h-full object-cover" /> : '👟'}
                                  </div>
                                  <span className="truncate max-w-[220px]">{ad.name}</span>
                                </div>
                              </td>
                              <td className={`p-3 border-r align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${ad.effective_status === 'ACTIVE' ? 'bg-[#31A24C]' : 'bg-slate-400'}`}></span> {ad.effective_status || ad.status}</span>
                              </td>
                              
                              <td className={`p-3 border-r text-right align-middle min-w-[150px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="font-semibold">{results === "-" ? "-" : formatNumber(results)}</div>
                                <div className="text-[10px] text-slate-500 uppercase mt-0.5">Results</div>
                              </td>

                              <td className={`p-3 border-r text-right align-middle min-w-[120px] ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="font-semibold">{cpa ? "$" + cpa.toFixed(2) : "-"}</div>
                                <div className="text-[10px] text-slate-500 uppercase mt-0.5">Per Result</div>
                              </td>

                              <td className={`p-3 border-r text-right align-middle text-slate-500 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>Using ad set budget</td>
                              
                              <td className={`p-3 border-r text-right font-bold align-middle ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>
                                ${Number(spend).toFixed(2)}
                              </td>
                              
                              <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(impressions)}</td>
                              <td className={`p-3 border-r text-right align-middle ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>{formatNumber(reach)}</td>
                              <td className={`p-3 text-[12px] align-middle ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Ongoing</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
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
      {/* 🌟 ផ្ទាំង Pop-up សម្រាប់ Quick Edit (ស្ដង់ដារ Facebook) */}
      {/* ============================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all ${theme === 'dark' ? 'bg-[#242526] border border-slate-700' : 'bg-white border border-slate-100'}`}>
            
            <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <h2 className={`font-bold text-lg flex items-center gap-2.5 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">✏️</span> កែប្រែយុទ្ធនាការរហ័ស
              </h2>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-[24px] leading-none text-slate-400 hover:text-red-500">&times;</button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              
              {/* ១. ចំណងជើងយុទ្ធនាការ */}
              <div>
                <label className={`block text-[14px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>១. ចំណងជើងយុទ្ធនាការ (Campaign Name)</label>
                <input type="text" value={editCampaignName} onChange={(e) => setEditCampaignName(e.target.value)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>

              {/* ២. ថវិកា */}
              <div>
                <label className={`block text-[14px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>២. ថវិកា (Budget)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 font-bold text-slate-500">$</span>
                  <input type="number" min="1" step="0.5" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className={`w-full border rounded-xl p-3 pl-8 outline-none focus:border-blue-500 font-bold text-[15px] ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                </div>
              </div>

              {/* ៣. កាលវិភាគ (Schedule) */}
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <label className={`block text-[14px] font-bold mb-3 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>៣. កាលវិភាគ (Schedule)</label>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                       <span className="block text-[12px] mb-1.5 text-slate-500 font-bold uppercase">ថ្ងៃចាប់ផ្តើម (Start)</span>
                       <input type="datetime-local" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className={`w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 text-[13.5px] cursor-pointer ${theme === 'dark' ? 'bg-[#3A3B3C] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'}`} />
                    </div>
                    <div className="flex-1">
                       <span className="block text-[12px] mb-1.5 text-[#1877F2] font-bold uppercase">ថ្ងៃបញ្ចប់ (End)</span>
                       <input type="datetime-local" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] text-[13.5px] font-bold cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-[#3A3B3C] border-[#1877F2]/50 text-white' : 'bg-white border-[#1877F2]/30 text-slate-900'}`} />
                    </div>
                 </div>
              </div>

            </div>

            <div className={`p-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={`px-5 py-2.5 rounded-xl font-bold text-[14px] border transition ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-[#18191A]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>បោះបង់</button>
              <button type="button" onClick={handleSaveQuickEdit} disabled={isSavingEdit || !editCampaignName} className="px-8 py-2.5 rounded-xl font-bold text-[14px] text-white bg-[#1877F2] hover:bg-[#166FE5] shadow-sm disabled:opacity-50">
                {isSavingEdit ? 'កំពុងរក្សាទុក...' : '✓ រក្សាទុក'}
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
          <div className={`rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col transform transition-all ${theme === 'dark' ? 'bg-[#242526] border border-slate-700' : 'bg-white border border-slate-100'}`}>
            
            <div className={`px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <h2 className={`font-bold text-lg flex items-center gap-2.5 ${theme === 'dark' ? 'text-white' : 'text-[#050505]'}`}>
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">📄</span> Duplicate & Edit Ad
              </h2>
              <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className="text-[24px] leading-none text-slate-400 hover:text-red-500 cursor-pointer">&times;</button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* ដូរឈ្មោះ Ad */}
              <div>
                <label className={`block text-[14px] font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Ad name (ឈ្មោះការផ្សាយ)</label>
                <input type="text" value={duplicateAdName} onChange={(e) => setDuplicateAdName(e.target.value)} className={`w-full border rounded-xl p-3 outline-none focus:border-blue-500 font-semibold ${theme === 'dark' ? 'bg-[#18191A] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
              </div>

              {/* ដូរ Post (Ad Creative) */}
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#18191A] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <label className={`block text-[14px] font-bold mb-3 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Ad creative (ជ្រើសរើស Post ថ្មី)</label>
                 
                 <div className={`w-full border rounded-lg p-3 flex items-center justify-between mb-4 shadow-sm ${theme === 'dark' ? 'bg-[#242526] border-slate-600' : 'bg-white border-slate-300'}`}>
                   <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                     {posts.find(p => p.id === duplicatePostId)?.full_picture ? (
                        <img src={posts.find(p => p.id === duplicatePostId)?.full_picture} className="w-12 h-12 object-cover rounded-md border" />
                     ) : (
                        <div className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center text-[10px]">No Img</div>
                     )}
                     <div className="flex flex-col min-w-0 flex-1">
                       <span className={`font-medium text-[13px] line-clamp-2 leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                         {posts.find(p => p.id === duplicatePostId)?.message || "[គ្មានចំណងជើង] ឬមិនទាន់ជ្រើសរើស"}
                       </span>
                     </div>
                   </div>
                 </div>

                 <button 
                   type="button" 
                   onClick={() => { setPostSelectionContext('duplicate'); setIsPostMenuOpen(true); }} 
                   className="w-full rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition shadow-md cursor-pointer"
                 >
                   <span className="text-lg leading-none mb-0.5">📄</span> Select new post
                 </button>
              </div>
            </div>

            <div className={`p-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-slate-700 bg-[#3A3B3C]' : 'border-slate-200 bg-slate-50'}`}>
              <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className={`px-5 py-2.5 rounded-xl font-bold text-[14px] border transition cursor-pointer ${theme === 'dark' ? 'bg-[#242526] border-slate-600 text-slate-300 hover:bg-[#18191A]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>បោះបង់</button>
              <button type="button" onClick={executeDuplicate} className="px-8 py-2.5 rounded-xl font-bold text-[14px] text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {isDuplicating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Duplicating...</> : '📄 Duplicate Ad'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

