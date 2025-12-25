'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { Search, Download, FileText, ExternalLink, Eye, XCircle } from 'lucide-react';

interface CVData {
    id: string;
    full_name: string; // Fallback from cvs table
    email: string;     // Fallback from cvs table
    city: string;
    documents: any[];
    created_at: string;
    status: string;
    // Joined user data
    users: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
    } | null;
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
                .select('*, users(first_name, last_name, email, phone)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCVs(data as CVData[]);
        } catch (error) {
            console.error('Error fetching CVs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = (cv: CVData) => {
        if (cv.users?.first_name || cv.users?.last_name) {
            return `${cv.users.first_name || ''} ${cv.users.last_name || ''}`.trim();
        }
        return cv.full_name || 'Unknown User';
    };

    const getDisplayEmail = (cv: CVData) => {
        return cv.users?.email || cv.email || 'No Email';
    };

    const filteredCVs = cvs.filter(cv => {
        const displayName = getDisplayName(cv).toLowerCase();
        const displayEmail = getDisplayEmail(cv).toLowerCase();
        const phone = (cv.users?.phone || '').toLowerCase();
        const query = searchQuery.toLowerCase();

        return displayName.includes(query) ||
            displayEmail.includes(query) ||
            phone.includes(query);
    });

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
                        placeholder="Search CVs (Name, Email, Phone)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Phone</th>
                                    <th className="p-4 font-medium">Location</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Documents</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8">Loading CVs...</td></tr>
                                ) : filteredCVs.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8">No CVs found.</td></tr>
                                ) : (
                                    filteredCVs.map((cv) => (
                                        <tr key={cv.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                {getDisplayName(cv)}
                                            </td>
                                            <td className="p-4 text-gray-500">{getDisplayEmail(cv)}</td>
                                            <td className="p-4 text-gray-500 font-mono text-sm">
                                                {cv.users?.phone || '-'}
                                            </td>
                                            <td className="p-4 text-gray-500">{cv.city}</td>
                                            <td className="p-4 capitalize">{cv.status}</td>
                                            <td className="p-4">
                                                {cv.documents && cv.documents.length > 0 ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => openDocuments(cv)}
                                                        leftIcon={<FileText size={16} />}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        View ({cv.documents.length})
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled
                                                        className="opacity-50 cursor-not-allowed"
                                                        leftIcon={<FileText size={16} />}
                                                    >
                                                        No Docs
                                                    </Button>
                                                )}
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <Card><div className="p-8 text-center text-gray-500">Loading CVs...</div></Card>
                ) : filteredCVs.length === 0 ? (
                    <Card><div className="p-8 text-center text-gray-500">No CVs found.</div></Card>
                ) : (
                    filteredCVs.map((cv) => (
                        <Card key={cv.id}>
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{getDisplayName(cv)}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span>{cv.city}</span>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100">
                                        {cv.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 break-all">
                                        <span className="font-medium min-w-[50px]">Email:</span>
                                        {getDisplayEmail(cv)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium min-w-[50px]">Phone:</span>
                                        <span className="font-mono">{cv.users?.phone || '-'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {cv.documents && cv.documents.length > 0 ? (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => openDocuments(cv)}
                                            leftIcon={<FileText size={16} />}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white justify-center"
                                        >
                                            Documents ({cv.documents.length})
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled
                                            className="flex-1 opacity-50 cursor-not-allowed justify-center bg-gray-100 dark:bg-gray-800"
                                            leftIcon={<FileText size={16} />}
                                        >
                                            No Docs
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { }}
                                        className="px-3"
                                        aria-label="View Details"
                                    >
                                        <Eye size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Document Modal */}
            {showDocsModal && selectedCV && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Documents: {getDisplayName(selectedCV)}
                            </h3>
                            <button onClick={() => setShowDocsModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label="Close modal">
                                <XCircle size={24} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
                            {!selectedCV.documents || selectedCV.documents.length === 0 ? (
                                <p className="text-center text-gray-500 py-12">No documents found.</p>
                            ) : (
                                <div className="space-y-8">
                                    {(Array.isArray(selectedCV.documents) ? selectedCV.documents : []).map((doc: any, idx: number) => {
                                        const isImage = doc.type?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name);
                                        const isPdf = doc.type?.includes('pdf') || /\.pdf$/i.test(doc.name);

                                        return (
                                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                {/* Document Header */}
                                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {doc.name || `Document ${idx + 1}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500 uppercase">{doc.type || 'FILE'}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    >
                                                        Open in New Tab <ExternalLink size={14} />
                                                    </a>
                                                </div>

                                                {/* Document Content */}
                                                <div className="p-4 flex justify-center bg-gray-100 dark:bg-gray-900 min-h-[200px]">
                                                    {isImage ? (
                                                        <img
                                                            src={doc.url}
                                                            alt={doc.name}
                                                            className="max-w-full h-auto rounded-lg shadow-sm"
                                                            loading="lazy"
                                                        />
                                                    ) : isPdf ? (
                                                        <iframe
                                                            src={`${doc.url}#view=FitH`}
                                                            className="w-full h-[600px] rounded-lg shadow-sm bg-white"
                                                            title={doc.name}
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                                            <FileText size={48} className="mb-4 text-gray-300" />
                                                            <p>Preview not available for this file type.</p>
                                                            <a href={doc.url} download className="mt-4 text-blue-600 hover:underline">
                                                                Download to view
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
