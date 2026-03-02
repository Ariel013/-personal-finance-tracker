'use client'

import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Save, TrendingUp, TrendingDown, Minus, FileText, Camera } from 'lucide-react'
import {
  type Expense,
  type Income,
  type Category,
  type Loan,
  type MonthlySnapshot,
  type MonthComparison,
} from '@/lib/types'

interface MonthlyReportProps {
  expenses: Expense[]
  incomes: Income[]
  categories: Category[]
  loans: Loan[]
  snapshots: MonthlySnapshot[]
  selectedMonth: string
  analysis: {
    monthlyIncome: number
    monthlyExpenses: number
    fixedChargesForMonth: number
    reallyAvailable: number
    monthComparison: MonthComparison
    budgetStatus: Array<{
      categoryId: string
      categoryName: string
      categoryColor: string
      budgeted: number
      spent: number
      remaining: number
      percentage: number
      status: 'ok' | 'warning' | 'exceeded'
    }>
  }
  onCreateSnapshot: (month: string) => void
  onUpdateSnapshot: (month: string, updates: Partial<MonthlySnapshot>) => void
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount)

export function MonthlyReport({
  expenses,
  incomes,
  categories,
  loans,
  snapshots,
  selectedMonth,
  analysis,
  onCreateSnapshot,
  onUpdateSnapshot,
}: MonthlyReportProps) {
  const snapshot = snapshots.find((s) => s.month === selectedMonth)
  const [reportNote, setReportNote] = useState(snapshot?.reportNote || '')
  const [attachmentPath, setAttachmentPath] = useState(snapshot?.attachmentPath || '')
  const [saved, setSaved] = useState(false)

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => e.date.startsWith(selectedMonth) && !e.isSimulated
    )

    return categories
      .map((cat) => {
        const total = monthExpenses
          .filter((e) => e.categoryId === cat.id)
          .reduce((sum, e) => sum + e.amount, 0)
        return { name: cat.name, value: total, color: cat.color }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [expenses, categories, selectedMonth])

  // Comparison data for bar chart
  const comparisonData = useMemo(() => {
    return analysis.monthComparison.byCategory
      .filter((c) => c.current > 0 || c.previous > 0)
      .map((c) => ({
        name: c.categoryName,
        'Mois en cours': c.current,
        'Mois précédent': c.previous,
      }))
  }, [analysis.monthComparison])

  // Daily average and projection
  const dailyStats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = new Date()
    const isCurrentMonth =
      today.getFullYear() === year && today.getMonth() + 1 === month
    const daysElapsed = isCurrentMonth
      ? today.getDate()
      : daysInMonth
    const daysRemaining = isCurrentMonth ? daysInMonth - daysElapsed : 0
    const dailyAverage =
      daysElapsed > 0 ? analysis.monthlyExpenses / daysElapsed : 0
    const projection = dailyAverage * daysInMonth

    return { daysInMonth, daysElapsed, daysRemaining, dailyAverage, projection, isCurrentMonth }
  }, [selectedMonth, analysis.monthlyExpenses])

  // Debt/receivable totals
  const loanStats = useMemo(() => {
    const totalDebts = loans
      .filter((l) => l.type === 'EMPRUNTE' && l.status !== 'REMBOURSE')
      .reduce((sum, l) => sum + l.remainingAmount, 0)
    const totalReceivable = loans
      .filter((l) => l.type === 'PRETE' && l.status !== 'REMBOURSE')
      .reduce((sum, l) => sum + l.remainingAmount, 0)
    return { totalDebts, totalReceivable }
  }, [loans])

  const balance = analysis.monthlyIncome - analysis.monthlyExpenses

  const handleSaveNote = () => {
    if (!snapshot) {
      onCreateSnapshot(selectedMonth)
    }
    // Small delay to ensure snapshot exists before updating
    setTimeout(() => {
      onUpdateSnapshot(selectedMonth, {
        reportNote: reportNote || undefined,
        attachmentPath: attachmentPath || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 100)
  }

  const percentChange = analysis.monthComparison.percentageChange

  return (
    <div className="space-y-6">
      {/* Bloc 1: Snapshot du mois */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total dépenses</div>
            <div className="text-2xl font-bold tabular-nums">
              {formatAmount(analysis.monthlyExpenses)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {percentChange > 0 ? (
                <TrendingUp className="size-3 text-red-500" />
              ) : percentChange < 0 ? (
                <TrendingDown className="size-3 text-green-500" />
              ) : (
                <Minus className="size-3 text-muted-foreground" />
              )}
              <span
                className={`text-xs ${
                  percentChange > 0
                    ? 'text-red-500'
                    : percentChange < 0
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                }`}
              >
                {percentChange > 0 ? '+' : ''}
                {percentChange.toFixed(1)}% vs mois précédent
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Moyenne/jour</div>
            <div className="text-2xl font-bold tabular-nums">
              {formatAmount(dailyStats.dailyAverage)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {dailyStats.daysElapsed} jours écoulés sur {dailyStats.daysInMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Projection fin de mois</div>
            <div className="text-2xl font-bold tabular-nums">
              {formatAmount(dailyStats.projection)}
            </div>
            {dailyStats.isCurrentMonth && dailyStats.daysRemaining > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {dailyStats.daysRemaining} jours restants
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Solde du mois</div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatAmount(balance)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Revenus: {formatAmount(analysis.monthlyIncome)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart - répartition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aucune dépense ce mois
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bar chart - comparaison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparaison avec le mois précédent</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Legend />
                  <Bar dataKey="Mois en cours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Mois précédent" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Pas assez de données pour comparer
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget status */}
      {analysis.budgetStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi des budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analysis.budgetStatus.map((b) => (
                <div key={b.categoryId} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{b.categoryName}</span>
                    <Badge
                      variant={
                        b.status === 'ok'
                          ? 'default'
                          : b.status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {b.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(b.spent)} / {formatAmount(b.budgeted)}
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.status === 'ok'
                          ? 'bg-green-500'
                          : b.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloc 2: Santé financière */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Santé financière</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Solde actuel</div>
              <div
                className={`text-lg font-bold tabular-nums ${
                  balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatAmount(balance)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Dettes restantes</div>
              <div className="text-lg font-bold tabular-nums text-red-600">
                {formatAmount(loanStats.totalDebts)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">À recevoir (prêts)</div>
              <div className="text-lg font-bold tabular-nums text-blue-600">
                {formatAmount(loanStats.totalReceivable)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Marge restante</div>
              <div
                className={`text-lg font-bold tabular-nums ${
                  analysis.reallyAvailable >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatAmount(analysis.reallyAvailable)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloc 3: Note & fichier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Note du rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-note">Note (observations, décisions, contexte)</Label>
            <Textarea
              id="report-note"
              value={reportNote}
              onChange={(e) => {
                setReportNote(e.target.value)
                setSaved(false)
              }}
              placeholder="Observations sur ce mois..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attachment-path">Fichier attaché (chemin local)</Label>
            <Input
              id="attachment-path"
              value={attachmentPath}
              onChange={(e) => {
                setAttachmentPath(e.target.value)
                setSaved(false)
              }}
              placeholder="/chemin/vers/rapport-fevrier-2026.pdf"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSaveNote} size="sm">
              <Save className="size-4 mr-2" />
              {snapshot ? 'Sauvegarder' : 'Créer snapshot & sauvegarder'}
            </Button>
            {saved && (
              <span className="text-xs text-green-600">Sauvegardé</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
