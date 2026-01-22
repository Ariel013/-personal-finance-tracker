'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type Income, INCOME_SOURCES } from '@/lib/types'

interface IncomeFormProps {
  onAdd: (income: Omit<Income, 'id' | 'createdAt'>) => void
  selectedMonth: string
}

export function IncomeForm({ onAdd, selectedMonth }: IncomeFormProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<string>(INCOME_SOURCES[0])
  const [customSource, setCustomSource] = useState('')
  const [date, setDate] = useState(selectedMonth + '-01')
  const [isRecurring, setIsRecurring] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalSource = source === 'Autre' && customSource ? customSource : source

    onAdd({
      amount: parseFloat(amount),
      source: finalSource,
      date,
      isRecurring,
    })

    // Reset form
    setAmount('')
    setSource(INCOME_SOURCES[0])
    setCustomSource('')
    setDate(selectedMonth + '-01')
    setIsRecurring(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Ajouter un revenu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau revenu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Montant</Label>
            <Input
              id="amount"
              type="number"
              step="1"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {source === 'Autre' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customSource">Source personnalisée</Label>
              <Input
                id="customSource"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Ex: Vente occasion"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="recurring" className="cursor-pointer">
              Revenu récurrent
            </Label>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            Ajouter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
