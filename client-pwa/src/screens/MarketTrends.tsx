import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MarketPrice {
  id: string;
  crop_name: string;
  price_per_measure: number;
  market_name: string;
  trend: 'up' | 'down';
  change_percent: number;
}

export const MarketTrends = () => {
  const [trends, setTrends] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('market_intelligence')
          .select('*')
          .order('crop_name', { ascending: true });
        
        if (fetchError) throw fetchError;
        if (data) setTrends(data as MarketPrice[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1B4332]/10 border border-[#1B4332]/20 p-4 rounded-[2rem] animate-pulse">
            <div className="h-4 bg-[#1B4332]/20 rounded w-20 mb-2" />
            <div className="h-6 bg-[#1B4332]/20 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-[2rem] text-red-400 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-[#1B4332]/10 border border-[#1B4332]/20 p-4 rounded-[2rem] text-slate-400 text-sm text-center">
        No market data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {trends.map((item) => (
        <div 
          key={item.id} 
          className="bg-[#1B4332]/10 border border-[#1B4332]/20 p-4 rounded-[2rem] flex flex-col gap-2 hover:bg-[#1B4332]/15 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase">{item.crop_name}</span>
            <div className={`flex items-center gap-1 ${item.trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
              {item.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-[8px] font-bold">{item.change_percent}%</span>
            </div>
          </div>
          
          <h3 className="text-xl font-black text-white">
            ₦{item.price_per_measure.toLocaleString('en-NG')}
          </h3>
          
          <p className="text-[8px] font-bold text-[#FFB703] uppercase tracking-tighter">
            {item.market_name} Market
          </p>
        </div>
      ))}
    </div>
  );
};