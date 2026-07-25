export type AuditLog = {
  id: string
  action: string
  module: string
  operator: string
  target: string
  detail: string
  createdAt: string
}

const storageKey = 'interviewos_audit_logs'

export function listAuditLogs(): AuditLog[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') as AuditLog[] }
  catch { return [] }
}

export function recordAuditLog(input: Omit<AuditLog, 'id' | 'createdAt'>) {
  const next: AuditLog = { ...input, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: new Date().toISOString() }
  localStorage.setItem(storageKey, JSON.stringify([next, ...listAuditLogs()].slice(0, 200)))
  return next
}
