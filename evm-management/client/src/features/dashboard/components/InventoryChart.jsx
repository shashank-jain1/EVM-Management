import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '@/components/common/LanguageContext';

export default function InventoryChart({ data }) {
  const { t } = useTranslation();

  // Format data for Recharts: expect objects like { stateName, controlUnits, ballotUnits, vvpatUnits }
  // Map or clean the keys to user-friendly titles
  const chartData = data.map((item) => ({
    name: item.stateName || 'Unknown',
    [t('Control Units')]: item.controlUnits || 0,
    [t('Ballot Units')]: item.ballotUnits || 0,
    [t('VVPATs')]: item.vvpatUnits || 0,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-bold font-sans text-navy-900 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">
        {t('EVM Allocation by State')}
      </h3>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 font-sans">
            {t('No state allocation data available.')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E6EC" />
              <XAxis
                dataKey="name"
                stroke="#8A95A3"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#8A95A3"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={-8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8CFD8',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#4A5568',
                }}
              />
              <Bar dataKey={t('Control Units')} fill="var(--color-navy-700)" radius={[2, 2, 0, 0]} />
              <Bar dataKey={t('Ballot Units')} fill="var(--color-navy-500)" radius={[2, 2, 0, 0]} />
              <Bar dataKey={t('VVPATs')} fill="var(--color-saffron-500)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
