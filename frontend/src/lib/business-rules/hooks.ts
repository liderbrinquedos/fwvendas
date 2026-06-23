'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { BusinessRule, RulesEngineContext, RulesEngineResult } from './types'
import { BusinessRulesEngine, createRulesEngine } from './engine'
import { DEFAULT_RULES } from './default-rules'
import { erpApi } from '@/lib/erp-api'

const STORAGE_KEY = 'business-rules'

async function loadRulesFromStorage(): Promise<BusinessRule[]> {
  if (typeof window === 'undefined') return DEFAULT_RULES
  
  // Try to load from backend first
  try {
    const res = await erpApi.getBusinessRules()
    if (res.success && res.data.length > 0) {
      return res.data
    }
  } catch (err) {
    // Backend failed, fall back to localStorage
    console.warn('Failed to load business rules from backend:', err)
  }
  
  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // fall through to default
  }
  
  return DEFAULT_RULES
}

export function useBusinessRules() {
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [loading, setLoading] = useState(true)

  // Load rules from backend on init
  useEffect(() => {
    async function loadRules() {
      try {
        const storedRules = await loadRulesFromStorage()
        setRules(storedRules)
      } catch (err) {
        console.error('Failed to load business rules:', err)
        // Fall back to defaults
        setRules(DEFAULT_RULES)
      } finally {
        setLoading(false)
      }
    }
    loadRules()
  }, [])

  // Persist to localStorage whenever rules change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    }
  }, [rules, loading])

  const engine = useMemo(() => createRulesEngine(rules), [rules])

  const enabledRules = useMemo(() => rules.filter(r => r.enabled), [rules])
  const hasActiveRules = enabledRules.length > 0

  const addRule = useCallback((rule: BusinessRule) => {
    setRules(prev => [...prev, rule])
  }, [])

  const updateRule = useCallback((ruleId: string, updates: Partial<BusinessRule>) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
  }, [])

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled, updatedAt: new Date().toISOString() } : r))
  }, [])

  const duplicateRule = useCallback((ruleId: string) => {
    setRules(prev => {
      const original = prev.find(r => r.id === ruleId)
      if (!original) return prev
      const newRule: BusinessRule = {
        ...original,
        id: `rule-${Date.now()}`,
        name: `${original.name} (Cópia)`,
        enabled: false,
        appliedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return [...prev, newRule]
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setRules(DEFAULT_RULES)
  }, [])

  const processCart = useCallback((context: RulesEngineContext): RulesEngineResult => {
    return engine.process(context)
  }, [engine])

  return {
    rules,
    enabledRules,
    hasActiveRules,
    isLoaded: !loading,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    duplicateRule,
    resetToDefaults,
    processCart,
  }
}
