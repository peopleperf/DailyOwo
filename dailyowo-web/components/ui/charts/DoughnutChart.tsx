'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  title?: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  height?: number;
  showLegend?: boolean;
  currency?: string;
}

export default function DoughnutChart({
  title,
  data,
  height = 300,
  showLegend = true,
  currency = 'USD'
}: DoughnutChartProps) {
  const defaultColors = [
    '#A67C00', // Gold
    '#262659', // Primary
    '#3D3D73', // Primary Light
    '#FFB800', // Gold Light
    '#8B6914', // Gold Dark
    '#4A4A8A', // Primary Variant
    '#FFC947', // Gold Variant
    '#1A1A40', // Primary Dark
  ];

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          color: '#262659',
          font: {
            size: 12,
            family: 'Inter'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
            
            return `${label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%',
    layout: {
      padding: {
        top: 10,
        bottom: showLegend ? 0 : 10
      }
    }
  };

  // Apply default styling to datasets
  const styledData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColors,
      borderColor: dataset.borderColor || '#ffffff',
      borderWidth: dataset.borderWidth || 2,
      hoverOffset: 8
    }))
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Doughnut options={options} data={styledData} />
      </div>
    </div>
  );
} 