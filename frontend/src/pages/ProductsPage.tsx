import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Package, ImageIcon, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { RetryError } from '@/components/common/RetryError';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Pagination } from '@/components/common/Pagination';
import { StockBadge } from '@/components/common/StockBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useCurrency } from '@/stores/businessStore';
import { formatCurrency } from '@/lib/format';
import { resolveAsset } from '@/lib/api';

const ALL = '__all__';

type Status = 'any' | 'active' | 'inactive' | 'lowStock';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [status, setStatus] = useState<Status>('any');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const currency = useCurrency();

  const { data: categories } = useCategories();
  const params = {
    search: debouncedSearch || undefined,
    categoryId: categoryId === ALL ? undefined : categoryId,
    active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    lowStock: status === 'lowStock' ? true : undefined,
    page,
    pageSize,
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts(params);

  const reset = () => {
    setSearch('');
    setCategoryId(ALL);
    setStatus('any');
    setPage(1);
  };

  const products = data?.products ?? [];
  const hasFilters =
    !!debouncedSearch || categoryId !== ALL || status !== 'any';

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue, pricing, and stock for every item you sell."
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, SKU or barcode…"
            className="pl-9"
          />
        </div>
        <Select
          value={categoryId}
          onValueChange={(v) => {
            setCategoryId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as Status);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="lowStock">Low stock</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : isError ? (
        <RetryError error={error} onRetry={() => refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={hasFilters ? 'No products match' : 'No products yet'}
          description={
            hasFilters
              ? 'Try adjusting filters or clearing them.'
              : 'Add your first product to start selling.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={reset}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className={`border rounded-lg overflow-hidden bg-card ${isFetching ? 'opacity-90' : ''}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const imageSrc = resolveAsset(p.imageUrl);
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                          {imageSrc ? (
                            <img src={imageSrc} alt={p.name} className="object-cover w-full h-full" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.category?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(p.price, currency)}
                      </TableCell>
                      <TableCell>
                        <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                      </TableCell>
                      <TableCell>
                        {p.active ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="muted">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={data?.page ?? 1}
            pageSize={data?.pageSize ?? pageSize}
            total={data?.total ?? 0}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
