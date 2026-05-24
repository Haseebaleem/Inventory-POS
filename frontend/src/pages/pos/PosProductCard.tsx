import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { resolveAsset } from '@/lib/api';
import type { PosProduct } from '@/hooks/usePosSearch';

interface PosProductCardProps {
  product: PosProduct;
  currency: string;
  onAdd: () => void;
}

export function PosProductCard({ product, currency, onAdd }: PosProductCardProps) {
  const outOfStock = product.stock <= 0;
  const low = !outOfStock && product.stock <= product.lowStockThreshold;
  const image = resolveAsset(product.imageUrl);

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className={cn(
        'group flex flex-col rounded-lg border bg-card text-left overflow-hidden transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        outOfStock
          ? 'opacity-50 cursor-not-allowed grayscale'
          : 'hover:border-primary/40 hover:shadow-md active:scale-[0.98]'
      )}
    >
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={product.name} className="object-cover w-full h-full" />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{product.sku}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-semibold text-sm">{formatCurrency(product.price, currency)}</span>
          <span
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              outOfStock
                ? 'bg-red-100 text-red-700'
                : low
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {outOfStock ? 'Out' : `${product.stock} left`}
          </span>
        </div>
      </div>
    </button>
  );
}
