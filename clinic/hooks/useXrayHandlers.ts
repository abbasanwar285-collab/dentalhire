import React, { useState, useCallback } from 'react';
import { Patient, PaymentRecord } from '../types';
import { db } from '../services/db';

// Helper to get local date YYYY-MM-DD
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface XrayHandlerState {
    showXrayCaptureModal: boolean;
    showXrayViewerModal: boolean;
    showXrayPaymentModal: boolean;
    currentXrayImages: string[];
    xrayPaymentProcId: string | null;
    xrayPaymentAmount: string;
}

export interface XrayHandlerActions {
    handleViewXray: (images: string[]) => void;
    handleOpenPaymentModal: (procId: string) => void;
    handlePaymentWithXray: () => Promise<void>;
    handleCaptureXrayForPayment: (imageBase64: string) => Promise<void>;
    handlePaymentWithoutXray: () => Promise<void>;
    handleCaptureXrayForNewProcedure: (imageBase64: string) => void;
    closeXrayCaptureModal: () => void;
    closeXrayViewerModal: () => void;
    closeXrayPaymentModal: () => void;
    setXrayPaymentAmount: (amount: string) => void;
}

/**
 * Hook to manage X-ray related state and handlers
 * Extracted from PatientDetails.tsx for better separation of concerns
 */
export function useXrayHandlers(
    patient: Patient | null,
    setPatient: React.Dispatch<React.SetStateAction<Patient | null>>,
    onNewProcedureXray?: (imageBase64: string) => void
): XrayHandlerState & XrayHandlerActions {
    const [showXrayCaptureModal, setShowXrayCaptureModal] = useState(false);
    const [showXrayViewerModal, setShowXrayViewerModal] = useState(false);
    const [showXrayPaymentModal, setShowXrayPaymentModal] = useState(false);
    const [currentXrayImages, setCurrentXrayImages] = useState<string[]>([]);
    const [xrayPaymentProcId, setXrayPaymentProcId] = useState<string | null>(null);
    const [xrayPaymentAmount, setXrayPaymentAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleViewXray = useCallback((images: string[]) => {
        setCurrentXrayImages(images);
        setShowXrayViewerModal(true);
    }, []);

    const handleOpenPaymentModal = useCallback((procId: string) => {
        setXrayPaymentProcId(procId);
        setXrayPaymentAmount('');
        setShowXrayPaymentModal(true);
    }, []);

    const handlePaymentWithXray = useCallback(async () => {
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);
        if (amount <= 0) {
            return;
        }

        // Open camera for X-ray
        setShowXrayPaymentModal(false);
        setShowXrayCaptureModal(true);
    }, [patient, xrayPaymentProcId, xrayPaymentAmount]);

    const handleCaptureXrayForPayment = useCallback(async (imageBase64: string) => {
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);

        const newPayment: PaymentRecord = {
            id: Date.now().toString(),
            amount: amount,
            date: getLocalDateStr(),
            timestamp: Date.now()
        };

        const updatedProcedures = patient.procedures.map(proc => {
            if (proc.id === xrayPaymentProcId) {
                return {
                    ...proc,
                    payments: [newPayment, ...(proc.payments || [])],
                    xrayImages: [...(proc.xrayImages || []), imageBase64]
                };
            }
            return proc;
        });

        const updatedPatient = { ...patient, procedures: updatedProcedures };
        setPatient(updatedPatient);
        await db.savePatient(updatedPatient);

        setShowXrayCaptureModal(false);
        setXrayPaymentProcId(null);
        setXrayPaymentAmount('');
    }, [patient, xrayPaymentProcId, xrayPaymentAmount, setPatient]);

    const handlePaymentWithoutXray = useCallback(async () => {
        if (isSaving) {
            return;
        }
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);
        if (amount <= 0) {
            return;
        }

        // Close UI immediately
        setShowXrayPaymentModal(false);
        setIsSaving(true);

        try {
            const newPayment: PaymentRecord = {
                id: Date.now().toString(),
                amount: amount,
                date: getLocalDateStr(),
                timestamp: Date.now()
            };

            const updatedProcedures = patient.procedures.map(proc => {
                if (proc.id === xrayPaymentProcId) {
                    return {
                        ...proc,
                        payments: [newPayment, ...(proc.payments || [])]
                    };
                }
                return proc;
            });

            const updatedPatient = { ...patient, procedures: updatedProcedures };
            setPatient(updatedPatient);
            await db.savePatient(updatedPatient);
        } catch (e) {
            console.error(e);
            alert('حدث خطأ في الحفظ');
        } finally {
            setIsSaving(false);
            setXrayPaymentProcId(null);
            setXrayPaymentAmount('');
        }
    }, [isSaving, patient, xrayPaymentProcId, xrayPaymentAmount, setPatient]);

    const handleCaptureXrayForNewProcedure = useCallback((imageBase64: string) => {
        if (onNewProcedureXray) {
            onNewProcedureXray(imageBase64);
        }
    }, [onNewProcedureXray]);

    const closeXrayCaptureModal = useCallback(() => {
        setShowXrayCaptureModal(false);
    }, []);

    const closeXrayViewerModal = useCallback(() => {
        setShowXrayViewerModal(false);
    }, []);

    const closeXrayPaymentModal = useCallback(() => {
        setShowXrayPaymentModal(false);
        setXrayPaymentProcId(null);
        setXrayPaymentAmount('');
    }, []);

    return {
        // State
        showXrayCaptureModal,
        showXrayViewerModal,
        showXrayPaymentModal,
        currentXrayImages,
        xrayPaymentProcId,
        xrayPaymentAmount,
        // Actions
        handleViewXray,
        handleOpenPaymentModal,
        handlePaymentWithXray,
        handleCaptureXrayForPayment,
        handlePaymentWithoutXray,
        handleCaptureXrayForNewProcedure,
        closeXrayCaptureModal,
        closeXrayViewerModal,
        closeXrayPaymentModal,
        setXrayPaymentAmount
    };
}
