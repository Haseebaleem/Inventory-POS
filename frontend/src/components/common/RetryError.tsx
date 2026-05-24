import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractApiError } from '@/lib/api';

interface RetryErrorProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function RetryError({ error, onRetry, className }: RetryErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 rounded-lg border bg-card text-center ${className ?? ''}`}
    >
      <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">Couldn't load this</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md break-words">
        {extractApiError(error)}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}
