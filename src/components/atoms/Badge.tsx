import { memo, type CSSProperties, type FC, type ReactNode } from "react";

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export const Badge: FC<BadgeProps> = memo(({ variant = 'default', className = '', children, ...props }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80 bg-gray-900 text-white',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gray-100 text-gray-900',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80 bg-red-600 text-white',
    outline: 'text-foreground border border-gray-300',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
