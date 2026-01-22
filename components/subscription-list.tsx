'use client'

import { useState } from 'react'
import { Pencil, Trash2, Calendar, Lock, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
import { type Subscription, type Category } from '@/lib/types'
import { SubscriptionForm } from './subscription-form'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  categories: Category[]
  onUpdate: (id: string, updates: Partial<Subscription>) => void
  onDelete: (id: string) => void
}

export function SubscriptionList({
  subscriptions,
  categories,
  onUpdate,
  onDelete,
}: SubscriptionListProps) {
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryById = (id: string) => categories.find((c) => c.id === id)

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const totalActive = subscriptions
    .filter((s) => s.status === 'ACTIF' || (s.isActive && !s.status))
    .reduce((sum, s) => sum + s.amount, 0)
  
  const totalFuture = subscriptions
    .filter((s) => s.status === 'A_VENIR')
    .reduce((sum, s) => sum + s.amount, 0)

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Aucun abonnement</p>
        <p className="text-sm text-muted-foreground">
          Ajoutez vos charges recurrentes
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 grid gap-3">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="text-sm text-muted-foreground">Total mensuel actif</div>
          <div className="text-2xl font-semibold tabular-nums">
            {formatAmount(totalActive)}
          </div>
        </div>
        {totalFuture > 0 && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 p-4">
            <div className="text-sm text-blue-700 dark:text-blue-300">Charges futures (à venir)</div>
            <div className="text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-100">
              {formatAmount(totalFuture)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              N'impactent pas encore le budget
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {subscriptions.map((subscription) => {
          const category = getCategoryById(subscription.categoryId)
          return (
            <div
              key={subscription.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                !subscription.isActive ? 'opacity-60' : 'bg-card'
              }`}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${category?.color}15` }}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: category?.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{subscription.name}</span>
                  {subscription.status === 'A_VENIR' && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      À venir
                    </Badge>
                  )}
                  {subscription.status === 'ACTIF' && subscription.isFixed && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Lock className="size-3" />
                      Fixe
                    </Badge>
                  )}
                  {(subscription.status === 'SUSPENDU' || subscription.isSuspended) && (
                    <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
                      <Pause className="size-3" />
                      Suspendu
                    </Badge>
                  )}
                  {subscription.frequency && subscription.frequency !== 'monthly' && (
                    <Badge variant="outline" className="text-xs">
                      {subscription.frequency === 'quarterly' && 'Trimestriel'}
                      {subscription.frequency === 'yearly' && 'Annuel'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{category?.name}</span>
                  {subscription.startMonth && (
                    <>
                      <span>•</span>
                      <span>Dès {formatMonth(subscription.startMonth)}</span>
                    </>
                  )}
                  <span>•</span>
                  <Calendar className="size-3" />
                  <span>Le {subscription.billingDate} du mois</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {formatAmount(subscription.amount)}
                </span>
                <Switch
                  checked={subscription.isActive}
                  onCheckedChange={(checked) =>
                    onUpdate(subscription.id, { isActive: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingSubscription(subscription)}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeletingId(subscription.id)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {editingSubscription && (
        <SubscriptionForm
          open={!!editingSubscription}
          onOpenChange={(open) => !open && setEditingSubscription(null)}
          categories={categories}
          subscription={editingSubscription}
          onSubmit={(data) => {
            onUpdate(editingSubscription.id, data)
            setEditingSubscription(null)
          }}
        />
      )}

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'abonnement?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible.
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
