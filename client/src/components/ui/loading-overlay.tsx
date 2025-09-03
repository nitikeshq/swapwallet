import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  title = "Processing...", 
  subtitle,
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn("glass-card rounded-xl p-8 text-center max-w-sm mx-4", className)}>
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="font-medium text-foreground mb-2" data-testid="loading-title">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground" data-testid="loading-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
