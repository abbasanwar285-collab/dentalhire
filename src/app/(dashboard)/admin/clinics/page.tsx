'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { Search, Download, Building2, Eye } from 'lucide-react';

interface ClinicData {
    id: string;
    name: string;
    email: string;
    city: string;
    phone: string;
    verified: boolean;
    created_at: string;
    type: string;
}

export default function AdminClinicsPage() {
    const [clinics, setClinics] = useState<ClinicData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchClinics = async () => {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('clinics')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setClinics(data as ClinicData[]);
            } catch (error) {
                console.error('Error fetching clinics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClinics();
    }, []);

    const filteredClinics = clinics.filter(clinic =>
        (clinic.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clinic.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clinic Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage clinics, companies, and labs</p>
                </div>
                <Button variant="outline" leftIcon={<Download size={18} />}>Export</Button>
            </div>

            <Card>
                <div className="p-4">
                    <Input
                        placeholder="Search clinics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Verified</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Loading clinics...</td></tr>
                            ) : filteredClinics.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8">No clinics found.</td></tr>
                            ) : (
                                filteredClinics.map((clinic) => (
                                    <tr key={clinic.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                {clinic.name}
                                            </div>
                                        </td>
                                        <td className="p-4 capitalize">{clinic.type}</td>
                                        <td className="p-4 text-gray-500">{clinic.email}</td>
                                        <td className="p-4 text-gray-500">{clinic.city}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${clinic.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {clinic.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="sm" title="View Details">
                                                <Eye size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
