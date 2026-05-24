import { Store } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
        <Store className="h-7 w-7" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Loading session…
      </div>
    </div>
  );
}
