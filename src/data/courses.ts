import { BookOpen, FileText, Award, Video, LucideIcon } from 'lucide-react';

export interface Course {
    id: string; // Changed to string for consistency with URL params
    title: string;
    category: 'Basics' | 'Instruments' | 'Materials' | 'Procedures' | string;
    description: string;
    duration: string;
    lessons: number;
    enrolled: number;
    rating: number;
    image: string; // Emoji for now, can be image URL later
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    videoUrl?: string; // YouTube URL
}

export interface Category {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'orange';
    courses: number;
    duration: string;
    level: string;
}

export const categories: Category[] = [
    {
        id: 'basics',
        title: 'Dental Assistant Basics',
        description: 'Learn the fundamental skills and knowledge every dental assistant needs',
        icon: BookOpen,
        color: 'blue',
        courses: 5,
        duration: '8 hours',
        level: 'Beginner',
    },
    {
        id: 'instruments',
        title: 'Dental Instruments & Tools',
        description: 'Master the identification and proper use of dental instruments',
        icon: FileText,
        color: 'green',
        courses: 8,
        duration: '12 hours',
        level: 'Beginner',
    },
    {
        id: 'materials',
        title: 'Dental Materials',
        description: 'Understand different dental materials and their applications',
        icon: Award,
        color: 'purple',
        courses: 6,
        duration: '10 hours',
        level: 'Intermediate',
    },
    {
        id: 'procedures',
        title: 'Clinical Procedures',
        description: 'Step-by-step guidance on assisting with dental procedures',
        icon: Video,
        color: 'orange',
        courses: 12,
        duration: '20 hours',
        level: 'Advanced',
    },
];

export const courses: Course[] = [
    {
        id: 'intro-dental-assisting',
        title: 'Introduction to Dental Assisting',
        category: 'Basics',
        description: 'A comprehensive introduction to the role of a dental assistant, including patient interaction, clinic workflow, and basic terminology.',
        duration: '2 hours',
        lessons: 8,
        enrolled: 1234,
        rating: 4.8,
        image: '🦷',
        level: 'Beginner',
        // videoUrl: '', // Ready for new link
    },
    {
        id: 'dental-instruments-id',
        title: 'Dental Instruments Identification',
        category: 'Instruments',
        description: 'Learn to identify and set up common dental instruments used in general dentistry procedures.',
        duration: '3 hours',
        lessons: 12,
        enrolled: 987,
        rating: 4.9,
        image: '🔧',
        level: 'Beginner',
        // videoUrl: '', // Ready for new link
    },
    {
        id: 'infection-control',
        title: 'Infection Control & Sterilization',
        category: 'Procedures',
        description: 'Master the critical protocols for infection control and instrument sterilization in the dental clinic.',
        duration: '2.5 hours',
        lessons: 10,
        enrolled: 1456,
        rating: 4.7,
        image: '🧪',
        level: 'Intermediate',
        // videoUrl: '', // Ready for new link
    },
];
