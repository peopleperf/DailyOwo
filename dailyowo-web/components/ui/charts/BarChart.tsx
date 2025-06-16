'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }[];
  };
  height?: number;
  showLegend?: boolean;
  currency?: string;
  stacked?: boolean;
}

export default function BarChart({
  title,
  data,
  height = 300,
  showLegend = true,
  currency = 'USD',
  stacked = false
}: BarChartProps) {
  const options: ChartOptions<'bar'> = {
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
        stacked: stacked,
        grid: {
          display: false
        },
        ticks: {
          color: '#262659',
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: stacked,
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
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  // Apply default styling to datasets
  const defaultColors = ['#A67C00', '#262659', '#3D3D73', '#FFB800'];
  
  const styledData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length],
      borderColor: dataset.borderColor || 'transparent',
      borderWidth: dataset.borderWidth || 0,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40
    }))
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar options={options} data={styledData} />
      </div>
    </div>
  );
} 