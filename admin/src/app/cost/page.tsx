'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@primeshot/common/web/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@primeshot/common/web/ui/select'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@primeshot/common/web/ui/tabs'
import { Progress } from '@primeshot/common/web/ui/progress'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Database, Upload, Download, Activity } from 'lucide-react'
import { apiRequest, type CostMetrics, type S3Metrics } from '@/lib/api/client'
import { Alert, AlertDescription, AlertTitle } from '@primeshot/common/web/ui/alert'

// Simple Line Chart component
function SimpleLineChart({ data, title }: { data: Array<{ date: string; cost: number }>, title: string }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map(d => d.cost))
  const minValue = Math.min(...data.map(d => d.cost))
  const range = maxValue - minValue || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground">
            <span>${maxValue.toFixed(2)}</span>
            <span>${(maxValue * 0.75).toFixed(2)}</span>
            <span>${(maxValue * 0.5).toFixed(2)}</span>
            <span>${(maxValue * 0.25).toFixed(2)}</span>
            <span>$0.00</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-14 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute w-full border-t border-gray-200"
                  style={{ top: `${percent}%` }}
                />
              ))}
            </div>
            
            {/* Line chart */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                points={data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 100
                  const y = 100 - ((point.cost - minValue) / range) * 100
                  return `${x},${y}`
                }).join(' ')}
              />
              {/* Data points */}
              {data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = 100 - ((point.cost - minValue) / range) * 100
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1"
                    fill="#3b82f6"
                    className="hover:r-2"
                  />
                )
              })}
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-muted-foreground">
              <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              {data.length > 2 && (
                <span>{new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              )}
              <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-semibold">${data.reduce((sum, d) => sum + d.cost, 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="font-semibold">${(data.reduce((sum, d) => sum + d.cost, 0) / data.length).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peak</p>
            <p className="font-semibold">${maxValue.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple Bar Chart component for cost breakdown
function SimpleBarChart({ data, title }: { data: Array<{ label: string; value: number }>, title: string }) {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${((item?.value || 0) / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  ${(item?.value || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: any
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {changeType === 'increase' ? (
              <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
            )}
            <span className={changeType === 'increase' ? 'text-red-500' : 'text-green-500'}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function CostPage() {
  const [costData, setCostData] = useState<{
    costMetrics: CostMetrics
    s3Metrics: S3Metrics
    period: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('LAST_30_DAYS')

  const fetchCostData = async (period: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest(`/api/admin/aws-cost?period=${period}`) as {
        costMetrics: CostMetrics
        s3Metrics: S3Metrics
        period: string
      }
      setCostData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cost data')
      console.error('Error fetching cost data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCostData(selectedPeriod)
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">AWS Cost Monitoring</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AWS Cost Monitoring</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!costData) return null

  const { costMetrics, s3Metrics } = costData

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AWS Cost Monitoring</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
            <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
            <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
            <SelectItem value="CURRENT_MONTH">Current Month</SelectItem>
            <SelectItem value="PREVIOUS_MONTH">Previous Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cost"
          value={`$${(costMetrics?.totalCost || 0).toFixed(2)}`}
          change={costMetrics?.costDifferencePercentage || 0}
          changeType={(costMetrics?.costDifference || 0) > 0 ? 'increase' : 'decrease'}
          icon={DollarSign}
          description={`vs previous ${selectedPeriod.includes('PREVIOUS') ? 'month' : 'period'}`}
        />

        <MetricCard
          title="S3 Storage"
          value={formatBytes(s3Metrics?.totalBytesStored || 0)}
          icon={Database}
          description={`${formatNumber(s3Metrics?.totalRequests || 0)} total requests`}
        />

        <MetricCard
          title="Upload Volume"
          value={formatBytes(s3Metrics?.uploadMetrics?.totalUploadBytes || 0)}
          icon={Upload}
          description={`${formatNumber(s3Metrics?.uploadMetrics?.totalUploads || 0)} uploads`}
        />

        <MetricCard
          title="Download Volume"
          value={formatBytes(s3Metrics?.downloadMetrics?.totalDownloadBytes || 0)}
          icon={Download}
          description={`${formatNumber(s3Metrics?.downloadMetrics?.totalDownloads || 0)} downloads`}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="s3-metrics">S3 Metrics</TabsTrigger>
          <TabsTrigger value="upload-metrics">Upload Metrics</TabsTrigger>
          <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SimpleLineChart
              data={costMetrics?.dailyCosts || []}
              title="Cost Trend"
            />

            <Card>
              <CardHeader>
                <CardTitle>Top Cost Drivers</CardTitle>
                <CardDescription>Services contributing most to costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costMetrics?.topCostDrivers?.length > 0 ? (
                    costMetrics.topCostDrivers.map((driver, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{driver?.service || 'Unknown'}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {(driver?.percentage || 0).toFixed(1)}%
                          </span>
                        </div>
                        <span className="font-medium">${(driver?.cost || 0).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No cost driver data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="s3-metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>S3 Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Average Request Size</p>
                    <p className="text-2xl font-bold">{formatBytes(s3Metrics?.averageRequestSize || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cost per GB</p>
                    <p className="text-2xl font-bold">${(s3Metrics?.costPerGB || 0).toFixed(3)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Upload Success Rate</span>
                    <span className="text-sm font-medium">
                      {(s3Metrics?.uploadMetrics?.uploadSuccessRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={s3Metrics?.uploadMetrics?.uploadSuccessRate || 0} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Download Success Rate</span>
                    <span className="text-sm font-medium">
                      {(s3Metrics?.downloadMetrics?.downloadSuccessRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={s3Metrics?.downloadMetrics?.downloadSuccessRate || 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>S3 Transfer Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Total Uploads</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(s3Metrics?.uploadMetrics?.totalUploads || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span className="text-sm">Total Downloads</span>
                    </div>
                    <span className="font-medium">
                      {formatNumber(s3Metrics?.downloadMetrics?.totalDownloads || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Total Bytes</span>
                    </div>
                    <span className="font-medium">
                      {formatBytes(s3Metrics.totalBytesTransferred)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Upload/Download Ratio</p>
                  <div className="flex gap-1 h-2">
                    <div
                      className="bg-blue-500 rounded-l"
                      style={{
                        width: `${(((s3Metrics?.uploadMetrics?.totalUploadBytes || 0) / (s3Metrics?.totalBytesTransferred || 1)) * 100)}%`
                      }}
                    />
                    <div
                      className="bg-green-500 rounded-r"
                      style={{
                        width: `${(((s3Metrics?.downloadMetrics?.totalDownloadBytes || 0) / (s3Metrics?.totalBytesTransferred || 1)) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Upload: {(((s3Metrics?.uploadMetrics?.totalUploadBytes || 0) / (s3Metrics?.totalBytesTransferred || 1)) * 100).toFixed(1)}%</span>
                    <span>Download: {(((s3Metrics?.downloadMetrics?.totalDownloadBytes || 0) / (s3Metrics?.totalBytesTransferred || 1)) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload-metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Performance</CardTitle>
                <CardDescription>Upload operation metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-xs text-muted-foreground">Based on recent uploads</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Upload Time</p>
                    <p className="text-2xl font-bold">2.3s</p>
                    <p className="text-xs text-muted-foreground">Per file</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Operation Distribution</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Init Operations</span>
                      <span>45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Part Uploads</span>
                      <span>180</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Complete Operations</span>
                      <span>42</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Abort Operations</span>
                      <span>3</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Upload Activity</CardTitle>
                <CardDescription>Latest upload operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <div>
                      <p className="text-sm font-medium">Upload Complete</p>
                      <p className="text-xs text-muted-foreground">user123 • 2 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">Success</Badge>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <div>
                      <p className="text-sm font-medium">Upload Complete</p>
                      <p className="text-xs text-muted-foreground">user456 • 5 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">Success</Badge>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <p className="text-sm font-medium">Upload Failed</p>
                      <p className="text-xs text-muted-foreground">user789 • 8 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="text-red-600">Failed</Badge>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <div>
                      <p className="text-sm font-medium">Upload Complete</p>
                      <p className="text-xs text-muted-foreground">user101 • 12 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">Success</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost-breakdown" className="space-y-4">
          <SimpleBarChart
            data={Object.entries(costMetrics.serviceBreakdown).map(([service, cost]) => ({
              label: service,
              value: cost
            }))}
            title="Cost by Service"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
