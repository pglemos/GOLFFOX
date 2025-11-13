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
  
  // Adicione outros ícones conforme necessário
  const Icon: FC<IconProps>
  export default Icon
}

