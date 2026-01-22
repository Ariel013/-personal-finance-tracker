'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { type Subscription, type Category } from '@/lib/types'

interface SubscriptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  subscription?: Subscription
  onSubmit: (data: Omit<Subscription, 'id' | 'createdAt'>) => void
}

export function SubscriptionForm({
  open,
  onOpenChange,
  categories,
  subscription,
  onSubmit,
}: SubscriptionFormProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [billingDate, setBillingDate] = useState('1')
  const [isActive, setIsActive] = useState(true)
  const [isFixed, setIsFixed] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspendedUntil, setSuspendedUntil] = useState('')
  
  // New fields
  const [status, setStatus] = useState<'A_VENIR' | 'ACTIF' | 'SUSPENDU'>('ACTIF')
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [startMonth, setStartMonth] = useState('')
  const [endMonth, setEndMonth] = useState('')

  useEffect(() => {
    if (subscription) {
      setName(subscription.name)
      setAmount(subscription.amount.toString())
      setCategoryId(subscription.categoryId)
      setBillingDate(subscription.billingDate.toString())
      setIsActive(subscription.isActive ?? true)
      setIsFixed(subscription.isFixed ?? true)
      setIsSuspended(subscription.isSuspended ?? false)
      setSuspendedUntil(subscription.suspendedUntil || '')
      setStatus(subscription.status || 'ACTIF')
      setFrequency(subscription.frequency || 'monthly')
      setStartMonth(subscription.startMonth || '')
      setEndMonth(subscription.endMonth || '')
    } else {
      // Defaults for new subscription
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setStartMonth(currentMonth)
    }
  }, [subscription, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !categoryId || !billingDate || !startMonth) return

    onSubmit({
      name,
      amount: parseFloat(amount),
      categoryId,
      billingDate: parseInt(billingDate),
      isActive: status === 'ACTIF',
      isFixed,
      isSuspended: status === 'SUSPENDU',
      suspendedUntil: status === 'SUSPENDU' && suspendedUntil ? suspendedUntil : undefined,
      status,
      frequency,
      startMonth,
      endMonth: endMonth || undefined,
    })

    // Reset form
    setName('')
    setAmount('')
    setCategoryId('')
    setBillingDate('1')
    setIsActive(true)
    setIsFixed(true)
    setIsSuspended(false)
    setSuspendedUntil('')
    setStatus('ACTIF')
    setFrequency('monthly')
    setStartMonth('')
    setEndMonth('')
    onOpenChange(false)
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'A_VENIR':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">À venir</Badge>
      case 'ACTIF':
        return <Badge variant="default" className="bg-green-600">Actif</Badge>
      case 'SUSPENDU':
        return <Badge variant="outline">Suspendu</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {subscription ? 'Modifier l\'abonnement' : 'Nouvel abonnement'}
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Configurez les détails de l'abonnement et sa date d'activation budgétaire
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Basic Info */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              placeholder="Ex: Netflix, Gym..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-amount">Montant</Label>
              <Input
                id="sub-amount"
                type="number"
                step="1000"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Frequency and Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequency">Fréquence</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="quarterly">Trimestrielle</SelectItem>
                  <SelectItem value="yearly">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="billingDate">Jour de facturation</Label>
              <Input
                id="billingDate"
                type="number"
                min="1"
                max="31"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Budgetary Activation */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Activation budgétaire</Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_VENIR">
                    <div className="flex flex-col items-start">
                      <span>À venir</span>
                      <span className="text-xs text-muted-foreground">
                        Visible mais n'impacte pas le budget
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ACTIF">
                    <div className="flex flex-col items-start">
                      <span>Actif</span>
                      <span className="text-xs text-muted-foreground">
                        Impacte le budget
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SUSPENDU">
                    <div className="flex flex-col items-start">
                      <span>Suspendu</span>
                      <span className="text-xs text-muted-foreground">
                        Temporairement inactif
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="startMonth">Début d'impact</Label>
                <Input
                  id="startMonth"
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Premier mois de déduction budgétaire
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="endMonth">Fin (optionnel)</Label>
                <Input
                  id="endMonth"
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dernier mois d'impact
                </p>
              </div>
            </div>

            {status === 'SUSPENDU' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="suspendedUntil">Suspendu jusqu'à</Label>
                <Input
                  id="suspendedUntil"
                  type="month"
                  value={suspendedUntil}
                  onChange={(e) => setSuspendedUntil(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Type */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex flex-col gap-1">
              <Label htmlFor="isFixed" className="font-medium">Charge fixe</Label>
              <span className="text-xs text-muted-foreground">
                Montant identique chaque période
              </span>
            </div>
            <Switch
              id="isFixed"
              checked={isFixed}
              onCheckedChange={setIsFixed}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {subscription ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
