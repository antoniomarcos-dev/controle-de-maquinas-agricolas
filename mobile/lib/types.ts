export type UserRole = 'admin' | 'operator' | 'supervisor'
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'inactive'
export type ServiceStatus = 'open' | 'finished'

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  function: string | null
  photo_url: string | null
  status: string
}

export interface Machine {
  id: string
  name: string
  equipment_type: string
  model: string
  color: string | null
  internal_number: string
  status: EquipmentStatus
  hourmeter_current: number
  maintenance_limit: number
}

export interface Vehicle {
  id: string
  plate: string
  vehicle_type: string
  model: string
  status: EquipmentStatus
  mileage_current: number
}

export interface Journey {
  id: string
  operator_id: string
  date: string
  garage_out_at: string
  garage_return_at: string | null
  lunch_break_minutes: number
  overtime_minutes: number
}

export interface ServiceOrder {
  id: string
  operator_id: string
  machine_id: string | null
  vehicle_id: string | null
  journey_id: string | null
  date: string
  started_at: string
  finished_at: string | null
  location: string | null
  notes: string | null
  status: ServiceStatus
  hourmeter_initial: number | null
  hourmeter_final: number | null
  mileage_initial: number | null
  mileage_final: number | null
}
