'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@primeshot/common/web/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@primeshot/common/web/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';
import { useChartDimensions } from '@/hooks/useResizeObserver';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'annually';

interface RevenueData {
  period: string;
  sales: number;
  refunds: number;
  net: number;
  costs: number;
  profit: number;
}

// Cost constants
const INFERENCE_JOB_COST = 0.40 // $0.40 per inference job
const TRAINING_JOB_COST = 1.00  // $1.00 per training job
const S3_COST_PER_10GB = 1.00   // $1.00 per 10GB per month
const FIXED_MONTHLY_COSTS = 400 // $400 per month for infrastructure

async function fetchRevenueData(period: TimePeriod): Promise<RevenueData[]> {
  const supabase = createClient();
  
  // Calculate date ranges based on period
  const now = new Date();
  let periods: { start: Date; end: Date; label: string }[] = [];
  
  if (period === 'weekly') {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = endOfWeek(weekStart);
      periods.push({
        start: weekStart,
        end: weekEnd,
        label: format(weekStart, 'MMM dd')
      });
    }
  } else if (period === 'monthly') {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      const monthEnd = endOfMonth(monthStart);
      periods.push({
        start: monthStart,
        end: monthEnd,
        label: format(monthStart, 'MMM yyyy')
      });
    }
  } else if (period === 'quarterly') {
    // Last 8 quarters
    for (let i = 7; i >= 0; i--) {
      const quarterStart = startOfQuarter(new Date(now.getFullYear(), now.getMonth() - (i * 3), 1));
      const quarterEnd = endOfQuarter(quarterStart);
      periods.push({
        start: quarterStart,
        end: quarterEnd,
        label: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`
      });
    }
  } else if (period === 'annually') {
    // Last 5 years
    for (let i = 4; i >= 0; i--) {
      const yearStart = startOfYear(new Date(now.getFullYear() - i, 0, 1));
      const yearEnd = endOfYear(yearStart);
      periods.push({
        start: yearStart,
        end: yearEnd,
        label: format(yearStart, 'yyyy')
      });
    }
  }

  const revenueData: RevenueData[] = [];

  // Calculate fixed costs per period
  let fixedCostsPerPeriod: number
  if (period === 'weekly') {
    fixedCostsPerPeriod = FIXED_MONTHLY_COSTS / 4 // Approx 4 weeks per month
  } else if (period === 'monthly') {
    fixedCostsPerPeriod = FIXED_MONTHLY_COSTS
  } else if (period === 'quarterly') {
    fixedCostsPerPeriod = FIXED_MONTHLY_COSTS * 3
  } else { // annually
    fixedCostsPerPeriod = FIXED_MONTHLY_COSTS * 12
  }

  for (const periodInfo of periods) {
    // Use the new RPC function to get revenue data
    const { data: revenueInfo, error } = await supabase
      .rpc('get_revenue_data', {
        start_date: periodInfo.start.toISOString(),
        end_date: periodInfo.end.toISOString()
      });

    if (error) {
      console.error('Error fetching revenue data:', error);
      // Fallback to zeros if RPC fails
      revenueData.push({
        period: periodInfo.label,
        sales: 0,
        refunds: 0,
        net: 0,
        costs: 0,
        profit: 0
      });
      continue;
    }

    // Get revenue data
    const revenue = revenueInfo?.[0] || { subscription_revenue: 0, credit_pack_revenue: 0, refund_amount: 0 };
    
    const totalSales = Math.round((Number(revenue.subscription_revenue) + Number(revenue.credit_pack_revenue)) / 100);
    const totalRefunds = Math.round(Number(revenue.refund_amount) / 100);
    const netRevenue = totalSales - totalRefunds;

    // Get inference job count for this period
    const { count: inferenceCount } = await supabase
      .from('inference_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodInfo.start.toISOString())
      .lte('created_at', periodInfo.end.toISOString())
      .eq('status', 'completed')

    // Get training job count for this period
    const { count: trainingCount } = await supabase
      .from('training_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodInfo.start.toISOString())
      .lte('created_at', periodInfo.end.toISOString())
      .eq('status', 'completed')

    // Calculate variable costs
    const inferenceCosts = (inferenceCount || 0) * INFERENCE_JOB_COST
    const trainingCosts = (trainingCount || 0) * TRAINING_JOB_COST
    
    // For storage costs, we'll use a simplified calculation
    // TODO: Implement actual S3 storage usage query if available
    const storageCosts = 0 // Placeholder - would need to query actual storage usage
    
    // Total costs
    const totalCosts = Math.round(inferenceCosts + trainingCosts + storageCosts + fixedCostsPerPeriod)
    
    // Calculate profit
    const profit = netRevenue - totalCosts

    revenueData.push({
      period: periodInfo.label,
      sales: totalSales,
      refunds: totalRefunds,
      net: netRevenue,
      costs: totalCosts,
      profit
    });
  }

  return revenueData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium">
                  {entry.dataKey}: ${entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const { containerHeight } = useChartDimensions(300);
  
  const { data: currentData, isLoading, refetch } = useQuery({
    queryKey: ['revenue-analytics', selectedPeriod],
    queryFn: () => fetchRevenueData(selectedPeriod),
    refetchInterval: 300000, // Refresh every 5 minutes as fallback
  });

  // Handle realtime updates for revenue-related tables
  const handleRealtimeUpdate = useCallback((table: string, eventType: string, record: any) => {
    console.log(`Revenue data may have changed due to ${eventType} on ${table}:`, record);
    
    // Refetch revenue data when revenue-affecting changes occur
    if (['user_subscriptions', 'credit_pack_purchases', 'user_credits', 'subscriptions'].includes(table)) {
      refetch();
    }
  }, [refetch]);

  // Subscribe to realtime updates
  const { isConnected, connectionError } = useRealtimeSubscription({
    tables: ['user_subscriptions', 'credit_pack_purchases', 'user_credits', 'subscriptions'],
    onDataChange: handleRealtimeUpdate,
    enabled: true
  });
  
  // Get the LATEST period's data for the summary cards (not totals)
  const latestPeriod = currentData?.[currentData.length - 1] || {
    sales: 0,
    refunds: 0,
    net: 0,
    costs: 0,
    profit: 0
  };

  const chartConfig = {
    sales: {
      label: 'Sales',
      color: '#2ADED8', // bright teal
    },
    refunds: {
      label: 'Refunds',
      color: '#99EFEC', // medium teal
    },
    net: {
      label: 'Net Revenue',
      color: '#E5FBFA', // light teal
    },
    costs: {
      label: 'Costs',
      color: '#FF6B6B', // red
    },
    profit: {
      label: 'Profit',
      color: '#51CF66', // green
    },
  };

  if (isLoading || !currentData) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-col space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Revenue Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
            <div className="h-[300px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

    return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-4 pb-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">Revenue Analytics</CardTitle>
              {isConnected ? (
                <div title="Live updates enabled">
                  <Wifi className="h-4 w-4 text-green-500" />
                </div>
              ) : connectionError ? (
                <div title={`Connection error: ${connectionError}`}>
                  <WifiOff className="h-4 w-4 text-red-500" />
                </div>
              ) : (
                <div title="Connecting to live updates...">
                  <WifiOff className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            <CardDescription className="text-xs mt-1 text-[#666666]">
              Total revenue from subscriptions and credit packs {isConnected && '• Live updates'}
            </CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-36 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-36">
              <SelectItem value="weekly" className="py-3 px-4">Weekly</SelectItem>
              <SelectItem value="monthly" className="py-3 px-4">Monthly</SelectItem>
              <SelectItem value="quarterly" className="py-3 px-4">Quarterly</SelectItem>
              <SelectItem value="annually" className="py-3 px-4">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4 w-full">
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#2ADED8' }} />
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2ADED8' }}>
              ${latestPeriod.sales.toLocaleString()}
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" style={{ color: '#99EFEC' }} />
              <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#99EFEC' }}>
              ${latestPeriod.refunds.toLocaleString()}
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" style={{ color: '#E5FBFA' }} />
              <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#E5FBFA' }}>
              ${latestPeriod.net.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Costs</p>
            </div>
            <p className="text-2xl font-bold text-red-500">
              ${latestPeriod.costs.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2 rounded-lg p-4 flex-1 bg-[#FFFFFF05]">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium text-muted-foreground">Profit</p>
            </div>
            <p className={`text-2xl font-bold ${latestPeriod.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {latestPeriod.profit >= 0 ? '+' : ''}${latestPeriod.profit.toLocaleString()}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: containerHeight }}>
          <ResponsiveContainer width="100%" height={containerHeight} key={`${containerHeight}-${selectedPeriod}`}>
              <AreaChart data={currentData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ADED8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2ADED8" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="refundsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#99EFEC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#99EFEC" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5FBFA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E5FBFA" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="costsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#51CF66" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#51CF66" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis 
                  dataKey="period" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  minTickGap={5}
                />
                <YAxis 
                  hide={true}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2ADED8"
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="refunds"
                  stroke="#99EFEC"
                  fill="url(#refundsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#E5FBFA"
                  fill="url(#netGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="#FF6B6B"
                  fill="url(#costsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#51CF66"
                  fill="url(#profitGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 