'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Calendar,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type FinancialAction, type ActionStatus } from '@/lib/types'

interface FinancialActionsProps {
  actions: FinancialAction[]
  loans: Array<{ type: string; remainingAmount: number; status: string }>
  onAdd: (action: Omit<FinancialAction, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, updates: Partial<FinancialAction>) => void
  onDelete: (id: string) => void
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const STATUS_CONFIG: Record<
  ActionStatus,
  { label: string; color: string; icon: typeof Check }
> = {
  A_FAIRE: { label: 'À faire', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  FAIT: { label: 'Fait', color: 'bg-green-100 text-green-700 border-green-200', icon: Check },
}

export function FinancialActions({
  actions,
  loans,
  onAdd,
  onUpdate,
  onDelete,
}: FinancialActionsProps) {
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<ActionStatus>('A_FAIRE')
  const [note, setNote] = useState('')

  const handleAdd = () => {
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      dueDate: dueDate || undefined,
      status,
      note: note.trim() || undefined,
    })
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setTitle('')
    setAmount('')
    setDueDate('')
    setStatus('A_FAIRE')
    setNote('')
  }

  // Group actions by status
  const grouped = {
    A_FAIRE: actions.filter((a) => a.status === 'A_FAIRE'),
    EN_ATTENTE: actions.filter((a) => a.status === 'EN_ATTENTE'),
    FAIT: actions.filter((a) => a.status === 'FAIT'),
  }

  // Totals by status
  const totalByStatus = (status: ActionStatus) =>
    actions
      .filter((a) => a.status === status && a.amount)
      .reduce((sum, a) => sum + (a.amount || 0), 0)

  // Total remaining debts from loans
  const totalDebts = loans
    .filter((l) => l.type === 'EMPRUNTE' && l.status !== 'REMBOURSE')
    .reduce((sum, l) => sum + l.remainingAmount, 0)

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">À faire</div>
            <div className="text-xl font-bold tabular-nums text-red-600">
              {formatAmount(totalByStatus('A_FAIRE'))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {grouped.A_FAIRE.length} action{grouped.A_FAIRE.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">En attente</div>
            <div className="text-xl font-bold tabular-nums text-amber-600">
              {formatAmount(totalByStatus('EN_ATTENTE'))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {grouped.EN_ATTENTE.length} action{grouped.EN_ATTENTE.length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Dettes restantes</div>
            <div className="text-xl font-bold tabular-nums text-red-600">
              {formatAmount(totalDebts)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Action lists by status */}
      {(['A_FAIRE', 'EN_ATTENTE', 'FAIT'] as const).map((statusKey) => {
        const items = grouped[statusKey]
        if (items.length === 0) return null
        const config = STATUS_CONFIG[statusKey]

        return (
          <Card key={statusKey}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <config.icon className="size-4" />
                {config.label} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {items
                  .sort((a, b) => {
                    // Sort by due date (earliest first), no date last
                    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
                    if (a.dueDate) return -1
                    if (b.dueDate) return 1
                    return 0
                  })
                  .map((action) => (
                    <div
                      key={action.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        statusKey === 'FAIT' ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Checkbox for completion */}
                      <Checkbox
                        checked={action.status === 'FAIT'}
                        onCheckedChange={(checked) =>
                          onUpdate(action.id, {
                            status: checked ? 'FAIT' : 'A_FAIRE',
                          })
                        }
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium ${
                              action.status === 'FAIT' ? 'line-through' : ''
                            }`}
                          >
                            {action.title}
                          </span>
                          {action.amount && (
                            <Badge variant="outline" className="tabular-nums text-xs">
                              {formatAmount(action.amount)}
                            </Badge>
                          )}
                          {action.dueDate && isOverdue(action.dueDate) && action.status !== 'FAIT' && (
                            <Badge variant="destructive" className="text-[10px]">
                              En retard
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {action.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(action.dueDate)}
                            </span>
                          )}
                          {action.note && <span>• {action.note}</span>}
                          {action.completedDate && (
                            <span className="text-green-600">
                              Fait le {formatDate(action.completedDate.split('T')[0])}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status selector */}
                      <Select
                        value={action.status}
                        onValueChange={(val: ActionStatus) =>
                          onUpdate(action.id, { status: val })
                        }
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A_FAIRE">À faire</SelectItem>
                          <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                          <SelectItem value="FAIT">Fait</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingId(action.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {actions.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">
              Aucune action financière. Cliquez sur &quot;Nouvelle action&quot; pour commencer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle action financière</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-title">Action *</Label>
              <Input
                id="action-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Rembourser Franck"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action-amount">Montant (optionnel)</Label>
              <Input
                id="action-amount"
                type="number"
                step="1000"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action-date">Échéance (optionnel)</Label>
              <Input
                id="action-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action-status">Statut</Label>
              <Select value={status} onValueChange={(val: ActionStatus) => setStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_FAIRE">À faire</SelectItem>
                  <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                  <SelectItem value="FAIT">Fait</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="action-note">Note (optionnel)</Label>
              <Textarea
                id="action-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contexte ou détails..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdd}
                disabled={!title.trim()}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette action ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action sera supprimée définitivement.
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
    </div>
  )
}
