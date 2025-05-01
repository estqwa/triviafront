import { FC, SVGProps } from 'react';

// Более точное определение пропсов для иконок Lucide
interface LucideProps extends SVGProps<SVGSVGElement> {
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
  absoluteStrokeWidth?: boolean;
}

// Объявление модулей, для которых нет типов
declare module 'lucide-react' {
  // Используем LucideProps вместо SVGProps
  export const Users: FC<LucideProps>;
  export const DollarSign: FC<LucideProps>;
  export const LogOut: FC<LucideProps>;
  export const LogIn: FC<LucideProps>;
  export const User: FC<LucideProps>;
  export const Trophy: FC<LucideProps>;
  export const ArrowLeft: FC<LucideProps>;
  export const XCircle: FC<LucideProps>;
  export const HelpCircle: FC<LucideProps>;
  export const Send: FC<LucideProps>;
  export const PlayCircle: FC<LucideProps>;
  export const List: FC<LucideProps>; // Теперь использует LucideProps
  export const CheckCircle: FC<LucideProps>;
  export const Clock: FC<LucideProps>;
  export const CheckSquare: FC<LucideProps>; 
  export const ClipboardList: FC<LucideProps>; // Добавим на всякий случай ClipboardList
  // ... можно добавить другие иконки по мере необходимости
}

// Другие модули без типов можно добавить здесь 