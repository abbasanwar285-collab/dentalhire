import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DOCTORS } from '../types';

interface DoctorContextType {
    currentDoctorId: string;
    setCurrentDoctorId: (id: string) => void;
    currentDoctor: typeof DOCTORS[0] | undefined;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

const STORAGE_KEY = 'currentDoctorId';

export const DoctorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentDoctorId, setCurrentDoctorIdState] = useState<string>(() => {
        // Initialize from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved || DOCTORS[0]?.id || 'dr_abbas';
    });

    const setCurrentDoctorId = (id: string) => {
        setCurrentDoctorIdState(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    const currentDoctor = DOCTORS.find(d => d.id === currentDoctorId);

    return (
        <DoctorContext.Provider value={{ currentDoctorId, setCurrentDoctorId, currentDoctor }}>
            {children}
        </DoctorContext.Provider>
    );
};

export const useDoctorContext = (): DoctorContextType => {
    const context = useContext(DoctorContext);
    if (!context) {
        throw new Error('useDoctorContext must be used within a DoctorProvider');
    }
    return context;
};

// Helper to get current doctor ID without hook (for services)
export const getCurrentDoctorId = (): string => {
    return localStorage.getItem(STORAGE_KEY) || DOCTORS[0]?.id || 'dr_abbas';
};
