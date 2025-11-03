"use client"

// @ts-ignore
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// @ts-ignore
import { Button } from "@/components/ui/button"
// @ts-ignore
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
// @ts-ignore
import { supabase } from "@/lib/supabase"
import { geocodeAddress } from "@/lib/google-maps"
import toast from "react-hot-toast"
import { useState, useRef } from "react"

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

interface CSVRow {
  name: string
  email: string
  phone?: string
  cpf?: string
  address?: string
  cost_center?: string
}

export function CSVImportModal({ isOpen, onClose, onSave, empresaId }: CSVImportModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // Detecta se tem header (primeira linha tem 'nome' ou 'email')
    const hasHeader = lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('email')
    const dataLines = hasHeader ? lines.slice(1) : lines

    return dataLines.map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return {
        name: cols[0] || '',
        email: cols[1] || '',
        phone: cols[2] || '',
        cpf: cols[3] || '',
        address: cols[4] || '',
        cost_center: cols[5] || ''
      }
    }).filter(row => row.name && row.email)
  }

  const validateRow = (row: CSVRow, index: number): string[] => {
    const errs: string[] = []
    if (!row.name || row.name.length < 3) {
      errs.push(`Linha ${index + 1}: Nome inválido`)
    }
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errs.push(`Linha ${index + 1}: Email inválido`)
    }
    if (row.cpf && !/^\d{11}$/.test(row.cpf.replace(/\D/g, ''))) {
      errs.push(`Linha ${index + 1}: CPF inválido`)
    }
    return errs
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setErrors([])
    setPreview([])

    try {
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      
      if (parsed.length === 0) {
        setErrors(["Arquivo vazio ou formato inválido"])
        return
      }

      // Validar todas as linhas
      const validationErrors: string[] = []
      parsed.forEach((row, idx) => {
        validationErrors.push(...validateRow(row, idx))
      })

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
      } else {
        setPreview(parsed.slice(0, 10)) // Preview das primeiras 10 linhas
        toast.success(`${parsed.length} funcionários encontrados no arquivo`)
      }
    } catch (error: any) {
      setErrors([`Erro ao ler arquivo: ${error.message}`])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress({ current: 0, total: preview.length })

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        setProgress({ current: i + 1, total: rows.length })

        try {
          // Criar usuário via API
          const res = await fetch('/api/operator/create-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: row.email,
              name: row.name,
              phone: row.phone,
              role: 'passenger'
            })
          })

          if (!res.ok) {
            throw new Error('Erro ao criar usuário')
          }

          const { userId } = await res.json()

          // Geocodificar endereço se fornecido
          let lat = null
          let lng = null
          if (row.address) {
            const geocode = await geocodeAddress(row.address)
            if (geocode) {
              lat = geocode.lat
              lng = geocode.lng
            }
          }

          // Criar entrada em gf_employee_company
          const { error } = await supabase
            .from("gf_employee_company")
            .insert({
              employee_id: userId,
              company_id: empresaId,
              cpf: row.cpf?.replace(/\D/g, ''),
              address: row.address,
              latitude: lat,
              longitude: lng,
              is_active: true
            })

          if (error) throw error
          successCount++
        } catch (error: any) {
          console.error(`Erro ao importar linha ${i + 1}:`, error)
          errorCount++
        }

        // Pequeno delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      toast.success(`Importação concluída: ${successCount} sucessos, ${errorCount} erros`)
      onSave()
      onClose()
      reset()
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setErrors([])
    setProgress({ current: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!importing) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Funcionários (CSV)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                disabled={importing}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              {file && (
                <span className="text-sm text-[var(--ink-muted)]">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Formato esperado: nome, email, telefone, cpf, endereço, centro_de_custo (separados por vírgula)
            </p>
          </div>

          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Erros encontrados:</span>
              </div>
              <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Preview ({preview.length} primeiras linhas)</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--bg-soft)]">
                    <tr>
                      <th className="text-left p-1">Nome</th>
                      <th className="text-left p-1">Email</th>
                      <th className="text-left p-1">CPF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="p-1">{row.name}</td>
                        <td className="p-1">{row.email}</td>
                        <td className="p-1">{row.cpf || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-[var(--bg-soft)] rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || preview.length === 0 || errors.length > 0 || importing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

