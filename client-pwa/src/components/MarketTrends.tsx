import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { day: 'Mon', price: 38000 },
  { day: 'Tue', price: 39500 },
  { day: 'Wed', price: 38800 },
  { day: 'Thu', price: 41000 },
  { day: 'Fri', price: 43500 },
  { day: 'Sat', price: 45000 },
];

export const MarketTrends: React.FC = () => {
  return (
    <div className="w-full h-64 bg-[#1B4332]/5 border border-[#1B4332]/20 rounded-[2rem] p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          7D Price Movement
        </h3>
        <span className="text-[10px] font-bold text-[#FFB703]">
          Millet / Dawanau
        </span>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB703" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FFB703" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B4332" vertical={false} opacity={0.2} />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0a1a14', 
              border: '1px solid #1B4332', 
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#F4F4F4'
            }}
            itemStyle={{ color: '#FFB703' }}
            cursor={{ stroke: '#1B4332', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#FFB703" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};