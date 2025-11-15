// Declaração de tipos para lucide-react
// Como @types/lucide-react não existe, criamos nossa própria declaração

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    strokeWidth?: string | number
    absoluteStrokeWidth?: boolean
  }
  
  export const AlertTriangle: FC<IconProps>
  export const Search: FC<IconProps>
  export const Filter: FC<IconProps>
  export const ChevronDown: FC<IconProps>
  export const ChevronUp: FC<IconProps>
  export const Save: FC<IconProps>
  export const X: FC<IconProps>
  export const CheckCircle: FC<IconProps>
  export const User: FC<IconProps>
  export const Download: FC<IconProps>
  export const XCircle: FC<IconProps>
  export const Trash2: FC<IconProps>
  export const Users: FC<IconProps>
  export const Plus: FC<IconProps>
  export const Award: FC<IconProps>
  export const FileText: FC<IconProps>
  export const Edit: FC<IconProps>
  export const Truck: FC<IconProps>
  export const Navigation: FC<IconProps>
  export const AlertCircle: FC<IconProps>
  export const ArrowUpRight: FC<IconProps>
  export const MapPin: FC<IconProps>
  export const Calendar: FC<IconProps>
  export const Activity: FC<IconProps>
  export const TrendingUp: FC<IconProps>
  export const Settings: FC<IconProps>
  export const UserPlus: FC<IconProps>
  export const Clock: FC<IconProps>
  export const HelpCircle: FC<IconProps>
  export const MessageCircle: FC<IconProps>
  export const ExternalLink: FC<IconProps>
  export const DollarSign: FC<IconProps>
  export const Upload: FC<IconProps>
  export const Building2: FC<IconProps>
  export const Briefcase: FC<IconProps>
  export const Shield: FC<IconProps>
  export const MessageSquare: FC<IconProps>
  export const RefreshCw: FC<IconProps>
  export const Database: FC<IconProps>
  export const Play: FC<IconProps>
  export const Pause: FC<IconProps>
  export const RotateCcw: FC<IconProps>
  export const Settings2: FC<IconProps>
  export const Bell: FC<IconProps>
  export const Menu: FC<IconProps>
  export const LogOut: FC<IconProps>
  export const Loader2: FC<IconProps>
  export const Check: FC<IconProps>
  export const LayoutDashboard: FC<IconProps>
  export const UserCog: FC<IconProps>
  export type LucideIcon = FC<IconProps>
  export const HardDrive: FC<IconProps>
  export const Wifi: FC<IconProps>
  export const Minimize2: FC<IconProps>
  export const LifeBuoy: FC<IconProps>
  export const BarChart3: FC<IconProps>
  export const FileSpreadsheet: FC<IconProps>
  export const CheckCircle2: FC<IconProps>
  export const Info: FC<IconProps>
  export const Send: FC<IconProps>
  export const Route: FC<IconProps>
  export const Wrench: FC<IconProps>
  export const ClipboardCheck: FC<IconProps>
  export const Phone: FC<IconProps>
  export const ChevronRight: FC<IconProps>
  export const Mail: FC<IconProps>
  export const Sparkles: FC<IconProps>
  export const Key: FC<IconProps>
  export const Layers: FC<IconProps>
  export const History: FC<IconProps>
  export const Timer: FC<IconProps>
  export const WifiOff: FC<IconProps>
  export const Accessibility: FC<IconProps>
  export const Keyboard: FC<IconProps>
  export const TrendingDown: FC<IconProps>
  export const PieChart: FC<IconProps>
  export const Map: FC<IconProps>
  export const Maximize2: FC<IconProps>
  export const Radio: FC<IconProps>
  export const Square: FC<IconProps>
  export const SkipBack: FC<IconProps>
  export const SkipForward: FC<IconProps>
  export const Gauge: FC<IconProps>
  export const Repeat: FC<IconProps>
  export const Repeat1: FC<IconProps>
  export const Volume2: FC<IconProps>
  export const VolumeX: FC<IconProps>
  
  // Adicione outros ícones conforme necessário
  const Icon: FC<IconProps>
  export default Icon
}

