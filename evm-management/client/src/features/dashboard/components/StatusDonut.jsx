import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '@/components/common/LanguageContext';

const STATUS_COLORS = {
  IN_WAREHOUSE: '#2563EB',      // Blue
  IN_TRANSIT: '#D97706',        // Amber
};

const STATUS_LABELS = {
  IN_WAREHOUSE: 'In Warehouse',
  IN_TRANSIT: 'Receiving pending',
};

export default function StatusDonut({ data }) {
  const { t } = useTranslation();

  // Format data for Recharts: expect objects like { status, count }
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: t(STATUS_LABELS[item.status] || item.status),
      value: item.count,
      statusKey: item.status,
    }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-bold font-sans text-navy-900 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">
        {t('EVM Inventory Status Allocation')}
      </h3>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 font-sans">
            {t('No status distribution data available.')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.statusKey] || '#8A95A3'}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={40}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  color: '#4A5568',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
