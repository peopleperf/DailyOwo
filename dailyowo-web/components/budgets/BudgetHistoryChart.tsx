'use client';

import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { BudgetHistoryData } from '@/lib/financial-logic/budget-period-logic';
import { formatCurrency } from '@/lib/utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetHistoryChartProps {
  history: BudgetHistoryData;
  currency: string;
  view: 'income-expense' | 'savings-rate' | 'budget-health';
}

export function BudgetHistoryChart({ history, currency, view }: BudgetHistoryChartProps) {
  const months = history.months.slice(-12); // Show last 12 months
  const labels = months.map(m => m.monthName.split(' ')[0]); // Just month name

  const getChartData = () => {
    switch (view) {
      case 'income-expense':
        return {
          labels,
          datasets: [
            {
              label: 'Income',
              data: months.map(m => m.actualIncome),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Expenses',
              data: months.map(m => m.totalSpent),
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Budget',
              data: months.map(m => m.totalAllocated),
              borderColor: '#D4AF37',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderDash: [5, 5],
              tension: 0.4,
            },
          ],
        };

      case 'savings-rate':
        return {
          labels,
          datasets: [
            {
              label: 'Savings Rate %',
              data: months.map(m => m.savingsRate),
              backgroundColor: months.map(m => 
                m.savingsRate >= 20 ? 'rgba(16, 185, 129, 0.8)' :
                m.savingsRate >= 10 ? 'rgba(59, 130, 246, 0.8)' :
                'rgba(239, 68, 68, 0.8)'
              ),
              borderColor: months.map(m => 
                m.savingsRate >= 20 ? '#10B981' :
                m.savingsRate >= 10 ? '#3B82F6' :
                '#EF4444'
              ),
              borderWidth: 1,
            },
          ],
        };

      case 'budget-health':
        return {
          labels,
          datasets: [
            {
              label: 'Budget Health Score',
              data: months.map(m => m.budgetHealth),
              backgroundColor: months.map(m => 
                m.budgetHealth >= 80 ? 'rgba(16, 185, 129, 0.8)' :
                m.budgetHealth >= 60 ? 'rgba(59, 130, 246, 0.8)' :
                m.budgetHealth >= 40 ? 'rgba(251, 191, 36, 0.8)' :
                'rgba(239, 68, 68, 0.8)'
              ),
              borderColor: months.map(m => 
                m.budgetHealth >= 80 ? '#10B981' :
                m.budgetHealth >= 60 ? '#3B82F6' :
                m.budgetHealth >= 40 ? '#FBBF24' :
                '#EF4444'
              ),
              borderWidth: 1,
            },
          ],
        };
    }
  };

  const getChartOptions = (): ChartOptions<'line' | 'bar'> => {
    const baseOptions = {
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
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              
              if (view === 'income-expense') {
                return `${label}: ${formatCurrency(value, { currency })}`;
              } else if (view === 'savings-rate' || view === 'budget-health') {
                return `${label}: ${value.toFixed(1)}%`;
              }
              
              return `${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => {
              if (view === 'income-expense') {
                return formatCurrency(Number(value), { currency, compact: true });
              } else if (view === 'savings-rate' || view === 'budget-health') {
                return `${value}%`;
              }
              return value;
            },
          },
          ...(view === 'savings-rate' || view === 'budget-health' ? { max: 100 } : {}),
        },
      },
    };

    return baseOptions as ChartOptions<'line' | 'bar'>;
  };

  const chartData = getChartData();
  const chartOptions = getChartOptions();

  return (
    <div className="h-64">
      {view === 'income-expense' ? (
        <Line data={chartData} options={chartOptions as ChartOptions<'line'>} />
      ) : (
        <Bar data={chartData} options={chartOptions as ChartOptions<'bar'>} />
      )}
    </div>
  );
} 