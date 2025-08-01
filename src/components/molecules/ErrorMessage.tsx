import { AlertCircle, X } from 'lucide-react';
import type { FC } from 'react';

export interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

// 오류 메시지 컴포넌트
export const ErrorMessage: FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{message}</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-4 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
