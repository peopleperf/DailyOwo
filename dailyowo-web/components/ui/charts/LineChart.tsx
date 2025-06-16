'use client';

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
  Filler,
  ChartOptions
} from 'chart.js';
import { GlassContainer } from '../GlassContainer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
    }[];
  };
  height?: number;
  showLegend?: boolean;
  currency?: string;
}

export default function LineChart({ 
  title, 
  data, 
  height = 300,
  showLegend = true,
  currency = 'USD'
}: LineChartProps) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: '#262659',
          font: {
            size: 12,
            family: 'Inter'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#262659',
        bodyColor: '#262659',
        borderColor: '#A67C00',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(38, 38, 89, 0.05)'
        },
        ticks: {
          color: '#262659',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(38, 38, 89, 0.05)'
        },
        ticks: {
          color: '#262659',
          font: {
            size: 11
          },
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
              notation: 'compact'
            }).format(value as number);
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  // Apply default styling to datasets
  const styledData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || (index === 0 ? '#A67C00' : '#262659'),
      backgroundColor: dataset.backgroundColor || (index === 0 ? 'rgba(166, 124, 0, 0.1)' : 'rgba(38, 38, 89, 0.1)'),
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: dataset.borderColor || (index === 0 ? '#A67C00' : '#262659'),
      pointBorderWidth: 2,
      tension: dataset.tension || 0.4,
      fill: dataset.fill !== false
    }))
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Line options={options} data={styledData} />
      </div>
    </div>
  );
} 