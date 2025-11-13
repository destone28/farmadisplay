export interface User {
  id: string
  username: string
  email: string | null
  phone?: string | null
  city?: string | null
  postal_code?: string | null
  address?: string | null
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role?: 'admin' | 'user'
}

export interface UserCreate {
  username: string
  email?: string
  phone?: string
  city?: string
  postal_code?: string
  address?: string
  password: string
  role?: 'admin' | 'user'
}

export interface UserUpdate {
  username?: string
  email?: string
  phone?: string
  city?: string
  postal_code?: string
  address?: string
  is_active?: boolean
  role?: 'admin' | 'user'
}

export interface ProfileUpdate {
  email?: string
  phone?: string
  city?: string
  postal_code?: string
  address?: string
}

export interface Pharmacy {
  id: string
  user_id: string
  name: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  email?: string
  logo_url?: string  // Deprecated
  logo_path?: string
  opening_hours?: string
  location?: {
    latitude: number
    longitude: number
  }
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface PharmacyCreate {
  name: string
  address?: string
  city: string
  postal_code: string
  phone?: string
  email?: string
  logo_url?: string  // Deprecated
  logo_path?: string
  opening_hours?: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface PharmacyUpdate extends Partial<PharmacyCreate> {
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
  has_more: boolean
}

export interface Shift {
  id: string
  pharmacy_id: string
  date: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_rule?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface ShiftCreate {
  pharmacy_id: string
  date: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_rule?: string
  notes?: string
}

export interface ShiftUpdate extends Partial<Omit<ShiftCreate, 'pharmacy_id'>> {}

export type DeviceStatus = 'pending' | 'active' | 'inactive' | 'maintenance'

export interface Device {
  id: string
  serial_number: string
  mac_address?: string
  activation_code: string
  pharmacy_id?: string
  status: DeviceStatus
  last_seen?: string
  firmware_version?: string
  created_at: string
  activated_at?: string
}

export interface DeviceCreate {
  serial_number: string
  mac_address?: string
  firmware_version?: string
}

export interface DeviceActivate {
  activation_code: string
  pharmacy_id: string
}

export interface DeviceHeartbeat {
  serial_number: string
  status: DeviceStatus
  firmware_version?: string
}
