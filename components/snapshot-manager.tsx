'use client'

import { useState } from 'react'
import { FileText, Download, Trash2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type MonthlySnapshot } from '@/lib/types'

interface SnapshotManagerProps {
  snapshots: MonthlySnapshot[]
  selectedMonth: string
  onCreateSnapshot: (month: string) => void
  onDeleteSnapshot: (id: string) => void
}

export function SnapshotManager({
  snapshots,
  selectedMonth,
  onCreateSnapshot,
  onDeleteSnapshot,
}: SnapshotManagerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const currentSnapshot = snapshots.find((s) => s.month === selectedMonth)

  const exportSnapshotToJSON = (snapshot: MonthlySnapshot) => {
    const jsonContent = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `snapshot-${snapshot.month}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Action pour le mois actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snapshot du mois en cours</CardTitle>
          <CardDescription>
            {formatMonth(selectedMonth)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentSnapshot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Créé le {formatDate(currentSnapshot.createdAt)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportSnapshotToJSON(currentSnapshot)}
                  >
                    <Download className="size-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingId(currentSnapshot.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Revenus</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatAmount(currentSnapshot.totalIncome)}
                  </div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Dépenses</div>
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {formatAmount(currentSnapshot.totalExpenses)}
                  </div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Charges fixes</div>
                  <div className="text-lg font-semibold">
                    {formatAmount(currentSnapshot.totalFixedCharges)}
                  </div>
                </div>
                <div className="p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Variables</div>
                  <div className="text-lg font-semibold">
                    {formatAmount(currentSnapshot.totalVariableExpenses)}
                  </div>
                </div>
              </div>

              {/* Budget compliance */}
              {currentSnapshot.budgetCompliance.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">État des budgets</div>
                  <div className="flex flex-wrap gap-2">
                    {currentSnapshot.budgetCompliance.map((comp) => (
                      <Badge
                        key={comp.categoryId}
                        variant={
                          comp.status === 'ok'
                            ? 'default'
                            : comp.status === 'warning'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="gap-1"
                      >
                        {comp.status === 'ok' && <CheckCircle className="size-3" />}
                        {comp.status === 'warning' && <AlertTriangle className="size-3" />}
                        {comp.status === 'exceeded' && <XCircle className="size-3" />}
                        {formatAmount(comp.spent)} / {formatAmount(comp.budgeted)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Top decisions */}
              {currentSnapshot.topDecisions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Décisions clés</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {currentSnapshot.topDecisions.slice(0, 5).map((decision, idx) => (
                      <li key={idx}>{decision}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Aucun snapshot pour ce mois
              </p>
              <Button onClick={() => onCreateSnapshot(selectedMonth)}>
                <FileText className="size-4 mr-2" />
                Créer un snapshot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des snapshots précédents */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {snapshots
                .sort((a, b) => b.month.localeCompare(a.month))
                .map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{formatMonth(snapshot.month)}</div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {formatAmount(snapshot.totalIncome - snapshot.totalExpenses)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportSnapshotToJSON(snapshot)}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(snapshot.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  onDeleteSnapshot(deletingId)
                  setDeletingId(null)
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
