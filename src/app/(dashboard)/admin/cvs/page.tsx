'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { Search, Download, FileText, ExternalLink, Eye, XCircle } from 'lucide-react';

interface CVData {
    id: string;
    full_name: string;
    email: string;
    city: string;
    documents: any[];
    created_at: string;
    status: string;
}

export default function AdminCVsPage() {
    const [cvs, setCVs] = useState<CVData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Document Viewer State
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedCV, setSelectedCV] = useState<CVData | null>(null);

    useEffect(() => {
        fetchCVs();
    }, []);

    const fetchCVs = async () => {
        setLoading(true);
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('cvs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCVs(data as CVData[]);
        } catch (error) {
            console.error('Error fetching CVs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCVs = cvs.filter(cv =>
        (cv.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cv.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openDocuments = (cv: CVData) => {
        setSelectedCV(cv);
        setShowDocsModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CV Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage job seeker CVs</p>
                </div>
                <Button variant="outline" leftIcon={<Download size={18} />}>Export</Button>
            </div>

            <Card>
                <div className="p-4">
                    <Input
                        placeholder="Search CVs..."
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
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Documents</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Loading CVs...</td></tr>
                            ) : filteredCVs.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8">No CVs found.</td></tr>
                            ) : (
                                filteredCVs.map((cv) => (
                                    <tr key={cv.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{cv.full_name}</td>
                                        <td className="p-4 text-gray-500">{cv.email}</td>
                                        <td className="p-4 text-gray-500">{cv.city}</td>
                                        <td className="p-4 capitalize">{cv.status}</td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="sm" onClick={() => openDocuments(cv)} leftIcon={<FileText size={16} />}>
                                                View Docs
                                            </Button>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="sm" title="View Details" onClick={() => { }} aria-label="View Details">
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

            {/* Document Modal */}
            {showDocsModal && selectedCV && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Documents: {selectedCV.full_name}
                            </h3>
                            <button onClick={() => setShowDocsModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <XCircle size={24} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {!selectedCV.documents || selectedCV.documents.length === 0 ? (
                                <p className="text-center text-gray-500">No documents found.</p>
                            ) : (
                                <div className="grid gap-4">
                                    {(Array.isArray(selectedCV.documents) ? selectedCV.documents : []).map((doc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-blue-500" />
                                                <div>
                                                    <p className="font-medium">{doc.name}</p>
                                                    <p className="text-xs text-gray-500">{doc.type}</p>
                                                </div>
                                            </div>
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                Open <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                            <Button variant="secondary" onClick={() => setShowDocsModal(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
