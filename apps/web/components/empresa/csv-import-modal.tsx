"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError, notifyInfo, notifyWarning } from "@/lib/toast"
import { useState, useRef } from "react"
import { warn, error as logError } from "@/lib/logger"

const operatorI18n: any = {
  csv_import: {
    title: 'Importar Funcionários via CSV',
    select_file: 'Selecionar Arquivo',
    preview: 'Prévia',
    errors: 'Erros',
    geocoding: 'Geocodificando endereços...',
    importing: 'Importando...',
    success: 'Importação concluída',
    import: 'Importar',
    unresolved_addresses: 'endereços não resolvidos'
  }
}

async function loadCsvModule() {
  try {
    const csvModule = await import('@/lib/importers/employee-csv')
    return {
      parseCSV: csvModule.parseCSV,
      geocodeBatch: csvModule.geocodeBatch,
      importEmployees: csvModule.importEmployees,
    }
  } catch (err) {
    warn('Módulo de importação CSV não encontrado', { error: err }, 'CSVImportModal')
    return null
  }
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  empresaId: string
}

import type { EmployeeRow, ParseResult, ImportResult } from '@/lib/importers/employee-csv'

export function CSVImportModal({ isOpen, onClose, onSave, empresaId }: CSVImportModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<EmployeeRow[]>([])
  const [parseErrors, setParseErrors] = useState<Array<{ line: number; errors: string[] }>>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, stage: 'parsing' as 'parsing' | 'geocoding' | 'importing' })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [csvAvailable, setCsvAvailable] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const mod = await loadCsvModule()
    setCsvAvailable(Boolean(mod?.parseCSV))
    if (!mod?.parseCSV) {
      notifyError('Funcionalidade de importação CSV não disponível. Verifique se o módulo está instalado.', undefined, {
        i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Módulo ausente' } }
      })
      return
    }

    setFile(selectedFile)
    setParseErrors([])
    setPreview([])
    setImportResult(null)

    try {
      const result = await mod.parseCSV(selectedFile) as ParseResult

      if (!result || !result.valid) {
        notifyError("Erro ao processar arquivo CSV", undefined, {
          i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Processamento' } }
        })
        return
      }

      if (result.valid.length === 0) {
        notifyError("Nenhum funcionário válido encontrado no arquivo", undefined, {
          i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Nenhum válido' } }
        })
        return
      }

      setPreview(result.valid.slice(0, 10)) // Preview das primeiras 10 linhas
      setParseErrors(result.errors || [])

      if (result.errors && result.errors.length > 0) {
        notifyInfo(`${result.valid.length} válidos, ${result.errors.length} erros encontrados`)
      } else {
        notifySuccess(`${result.valid.length} funcionários encontrados no arquivo`, {
          i18n: { ns: 'common', key: 'success.validRowsFound', params: { count: result.valid.length } }
        })
      }
    } catch (error: any) {
      logError("Erro ao ler arquivo", { error }, 'CSVImportModal')
      notifyError(`Erro ao ler arquivo: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleImport = async () => {
    if (!file) return

    const mod = await loadCsvModule()
    if (!mod?.parseCSV || !mod?.geocodeBatch || !mod?.importEmployees) {
      notifyError('', undefined, { i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Funcionalidade de importação CSV não disponível. Verifique se o módulo está instalado.' } } })
      return
    }

    if (!empresaId) {
      notifyError('', undefined, { i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Empresa não selecionada' } } })
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      // 1. Parse CSV
      setImportProgress({ current: 0, total: 100, stage: 'parsing' })
      const parseResult = await mod.parseCSV(file) as ParseResult

      if (!parseResult || parseResult.valid.length === 0) {
        notifyError('', undefined, { i18n: { ns: 'operador', key: 'csv_import.error', params: { message: 'Nenhum funcionário válido para importar' } } })
        setImporting(false)
        return
      }

      // 2. Geocoding em lote
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'geocoding' })
      const addresses = parseResult.valid
        .map(emp => emp.endereco)
        .filter((addr): addr is string => Boolean(addr))
      
      let geocodedAddresses = new Map<string, { lat: number; lng: number } | null>()
      if (addresses.length > 0) {
        geocodedAddresses = await mod.geocodeBatch(addresses, (current: number, total: number) => {
          setImportProgress({ current, total, stage: 'geocoding' })
        })
      }

      // 3. Importar funcionários
      setImportProgress({ current: 0, total: parseResult.valid.length, stage: 'importing' })
      const result = await mod.importEmployees(
        parseResult.valid,
        empresaId,
        geocodedAddresses,
        (current: number, total: number) => {
          setImportProgress({ current, total, stage: 'importing' })
        }
      ) as ImportResult

      setImportResult(result)

      if (result.unresolvedAddresses && result.unresolvedAddresses.length > 0) {
        notifyWarning('', { i18n: { ns: 'operador', key: 'csv_import.summary', params: { success: result.success, errorsSuffix: result.errors && result.errors.length > 0 ? `, ${result.errors.length} erros` : '', unresolvedSuffix: `, ${result.unresolvedAddresses.length} ${operatorI18n.csv_import?.unresolved_addresses || 'Endereços não resolvidos'}` } } })
      } else {
        notifySuccess('', { i18n: { ns: 'operador', key: 'csv_import.summary', params: { success: result.success, errorsSuffix: result.errors && result.errors.length > 0 ? `, ${result.errors.length} erros` : '', unresolvedSuffix: '' } } })
      }

      onSave()
    } catch (error: any) {
      logError("Erro na importação", { error }, 'CSVImportModal')
      notifyError('', undefined, { i18n: { ns: 'operador', key: 'csv_import.error', params: { message: error?.message || 'Erro desconhecido' } } })
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview([])
    setParseErrors([])
    setImportProgress({ current: 0, total: 0, stage: 'parsing' })
    setImportResult(null)
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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold break-words">{operatorI18n.csv_import?.title || 'Importar Funcionários via CSV'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:gap-6 py-2 sm:py-4">
          {!csvAvailable && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  Módulo de importação CSV não disponível. Verifique se o módulo está instalado.
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                disabled={importing || !csvAvailable}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing || !csvAvailable}
              >
                <Upload className="h-4 w-4 mr-2" />
                {operatorI18n.csv_import?.select_file || 'Selecionar Arquivo'}
              </Button>
              {file && (
                <span className="text-sm text-gray-600 truncate">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Formato esperado: nome, email, telefone, cpf, endereço, centro_de_custo (separados por vírgula)
            </p>
          </div>

          {parseErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  {operatorI18n.csv_import?.errors || 'Erros'} ({parseErrors.length}):
                </span>
              </div>
              <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {parseErrors.slice(0, 10).map((err, i) => (
                  <li key={i}>Linha {err.line}: {err.errors.join(', ')}</li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="text-gray-500">... e mais {parseErrors.length - 10} erros</li>
                )}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {operatorI18n.csv_import?.preview || 'Prévia'} ({preview.length} primeiras linhas)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left p-1">Nome</th>
                      <th className="text-left p-1">Email</th>
                      <th className="text-left p-1">CPF</th>
                      <th className="text-left p-1">Endereço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="p-1">{row.nome}</td>
                        <td className="p-1">{row.email}</td>
                        <td className="p-1">{row.cpf || '-'}</td>
                        <td className="p-1 text-gray-500 truncate max-w-[200px]" title={row.endereco}>
                          {row.endereco ? `${row.endereco.substring(0, 30)}...` : '-'}
                        </td>
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
                <span>
                  {importProgress.stage === 'parsing' && 'Analisando CSV...'}
                  {importProgress.stage === 'geocoding' && (operatorI18n.csv_import?.geocoding || 'Geocodificando endereços...')}
                  {importProgress.stage === 'importing' && (operatorI18n.csv_import?.importing || 'Importando...')}
                </span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    {operatorI18n.csv_import?.success || 'Importação concluída'}
                  </span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p>✓ {importResult.success} funcionários importados</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <p className="text-red-600">✗ {importResult.errors.length} erros</p>
                  )}
                  {importResult.unresolvedAddresses && importResult.unresolvedAddresses.length > 0 && (
                    <p className="text-yellow-600">
                      ⚠ {importResult.unresolvedAddresses.length} {operatorI18n.csv_import?.unresolved_addresses || 'endereços não resolvidos'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={importing}
            className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] text-base font-medium"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || preview.length === 0 || importing || !csvAvailable}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-base font-medium"
          >
            {importing ? (operatorI18n.csv_import?.importing || 'Importando...') : (operatorI18n.csv_import?.import || 'Importar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
