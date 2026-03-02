'use client'

import React, { useRef, useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  Plus,
  Pencil,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2,
  Copy,
} from 'lucide-react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings as SettingsIcon, FileText } from 'lucide-react'
import { type Category, type ImportResult, type AppSettings, type MonthlySnapshot } from '@/lib/types'
import { SnapshotManager } from './snapshot-manager'

interface SettingsProps {
  categories: Category[]
  categoryThresholds: Record<string, number>
  settings: AppSettings
  snapshots: MonthlySnapshot[]
  selectedMonth: string
  onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void
  onUpdateCategory: (id: string, updates: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onSetThreshold: (categoryId: string, threshold: number) => void
  onUpdateSettings: (updates: Partial<AppSettings>) => void
  onCreateSnapshot: (month: string) => void
  onDeleteSnapshot: (id: string) => void
  onExportCSV: (options?: { month?: string; categoryId?: string }) => { success: boolean; message: string }
  onExportItemsCSV: (options?: { month?: string; categoryId?: string; itemCategory?: string }) => { success: boolean; message: string }
  onExportLoansCSV: () => { success: boolean; message: string }
  onExportRepaymentsCSV: () => { success: boolean; message: string }
  onExportJSON: () => void
  onImportJSON: (file: File) => Promise<ImportResult>
  onResetData: () => void
  availableMonths: string[]
  // Cloud sync
  cloudSync?: {
    isConnected: boolean
    isSyncing: boolean
    lastSyncAt: string | null
    error: string | null
    onConnect: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>
    onDisconnect: () => void
    onSyncNow: () => Promise<{ success: boolean; message: string }>
    onPullFromCloud: () => void
    onRestoreBackup: () => void
  }
}

const COLORS = [
  '#475569', '#0284c7', '#16a34a', '#7c3aed', '#dc2626',
  '#ea580c', '#db2777', '#0d9488', '#64748b', '#4f46e5',
]

export function Settings({
  categories,
  categoryThresholds,
  settings,
  snapshots,
  selectedMonth,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSetThreshold,
  onUpdateSettings,
  onCreateSnapshot,
  onDeleteSnapshot,
  onExportCSV,
  onExportItemsCSV,
  onExportLoansCSV,
  onExportRepaymentsCSV,
  onExportJSON,
  onImportJSON,
  onResetData,
  availableMonths,
  cloudSync,
}: SettingsProps) {
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState(COLORS[0])
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [exportMonth, setExportMonth] = useState<string>('')
  const [exportCategory, setExportCategory] = useState<string>('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cloud sync state
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [cloudNotification, setCloudNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showSqlInstructions, setShowSqlInstructions] = useState(false)
  
  // Transition month form
  const [showTransitionForm, setShowTransitionForm] = useState(false)
  const [transitionMonth, setTransitionMonth] = useState('')
  const [transitionReason, setTransitionReason] = useState('')
  const [transitionNote, setTransitionNote] = useState('')

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleAddTransitionMonth = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transitionMonth || !transitionReason) return

    onUpdateSettings({
      transitionMonths: [
        ...settings.transitionMonths,
        {
          month: transitionMonth,
          reason: transitionReason,
          ...(transitionNote && { note: transitionNote }),
        },
      ],
    })

    setTransitionMonth('')
    setTransitionReason('')
    setTransitionNote('')
    setShowTransitionForm(false)
    showNotification('success', 'Mois de transition ajouté')
  }

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName) return

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, { name: categoryName, color: categoryColor })
    } else {
      onAddCategory({ name: categoryName, color: categoryColor })
    }

    setCategoryName('')
    setCategoryColor(COLORS[0])
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryColor(category.color)
    setShowCategoryForm(true)
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const handleExportCSV = () => {
    const result = onExportCSV({
      month: exportMonth === 'all' ? undefined : exportMonth || undefined,
      categoryId: exportCategory === 'all' ? undefined : exportCategory || undefined,
    })
    if (!result.success) {
      showNotification('error', result.message)
    } else {
      showNotification('success', result.message)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingImportFile(file)
      setShowImportConfirm(true)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportConfirm = async () => {
    if (!pendingImportFile) return
    
    const result = await onImportJSON(pendingImportFile)
    
    if (result.success) {
      let message = result.message
      if (result.warnings?.length) {
        message += ` (${result.warnings.join(', ')})`
      }
      showNotification('success', message)
    } else {
      showNotification('error', result.message)
    }
    
    setPendingImportFile(null)
    setShowImportConfirm(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="gap-2">
            <SettingsIcon className="size-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="gap-2">
            <FileText className="size-4" />
            Snapshots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="flex flex-col gap-6 mt-6">
          {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parametres generaux</CardTitle>
          <CardDescription>
            Configuration du pilotage financier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="strictMode" className="cursor-pointer">
                  Mode mois sous controle
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Active des contraintes strictes sur les depenses
                </p>
              </div>
              <Switch
                id="strictMode"
                checked={settings.strictMode}
                onCheckedChange={(checked) =>
                  onUpdateSettings({ strictMode: checked })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="minimalBudget">Budget minimum vital (mensuel)</Label>
              <Input
                id="minimalBudget"
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                value={settings.minimalBudget || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : 0
                  onUpdateSettings({ minimalBudget: value })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Montant reserve pour les depenses incompressibles (alimentation, transport essentiels)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transition Months */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Mois de transition</CardTitle>
              <CardDescription>
                Marquez les mois non représentatifs (changement de pays, fin de contrat, etc.)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransitionForm(true)}
            >
              <Plus className="size-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.transitionMonths.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Aucun mois de transition défini
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {settings.transitionMonths
                .sort((a, b) => b.month.localeCompare(a.month))
                .map((tm, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50/30 dark:bg-amber-950/20"
                  >
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {new Date(tm.month + '-01').toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {tm.reason}
                      </p>
                      {tm.note && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          {tm.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        onUpdateSettings({
                          transitionMonths: settings.transitionMonths.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              💡 Les mois de transition désactivent les alertes budgétaires et affichent un message explicatif sur le dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Categories</CardTitle>
              <CardDescription>
                Gerez vos categories de depenses
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowCategoryForm(true)}>
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                  {category.isDefault && (
                    <span className="text-xs text-muted-foreground">(par defaut)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditCategory(category)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Modifier</span>
                  </Button>
                  {!category.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingCategoryId(category.id)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seuils d'alerte</CardTitle>
          <CardDescription>
            Definissez des limites par categorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm truncate">{category.name}</span>
                </div>
                <Input
                  type="number"
                  placeholder="Seuil"
                  className="w-32"
                  value={categoryThresholds[category.id] || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : 0
                    onSetThreshold(category.id, value)
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore (JSON) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sauvegarde et restauration</CardTitle>
          <CardDescription>
            Exportez ou importez toutes vos donnees au format JSON pour synchroniser entre appareils
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={onExportJSON} className="flex-1 bg-transparent">
                <FileJson className="size-4" />
                Exporter JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-transparent"
              >
                <Upload className="size-4" />
                Importer JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le fichier JSON inclut toutes vos depenses, categories, abonnements et seuils.
              Compatible entre appareils (PC et mobile).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export CSV</CardTitle>
          <CardDescription>
            Telecharger vos depenses au format tableur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Periode</Label>
                <Select value={exportMonth} onValueChange={setExportMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les periodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les periodes</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {formatMonth(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Categorie</Label>
                <Select value={exportCategory} onValueChange={setExportCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleExportCSV} className="flex-1 bg-transparent">
                <FileSpreadsheet className="size-4" />
                Exporter depenses
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const result = onExportItemsCSV({
                    month: exportMonth === 'all' ? undefined : exportMonth || undefined,
                    categoryId: exportCategory === 'all' ? undefined : exportCategory || undefined,
                  })
                  if (!result.success) {
                    showNotification('error', result.message)
                  } else {
                    showNotification('success', result.message)
                  }
                }}
                className="flex-1 bg-transparent"
              >
                <FileSpreadsheet className="size-4" />
                Exporter items
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const result = onExportLoansCSV()
                  if (!result.success) {
                    showNotification('error', result.message)
                  } else {
                    showNotification('success', result.message)
                  }
                }}
                className="flex-1 bg-transparent"
              >
                <FileSpreadsheet className="size-4" />
                Exporter prets/dettes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const result = onExportRepaymentsCSV()
                  if (!result.success) {
                    showNotification('error', result.message)
                  } else {
                    showNotification('success', result.message)
                  }
                }}
                className="flex-1 bg-transparent"
              >
                <FileSpreadsheet className="size-4" />
                Exporter remboursements
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Export depenses: une ligne par depense. Export items: une ligne par item detaille. Export prets/dettes: historique complet.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {cloudSync?.isConnected ? <Cloud className="size-4 text-green-600" /> : <CloudOff className="size-4 text-muted-foreground" />}
            Synchronisation Cloud
          </CardTitle>
          <CardDescription>
            Connectez votre base Supabase pour acceder a vos donnees depuis n&apos;importe quel appareil.
            Les donnees sont toujours sauvegardees en local d&apos;abord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cloudSync?.isConnected ? (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" />
                Connecte a Supabase
              </div>
              {cloudSync.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Derniere sync : {new Date(cloudSync.lastSyncAt).toLocaleString('fr-FR')}
                </p>
              )}
              {cloudSync.error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {cloudSync.error}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const result = await cloudSync.onSyncNow()
                    setCloudNotification({ type: result.success ? 'success' : 'error', message: result.message })
                    setTimeout(() => setCloudNotification(null), 3000)
                  }}
                  disabled={cloudSync.isSyncing}
                >
                  {cloudSync.isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Envoyer vers le cloud
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cloudSync.onPullFromCloud()}
                  disabled={cloudSync.isSyncing}
                >
                  <Download className="size-4" />
                  Recuperer du cloud
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cloudSync.onRestoreBackup()}
                >
                  Restaurer backup local
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    cloudSync.onDisconnect()
                    setSupabaseUrl('')
                    setSupabaseKey('')
                    setCloudNotification({ type: 'success', message: 'Deconnecte. Vos donnees locales sont intactes.' })
                    setTimeout(() => setCloudNotification(null), 3000)
                  }}
                >
                  <CloudOff className="size-4" />
                  Deconnecter
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="supabase-url">URL du projet Supabase</Label>
                  <Input
                    id="supabase-url"
                    placeholder="https://xxxxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supabase-key">Cle anon (publique)</Label>
                  <Input
                    id="supabase-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!supabaseUrl || !supabaseKey || cloudSync?.isSyncing}
                    onClick={async () => {
                      if (!cloudSync) return
                      const result = await cloudSync.onConnect(supabaseUrl, supabaseKey)
                      setCloudNotification({ type: result.success ? 'success' : 'error', message: result.message })
                      setTimeout(() => setCloudNotification(null), 5000)
                    }}
                  >
                    {cloudSync?.isSyncing ? <Loader2 className="size-4 animate-spin" /> : <Cloud className="size-4" />}
                    Connecter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSqlInstructions(!showSqlInstructions)}
                  >
                    {showSqlInstructions ? 'Masquer' : 'Voir les instructions SQL'}
                  </Button>
                </div>
              </div>
              {showSqlInstructions && (
                <div className="mt-3 rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Executez ce SQL dans votre projet Supabase (SQL Editor) :
                  </p>
                  <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto whitespace-pre">{`CREATE TABLE app_data (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device TEXT DEFAULT 'unknown'
);

ALTER TABLE app_data DISABLE ROW LEVEL SECURITY;`}</pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`CREATE TABLE app_data (\n  id TEXT PRIMARY KEY DEFAULT 'default',\n  data JSONB NOT NULL,\n  updated_at TIMESTAMPTZ DEFAULT NOW(),\n  device TEXT DEFAULT 'unknown'\n);\n\nALTER TABLE app_data DISABLE ROW LEVEL SECURITY;`)
                      setCloudNotification({ type: 'success', message: 'SQL copie!' })
                      setTimeout(() => setCloudNotification(null), 2000)
                    }}
                  >
                    <Copy className="size-4" />
                    Copier le SQL
                  </Button>
                </div>
              )}
            </>
          )}
          {cloudNotification && (
            <div className={`flex items-center gap-2 text-sm ${cloudNotification.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
              {cloudNotification.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              {cloudNotification.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Data */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Ces actions sont irreversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 className="size-4" />
            Reinitialiser toutes les donnees
          </Button>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="mt-6">
          <SnapshotManager
            snapshots={snapshots}
            selectedMonth={selectedMonth}
            onCreateSnapshot={onCreateSnapshot}
            onDeleteSnapshot={onDeleteSnapshot}
          />
        </TabsContent>
      </Tabs>

      {/* Category Form Dialog */}
      <Dialog
        open={showCategoryForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowCategoryForm(false)
            setEditingCategory(null)
            setCategoryName('')
            setCategoryColor(COLORS[0])
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la categorie' : 'Nouvelle categorie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-name">Nom</Label>
              <Input
                id="cat-name"
                placeholder="Nom de la categorie"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-8 rounded-full transition-transform ${
                      categoryColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                }}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirm */}
      <AlertDialog
        open={!!deletingCategoryId}
        onOpenChange={(open) => !open && setDeletingCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la categorie?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les depenses et abonnements associes seront egalement supprimes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategoryId) {
                  onDeleteCategory(deletingCategoryId)
                  setDeletingCategoryId(null)
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirm */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importer les donnees?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action remplacera toutes vos donnees actuelles par celles du fichier importe.
              Assurez-vous d'avoir exporte une sauvegarde si necessaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImportFile(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Importer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Data Confirm */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reinitialiser toutes les donnees?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes vos depenses, abonnements et categories personnalisees. Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetData()
                setShowResetConfirm(false)
              }}
            >
              Reinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transition Month Form */}
      <Dialog open={showTransitionForm} onOpenChange={setShowTransitionForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un mois de transition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTransitionMonth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tm-month">Mois</Label>
              <Input
                id="tm-month"
                type="month"
                value={transitionMonth}
                onChange={(e) => setTransitionMonth(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Sélectionnez le mois non représentatif
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tm-reason">Raison</Label>
              <Input
                id="tm-reason"
                placeholder="Ex: Changement de pays"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tm-note">Note complémentaire (optionnel)</Label>
              <Input
                id="tm-note"
                placeholder="Ex: Transition Bénin → Côte d'Ivoire"
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowTransitionForm(false)}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
