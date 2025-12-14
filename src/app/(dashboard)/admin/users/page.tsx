'use client';

// ============================================
// DentalHire - Admin Users Management (Real Data)
// ============================================

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, Button, Input } from '@/components/shared';
import { getSupabaseClient } from '@/lib/supabase';
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Ban,
    UserCheck,
    Download,
    Mail,
    FileText,
    ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserData {
    id: string;
    email: string;
    role: string;
    user_type: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar: string | null;
    verified: boolean;
    created_at: string;
    status?: 'active' | 'suspended'; // Using a simplified status for now or deriving it if needed
}

interface UserCV {
    id: string;
    documents: any[];
}

function AdminUsersContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedVerified, setSelectedVerified] = useState<string>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Document Viewer State
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedUserForDocs, setSelectedUserForDocs] = useState<UserData | null>(null);
    const [userDocuments, setUserDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        // Initialize filters from URL params
        const verifiedParam = searchParams.get('verified');
        const roleParam = searchParams.get('role');

        if (verifiedParam) setSelectedVerified(verifiedParam);
        if (roleParam) setSelectedRole(roleParam);

        fetchUsers();
    }, [searchParams]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data as UserData[]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async (userId: string, currentStatus: boolean, role: string) => {
        const newStatus = !currentStatus;
        try {
            const supabase = getSupabaseClient();

            // 1. Update public.users
            const { data: userData, error: userError } = await (supabase
                .from('users') as any)
                .update({ verified: newStatus })
                .eq('id', userId)
                .select();

            if (userError) throw userError;

            // Check if RLS blocked the update
            if (!userData || userData.length === 0) {
                throw new Error(t('admin.users.permission_denied'));
            }

            // 2. If clinic, update public.clinics to keep in sync
            if (role === 'clinic') {
                const { error: clinicError } = await (supabase
                    .from('clinics') as any)
                    .update({ verified: newStatus })
                    .eq('user_id', userId);

                if (clinicError) console.error('Error syncing clinic verification:', clinicError);
            }

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, verified: newStatus } : u));

        } catch (error: any) {
            console.error('Error updating verification:', error);
            alert(`${error.message}`);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm(t('admin.users.delete.confirm'))) return;

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== userId));
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(t('admin.users.delete.error'));
        }
    };

    const viewDocuments = async (user: UserData) => {
        setSelectedUserForDocs(user);
        setShowDocsModal(true);
        setLoadingDocs(true);
        setUserDocuments([]);

        if (user.role === 'job_seeker') {
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('cvs')
                    .select('documents')
                    .eq('user_id', user.id)
                    .single();

                const cvData = data as any;
                if (cvData && cvData.documents) {
                    setUserDocuments(Array.isArray(cvData.documents) ? cvData.documents : []);
                }
            } catch (error) {
                console.error('Error fetching documents:', error);
            }
        }
        setLoadingDocs(false);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        const matchesVerified = selectedVerified === 'all'
            ? true
            : selectedVerified === 'verified' ? user.verified
                : !user.verified;

        return matchesSearch && matchesRole && matchesVerified;
    });

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('admin.users.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('admin.users.subtitle')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" leftIcon={<Download size={18} />}>
                        {t('admin.users.export')}
                    </Button>
                    <Button leftIcon={<Plus size={18} />}>
                        {t('admin.users.add')}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 p-4">
                    <div className="flex-1">
                        <Input
                            placeholder={t('admin.users.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search size={18} />}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            aria-label="Filter by role"
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">{t('admin.users.filter.role')}</option>
                            <option value="job_seeker">{t('admin.users.filter.jobseeker')}</option>
                            <option value="clinic">{t('admin.users.filter.clinic')}</option>
                            <option value="admin">{t('admin.users.filter.admin')}</option>
                        </select>
                        <select
                            value={selectedVerified}
                            onChange={(e) => setSelectedVerified(e.target.value)}
                            aria-label="Filter by verification"
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">{t('admin.users.filter.status')}</option>
                            <option value="verified">{t('admin.users.filter.verified')}</option>
                            <option value="unverified">{t('admin.users.filter.unverified')}</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                        aria-label="Select all users"
                                    />
                                </th>
                                <th className="p-4 font-medium">{t('admin.users.table.user')}</th>
                                <th className="p-4 font-medium">{t('admin.users.table.role')}</th>
                                <th className="p-4 font-medium">{t('admin.users.table.verification')}</th>
                                <th className="p-4 font-medium">{t('admin.users.table.docs')}</th>
                                <th className="p-4 font-medium">{t('admin.users.table.joined')}</th>
                                <th className="p-4 font-medium">{t('admin.users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">{t('admin.users.loading')}</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">{t('admin.users.nousers')}</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelectUser(user.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                aria-label={`Select ${user.first_name}`}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {(user.first_name?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${user.role === 'clinic' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {user.user_type?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleVerification(user.id, user.verified, user.role)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${user.verified
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {user.verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {user.verified ? t('admin.users.filter.verified') : t('admin.users.filter.unverified')}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'job_seeker' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => viewDocuments(user)}
                                                    leftIcon={<FileText size={16} />}
                                                >
                                                    {t('admin.users.docs.review')}
                                                </Button>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                    aria-label="Delete user"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Document Viewer Modal */}
            {showDocsModal && selectedUserForDocs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('admin.users.docs.title')}: {selectedUserForDocs.first_name} {selectedUserForDocs.last_name}
                            </h3>
                            <button
                                onClick={() => setShowDocsModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <XCircle size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingDocs ? (
                                <div className="text-center py-8">Loading documents...</div>
                            ) : userDocuments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
                                    <FileText size={40} className="text-gray-300" />
                                    <p>{t('admin.users.docs.no_docs')}</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {userDocuments.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{doc.name || `Document ${index + 1}`}</p>
                                                    <p className="text-xs text-gray-500 uppercase">{doc.type || 'FILE'}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                {t('admin.users.docs.view')} <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowDocsModal(false)}>
                                {t('common.close')}
                            </Button>
                            {!selectedUserForDocs.verified && (
                                <Button
                                    onClick={() => {
                                        toggleVerification(selectedUserForDocs.id, false, selectedUserForDocs.role);
                                        setShowDocsModal(false);
                                    }}
                                    leftIcon={<CheckCircle size={18} />}
                                >
                                    {t('admin.users.docs.approve')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminUsersContent />
        </Suspense>
    );
}
