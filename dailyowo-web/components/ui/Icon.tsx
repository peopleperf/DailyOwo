'use client';

import { FC } from 'react';
import { 
  LucideIcon,
  // Navigation
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  
  // Finance
  DollarSign,
  Euro,
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  Calculator,
  PiggyBank,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  
  // UI
  Search,
  Filter,
  Settings,
  Bell,
  User,
  Users,
  Calendar,
  Clock,
  
  // Status
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  
  // Features
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Brain,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Categories
  ShoppingCart,
  Car,
  Home as HomeIcon,
  Utensils,
  Heart,
  Briefcase,
  GraduationCap,
  Plane,
  Gift,
  Zap,
  
  // Misc
  Globe,
  Smartphone,
  Mail,
  Camera,
  Image,
  FileText,
  Loader2,
  Cloud,
} from 'lucide-react';

// Size presets
const sizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const;

export type IconSize = keyof typeof sizeMap;

interface IconProps {
  name: string;
  size?: IconSize | number;
  className?: string;
  color?: string;
}

// Icon mapping
const iconMap: Record<string, LucideIcon | (() => React.ReactElement)> = {
  // Navigation
  home: Home,
  menu: Menu,
  close: X,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  
  // Finance
  dollar: DollarSign,
  euro: Euro,
  pound: PoundSterling,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  wallet: Wallet,
  creditCard: CreditCard,
  cash: Banknote,
  receipt: Receipt,
  calculator: Calculator,
  piggyBank: PiggyBank,
  
  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  share: Share2,
  copy: Copy,
  
  // UI
  search: Search,
  filter: Filter,
  settings: Settings,
  notification: Bell,
  user: User,
  users: Users,
  calendar: Calendar,
  clock: Clock,
  
  // Status
  check: Check,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,
  
  // Features
  goal: Target,
  barChart: BarChart3,
  pieChart: PieChart,
  lineChart: LineChart,
  ai: Brain,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  
  // Categories
  shopping: ShoppingCart,
  transport: Car,
  housing: HomeIcon,
  food: Utensils,
  health: Heart,
  work: Briefcase,
  briefcase: Briefcase,
  education: GraduationCap,
  travel: Plane,
  gift: Gift,
  utilities: Zap,
  
  // Misc
  globe: Globe,
  phone: Smartphone,
  mail: Mail,
  camera: Camera,
  image: Image,
  document: FileText,
  loader: Loader2,
  cloud: Cloud,
  google: () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
};

export function Icon({ 
  name, 
  size = 'md', 
  className = '', 
  color 
}: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Check if it's a custom icon (function returning ReactElement)
  if (!('$$typeof' in IconComponent)) {
    // It's a custom icon function
    const CustomIcon = IconComponent as () => React.ReactElement;
    return (
      <div 
        className={className}
        style={{ 
          width: iconSize, 
          height: iconSize,
          color: color 
        }}
      >
        {CustomIcon()}
      </div>
    );
  }
  
  // It's a Lucide icon component
  const LucideIconComponent = IconComponent as LucideIcon;
  return (
    <LucideIconComponent 
      size={iconSize} 
      className={className}
      color={color}
    />
  );
}

// Export individual icons for direct use
export const Icons = iconMap;

// Category icon helper
export const getCategoryIcon = (category: string): string => {
  const categoryIcons: Record<string, string> = {
    groceries: 'shopping',
    transport: 'transport',
    housing: 'housing',
    food: 'food',
    health: 'health',
    work: 'work',
    education: 'education',
    travel: 'travel',
    entertainment: 'gift',
    utilities: 'utilities',
    other: 'receipt',
  };
  
  return categoryIcons[category.toLowerCase()] || 'receipt';
}; 