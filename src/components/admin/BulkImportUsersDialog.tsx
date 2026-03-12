'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

type ParsedRow = {
  fullName: string
  email: string
  role: 'user' | 'agent' | 'admin'
  error?: string
}

type ImportResult = {
  created: User[]
  failed: { email: string; reason: string }[]
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseLines(text: string, defaultRole: 'user' | 'agent' | 'admin'): ParsedRow[] {
  const VALID_ROLES = ['user', 'agent', 'admin']
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Auto-detect and skip header row
  const first = lines[0]?.toLowerCase() ?? ''
  const startIdx = (first.includes('email') || first.includes('name')) ? 1 : 0

  return lines.slice(startIdx).map(line => {
    const parts = line.split(',').map(p => p.trim())
    const fullName = parts[0] ?? ''
    const email = parts[1] ?? ''
    const roleRaw = parts[2]?.toLowerCase() ?? ''
    const role = VALID_ROLES.includes(roleRaw) ? roleRaw as 'user' | 'agent' | 'admin' : defaultRole

    let error: string | undefined
    if (!fullName) error = 'Missing name'
    else if (!email) error = 'Missing email'
    else if (!isValidEmail(email)) error = 'Invalid email'

    return { fullName, email, role, error }
  })
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newUsers: User[]) => void
}

export function BulkImportUsersDialog({ open, onOpenChange, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'paste' | 'csv'>('paste')
  const [pasteText, setPasteText] = useState('')
  const [defaultRole, setDefaultRole] = useState<'user' | 'agent' | 'admin'>('user')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)

  const hasErrors = rows.some(r => r.error)
  const validCount = rows.filter(r => !r.error).length

  function handlePasteChange(text: string) {
    setPasteText(text)
    setRows(text.trim() ? parseLines(text, defaultRole) : [])
    setResult(null)
  }

  function handleRoleChange(role: 'user' | 'agent' | 'admin') {
    setDefaultRole(role)
    if (pasteText.trim()) setRows(parseLines(pasteText, role))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setPasteText(text)
      setRows(text.trim() ? parseLines(text, defaultRole) : [])
      setResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const valid = rows.filter(r => !r.error)
    if (!valid.length) return

    setImporting(true)
    const res = await fetch('/api/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: valid }),
    })
    const data: ImportResult = await res.json()
    setResult(data)
    setImporting(false)

    if (data.created.length > 0) {
      onSuccess(data.created as User[])
      toast.success(`${data.created.length} user${data.created.length !== 1 ? 's' : ''} created`)
    }
    if (data.failed.length > 0) {
      toast.warning(`${data.failed.length} user${data.failed.length !== 1 ? 's' : ''} failed`)
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setPasteText('')
      setRows([])
      setResult(null)
      setTab('paste')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {(['paste', 'csv'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'paste' ? 'Paste Text' : 'Upload CSV'}
              </button>
            ))}
          </div>

          {/* Default role */}
          <div className="flex items-center gap-3">
            <Label className="shrink-0 text-sm">Default role</Label>
            <Select value={defaultRole} onValueChange={v => handleRoleChange(v as typeof defaultRole)}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-400">Applied when no role is specified in the list</span>
          </div>

          {tab === 'paste' ? (
            <div className="space-y-1.5">
              <Label className="text-sm">One user per line: <span className="font-mono text-slate-400">Full Name, email@example.com, role</span></Label>
              <Textarea
                rows={6}
                placeholder={"John Smith, john@acme.com\nJane Doe, jane@acme.com, agent"}
                value={pasteText}
                onChange={e => handlePasteChange(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm">CSV columns: <span className="font-mono text-slate-400">name, email, role</span> (role optional, header row auto-skipped)</Label>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                Choose file
              </Button>
              {pasteText && (
                <p className="text-xs text-slate-500">{rows.length} row{rows.length !== 1 ? 's' : ''} parsed from file</p>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Preview — {validCount} valid{hasErrors ? `, ${rows.filter(r => r.error).length} with errors` : ''}
              </p>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Name</TableHead>
                      <TableHead className="py-2">Email</TableHead>
                      <TableHead className="py-2">Role</TableHead>
                      <TableHead className="py-2 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} className={r.error ? 'bg-red-50' : ''}>
                        <TableCell className="py-1.5 text-sm">{r.fullName || <span className="text-slate-400 italic">missing</span>}</TableCell>
                        <TableCell className="py-1.5 text-sm">{r.email || <span className="text-slate-400 italic">missing</span>}</TableCell>
                        <TableCell className="py-1.5 text-sm capitalize">{r.role}</TableCell>
                        <TableCell className="py-1.5">
                          {r.error && (
                            <span title={r.error}>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {hasErrors && (
                <p className="text-xs text-red-500">Rows with errors will be skipped during import.</p>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {result.created.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{result.created.length} user{result.created.length !== 1 ? 's' : ''} created and welcome emails sent.</span>
                </div>
              )}
              {result.failed.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 space-y-1">
                  <p className="font-medium">{result.failed.length} failed:</p>
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-xs">{f.email} — {f.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={importing || validCount === 0}>
              {importing ? 'Importing…' : `Import ${validCount > 0 ? validCount : ''} User${validCount !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
