/* ============================================================
   Type Definitions for the Operational Control System
   ============================================================ */

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
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  plate: string
  vehicle_type: string
  model: string
  status: EquipmentStatus
  mileage_current: number
  created_at: string
  updated_at: string
}

export interface Journey {
  id: string
  operator_id: string
  date: string
  garage_out_at: string
  garage_return_at: string | null
  lunch_break_minutes: number
  overtime_minutes: number
  created_at: string
  operator?: UserProfile
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
  created_at: string
  operator?: UserProfile
  machine?: Machine
  vehicle?: Vehicle
}

export interface PhotoRecord {
  id: string
  service_id: string
  image_url: string
  latitude: number | null
  longitude: number | null
  captured_at: string
}

export interface Maintenance {
  id: string
  machine_id: string
  maintenance_type: string
  scheduled_date: string | null
  completed_date: string | null
  accumulated_hours: number
  notes: string | null
  created_at: string
  machine?: Machine
}

export interface DailyReport {
  report_date: string
  operators_active: number
  services_open: number
  services_finished: number
  total_services: number
  machines_in_use: number
}

export interface MaintenanceAlert {
  machine_id: string
  machine_name: string
  hourmeter_current: number
  maintenance_limit: number
  needs_maintenance: boolean
  hours_remaining: number
}

export interface OperatorReport {
  operator_id: string
  operator_name: string
  total_journeys: number
  total_services: number
  total_hours_worked: number
  total_overtime_minutes: number
  avg_services_per_day: number
}

export interface MachineReport {
  machine_id: string
  machine_name: string
  internal_number: string
  total_services: number
  total_hours_used: number
  hourmeter_current: number
  needs_maintenance: boolean
}
