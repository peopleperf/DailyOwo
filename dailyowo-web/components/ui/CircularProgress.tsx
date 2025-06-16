'use client';

import { motion } from 'framer-motion';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export default function CircularProgress({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  showPercentage = true,
  className = '' 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color coding based on score
  const getColor = (score: number) => {
    if (score >= 85) return '#22c55e'; // Green
    if (score >= 70) return '#3b82f6'; // Blue  
    if (score >= 55) return '#eab308'; // Yellow
    if (score >= 35) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Background color for circle
  const getBgColor = (score: number) => {
    if (score >= 85) return '#dcfce7'; // Green bg
    if (score >= 70) return '#dbeafe'; // Blue bg
    if (score >= 55) return '#fef3c7'; // Yellow bg
    if (score >= 35) return '#fed7aa'; // Orange bg
    return '#fecaca'; // Red bg
  };

  // Text color
  const getTextColor = (score: number) => {
    if (score >= 85) return 'text-green-700';
    if (score >= 70) return 'text-blue-700';
    if (score >= 55) return 'text-yellow-700';
    if (score >= 35) return 'text-orange-700';
    return 'text-red-700';
  };

  const color = getColor(percentage);
  const bgColor = getBgColor(percentage);
  const textColor = getTextColor(percentage);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          strokeLinecap="round"
        />
      </svg>
      
      {showPercentage && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <span className={`text-2xl font-bold ${textColor}`}>
            {Math.round(percentage)}%
          </span>
        </motion.div>
      )}
    </div>
  );
} 