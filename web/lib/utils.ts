/** Utility helpers */

/** Format date for display (DD/MM/YYYY) */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

/** Format datetime for display (DD/MM/YYYY HH:mm) */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Format time only (HH:mm) */
export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Format hours from minutes */
export function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''}`
}

/** Format number with locale */
export function formatNumber(num: number | null | undefined, decimals = 1): string {
  if (num == null) return '—'
  return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Get user initials */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Get status badge CSS class */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'active':
    case 'available':
    case 'finished':
      return 'badge-success'
    case 'in_use':
    case 'open':
      return 'badge-info'
    case 'maintenance':
      return 'badge-warning'
    case 'inactive':
      return 'badge-danger'
    default:
      return 'badge-neutral'
  }
}

/** Get status label in Portuguese */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    available: 'Disponível',
    in_use: 'Em Uso',
    maintenance: 'Manutenção',
    open: 'Aberto',
    finished: 'Finalizado',
    admin: 'Administrador',
    operator: 'Operador',
    supervisor: 'Supervisor',
  }
  return labels[status] || status
}

/** Today as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
