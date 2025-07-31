import { memo, type FC, type ReactNode } from 'react';

interface LabelProps {
  className?: string;
  children: ReactNode;
  error?: boolean;
}
export const Label: FC<LabelProps> = memo(({ className = '', children, error = false, ...props }) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
      error ? 'text-red-600' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </label>
));
