import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export function showToast({ title, description, type = 'info', duration = 5000 }: ToastOptions) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-accent" />;
    }
  };

  toast({
    title: title,
    description: (
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span>{description}</span>
      </div>
    ),
    description,
    duration,
    className: `border-l-4 ${
      type === 'success' ? 'border-green-400 bg-green-400/10' :
      type === 'error' ? 'border-red-400 bg-red-400/10' :
      type === 'warning' ? 'border-yellow-400 bg-yellow-400/10' :
      'border-accent bg-accent/10'
    }`,
  });
}

// Export individual toast functions for convenience
export const toastSuccess = (title: string, description?: string) => 
  showToast({ title, description, type: 'success' });

export const toastError = (title: string, description?: string) => 
  showToast({ title, description, type: 'error' });

export const toastWarning = (title: string, description?: string) => 
  showToast({ title, description, type: 'warning' });

export const toastInfo = (title: string, description?: string) => 
  showToast({ title, description, type: 'info' });
