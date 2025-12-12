'use client';

// ============================================
// DentalHire - Admin Users Management
// ============================================

import { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@/components/shared';
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
} from 'lucide-react';

const mockUsers = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'job_seeker', type: 'Dental Assistant', status: 'active', verified: true, createdAt: '2024-01-15' },
    { id: '2', name: 'Bright Smile Dental', email: 'info@brightsmile.com', role: 'clinic', type: 'Clinic', status: 'active', verified: true, createdAt: '2024-01-10' },
    { id: '3', name: 'Michael Chen', email: 'mchen@example.com', role: 'job_seeker', type: 'Sales Rep', status: 'active', verified: false, createdAt: '2024-02-01' },
    { id: '4', name: 'Elite Orthodontics', email: 'hr@eliteortho.com', role: 'clinic', type: 'Clinic', status: 'pending', verified: false, createdAt: '2024-02-05' },
    { id: '5', name: 'Amanda Garcia', email: 'amanda@example.com', role: 'job_seeker', type: 'Dental Hygienist', status: 'active', verified: true, createdAt: '2024-01-20' },
    { id: '6', name: 'City Dental Center', email: 'contact@citydental.com', role: 'clinic', type: 'Clinic', status: 'suspended', verified: true, createdAt: '2023-12-15' },
];

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
        return matchesSearch && matchesRole && matchesStatus;
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        User Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage all users on the platform
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" leftIcon={<Download size={18} />}>
                        Export
                    </Button>
                    <Button leftIcon={<Plus size={18} />}>
                        Add User
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search users..."
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
                            <option value="all">All Roles</option>
                            <option value="job_seeker">Job Seekers</option>
                            <option value="clinic">Clinics</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            aria-label="Filter by status"
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <p className="text-blue-700 dark:text-blue-400">
                            {selectedUsers.length} user(s) selected
                        </p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" leftIcon={<Mail size={16} />}>
                                Email
                            </Button>
                            <Button variant="ghost" size="sm" leftIcon={<UserCheck size={16} />}>
                                Verify
                            </Button>
                            <Button variant="ghost" size="sm" leftIcon={<Ban size={16} />} className="text-red-600">
                                Suspend
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <th className="pb-4 pr-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                        aria-label="Select all users"
                                    />
                                </th>
                                <th className="pb-4 font-medium">User</th>
                                <th className="pb-4 font-medium">Role</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium">Verified</th>
                                <th className="pb-4 font-medium">Joined</th>
                                <th className="pb-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-4 pr-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleSelectUser(user.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                            aria-label={`Select ${user.name}`}
                                        />
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'clinic'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : user.role === 'admin'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {user.type}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`flex items-center gap-1 text-sm ${user.status === 'active' ? 'text-green-600' :
                                                user.status === 'pending' ? 'text-amber-600' :
                                                    'text-red-600'
                                            }`}>
                                            {user.status === 'active' ? <CheckCircle size={14} /> :
                                                user.status === 'pending' ? <CheckCircle size={14} /> :
                                                    <XCircle size={14} />}
                                            <span className="capitalize">{user.status}</span>
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        {user.verified ? (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle size={16} /> Yes
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">No</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex gap-1">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500">
                        Showing {filteredUsers.length} of {mockUsers.length} users
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
