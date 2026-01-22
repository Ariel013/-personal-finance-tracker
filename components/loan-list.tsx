'use client'

import { useState } from 'react'
import {
  User,
  Calendar,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { type Loan, type LoanType, type LoanRepayment } from '@/lib/types'

interface LoanListProps {
  loans: Loan[]
  type: LoanType
  onDelete: (id: string) => void
  onAddRepayment: (loanId: string, repayment: Omit<LoanRepayment, 'id' | 'createdAt'>) => void
  onDeleteRepayment: (loanId: string, repaymentId: string) => void
}

export function LoanList({
  loans,
  type,
  onDelete,
  onAddRepayment,
  onDeleteRepayment,
}: LoanListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | null>(null)
  const [repaymentAmount, setRepaymentAmount] = useState('')
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [repaymentNote, setRepaymentNote] = useState('')
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set())

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false
    const due = new Date(dueDate)
    const today = new Date()
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 && diff <= 7
  }

  const getStatusBadge = (loan: Loan) => {
    switch (loan.status) {
      case 'EN_COURS':
        return <Badge variant="secondary">En cours</Badge>
      case 'PARTIELLEMENT_REMBOURSE':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Partiel</Badge>
      case 'REMBOURSE':
        return <Badge variant="default" className="bg-green-600">Remboursé</Badge>
    }
  }

  const handleAddRepayment = () => {
    if (!repaymentLoan || !repaymentAmount) return

    onAddRepayment(repaymentLoan.id, {
      date: repaymentDate,
      amount: parseFloat(repaymentAmount),
      note: repaymentNote || undefined,
    })

    setRepaymentLoan(null)
    setRepaymentAmount('')
    setRepaymentDate(new Date().toISOString().split('T')[0])
    setRepaymentNote('')
  }

  const toggleExpanded = (loanId: string) => {
    setExpandedLoans((prev) => {
      const next = new Set(prev)
      if (next.has(loanId)) {
        next.delete(loanId)
      } else {
        next.add(loanId)
      }
      return next
    })
  }

  const filteredLoans = loans
    .filter((l) => l.type === type)
    .sort((a, b) => {
      // Tri: non remboursés d'abord, puis par date d'échéance
      if (a.status === 'REMBOURSE' && b.status !== 'REMBOURSE') return 1
      if (a.status !== 'REMBOURSE' && b.status === 'REMBOURSE') return -1
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return b.date.localeCompare(a.date)
    })

  const total = filteredLoans.reduce((sum, l) => sum + l.totalAmount, 0)
  const totalRemaining = filteredLoans.reduce((sum, l) => sum + l.remainingAmount, 0)
  const totalRepaid = filteredLoans.reduce((sum, l) => sum + l.repaidAmount, 0)

  const title = type === 'PRETE' ? 'Argent prêté' : 'Argent emprunté'
  const emptyMessage = type === 'PRETE' 
    ? "Aucun argent prêté" 
    : "Aucun argent emprunté"

  if (filteredLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-semibold tabular-nums">{formatAmount(total)}</div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Remboursé</div>
              <div className="font-semibold tabular-nums text-green-600 dark:text-green-400">
                {formatAmount(totalRepaid)}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="text-xs text-muted-foreground">Restant</div>
              <div className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                {formatAmount(totalRemaining)}
              </div>
            </div>
          </div>

          {/* Liste des prêts/dettes */}
          <div className="flex flex-col gap-2">
            {filteredLoans.map((loan) => {
              const percentage = (loan.repaidAmount / loan.totalAmount) * 100
              const isExpanded = expandedLoans.has(loan.id)
              const hasRepayments = loan.repayments.length > 0

              return (
                <div
                  key={loan.id}
                  className="rounded-lg border bg-card overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{loan.person}</span>
                          {getStatusBadge(loan)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>{formatDate(loan.date)}</span>
                          {loan.dueDate && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatDate(loan.dueDate)}
                                {isOverdue(loan.dueDate) && loan.status !== 'REMBOURSE' && (
                                  <AlertCircle className="size-3 text-red-500" />
                                )}
                                {isDueSoon(loan.dueDate) && loan.status !== 'REMBOURSE' && (
                                  <Clock className="size-3 text-amber-500" />
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {loan.status !== 'REMBOURSE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRepaymentLoan(loan)}
                          >
                            <Plus className="size-4 mr-1" />
                            Rembourser
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingId(loan.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatAmount(loan.repaidAmount)} / {formatAmount(loan.totalAmount)}
                        </span>
                        <span className="font-semibold tabular-nums">
                          Reste: {formatAmount(loan.remainingAmount)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {percentage.toFixed(0)}% remboursé
                      </div>
                    </div>

                    {loan.note && (
                      <p className="text-xs text-muted-foreground italic mt-3 p-2 bg-muted/30 rounded">
                        {loan.note}
                      </p>
                    )}

                    {/* Remboursements */}
                    {hasRepayments && (
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleExpanded(loan.id)}
                        className="mt-3"
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full">
                            {isExpanded ? (
                              <>
                                <ChevronUp className="size-4 mr-2" />
                                Masquer les remboursements ({loan.repayments.length})
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-4 mr-2" />
                                Voir les remboursements ({loan.repayments.length})
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="space-y-1 pl-6 border-l-2">
                            {loan.repayments
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map((repayment) => (
                                <div
                                  key={repayment.id}
                                  className="flex items-center justify-between text-sm py-2 px-3 rounded bg-muted/30"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {formatAmount(repayment.amount)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(repayment.date)}
                                      {repayment.note && ` • ${repayment.note}`}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => onDeleteRepayment(loan.id, repayment.id)}
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Remboursement */}
      <Dialog open={!!repaymentLoan} onOpenChange={(open) => !open && setRepaymentLoan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un remboursement</DialogTitle>
          </DialogHeader>
          {repaymentLoan && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">Prêt/Dette</div>
                <div className="font-medium">{repaymentLoan.person}</div>
                <div className="text-sm">
                  Restant: {formatAmount(repaymentLoan.remainingAmount)}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="repay-amount">Montant</Label>
                <Input
                  id="repay-amount"
                  type="number"
                  step="1000"
                  min="0"
                  max={repaymentLoan.remainingAmount}
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="repay-date">Date</Label>
                <Input
                  id="repay-date"
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="repay-note">Note (optionnel)</Label>
                <Textarea
                  id="repay-note"
                  value={repaymentNote}
                  onChange={(e) => setRepaymentNote(e.target.value)}
                  placeholder="Note sur ce remboursement..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRepaymentLoan(null)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddRepayment}
                  disabled={!repaymentAmount || parseFloat(repaymentAmount) <= 0}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prêt/dette?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également tous les remboursements associés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  onDelete(deletingId)
                  setDeletingId(null)
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
