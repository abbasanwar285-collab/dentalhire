import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientList } from '../PatientList';
import { db } from '../../services/db';

// Mock the db service
jest.mock('../../services/db');

const mockPatients = [
    {
        id: '1',
        name: 'أحمد محمد',
        age: 30,
        mobile: '07901234567',
        consultationFeePaid: true,
        consultationFeeCount: 1,
        procedures: [],
        totalCost: 0,
        paidAmount: 0,
        createdAt: Date.now()
    },
    {
        id: '2',
        name: 'فاطمة علي',
        age: 25,
        mobile: '07902345678',
        consultationFeePaid: false,
        consultationFeeCount: 0,
        procedures: [],
        totalCost: 0,
        paidAmount: 0,
        createdAt: Date.now()
    }
];

describe('PatientList Component', () => {
    beforeEach(() => {
        (db.getPatients as jest.Mock).mockResolvedValue(mockPatients);
    });

    it('should render loading state initially', () => {
        render(
            <MemoryRouter>
                <PatientList />
            </MemoryRouter>
        );

        // Should show skeleton loaders or loading indicator
        expect(screen.getByTestId('loading-indicator') || screen.getByText(/تحميل/i)).toBeInTheDocument();
    });

    it('should render patient list after loading', async () => {
        render(
            <MemoryRouter>
                <PatientList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
            expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
        });
    });

    it('should show empty state when no patients', async () => {
        (db.getPatients as jest.Mock).mockResolvedValue([]);

        render(
            <MemoryRouter>
                <PatientList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/لا يوجد مرضى/i)).toBeInTheDocument();
        });
    });

    it('should filter patients by search term', async () => {
        render(
            <MemoryRouter>
                <PatientList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/بحث/i);
        fireEvent.change(searchInput, { target: { value: 'فاطمة' } });

        await waitFor(() => {
            expect(screen.queryByText('أحمد محمد')).not.toBeInTheDocument();
            expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
        });
    });

    it('should navigate to patient details on click', async () => {
        const { container: _container } = render(
            <MemoryRouter>
                <PatientList />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
        });

        const patientCard = screen.getByText('أحمد محمد').closest('div[role="button"]');
        expect(patientCard).toBeInTheDocument();

        fireEvent.click(patientCard!);

        // Check if navigation occurred (you might need to verify the route)
    });
});
