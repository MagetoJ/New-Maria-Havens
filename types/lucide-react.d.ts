// Type declarations for Lucide React components
declare module 'lucide-react' {
  import * as React from 'react'

  interface LucideProps {
    color?: string
    size?: string | number
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
    className?: string
    children?: React.ReactNode
  }

  interface LucideIcon extends React.FC<LucideProps> {
    displayName?: string
  }

  // Declare all Lucide icons as React functional components
  export const ChevronLeftIcon: LucideIcon
  export const ChevronRightIcon: LucideIcon
  export const ChevronDownIcon: LucideIcon
  export const CircleIcon: LucideIcon
  export const MinusIcon: LucideIcon
  export const SearchIcon: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const CheckIcon: LucideIcon
  export const MoreHorizontalIcon: LucideIcon
  export const Eye: LucideIcon
  export const EyeOff: LucideIcon
  export const Hotel: LucideIcon
  export const Lock: LucideIcon
  export const Mail: LucideIcon
  export const Info: LucideIcon
  export const ChefHat: LucideIcon
  export const Plus: LucideIcon
  export const Edit: LucideIcon
  export const Trash2: LucideIcon
  export const Search: LucideIcon
  export const DollarSign: LucideIcon
  export const Clock: LucideIcon
  export const TrendingUp: LucideIcon
  export const UtensilsCrossed: LucideIcon
  export const Minus: LucideIcon
  export const ShoppingCart: LucideIcon
  export const CheckCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const Loader2: LucideIcon
  export const Shield: LucideIcon
  export const TrendingDown: LucideIcon
  export const CreditCard: LucideIcon
  export const PieChart: LucideIcon
  export const Download: LucideIcon
  export const Filter: LucideIcon
  export const XCircle: LucideIcon
  export const Phone: LucideIcon
  export const Wifi: LucideIcon
  export const Tv: LucideIcon
  export const Coffee: LucideIcon
  export const Key: LucideIcon
  export const Bell: LucideIcon
  export const Calendar: LucideIcon
  export const Users: LucideIcon
  export const Bed: LucideIcon
  export const Settings: LucideIcon
  
  // Add more icons as needed...
}