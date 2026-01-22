'use client'

import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Minus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface AvailableFundsProps {
  monthlyIncome: number
  monthlyExpenses: number
  fixedCharges: number
  minimalBudget: number
  reallyAvailable: number
}

export function AvailableFunds({
  monthlyIncome,
  monthlyExpenses,
  fixedCharges,
  minimalBudget,
  reallyAvailable,
}: AvailableFundsProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isNegative = reallyAvailable < 0
  const isLow = reallyAvailable > 0 && reallyAvailable < minimalBudget * 0.5

  return (
    <Card className="border-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="size-5" />
              Argent réellement disponible
            </CardTitle>
            <div className="flex items-center gap-3">
              <span
                className={`text-xl font-bold tabular-nums ${
                  isNegative
                    ? 'text-red-600 dark:text-red-400'
                    : isLow
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              >
                {formatAmount(reallyAvailable)}
              </span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  <span className="sr-only">
                    {isOpen ? 'Masquer' : 'Afficher'} les détails
                  </span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CollapsibleContent>
            {/* Calcul détaillé */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="size-3" />
                  Revenus du mois
                </span>
                <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                  {formatAmount(monthlyIncome)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Minus className="size-3" />
                  Dépenses effectuées
                </span>
                <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                  {formatAmount(monthlyExpenses)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Minus className="size-3" />
                  Charges fixes restantes
                </span>
                <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                  {formatAmount(fixedCharges)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Minus className="size-3" />
                  Budget minimum vital
                </span>
                <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                  {formatAmount(minimalBudget)}
                </span>
              </div>
            </div>
          </CollapsibleContent>

          {/* Alertes (toujours visibles) */}
        {isNegative && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">
              Attention : vous êtes en déficit. Limitez les dépenses non essentielles.
            </AlertDescription>
          </Alert>
        )}

        {isLow && !isNegative && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <TrendingDown className="size-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-900 dark:text-amber-100">
              Attention : argent disponible faible. Soyez vigilant sur vos prochaines dépenses.
            </AlertDescription>
          </Alert>
        )}

          {!isNegative && !isLow && reallyAvailable > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Vous pouvez utiliser ce montant pour vos dépenses variables ou votre épargne.
            </p>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  )
}
