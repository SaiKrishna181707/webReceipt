'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, XCircle, AlertTriangle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress, Alert, AlertDescription, AlertTitle, Tabs, TabsContent, TabsList, TabsTrigger }

// Status badge component
export function StatusBadge({ status }: { status: 'healthy' | 'broken' | 'healing' | 'stale' }) {
  const colors = {
    healthy: 'bg-green-500/15 text-green-500 border-green-500/30',
    broken: 'bg-red-500/15 text-red-500 border-red-500/30',
    healing: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    stale: 'bg-gray-500/15 text-gray-500 border-gray-500/30'
  }

  const icons = {
    healthy: <CheckCircle2 size={12} />,
    broken: <XCircle size={12} />,
    healing: <AlertTriangle size={12} />,
    stale: <Minus size={12} />
  }

  return (
    <Badge className={`${colors[status]} border`}>
      <span className="flex items-center gap-1.5">
        {icons[status]}
        {status.toUpperCase()}
      </span>
    </Badge>
  )
}

// Metric card component
export function MetricCard({ 
  title, 
  value, 
  trend, 
  icon, 
  trendUp = true 
}: { 
  title: string
  value: string | number
  trend: string
  icon: React.ReactNode
  trendUp?: boolean
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trendUp ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={trendUp ? 'text-green-500' : 'text-red-500'}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Alert component for semantic integrity failures
export function SemanticIntegrityAlert({ 
  expected, 
  extracted, 
  formula 
}: { 
  expected: number
  extracted: number
  formula: string
}) {
  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-red-500">SEMANTIC INTEGRITY FAILURE</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Expected:</span>
            <span className="ml-2 font-mono font-bold">{expected}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Extracted:</span>
            <span className="ml-2 font-mono font-bold">{extracted}</span>
          </div>
        </div>
        <div className="bg-background/50 rounded p-2 font-mono text-xs">
          {formula}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Evidence item component
export function EvidenceItem({ 
  field, 
  capturedText, 
  sourceUrl, 
  journeyStep, 
  hash 
}: { 
  field: string
  capturedText: string
  sourceUrl: string
  journeyStep: number
  hash: string
}) {
  return (
    <Card className="border-border/50 bg-card/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">{field}</Badge>
          <span className="text-xs text-muted-foreground">Step {journeyStep}</span>
        </div>
        <p className="text-sm font-medium mb-2">{capturedText}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="truncate max-w-[200px]">{sourceUrl}</span>
          <span className="font-mono">{hash?.substring(0, 16)}...</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Validation check component
export function ValidationCheck({ 
  label, 
  pass, 
  details 
}: { 
  label: string
  pass: boolean
  details?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {pass ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={pass ? "outline" : "destructive"} className="text-xs">
          {pass ? 'PASS' : 'FAIL'}
        </Badge>
      </div>
    </div>
  )
}

// Anomaly card component
export function AnomalyCard({ 
  label, 
  severity, 
  details 
}: { 
  label: string
  severity: 'critical' | 'high' | 'info'
  details: string
}) {
  const severityColors = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    info: 'border-blue-500/50 bg-blue-500/10'
  }

  return (
    <Card className={`border ${severityColors[severity]}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />}
          {severity === 'high' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
          {severity === 'info' && <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">{label}</p>
            <p className="text-xs text-muted-foreground">{details}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}