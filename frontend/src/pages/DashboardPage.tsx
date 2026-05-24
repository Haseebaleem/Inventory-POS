import { useNavigate, Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Coins, ShoppingBag, AlertTriangle, Boxes } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { RetryError } from '@/components/common/RetryError';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useDashboard } from '@/hooks/useDashboard';
import { useCurrency } from '@/stores/businessStore';
import { formatCurrency, formatDate } from '@/lib/format';

interface StatProps {
  title: string;
  value: string;
  icon: typeof Coins;
  intent?: 'default' | 'warn';
  hint?: string;
  onClick?: () => void;
}

function StatCard({ title, value, icon: Icon, intent = 'default', hint, onClick }: StatProps) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              intent === 'warn'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const currency = useCurrency();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
      </>
    );
  }
  if (isError) return <RetryError error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Today is ${formatDate(new Date(), 'short')}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(data.todayRevenue, currency)}
          icon={Coins}
        />
        <StatCard
          title="Today's Sales"
          value={String(data.todaySales)}
          icon={ShoppingBag}
          hint="Completed sales only"
        />
        <StatCard
          title="Low Stock"
          value={String(data.lowStockCount)}
          icon={AlertTriangle}
          intent={data.lowStockCount > 0 ? 'warn' : 'default'}
          hint="At or below threshold"
          onClick={() => navigate('/products?lowStock=true')}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(data.stockValue, currency)}
          icon={Boxes}
          hint="Cost × stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Last 7 days revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.last7DaysChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v, 'short')}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v, currency)}
                    labelFormatter={(v) => formatDate(v, 'short')}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top 5 this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {data.topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No completed sales yet this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topProducts}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      fontSize={11}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(v: number, k: string) =>
                        k === 'quantity' ? `${v} sold` : formatCurrency(v, currency)
                      }
                    />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent sales</CardTitle>
          <Link to="/sales" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentSales.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No sales yet — open the POS counter to start.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSales.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/sales/${s.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-medium">{s.saleNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(s.createdAt, 'time')}
                    </TableCell>
                    <TableCell>{s.cashier?.name ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(s.total, currency)}
                    </TableCell>
                    <TableCell>
                      {s.status === 'COMPLETED' ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="destructive">Refunded</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
