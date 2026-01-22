'use client'

import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type MonthComparison, type ThreeMonthAverage } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

interface TemporalAnalysisProps {
  monthComparison: MonthComparison
  threeMonthAverage: ThreeMonthAverage
}

export function TemporalAnalysis({
  monthComparison,
  threeMonthAverage,
}: TemporalAnalysisProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatMonthShort = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date)
  }

  // Données pour le graphique de comparaison
  const comparisonChartData = [
    {
      name: formatMonthShort(monthComparison.previousMonth),
      montant: monthComparison.previousTotal,
    },
    {
      name: formatMonthShort(monthComparison.currentMonth),
      montant: monthComparison.currentTotal,
    },
  ]

  // Données pour le graphique 3 mois
  const threeMonthChartData = threeMonthAverage.months.map((month, index) => {
    const expenses = index === 2 ? threeMonthAverage.currentTotal : 0 // Simplifié, on pourrait calculer pour chaque mois
    return {
      name: formatMonthShort(month),
      montant: expenses || threeMonthAverage.averageTotal, // Placeholder
    }
  })

  return (
    <Tabs defaultValue="comparison" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="comparison" className="gap-2">
          <BarChart3 className="size-4" />
          Mois vs Mois
        </TabsTrigger>
        <TabsTrigger value="average" className="gap-2">
          <Activity className="size-4" />
          Moyenne 3 mois
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comparison" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparaison mensuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Résumé */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div>
                <p className="text-sm text-muted-foreground">Évolution</p>
                <p className="text-2xl font-bold tabular-nums flex items-center gap-2">
                  {monthComparison.difference >= 0 ? (
                    <>
                      <TrendingUp className="size-5 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        +{formatAmount(monthComparison.difference)}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="size-5 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        {formatAmount(monthComparison.difference)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Variation</p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    monthComparison.percentageChange >= 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {monthComparison.percentageChange >= 0 ? '+' : ''}
                  {monthComparison.percentageChange.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Graphique */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="montant" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Détail par catégorie */}
            {monthComparison.byCategory.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Par catégorie</p>
                {monthComparison.byCategory
                  .filter((c) => Math.abs(c.difference) > 0)
                  .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
                  .slice(0, 5)
                  .map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                    >
                      <span className="text-muted-foreground">{cat.categoryName}</span>
                      <span
                        className={`font-medium tabular-nums ${
                          cat.difference >= 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {cat.difference >= 0 ? '+' : ''}
                        {formatAmount(cat.difference)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="average" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Moyenne sur 3 mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Résumé */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div>
                <p className="text-sm text-muted-foreground">Moyenne</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatAmount(threeMonthAverage.averageTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Mois actuel</p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    threeMonthAverage.isAboveAverage
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {formatAmount(threeMonthAverage.currentTotal)}
                  {threeMonthAverage.isAboveAverage ? (
                    <TrendingUp className="inline size-5 ml-1" />
                  ) : (
                    <TrendingDown className="inline size-5 ml-1" />
                  )}
                </p>
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-center text-muted-foreground">
              {threeMonthAverage.isAboveAverage
                ? 'Vos dépenses ce mois sont supérieures à la moyenne'
                : 'Vos dépenses ce mois sont inférieures à la moyenne'}
            </p>

            {/* Détail par catégorie */}
            {threeMonthAverage.byCategory.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Par catégorie</p>
                {threeMonthAverage.byCategory
                  .filter((c) => c.average > 0 || c.current > 0)
                  .sort((a, b) => b.average - a.average)
                  .slice(0, 5)
                  .map((cat) => {
                    const diff = cat.current - cat.average
                    const isAbove = diff > 0
                    return (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                      >
                        <span className="text-muted-foreground">{cat.categoryName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            Moy: {formatAmount(cat.average)}
                          </span>
                          <span
                            className={`font-medium tabular-nums ${
                              isAbove
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {formatAmount(cat.current)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
