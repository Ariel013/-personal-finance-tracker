'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  type Expense,
  type ExpenseItem,
  type Category,
  PAYMENT_METHODS,
  ITEM_CATEGORIES,
  SUGGESTED_TAGS,
  type PaymentMethod,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  expense?: Expense
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt'>) => void
}

interface ItemFormData {
  id: string
  name: string
  quantity: string
  unit: string
  unitPrice: string
  total: string
  itemCategory: string
}

const createEmptyItem = (): ItemFormData => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: '',
  unit: '',
  unitPrice: '',
  total: '',
  itemCategory: '',
})

export function ExpenseForm({
  open,
  onOpenChange,
  categories,
  expense,
  onSubmit,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '')
  const [subcategory, setSubcategory] = useState(expense?.subcategory || '')
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    expense?.paymentMethod || 'cash'
  )
  const [note, setNote] = useState(expense?.note || '')
  const [decisionNote, setDecisionNote] = useState(expense?.decisionNote || '')
  const [tags, setTags] = useState<string[]>(expense?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [items, setItems] = useState<ItemFormData[]>(() => {
    if (expense?.items && expense.items.length > 0) {
      return expense.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity?.toString() || '',
        unit: item.unit || '',
        unitPrice: item.unitPrice?.toString() || '',
        total: item.total?.toString() || '',
        itemCategory: item.itemCategory || '',
      }))
    }
    return []
  })
  const [isItemsOpen, setIsItemsOpen] = useState(
    expense?.items && expense.items.length > 0
  )
  const [useAutoTotal, setUseAutoTotal] = useState(false)
  const [showDetails, setShowDetails] = useState(!!expense)

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount?.toString() || '')
      setCategoryId(expense.categoryId || '')
      setSubcategory(expense.subcategory || '')
      setDate(expense.date || new Date().toISOString().split('T')[0])
      setPaymentMethod(expense.paymentMethod || 'cash')
      setNote(expense.note || '')
      setDecisionNote(expense.decisionNote || '')
      setTags(expense.tags || [])
      if (expense.items && expense.items.length > 0) {
        setItems(
          expense.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity?.toString() || '',
            unit: item.unit || '',
            unitPrice: item.unitPrice?.toString() || '',
            total: item.total?.toString() || '',
            itemCategory: item.itemCategory || '',
          }))
        )
        setIsItemsOpen(true)
      } else {
        setItems([])
        setIsItemsOpen(false)
      }
    } else {
      resetForm()
    }
  }, [expense])

  const resetForm = () => {
    setAmount('')
    setCategoryId('')
    setSubcategory('')
    setDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('cash')
    setNote('')
    setDecisionNote('')
    setTags([])
    setTagInput('')
    setItems([])
    setIsItemsOpen(false)
    setUseAutoTotal(false)
    setShowDetails(false)
  }

  // Calculate item total when quantity or unit price changes
  const updateItemTotal = (index: number, field: 'quantity' | 'unitPrice', value: string) => {
    setItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }

      const qty = parseFloat(newItems[index].quantity) || 0
      const price = parseFloat(newItems[index].unitPrice) || 0
      if (qty > 0 && price > 0) {
        newItems[index].total = (qty * price).toString()
      }

      return newItems
    })
  }

  // Calculate total from items
  const calculateItemsTotal = () => {
    return items.reduce((sum, item) => {
      const total = parseFloat(item.total) || 0
      return sum + total
    }, 0)
  }

  // Auto-update amount when items change and useAutoTotal is enabled
  useEffect(() => {
    if (useAutoTotal && items.length > 0) {
      const total = calculateItemsTotal()
      if (total > 0) {
        setAmount(total.toString())
      }
    }
  }, [items, useAutoTotal])

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
    if (!isItemsOpen) setIsItemsOpen(true)
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemFormData, value: string) => {
    if (field === 'quantity' || field === 'unitPrice') {
      updateItemTotal(index, field, value)
    } else {
      setItems((prev) => {
        const newItems = [...prev]
        newItems[index] = { ...newItems[index], [field]: value }
        return newItems
      })
    }
  }

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags((prev) => [...prev, normalizedTag])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId || !date) return

    // Convert items form data to ExpenseItem[]
    const expenseItems: ExpenseItem[] = items
      .filter((item) => item.name.trim() !== '')
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        quantity: item.quantity ? parseFloat(item.quantity) : undefined,
        unit: item.unit || undefined,
        unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : undefined,
        total: item.total ? parseFloat(item.total) : undefined,
        itemCategory: item.itemCategory || undefined,
      }))

    onSubmit({
      amount: parseFloat(amount),
      categoryId,
      subcategory: subcategory || undefined,
      date,
      paymentMethod,
      note: note || undefined,
      decisionNote: decisionNote || undefined,
      tags: tags.length > 0 ? tags : undefined,
      items: expenseItems.length > 0 ? expenseItems : undefined,
    })

    resetForm()
    onOpenChange(false)
  }

  const itemsTotal = calculateItemsTotal()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Modifier la depense' : 'Nouvelle depense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Champs essentiels : montant + catégorie */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Montant</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setUseAutoTotal(false)
                }}
                required
                autoFocus
                className="flex-1 text-lg"
              />
              {items.length > 0 && itemsTotal > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap bg-transparent"
                  onClick={() => {
                    setAmount(itemsTotal.toString())
                    setUseAutoTotal(true)
                  }}
                >
                  = {itemsTotal.toLocaleString('fr-FR')}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Selectionner une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action rapide */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {expense ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>

          {/* Toggle pour afficher les détails */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="size-3" />
                    Masquer les details
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3" />
                    Plus de details
                  </>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="subcategory">Sous-categorie</Label>
                <Input
                  id="subcategory"
                  placeholder="Ex: Restaurant, Metro..."
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment">Paiement</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger id="payment" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  placeholder="Ajouter une note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="decisionNote">Note de decision</Label>
                <Textarea
                  id="decisionNote"
                  placeholder="Pourquoi cette depense ?"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        tags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-dashed hover:bg-muted/50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {tags.filter((t) => !SUGGESTED_TAGS.includes(t as typeof SUGGESTED_TAGS[number])).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.filter((t) => !SUGGESTED_TAGS.includes(t as typeof SUGGESTED_TAGS[number])).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:bg-muted rounded-sm p-0.5">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag personnalise..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Items Section */}
              <Collapsible open={isItemsOpen} onOpenChange={setIsItemsOpen}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        Details ({items.length} item{items.length !== 1 ? 's' : ''})
                      </span>
                      {isItemsOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 pt-0 flex flex-col gap-3">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              placeholder="Nom de l'item"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <Input
                              type="number"
                              placeholder="Qte"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            />
                            <Input
                              placeholder="Unite"
                              value={item.unit}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Prix unit."
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Total"
                              value={item.total}
                              onChange={(e) => updateItem(index, 'total', e.target.value)}
                            />
                          </div>
                          <Select
                            value={item.itemCategory}
                            onValueChange={(v) => updateItem(index, 'itemCategory', v)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Type d'item (optionnel)" />
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={addItem}
                      >
                        <Plus className="size-4 mr-2" />
                        Ajouter un item
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </DialogContent>
    </Dialog>
  )
}
