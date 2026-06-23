'use client'

import { useState, useEffect } from 'react'
import { fmt } from '@/lib/utils'
import type { ERPConfig } from '@/lib/data-types'
import { erpApi } from '@/lib/erp-api'
import { useSyncStore } from '@/store/sync-store'
import type { ERPSyncLogEntry, ERPConnectionTest, ERPSyncResult } from '@/lib/types-erp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Link2,
  Unlink,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'

interface ModuleStatus {
  name: string
  icon: React.ReactNode
  status: 'sincronizado' | 'pendente' | 'erro' | 'desativado'
  lastSync: string
  records: number
}

const DEFAULT_MODULES: ModuleStatus[] = [
  { name: 'Produtos', icon: <Package className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
  { name: 'Clientes', icon: <Users className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
  { name: 'Pedidos', icon: <ShoppingCart className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
  { name: 'Notas Fiscais', icon: <FileText className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
  { name: 'Estoque', icon: <BarChart3 className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
  { name: 'Financeiro', icon: <Activity className="size-4" />, status: 'pendente', lastSync: '--', records: 0 },
]

const MODULE_KEY_MAP: Record<string, string> = {
  Produtos: 'produtos',
  Clientes: 'clientes',
  Pedidos: 'pedidos',
  'Notas Fiscais': 'notas_fiscais',
  Estoque: 'estoque',
  Financeiro: 'financeiro',
}

const MODULE_STATUS_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
  sincronizado: { badge: 'badge-success', icon: <CheckCircle2 className="size-3" /> },
  pendente: { badge: 'badge-warning', icon: <Clock className="size-3" /> },
  erro: { badge: 'badge-danger', icon: <XCircle className="size-3" /> },
  desativado: { badge: 'badge-muted', icon: <AlertTriangle className="size-3" /> },
}

const LOG_STATUS_STYLES: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  sucesso: 'text-emerald-400',
  erro: 'text-red-400',
}

export default function ERPPage() {
  const [erp, setErp] = useState<ERPConfig>({
    conexao: '',
    ultimaSinc: '',
    endpoint: '',
    apiKey: '',
    frequencia: '',
    logs: []
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [modules, setModules] = useState<ModuleStatus[]>(DEFAULT_MODULES)
  const [logs, setLogs] = useState<ERPSyncLogEntry[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastTest, setLastTest] = useState<ERPConnectionTest | null>(null)

  const { isSyncing, setSyncing } = useSyncStore()

   const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
  const isConnected = lastTest?.ok === true

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const [status, syncLogs] = await Promise.all([
        erpApi.getSyncStatus(),
        erpApi.getSyncLogs(),
      ])
      setLogs(syncLogs.data)
      updateModulesFromStatus(status.modules)
      if (status.last_sync) {
        setErp((prev) => ({ ...prev, ultimaSinc: status.last_sync }))
      }
    } catch {
      // Backend offline
    }
  }

  const updateModulesFromStatus = (moduleResults: Record<string, ERPSyncResult>) => {
    setModules((prev) =>
      prev.map((mod) => {
        const key = MODULE_KEY_MAP[mod.name]
        const result = moduleResults[key]
        if (!result) return mod
        return {
          ...mod,
          status: result.status === 'success' ? 'sincronizado' : 'erro',
          records: result.registros,
          lastSync: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }
      })
    )
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setErrorMsg(null)
    try {
      const result = await erpApi.testConnection()
      setLastTest(result)
      useSyncStore.getState().setTestResult(result)
    } catch (err: any) {
      setLastTest({ ok: false, error: err.message })
      setErrorMsg(err.message)
    } finally {
      setTesting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setErrorMsg(null)
    try {
      const result = await erpApi.syncAll()
      useSyncStore.getState().setConnected(true)
      updateModulesFromStatus(
        Object.fromEntries(result.results.map((r) => [r.modulo, r]))
      )
      await loadStatus()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-amber-400" />
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Integração ERP
        </h2>
      </div>

      {/* Connection Status Card */}
      <Card className="bg-[#151820] border-[#252836]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`size-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-emerald-400/15' : 'bg-red-400/15'}`}>
                {isConnected ? (
                  <Wifi className="size-6 text-emerald-400" />
                ) : (
                  <WifiOff className="size-6 text-red-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{isConnected ? 'Conectado' : 'Desconectado'}</span>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${isConnected ? 'badge-success' : 'badge-danger'}`}>
                    {isConnected ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastTest?.ok
                    ? `Latência: ${lastTest.latency}s · Backend: ${backendUrl}`
                    : `Backend: ${backendUrl}`}
                  {erp.ultimaSinc !== '--' && ` · Última sync: ${erp.ultimaSinc}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[#252836] text-muted-foreground hover:text-foreground"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Link2 className="size-4" />
                )}
                Testar Conexão
              </Button>
              <Button
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {errorMsg && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-2 text-red-400 text-sm">
            <XCircle className="size-4" />
            {errorMsg}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card className="bg-[#151820] border-[#252836]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="size-4 text-amber-400" />
            Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Backend API URL</label>
            <Input
              value={backendUrl}
              disabled
              className="bg-[#0C0E14] border-[#252836] opacity-60"
            />
            <p className="text-xs text-muted-foreground mt-1">Configurado via NEXT_PUBLIC_BACKEND_URL</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">ERP Endpoint (Backend)</label>
            <Input
              value={erp.endpoint}
              onChange={(e) => setErp((prev) => ({ ...prev, endpoint: e.target.value }))}
              placeholder="https://erp.empresa.com.br/api/v1"
              className="bg-[#0C0E14] border-[#252836]"
            />
            <p className="text-xs text-muted-foreground mt-1">Configurado via ERP_API_URL no backend .env</p>
          </div>
          <div className="max-w-xs">
            <label className="text-xs text-muted-foreground block mb-1">Frequência de Sincronização (Backend)</label>
            <Select value={erp.frequencia} onValueChange={(v) => setErp((prev) => ({ ...prev, frequencia: v }))}>
              <SelectTrigger className="bg-[#0C0E14] border-[#252836] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151820] border-[#252836]">
                <SelectItem value="15 min">15 min</SelectItem>
                <SelectItem value="30 min">30 min</SelectItem>
                <SelectItem value="1 hora">1 hora</SelectItem>
                <SelectItem value="6 horas">6 horas</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Sync automático via APScheduler no backend</p>
          </div>
        </CardContent>
      </Card>

      {/* Integrated Modules */}
      <Card className="bg-[#151820] border-[#252836]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="size-4 text-amber-400" />
            Módulos Integrados
          </CardTitle>
          <CardDescription>Status dos módulos sincronizados com o ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((mod) => {
              const statusStyle = MODULE_STATUS_STYLES[mod.status]
              return (
                <div
                  key={mod.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0C0E14] border border-[#252836] transition-colors hover:border-[#3a3d52]"
                >
                  <div className="text-muted-foreground">{mod.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{mod.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {mod.records > 0 ? `${mod.records} registros` : '—'} · {mod.lastSync}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle.badge}`}>
                    {statusStyle.icon}
                    {mod.status === 'sincronizado' ? 'OK' : mod.status === 'pendente' ? 'Pend.' : mod.status === 'erro' ? 'Erro' : 'Off'}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sync Log */}
      <Card className="bg-[#151820] border-[#252836]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="size-4 text-amber-400" />
            Log de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-[#252836] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Hora</TableHead>
                  <TableHead className="text-muted-foreground">Módulo</TableHead>
                  <TableHead className="text-muted-foreground">Registros</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow className="border-[#252836]">
                    <TableCell colSpan={4} className="text-xs text-muted-foreground text-center py-4">
                      Nenhum log de sincronização ainda. Clique em "Sincronizar Agora".
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-[#252836]">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-400">
                          {log.modulo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.registros} registros</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${LOG_STATUS_STYLES[log.status] || 'text-muted-foreground'}`}>
                          {log.status === 'success' ? 'Sucesso' : log.status === 'error' ? 'Erro' : log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}