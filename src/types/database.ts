// ============================================
// DentalHire - Database Types (Generated from Supabase)
// ============================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    auth_id: string
                    email: string
                    role: 'job_seeker' | 'clinic' | 'admin'
                    user_type: 'dental_assistant' | 'sales_rep' | 'dentist' | 'clinic' | 'secretary' | 'media'
                    first_name: string
                    last_name: string
                    phone: string | null
                    avatar: string | null
                    verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    auth_id: string
                    email: string
                    role: 'job_seeker' | 'clinic' | 'admin'
                    user_type: 'dental_assistant' | 'sales_rep' | 'dentist' | 'clinic' | 'secretary' | 'media'
                    first_name: string
                    last_name: string
                    phone?: string | null
                    avatar?: string | null
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'job_seeker' | 'clinic' | 'admin'
                    user_type?: 'dental_assistant' | 'sales_rep' | 'dentist' | 'clinic' | 'secretary' | 'media'
                    first_name?: string
                    last_name?: string
                    phone?: string | null
                    avatar?: string | null
                    verified?: boolean
                    updated_at?: string
                }
            }
            cvs: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string
                    email: string
                    phone: string
                    city: string
                    bio: string | null
                    photo: string | null
                    experience: Json
                    skills: string[]
                    certifications: Json
                    languages: Json
                    salary_expected: number
                    salary_currency: string
                    salary_negotiable: boolean
                    location_preferred: string[]
                    willing_to_relocate: boolean
                    remote_work: boolean
                    availability_type: string
                    availability_start_date: string | null
                    availability_schedule: Json
                    documents: Json
                    status: 'draft' | 'active' | 'hidden'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name: string
                    email: string
                    phone: string
                    city: string
                    bio?: string | null
                    photo?: string | null
                    experience?: Json
                    skills?: string[]
                    certifications?: Json
                    languages?: Json
                    salary_expected?: number
                    salary_currency?: string
                    salary_negotiable?: boolean
                    location_preferred?: string[]
                    willing_to_relocate?: boolean
                    remote_work?: boolean
                    availability_type?: string
                    availability_start_date?: string | null
                    availability_schedule?: Json
                    documents?: Json
                    status?: 'draft' | 'active' | 'hidden'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    full_name?: string
                    email?: string
                    phone?: string
                    city?: string
                    bio?: string | null
                    photo?: string | null
                    experience?: Json
                    skills?: string[]
                    certifications?: Json
                    languages?: Json
                    salary_expected?: number
                    salary_currency?: string
                    salary_negotiable?: boolean
                    location_preferred?: string[]
                    willing_to_relocate?: boolean
                    remote_work?: boolean
                    availability_type?: string
                    availability_start_date?: string | null
                    availability_schedule?: Json
                    documents?: Json
                    status?: 'draft' | 'active' | 'hidden'
                    updated_at?: string
                }
            }
            clinics: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    logo: string | null
                    address: string
                    city: string
                    email: string
                    phone: string | null
                    website: string | null
                    type: 'clinic' | 'company' | 'lab'
                    preferences: Json
                    favorites: string[]
                    verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    logo?: string | null
                    address: string
                    city: string
                    email: string
                    phone?: string | null
                    website?: string | null
                    type?: 'clinic' | 'company' | 'lab'
                    preferences?: Json
                    favorites?: string[]
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    name?: string
                    description?: string | null
                    logo?: string | null
                    address?: string
                    city?: string
                    email?: string
                    phone?: string | null
                    website?: string | null
                    type?: 'clinic' | 'company' | 'lab'
                    preferences?: Json
                    favorites?: string[]
                    verified?: boolean
                    updated_at?: string
                }
            }
            job_drafts: {
                Row: {
                    id: string
                    clinic_id: string
                    user_id: string
                    role: string
                    status: string
                    step_data: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    clinic_id: string
                    user_id: string
                    role: string
                    status?: string
                    step_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    clinic_id?: string
                    user_id?: string
                    role?: string
                    status?: string
                    step_data?: Json | null
                    updated_at?: string
                }
            }
            jobs: {
                Row: {
                    id: string
                    clinic_id: string
                    title: string
                    description: string
                    requirements: string[]
                    salary_min: number
                    salary_max: number
                    salary_currency: string
                    location: string
                    employment_type: string
                    skills: string[]
                    status: 'active' | 'closed' | 'draft'
                    applications: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    clinic_id: string
                    title: string
                    description: string
                    requirements?: string[]
                    salary_min: number
                    salary_max: number
                    salary_currency?: string
                    location: string
                    employment_type: string
                    skills?: string[]
                    status?: 'active' | 'closed' | 'draft'
                    applications?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    title?: string
                    description?: string
                    requirements?: string[]
                    salary_min?: number
                    salary_max?: number
                    salary_currency?: string
                    location?: string
                    employment_type?: string
                    skills?: string[]
                    status?: 'active' | 'closed' | 'draft'
                    applications?: number
                    updated_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    participants: string[]
                    participant_names: Json
                    last_message_id: string | null
                    unread_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    participants: string[]
                    participant_names: Json
                    last_message_id?: string | null
                    unread_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    participants?: string[]
                    participant_names?: Json
                    last_message_id?: string | null
                    unread_count?: number
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    sender_name: string
                    content: string
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    sender_name: string
                    content: string
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    content?: string
                    read?: boolean
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: 'job_seeker' | 'clinic' | 'admin'
            user_type: 'dental_assistant' | 'sales_rep' | 'dentist' | 'clinic' | 'secretary' | 'media' | 'company' | 'lab' | 'dental_technician'
            cv_status: 'draft' | 'active' | 'hidden'
            job_status: 'active' | 'closed' | 'draft'
            employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary'
        }
    }
}
