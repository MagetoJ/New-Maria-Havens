// Global type declarations for Maria Havens POS
import * as React from 'react'

declare global {
  namespace React {
    interface ReactNode {
      bigint?: never
    }
  }
}

// Extend JSX namespace to allow Lucide React components
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

// Module declarations for better compatibility
declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'
  
  interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    strokeWidth?: string | number
  }

  export const Hotel: ComponentType<LucideProps>
  export const LayoutDashboard: ComponentType<LucideProps>
  export const Calendar: ComponentType<LucideProps>
  export const UtensilsCrossed: ComponentType<LucideProps>
  export const Users: ComponentType<LucideProps>
  export const Settings: ComponentType<LucideProps>
  export const LogOut: ComponentType<LucideProps>
  export const Menu: ComponentType<LucideProps>
  export const Bell: ComponentType<LucideProps>
  export const Search: ComponentType<LucideProps>
  export const BarChart3: ComponentType<LucideProps>
  export const DollarSign: ComponentType<LucideProps>
  export const Bed: ComponentType<LucideProps>
  export const ChefHat: ComponentType<LucideProps>
  export const Mail: ComponentType<LucideProps>
  export const Lock: ComponentType<LucideProps>
  export const Eye: ComponentType<LucideProps>
  export const EyeOff: ComponentType<LucideProps>
  export const Info: ComponentType<LucideProps>
  export const TrendingUp: ComponentType<LucideProps>
  export const Clock: ComponentType<LucideProps>
  export const CheckCircle: ComponentType<LucideProps>
  export const AlertCircle: ComponentType<LucideProps>
  export const Plus: ComponentType<LucideProps>
  export const Minus: ComponentType<LucideProps>
  export const X: ComponentType<LucideProps>
  export const Check: ComponentType<LucideProps>
  export const ChevronDown: ComponentType<LucideProps>
  export const ChevronUp: ComponentType<LucideProps>
  export const ChevronLeft: ComponentType<LucideProps>
  export const ChevronRight: ComponentType<LucideProps>
  export const MoreHorizontal: ComponentType<LucideProps>
  export const Edit: ComponentType<LucideProps>
  export const Trash2: ComponentType<LucideProps>
  export const Save: ComponentType<LucideProps>
  export const Upload: ComponentType<LucideProps>
  export const Download: ComponentType<LucideProps>
  export const RefreshCw: ComponentType<LucideProps>
  export const AlertTriangle: ComponentType<LucideProps>
  export const CheckIcon: ComponentType<LucideProps>
  export const ChevronDownIcon: ComponentType<LucideProps>
  export const ChevronUpIcon: ComponentType<LucideProps>
  export const ChevronLeftIcon: ComponentType<LucideProps>
  export const ChevronRightIcon: ComponentType<LucideProps>
  export const XIcon: ComponentType<LucideProps>
  export const GripVerticalIcon: ComponentType<LucideProps>
  export const PanelLeftIcon: ComponentType<LucideProps>
  export const CircleIcon: ComponentType<LucideProps>
  export const MinusIcon: ComponentType<LucideProps>
  export const SearchIcon: ComponentType<LucideProps>
  export const ArrowLeft: ComponentType<LucideProps>
  export const ArrowRight: ComponentType<LucideProps>
  export const MoreHorizontalIcon: ComponentType<LucideProps>
  export const ShoppingCart: ComponentType<LucideProps>
  export const Loader2: ComponentType<LucideProps>
  
  // Add any other Lucide icons used in the project
  const LucideIcon: ComponentType<LucideProps>
  export default LucideIcon
}

// Module declarations for UI libraries
declare module '@/components/ui/*' {
  const Component: ComponentType<any>
  export default Component
}

declare module 'next/link' {
  import { ComponentType, AnchorHTMLAttributes, ReactNode } from 'react'
  
  interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    href: string
    as?: string
    replace?: boolean
    scroll?: boolean
    shallow?: boolean
    passHref?: boolean
    prefetch?: boolean
    locale?: string | false
    children?: ReactNode
  }
  
  const Link: ComponentType<LinkProps>
  export default Link
}

declare module 'react-resizable-panels' {
  import { ComponentType } from 'react'
  
  export const Panel: ComponentType<any>
  export const PanelGroup: ComponentType<any>
  export const PanelResizeHandle: ComponentType<any>
  
  export interface ImperativePanelHandle {
    collapse: () => void
    expand: () => void
    getId: () => string
    getSize: () => number
    isCollapsed: () => boolean
    isExpanded: () => boolean
    resize: (percentage: number) => void
  }
}

export {}