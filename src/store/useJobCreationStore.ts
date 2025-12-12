
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JobCreationState {
    currentDraftId: string | null;
    selectedRole: string | null;
    clinicId: string | null;
    userId: string | null;

    // Actions
    setDraftId: (id: string | null) => void;
    setSelectedRole: (role: string | null) => void;
    setClinicId: (id: string | null) => void;
    setUserId: (id: string | null) => void;
    reset: () => void;
}

export const useJobCreationStore = create<JobCreationState>()(
    persist(
        (set) => ({
            currentDraftId: null,
            selectedRole: null,
            clinicId: null,
            userId: null,

            setDraftId: (id) => set({ currentDraftId: id }),
            setSelectedRole: (role) => set({ selectedRole: role }),
            setClinicId: (id) => set({ clinicId: id }),
            setUserId: (id) => set({ userId: id }),
            reset: () => set({
                currentDraftId: null,
                selectedRole: null,
                clinicId: null,
                userId: null
            }),
        }),
        {
            name: 'job-creation-storage',
        }
    )
);
