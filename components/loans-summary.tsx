'use client'

import { useState } from 'react'
import { HandCoins, Banknote, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { type Loan } from '@/lib/types'

interface LoansSummaryProps {
  loans: Loan[]
}

export function LoansSummary({ loans }: LoansSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Argent prêté (créances)
  const loanedOut = loans.filter((l) => l.type === 'PRETE')
  const totalLoanedOut = loanedOut.reduce((sum, l) => sum + l.remainingAmount, 0)

  // Argent emprunté (dettes)
  const borrowed = loans.filter((l) => l.type === 'EMPRUNTE')
  const totalBorrowed = borrowed.reduce((sum, l) => sum + l.remainingAmount, 0)

  // Impact net sur la trésorerie
  const netImpact = totalLoanedOut - totalBorrowed

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <HandCoins className="size-4" />
              Prêts & Dettes
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          {!isOpen && (
            <div className="flex items-center gap-4 pt-1">
              <div>
                <span className="text-xs text-muted-foreground">Impact net:</span>
                <span
                  className={`ml-2 text-lg font-bold tabular-nums ${
                    netImpact > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : netImpact < 0
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                  }`}
                >
                  {netImpact >= 0 ? '+' : ''}{formatAmount(netImpact)}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <HandCoins className="size-4" />
            Argent prêté
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {formatAmount(totalLoanedOut)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {loanedOut.length} prêt{loanedOut.length > 1 ? 's' : ''} en cours
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Banknote className="size-4" />
            Argent emprunté
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
            {formatAmount(totalBorrowed)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {borrowed.length} dette{borrowed.length > 1 ? 's' : ''} en cours
          </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Impact net
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  netImpact > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : netImpact < 0
                      ? 'text-red-600 dark:text-red-400'
                      : ''
                }`}
              >
                {netImpact >= 0 ? '+' : ''}{formatAmount(netImpact)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {netImpact > 0
                  ? 'Argent bloqué chez les autres'
                  : netImpact < 0
                    ? 'À rembourser'
                    : 'Aucun impact'}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </CollapsibleContent>
  </Card>
</Collapsible>
  )
}
