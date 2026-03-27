import { useMemo } from 'react';
import { Patient } from '../types';

export interface PatientFinancials {
    total: number;
    paid: number;
    debt: number;
    procedureCost: number;
    procedurePaid: number;
    orthoCost: number;
    orthoPaid: number;
}

/**
 * Hook to calculate patient financial summary
 * Extracts and centralizes financial calculation logic
 */
export function usePatientFinancials(patient: Patient | null): PatientFinancials {
    return useMemo(() => {
        if (!patient) {
            return {
                total: 0,
                paid: 0,
                debt: 0,
                procedureCost: 0,
                procedurePaid: 0,
                orthoCost: 0,
                orthoPaid: 0
            };
        }

        // 1. Procedures
        const procedureCost = (patient.procedures || []).reduce((sum, p) => sum + Number(p.price || 0), 0);
        const procedurePaid = (patient.procedures || []).reduce((sum, p) =>
            sum + (p.payments || []).reduce((subSum, pay) => subSum + Number(pay.amount || 0), 0)
            , 0);

        // 2. Ortho
        const orthoCost = Number(patient.orthoTotalCost || 0);
        const orthoPaid = (patient.orthoVisits || []).reduce((sum, v) => sum + Number(v.paymentReceived || 0), 0);

        // 3. Legacy / Global Payments (Backward Compatibility)
        const legacyPaid = (patient.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Calculate totals
        const total = procedureCost + orthoCost;
        const paid = procedurePaid + orthoPaid + legacyPaid;
        const debt = total - paid;

        return {
            total,
            paid,
            debt,
            procedureCost,
            procedurePaid,
            orthoCost,
            orthoPaid
        };
    }, [patient]);
}
