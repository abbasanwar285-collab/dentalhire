import React, { useState, useCallback } from 'react';
import { Patient, OrthoVisit, DOCTORS } from '../types';
import { db } from '../services/db';

// Helper to get local date YYYY-MM-DD
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface OrthoFormState {
    upperArch: string;
    lowerArch: string;
    paymentReceived: string;
    notes: string;
    visitDate: string;
}

export interface EditOrthoDataState {
    diagnosis: string;
    totalCost: number;
    doctorId: string;
}

export interface UseOrthoHandlersReturn {
    // Form State
    orthoForm: OrthoFormState;
    setOrthoForm: React.Dispatch<React.SetStateAction<OrthoFormState>>;
    editOrthoData: EditOrthoDataState;
    setEditOrthoData: React.Dispatch<React.SetStateAction<EditOrthoDataState>>;

    // UI State
    expandedVisitId: string | null;
    setExpandedVisitId: React.Dispatch<React.SetStateAction<string | null>>;
    isEditingOrthoHeader: boolean;
    setIsEditingOrthoHeader: React.Dispatch<React.SetStateAction<boolean>>;
    isOrthoUnlocked: boolean;
    showOrthoUnlockModal: boolean;
    setShowOrthoUnlockModal: React.Dispatch<React.SetStateAction<boolean>>;

    // Computed
    isOrthoPatient: boolean;
    orthoTotalPaid: number;

    // Actions
    handleGlobalUnlock: () => void;
    addOrthoVisit: () => Promise<void>;
    saveOrthoHeader: () => Promise<void>;
    handleDeleteOrthoVisit: (visitId: string) => Promise<void>;
    initEditOrthoData: (patient: Patient) => void;
}

/**
 * Hook to manage ortho-related state and handlers
 * Extracted from PatientDetails.tsx for better separation of concerns
 */
export function useOrthoHandlers(
    patient: Patient | null,
    patientId: string | undefined,
    setPatient: React.Dispatch<React.SetStateAction<Patient | null>>,
    loadPatient: () => Promise<void>
): UseOrthoHandlersReturn {
    // Form State
    const [orthoForm, setOrthoForm] = useState<OrthoFormState>({
        upperArch: '',
        lowerArch: '',
        paymentReceived: '',
        notes: '',
        visitDate: getLocalDateStr()
    });

    const [editOrthoData, setEditOrthoData] = useState<EditOrthoDataState>({
        diagnosis: '',
        totalCost: 0,
        doctorId: 'dr_ali'
    });

    // UI State
    const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
    const [isEditingOrthoHeader, setIsEditingOrthoHeader] = useState(false);
    const [isOrthoUnlocked, setIsOrthoUnlocked] = useState(() => {
        return localStorage.getItem('ortho_unlocked') === 'true';
    });
    const [showOrthoUnlockModal, setShowOrthoUnlockModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Computed
    const isOrthoPatient = patient !== null && (
        (patient.orthoDiagnosis && patient.orthoDiagnosis.trim().length > 0) ||
        (patient.orthoVisits && patient.orthoVisits.length > 0)
    );

    const orthoTotalPaid = (patient?.orthoVisits || []).reduce(
        (sum, v) => sum + Number(v.paymentReceived || 0), 0
    );

    // Actions
    const handleGlobalUnlock = useCallback(() => {
        setIsOrthoUnlocked(true);
        localStorage.setItem('ortho_unlocked', 'true');
        setShowOrthoUnlockModal(false);
    }, []);

    const initEditOrthoData = useCallback((patientData: Patient) => {
        setEditOrthoData({
            diagnosis: patientData.orthoDiagnosis || '',
            totalCost: patientData.orthoTotalCost || 0,
            doctorId: patientData.orthoDoctorId || 'dr_ali'
        });
    }, []);

    const addOrthoVisit = useCallback(async () => {
        if (!patient || isSaving) {
            return;
        }

        setIsSaving(true);
        try {
            const visit: OrthoVisit = {
                id: Date.now().toString(),
                visitDate: orthoForm.visitDate || getLocalDateStr(),
                procedure: `${orthoForm.upperArch ? 'Upper: ' + orthoForm.upperArch : ''} ${orthoForm.lowerArch ? 'Lower: ' + orthoForm.lowerArch : ''}`.trim() || 'زيارة دورية',
                paymentReceived: Number(orthoForm.paymentReceived) || 0,
                notes: orthoForm.notes
            };

            const updated = {
                ...patient,
                orthoVisits: [visit, ...(patient.orthoVisits || [])]
            };

            setPatient(updated);
            await db.savePatient(updated);
            setOrthoForm({
                upperArch: '',
                lowerArch: '',
                paymentReceived: '',
                notes: '',
                visitDate: getLocalDateStr()
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    }, [patient, isSaving, orthoForm, setPatient]);

    const saveOrthoHeader = useCallback(async () => {
        if (!patient) {
            return;
        }
        const updated = {
            ...patient,
            orthoDiagnosis: editOrthoData.diagnosis,
            orthoTotalCost: Number(editOrthoData.totalCost),
            orthoDoctorId: editOrthoData.doctorId
        };
        setPatient(updated);
        await db.savePatient(updated);
        setIsEditingOrthoHeader(false);
    }, [patient, editOrthoData, setPatient]);

    const handleDeleteOrthoVisit = useCallback(async (visitId: string) => {
        if (!patient || !patientId) {
            return;
        }
        if (!window.confirm('هل أنت متأكد من حذف هذه الزيارة نهائياً؟')) {
            return;
        }

        // Optimistic UI Update
        const updatedVisits = (patient.orthoVisits || []).filter(v => v.id !== visitId);
        setPatient({ ...patient, orthoVisits: updatedVisits });

        // DB Call
        const success = await db.deleteOrthoVisit(patientId, visitId);
        if (!success) {
            alert('حدث خطأ أثناء الحذف، يرجى إعادة تحميل الصفحة.');
            loadPatient();
        }
    }, [patient, patientId, setPatient, loadPatient]);

    return {
        // Form State
        orthoForm,
        setOrthoForm,
        editOrthoData,
        setEditOrthoData,

        // UI State
        expandedVisitId,
        setExpandedVisitId,
        isEditingOrthoHeader,
        setIsEditingOrthoHeader,
        isOrthoUnlocked,
        showOrthoUnlockModal,
        setShowOrthoUnlockModal,

        // Computed
        isOrthoPatient,
        orthoTotalPaid,

        // Actions
        handleGlobalUnlock,
        addOrthoVisit,
        saveOrthoHeader,
        handleDeleteOrthoVisit,
        initEditOrthoData
    };
}
