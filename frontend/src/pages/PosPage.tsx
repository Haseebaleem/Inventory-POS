import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Printer,
  CreditCard,
  Banknote,
  PackageX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePosSearch } from '@/hooks/usePosSearch';
import { useCreateSale } from '@/hooks/useSales';
import { useCart } from '@/stores/cartStore';
import { useAuth } from '@/stores/authStore';
import { useBusiness, useCurrency, useTaxRate } from '@/stores/businessStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { extractApiError } from '@/lib/api';
import { PosProductCard } from '@/pages/pos/PosProductCard';
import { PosReceipt } from '@/pages/pos/PosReceipt';
import type { Sale } from '@/types';

export default function PosPage() {
  const { user } = useAuth();
  const currency = useCurrency();
  const taxRate = useTaxRate();
  const business = useBusiness((s) => s.business);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);
  const search = usePosSearch(debouncedQuery, 36);

  const cart = useCart();
  const [payment, setPayment] = useState<'CASH' | 'CARD'>('CASH');
  const [pulse, setPulse] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const createSale = useCreateSale();
  const searchRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ignore when focus is in an input/textarea (except the search)
      const target = e.target as HTMLElement;
      const isFormField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !isFormField) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
      } else if (e.key === 'Enter' && document.activeElement === searchRef.current) {
        const first = search.data?.[0];
        if (first) {
          handleAdd(first);
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.data]);

  const subtotal = useMemo(
    () => cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart.items]
  );
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = subtotal + taxAmount;

  const handleAdd = (p: {
    id: string;
    sku: string;
    name: string;
    price: string | number;
    stock: number;
    imageUrl?: string | null;
  }) => {
    const result = cart.addOrIncrement({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.imageUrl,
    });
    if (result === 'capped') {
      toast.error(`No more "${p.name}" in stock (${p.stock} available)`);
    } else {
      setPulse(true);
      setTimeout(() => setPulse(false), 250);
    }
  };

  const handleComplete = async () => {
    if (cart.items.length === 0) return;
    try {
      const sale = await createSale.mutateAsync({
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: payment,
      });
      cart.clear();
      setReceiptSale(sale);
      toast.success(`Sale ${sale.saleNumber} complete`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const today = formatDate(time, 'short');
  const now = formatDate(time, 'time');

  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] overflow-hidden bg-muted/20">
      {/* Left pane — search + grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-card border-b px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold leading-tight">{business?.name ?? 'POS Counter'}</h1>
            <p className="text-xs text-muted-foreground">
              {user?.name} · {today} · {now}
            </p>
          </div>
        </div>

        <div className="px-6 pt-4 pb-3 bg-card border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU or barcode — press / to focus"
              className="pl-9 pr-9 h-11 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            <kbd className="px-1 rounded bg-muted">/</kbd> focus · <kbd className="px-1 rounded bg-muted">Enter</kbd> add first
            result · <kbd className="px-1 rounded bg-muted">Esc</kbd> clear
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {search.isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4]" />
              ))}
            </div>
          ) : (search.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={PackageX}
              title="No products match"
              description={query ? `No active products contain "${query}".` : 'No active products.'}
              action={
                query ? (
                  <Button variant="outline" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {search.data!.map((p) => (
                <PosProductCard
                  key={p.id}
                  product={p}
                  currency={currency}
                  onAdd={() => handleAdd(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right pane — cart */}
      <aside className="w-[400px] shrink-0 bg-card border-l flex flex-col">
        <div
          className={cn(
            'px-5 py-3 border-b flex items-center justify-between transition-colors',
            pulse && 'bg-primary/10'
          )}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Current Sale</h2>
          </div>
          <Badge variant={cart.items.length ? 'default' : 'muted'}>
            {cart.items.length} item{cart.items.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Cart is empty — click a product to start.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.items.map((item) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <li key={item.productId} className="flex gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCurrency(item.price, currency)} · stock {item.stock}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => cart.dec(item.productId)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) => cart.setQty(item.productId, Number(e.target.value))}
                          className="h-7 w-14 text-center text-sm px-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => cart.inc(item.productId)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto"
                          onClick={() => cart.remove(item.productId)}
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(lineTotal, currency)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t px-5 py-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="font-medium tabular-nums">{formatCurrency(taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-base pt-1 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-semibold tabular-nums">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPayment('CASH')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                payment === 'CASH'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-accent'
              )}
            >
              <Banknote className="h-4 w-4" /> Cash
            </button>
            <button
              type="button"
              onClick={() => setPayment('CARD')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                payment === 'CARD'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-accent'
              )}
            >
              <CreditCard className="h-4 w-4" /> Card
            </button>
          </div>

          <Button
            className="w-full h-11 text-base"
            onClick={handleComplete}
            disabled={cart.items.length === 0 || createSale.isPending}
          >
            {createSale.isPending ? (
              <>
                <Spinner className="mr-2" /> Processing…
              </>
            ) : (
              <>Complete Sale · {formatCurrency(total, currency)}</>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setClearOpen(true)}
            disabled={cart.items.length === 0}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:hover:text-muted-foreground block mx-auto"
          >
            Clear cart
          </button>
        </div>
      </aside>

      {/* Receipt modal */}
      <Dialog
        open={!!receiptSale}
        onOpenChange={(v) => {
          if (!v) setReceiptSale(null);
        }}
      >
        <DialogContent className="max-w-sm receipt-modal">
          <DialogHeader>
            <DialogTitle>Sale complete</DialogTitle>
          </DialogHeader>
          {receiptSale && (
            <>
              <PosReceipt ref={receiptRef} sale={receiptSale} currency={currency} />
              <div className="flex gap-2 pt-2 no-print">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
                <Button className="flex-1" onClick={() => setReceiptSale(null)}>
                  New Sale
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear cart?"
        description="All items will be removed."
        confirmLabel="Clear"
        destructive
        onConfirm={() => {
          cart.clear();
          setClearOpen(false);
        }}
      />
    </div>
  );
}
