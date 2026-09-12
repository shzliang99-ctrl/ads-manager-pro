'use client';

// 🌟 បន្ថែមបន្ទាត់នេះ ដើម្បីបង្ខំឱ្យរត់ជា Dynamic Page និងការពារកុំឱ្យគាំងពេល Build នៅលើ Vercel
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SubscriptionsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form states for adding/editing client
  const [clientName, setClientName] = useState('');
  const [packageName, setPackageName] = useState('១ ខែ (Standard)');
  const [durationDays, setDurationDays] = useState(30);
  const [amountPaid, setAmountPaid] = useState('');

  // ទាញយកទិន្នន័យអតិថិជនពី Supabase
  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // មុខងារបន្ថែមអតិថិជន ឬต่อអាយុ
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return alert('សូមបញ្ចូលឈ្មោះអតិថិជន!');

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + Number(durationDays));

    const { error } = await supabase.from('customer_subscriptions').insert([
      {
        client_name: clientName,
        package_name: packageName,
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        amount: Number(amountPaid) || 0,
        status: 'active',
      },
    ]);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setClientName('');
      setAmountPaid('');
      setShowModal(false);
      fetchClients();
    }
  };

  // មុខងារលុបអតិថិជន
  const handleDelete = async (id: string) => {
    if (!confirm('តើបងពិតជាចង់លុបទិន្នន័យអតិថិជននេះមែនទេ?')) return;
    const { error } = await supabase.from('customer_subscriptions').delete().eq('id', id);
    if (!error) fetchClients();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 គ្រប់គ្រងការបង់ប្រាក់ និងសេវាកម្មអតិថិជន</h1>
          <p className="text-sm text-gray-500">តាមដានថ្ងៃផុតកំណត់ និងស្ថានភាពគណនីរបស់អតិថិជនម្នាក់ៗ</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm cursor-pointer flex items-center gap-2"
        >
          <span>➕</span> <span>បន្ថែមអតិថិជនថ្មី</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="py-3.5 px-4">ឈ្មោះអតិថិជន / ហាង</th>
                <th className="py-3.5 px-4">កញ្ចប់សេវា</th>
                <th className="py-3.5 px-4">ថ្ងៃចាប់ផ្ដើម</th>
                <th className="py-3.5 px-4">ថ្ងៃផុតកំណត់</th>
                <th className="py-3.5 px-4">ទឹកប្រាក់</th>
                <th className="py-3.5 px-4">ស្ថានភាព</th>
                <th className="py-3.5 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">កំពុងទាញយកទិន្នន័យ...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">គ្មានទិន្នន័យអតិថិជននៅឡើយទេ។</td>
                </tr>
              ) : (
                clients.map((item) => {
                  const isExpired = new Date(item.expiry_date) < new Date();
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{item.client_name}</td>
                      <td className="py-3.5 px-4 text-gray-600">{item.package_name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{new Date(item.start_date).toLocaleDateString('km-KH')}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{new Date(item.expiry_date).toLocaleDateString('km-KH')}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">${item.amount}</td>
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">🔴 ផុតកំណត់</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">🟢 ដំណើរការ</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          លុប
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding Client */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✨ បន្ថែមអតិថិជន ឬកញ្ចប់សេវាថ្មី</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ឈ្មោះអតិថិជន ឬ ឈ្មោះហាង</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ឧ. ហាងស្បែកជើង វៀរ លុច្សជុរី"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ជ្រើសរើសកញ្ចប់សេវា</label>
                <select
                  value={packageName}
                  onChange={(e) => {
                    setPackageName(e.target.value);
                    if (e.target.value.includes('១ ខែ')) setDurationDays(30);
                    else if (e.target.value.includes('៣ ខែ')) setDurationDays(90);
                    else if (e.target.value.includes('១ ឆ្នាំ')) setDurationDays(365);
                  }}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="១ ខែ (Standard)">កញ្ចប់ ១ ខែ (៣០ ថ្ងៃ)</option>
                  <option value="៣ ខែ (Pro)">កញ្ចប់ ៣ ខែ (៩០ ថ្ងៃ)</option>
                  <option value="១ ឆ្នាំ (VIP)">កញ្ចប់ ១ ឆ្នាំ (៣៦៥ ថ្ងៃ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ទឹកប្រាក់បានបង់ ($)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="ឧ. 20"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200 transition cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition cursor-pointer"
                >
                  រក្សាទុក
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}