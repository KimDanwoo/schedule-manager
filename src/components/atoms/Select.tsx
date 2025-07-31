import { memo, type ChangeEvent, type FC, type ReactNode } from 'react';

interface SelectProps {
  className?: string;
  children: ReactNode;
  error?: boolean;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export const Select: FC<SelectProps> = memo(({ className = '', children, error = false, ...props }) => (
  <select
    className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-500'
    } ${className}`}
    {...props}
  >
    {children}
  </select>
));
