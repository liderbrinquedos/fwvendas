import { create } from 'zustand'
import type { ERPSyncResult, ERPSyncLogEntry } from '@/lib/types-erp'

interface SyncState {
  isSyncing: boolean
  isConnected: boolean
  lastSync: string | null
  lastFullSync: string | null
  lastTestResult: { ok: boolean; latency?: number; error?: string } | null
  modules: Record<string, ERPSyncResult>
  logs: ERPSyncLogEntry[]
  setSyncing: (v: boolean) => void
  setConnected: (v: boolean) => void
  setSyncStatus: (status: {
    last_sync: string | null
    last_full_sync: string | null
    modules: Record<string, ERPSyncResult>
  }) => void
  setTestResult: (r: { ok: boolean; latency?: number; error?: string }) => void
  setLogs: (logs: ERPSyncLogEntry[]) => void
  addLog: (log: ERPSyncLogEntry) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  isConnected: false,
  lastSync: null,
  lastFullSync: null,
  lastTestResult: null,
  modules: {},
  logs: [],

  setSyncing: (v) => set({ isSyncing: v }),
  setConnected: (v) => set({ isConnected: v }),
  setSyncStatus: (status) =>
    set({
      lastSync: status.last_sync,
      lastFullSync: status.last_full_sync,
      modules: status.modules,
    }),
  setTestResult: (r) => set({ lastTestResult: r }),
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 100) })),
}))