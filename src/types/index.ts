// ============================================
// DentalHire - TypeScript Type Definitions
// ============================================

// User Roles
export type UserRole = 'job_seeker' | 'clinic' | 'admin';
export type UserType = 'dental_assistant' | 'sales_rep' | 'dentist' | 'clinic' | 'secretary' | 'media' | 'company' | 'lab' | 'dental_technician';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';
export type LanguageProficiency = 'basic' | 'intermediate' | 'fluent' | 'native';
export type CVStatus = 'draft' | 'active' | 'hidden';

// User
export interface User {
    id: string;
    email: string;
    role: UserRole;
    userType: UserType;
    profile: UserProfile;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    city?: string;
    verified: boolean;
}

// CV / Resume
export interface CV {
    id: string;
    userId: string;
    personalInfo: PersonalInfo;
    experience: Experience[];
    skills: string[];
    certifications: Certification[];
    languages: Language[];
    salary: SalaryExpectation;
    location: LocationPreference;
    availability: Availability;
    documents: Document[];
    status: CVStatus;
    rating?: number;
    reviewCount?: number;
    matchScore?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    address?: string;
    city: string;
    photo?: string;
    bio?: string;
    verified?: boolean;
}

export interface Experience {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
}

export interface Language {
    language: string;
    proficiency: LanguageProficiency;
}

export interface SalaryExpectation {
    expected: number;
    currency: string;
    negotiable: boolean;
}

export interface LocationPreference {
    preferred: string[];
    province?: string;
    district?: string;
    details?: string;
    hasTransportation?: boolean;
    transportationType?: string;
    willingToRelocate: boolean;
    remoteWork: boolean;
    coordinates?: { lat: number; lng: number };
}

export interface Availability {
    type: EmploymentType;
    startDate?: string;
    schedule: WeeklySchedule;
}

export interface WeeklySchedule {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
}

export interface DayAvailability {
    available: boolean;
    hours?: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
}

// Clinic
export interface Clinic {
    id: string;
    userId: string;
    name: string;
    description?: string;
    logo?: string;
    location: ClinicLocation;
    contact: ClinicContact;
    preferences: ClinicPreferences;
    favorites: string[];
    verified: boolean;
    rating?: number;
    reviewCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ClinicLocation {
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
}

export interface ClinicContact {
    email: string;
    phone?: string;
    website?: string;
}

export interface ClinicPreferences {
    salaryRange: { min: number; max: number };
    experienceYears: { min: number; max: number };
    requiredSkills: string[];
    employmentType: EmploymentType[];
    languages: string[];
    radius?: number;
}

// Messages
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    content: string;
    timestamp: Date;
    read: boolean;
    attachments?: {
        type: 'image' | 'file';
        url: string;
        name: string;
    }[];
}

export interface Conversation {
    id: string;
    participants: string[];
    participantNames: { [key: string]: string };
    messages: Message[];
    lastMessage?: Message;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Search & Filters
export interface SearchFilters {
    query?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    skills?: string[];
    certifications?: string[];
    employmentType?: EmploymentType[];
    languages?: string[];
    gender?: string;
    verified?: boolean;
    radius?: number; // search radius in miles
    role?: string;
}

// Matching
export interface MatchResult {
    cv: CV;
    score: number;
    breakdown: MatchBreakdown;
    aiScore?: number;
    aiReasoning?: string;
    aiStrengths?: string[];
    aiWeaknesses?: string[];
}

export interface MatchBreakdown {
    location: number;
    salary: number;
    experience: number;
    skills: number;
    availability: number;
}

// Analytics (Admin)
export interface AnalyticsData {
    totalUsers: number;
    totalJobSeekers: number;
    totalClinics: number;
    totalCVs: number;
    activeJobSeekers: number;
    matchesThisMonth: number;
    newUsersThisWeek: number;
}

// Form States for CV Wizard
export interface CVWizardState {
    currentStep: number;
    personalInfo: Partial<PersonalInfo>;
    experience: Experience[];
    skills: string[];
    certifications: Certification[];
    languages: Language[];
    salary: Partial<SalaryExpectation>;
    location: Partial<LocationPreference>;
    availability: Partial<Availability>;
    documents: Document[];
}

// Job Listing
export interface Job {
    id: string;
    clinicId: string;
    clinicUserId?: string;
    clinicName: string;
    clinicLogo?: string;
    title: string;
    description: string;
    requirements: string[];
    salary: { min: number; max: number; currency: string };
    location: string;
    employmentType: EmploymentType;
    skills: string[];
    gender?: 'male' | 'female' | 'any';
    workingHours?: { start: string; end: string };
    status: 'active' | 'closed' | 'draft';
    applications: number;
    score?: number;
    matchBreakdown?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobApplication {
    id: string;
    jobId: string;
    userId: string;
    cvId: string;
    status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected';
    job?: Job;
    cv?: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        photo?: string;
        city: string;
        skills: string[];
        experience: any[];
    };
    appliedAt: Date;
    updatedAt: Date;
}

// Notification
export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'profile_view' | 'job_match' | 'application' | 'system';
    title: string;
    content: string;
    read: boolean;
    link?: string;
    createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Reviews
export interface Review {
    id: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: UserRole;
    targetId: string;
    rating: number;
    comment: string;
    createdAt: Date;
}
