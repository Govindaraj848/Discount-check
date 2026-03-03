/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home as HomeIcon, Link as LinkIcon, Barcode as BarcodeIcon, ChevronRight, Search, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

// --- Types ---

interface RowData {
  designNo: string;
  mrp: string;
  discount: string;
  color: string | null;
}

interface BarcodeData {
  BARCODE: string;
  'COMBINATION ID': string;
  'DESIGN NO': string;
}

interface ApiResponse {
  type: string;
  designNumber: string;
  oldMrp: number;
  discount: number;
  currentMrp: number;
}

// --- Components ---

const FlowerIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 100 100"
    className="w-20 h-20 drop-shadow-md transition-transform hover:scale-110"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 6 Rounded Petals */}
    <circle cx="50" cy="26" r="18" fill={color} />
    <circle cx="71" cy="38" r="18" fill={color} />
    <circle cx="71" cy="62" r="18" fill={color} />
    <circle cx="50" cy="74" r="18" fill={color} />
    <circle cx="29" cy="62" r="18" fill={color} />
    <circle cx="29" cy="38" r="18" fill={color} />
    {/* Center Circle - matching the table background */}
    <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
  </svg>
);

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Home Page', icon: HomeIcon },
    { path: '/api-link', label: 'API Link', icon: LinkIcon },
    { path: '/barcode-details', label: 'Barcode Details', icon: BarcodeIcon },
  ];

  return (
    <motion.div
      className="fixed left-0 top-0 h-full bg-[#1e1e2e] text-white z-50 shadow-2xl overflow-hidden"
      initial={{ width: '12px' }}
      animate={{ width: isHovered ? '240px' : '12px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col h-full py-8">
        <div className="px-4 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'rotate-180' : ''}`} />
          </div>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl whitespace-nowrap"
            >
              Menu
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 shrink-0" />
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
};

// --- Pages ---

const HomePage = () => {
  const [designInput, setDesignInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [barcodeMap, setBarcodeMap] = useState<BarcodeData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Barcode CSV for lookup
  useEffect(() => {
    const fetchCsv = async () => {
      try {
        const response = await fetch('/api/proxy/barcode-csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setBarcodeMap(results.data as BarcodeData[]);
          },
        });
      } catch (err) {
        console.error('Error fetching barcode map:', err);
      }
    };
    fetchCsv();
  }, []);

  const getFlowerColor = (type: string, discount: number) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('silver')) return '#0000FF'; // Blue
    if (discount === 30) return '#2E7D32'; // Green
    if (discount === 20) return '#FFFF00'; // Yellow
    if (discount === 40) return '#FF8C00'; // Orange
    return null; // Hide flower for other discounts
  };

  const fetchAndAddRow = async (designNo: string) => {
    if (!designNo) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/proxy/product-detail?designNumber=${designNo}`);
      if (!response.ok) throw new Error('Not found');
      const apiData: ApiResponse = await response.json();
      
      const newRow: RowData = {
        designNo: apiData.designNumber,
        mrp: apiData.currentMrp.toString(),
        discount: apiData.discount.toString() + '%' + (apiData.type?.toLowerCase().includes('silver') ? ' Silver' : ''),
        color: getFlowerColor(apiData.type, apiData.discount)
      };

      setTableData([newRow]); // Only show current result
    } catch (err) {
      alert('Design not found or API error');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAndAddRow(designInput);
    setDesignInput('');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = barcodeMap.find(b => b.BARCODE === barcodeInput);
    if (found) {
      fetchAndAddRow(found['DESIGN NO']);
    } else {
      alert('Barcode not found in database');
    }
    setBarcodeInput('');
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Product Discount</h1>
      </div>

      {/* Search Inputs */}
      <div className="flex flex-col md:flex-row justify-between mb-12 gap-6">
        <form onSubmit={handleDesignSubmit} className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={designInput}
            onChange={(e) => setDesignInput(e.target.value)}
            placeholder="Enter Design No"
            className="w-full bg-white border border-gray-200 rounded-2xl py-5 pl-14 pr-24 text-xl font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Design</span>
          </div>
        </form>
        
        <form onSubmit={handleBarcodeSubmit} className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <BarcodeIcon className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan Barcode"
            className="w-full bg-white border border-gray-200 rounded-2xl py-5 pl-14 pr-24 text-xl font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">Barcode</span>
          </div>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        )}
        
        <div className="grid grid-cols-4 bg-gray-50/80 border-b border-gray-100">
          <div className="p-5 text-center font-bold text-gray-500 text-xs uppercase tracking-widest">Design No</div>
          <div className="p-5 text-center font-bold text-gray-500 text-xs uppercase tracking-widest">MRP</div>
          <div className="p-5 text-center font-bold text-gray-500 text-xs uppercase tracking-widest">Discount</div>
          <div className="p-5 text-center font-bold text-gray-500 text-xs uppercase tracking-widest">Discount Image</div>
        </div>

        <div className="divide-y divide-gray-100">
          {tableData.length > 0 ? tableData.map((row, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={index} 
              className="grid grid-cols-4 min-h-[140px] hover:bg-gray-50/50 transition-colors"
            >
              <div className="p-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 font-mono">{row.designNo}</span>
              </div>
              <div className="p-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">₹{row.mrp}</span>
              </div>
              <div className="p-6 flex items-center justify-center">
                <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-lg font-bold">
                  {row.discount}
                </span>
              </div>
              <div className="p-6 flex items-center justify-center">
                {row.color && <FlowerIcon color={row.color} />}
              </div>
            </motion.div>
          )) : (
            <div className="p-24 flex flex-col items-center justify-center text-center col-span-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Yet</h3>
              <p className="text-gray-500 max-w-sm">Enter a design number or scan a barcode above to view product details and discounts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ApiLinkPage = () => {
  const [designNo, setDesignNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designNo) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/proxy/product-detail?designNumber=${designNo}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error fetching data. Please check the design number.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">API Product Search</h1>
      
      <form onSubmit={handleSearch} className="mb-12">
        <div className="relative">
          <input
            type="text"
            value={designNo}
            onChange={(e) => setDesignNo(e.target.value)}
            placeholder="Enter Design Number (e.g., 135621)"
            className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 px-6 pl-14 text-lg focus:border-indigo-500 focus:ring-0 transition-all outline-none shadow-sm"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
          >
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Design Number</p>
                <p className="text-2xl font-mono font-bold text-gray-800">{result.designNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Type</p>
                <p className="text-2xl font-bold text-gray-800">{result.type || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Old MRP</p>
                <p className="text-2xl font-bold text-gray-800">₹{result.oldMrp}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Discount</p>
                <p className="text-2xl font-bold text-emerald-600">{result.discount}%</p>
              </div>
              <div className="col-span-2 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-2">Current MRP</p>
                <p className="text-5xl font-black text-indigo-600">₹{result.currentMrp}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BarcodeDetailsPage = () => {
  const [data, setData] = useState<BarcodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/proxy/barcode-csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            setData(results.data as BarcodeData[]);
            setLoading(false);
          },
          error: (err: any) => {
            setError('Error parsing CSV data');
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error fetching CSV data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Barcode Details</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Barcode</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Combination ID</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-wider">Design No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4 font-mono text-gray-600">{row.BARCODE}</td>
                    <td className="px-8 py-4 text-gray-600">{row['COMBINATION ID']}</td>
                    <td className="px-8 py-4 font-medium text-gray-800">{row['DESIGN NO']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar />
        <main className="flex-1 p-8 pl-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/api-link" element={<ApiLinkPage />} />
            <Route path="/barcode-details" element={<BarcodeDetailsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
