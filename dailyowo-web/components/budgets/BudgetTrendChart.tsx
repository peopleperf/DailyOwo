'use client';

import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { formatCurrency } from '@/lib/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetTrendChartProps {
  trends: any; // TODO: Define proper type
  period: 'week' | 'month' | 'quarter';
  currency: string;
}

export function BudgetTrendChart({ trends, period, currency }: BudgetTrendChartProps) {
  // If no trends data, show empty state
  if (!trends || !trends[period]) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-primary/40 text-sm">No trend data available yet</p>
      </div>
    );
  }

  const data = trends[period];

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Spending',
        data: data.spending,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Budget',
        data: data.budget,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y, { currency });
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Number(value), { currency, compact: true }),
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-64"
    >
      <Line data={chartData} options={options} />
    </motion.div>
  );
} 