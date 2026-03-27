

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, Calendar, FileDown, Search, ShieldCheck, Stethoscope, Scissors, Syringe, Brain, ChevronRight, RefreshCw, Minus, Zap, X, Clock, AlertTriangle } from 'lucide-react';
import { db } from '../services/db';
import { inventoryService, DepletionAlert } from '../services/inventoryService';
import { InventoryItem as ItemType, INVENTORY_CATEGORIES, InventoryCategory } from '../types';

import { InventoryItemDetailsModal } from '../components/InventoryItemDetailsModal';

export const Inventory: React.FC = () => {
    const _navigate = useNavigate();
    const [items, setItems] = useState<ItemType[]>([]);
    const [activeTab, setActiveTab] = useState<InventoryCategory>('Restorative');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showConsumeModal, setShowConsumeModal] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<ItemType | null>(null); // New State for Modal

    const [consumeSearchQuery, setConsumeSearchQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const isConsumingRef = useRef(false);
    const hasSynced = useRef(false);
    const [displayCount, setDisplayCount] = useState(20);

    // Reorganized Add Form State
    const [addMode, setAddMode] = useState<'choose' | 'new' | 'existing_search' | 'existing_form'>('choose');
    const [existingAddQuery, setExistingAddQuery] = useState('');
    const [selectedExistingItem, setSelectedExistingItem] = useState<ItemType | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // New Item Form State
    const [newItem, setNewItem] = useState<Partial<ItemType>>({
        name: '',
        category: 'Restorative',
        quantity: 1,
        expiryDate: '',
        notes: ''
    });

    // AI Depletion Prediction State
    const [depletionAlerts, setDepletionAlerts] = useState<DepletionAlert[]>([]);
    const [_depletionPredictions, setDepletionPredictions] = useState<Map<string, { days: number; date: Date }>>(new Map());

    const fetchRemainingInBackground = async () => {
        // Get ALL items to ensure full cache
        const allItems = await db.getInventory();
        setItems(allItems);
    };

    const loadFullInventory = async () => {
        const data = await db.getInventory();
        setItems(data);
        setIsLoading(false);
    };

    useEffect(() => {
        // Reset display count when tab changes? 
        // We can do this in a separate effect that depends on activeTab, but purely for UI state.

        // Initial Fetch (Fast Load)
        const fetchInitial = async () => {
            setIsLoading(true);

            // Strategy: Stale-While-Revalidate (Global)
            // 1. Try to load from local cache IMMEDIATELY
            let localDataFound = false;
            try {
                const localItems = await db.getLocalInventory();
                if (localItems && localItems.length > 0) {
                    setItems(localItems);
                    setIsLoading(false);
                    localDataFound = true;
                }
            } catch (e) {
                console.error("Local load failed", e);
            }

            // 2. Network Fetch (If needed)
            // If we found local data, we are good for "Instant" render.
            // We still want to background sync.

            // If NO local data, we need to fetch *something* fast.
            if (!localDataFound) {
                // Fetch "Restorative" (default) or meaningful chunk to show something.
                // fetching 'Restorative' specifically might leave other tabs empty until full sync.
                // But it's better than fetching ALL if it's huge.
                // Let's fetch the first 20 of the default tab.
                const initialData = await db.getInventory(); // Parameters were ignored anyway

                // If we still have no items in state, show these
                if (items.length === 0) {
                    setItems(initialData);
                    setIsLoading(false);
                }
            }

            // 3. Background Sync (Always run to ensure freshness)
            if (!hasSynced.current) {
                hasSynced.current = true;
                fetchRemainingInBackground();
            }
        };

        fetchInitial();

        // Subscribe to realtime changes from other users
        const unsubscribe = db.subscribeToDataChanges('inventory', () => {
            if (!isConsumingRef.current) {
                loadFullInventory();
            }
        });

        // Periodic auto-refresh every 30 minutes to ensure freshness
        const refreshInterval = setInterval(() => {
            if (!isConsumingRef.current) {
                console.log('[Inventory] Auto-refreshing...');
                loadFullInventory();
            }
        }, 30 * 60 * 1000); // 30 minutes

        return () => {
            unsubscribe();
            clearInterval(refreshInterval);
        };
    }, []); // Run ONCE on mount

    // Load AI depletion predictions
    useEffect(() => {
        const loadDepletionData = async () => {
            const alerts = await inventoryService.getDepletionAlerts(14);
            setDepletionAlerts(alerts);

            const predictions = await inventoryService.getAllDepletionPredictions();
            setDepletionPredictions(predictions);
        };

        if (items.length > 0) {
            loadDepletionData();
        }
    }, [items]);

    // Separate effect to reset display count on tab change
    useEffect(() => {
        setDisplayCount(20);
    }, [activeTab]);

    const resetAddForm = () => {
        setAddMode('choose');
        setExistingAddQuery('');
        setSelectedExistingItem(null);
        setNewItem({ name: '', category: activeTab, quantity: 1, expiryDate: '', notes: '' });
        setShowAddForm(false);
    };

    const handleUpdateExisting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExistingItem || isSaving) {
            return;
        }

        setIsSaving(true);
        try {
            const updatedItem = {
                ...selectedExistingItem,
                category: selectedExistingItem.category,
                quantity: selectedExistingItem.quantity + (newItem.quantity || 0),
                expiryDate: newItem.expiryDate || selectedExistingItem.expiryDate,
                notes: newItem.notes || selectedExistingItem.notes
            };

            await db.saveInventoryItem(updatedItem);
            resetAddForm();
        } catch (error) {
            console.error("Failed to update item", error);
            alert("حدث خطأ أثناء التحديث");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDetails = async (updatedItem: ItemType) => {
        try {
            await db.saveInventoryItem(updatedItem);
            // Optimistic update
            setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        } catch (error) {
            console.error("Failed to save item details", error);
            alert("فشل حفظ التعديلات");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.category || isSaving) {
            return;
        }

        setIsSaving(true);
        try {
            await db.saveInventoryItem({
                id: crypto.randomUUID(),
                name: newItem.name!,
                category: newItem.category as InventoryCategory,
                quantity: newItem.quantity || 0,
                expiryDate: newItem.expiryDate,
                notes: newItem.notes,
                createdAt: Date.now()
            });

            resetAddForm();
        } catch (error) {
            console.error("Failed to save item", error);
            alert("حدث خطأ أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConsume = async (item: ItemType) => {
        if (!item) {
            return;
        }
        console.log('[Inventory] Consuming item:', item.name, 'current qty:', item.quantity);

        if (item.quantity <= 0) {
            alert('الكمية الحالية صفر بالفعل');
            return;
        }

        // Lock background reloads
        isConsumingRef.current = true;

        const updatedItem = {
            ...item,
            quantity: item.quantity - 1
        };

        // Optimistic UI Update - Mandatory for responsiveness
        setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));

        try {
            await db.saveInventoryItem(updatedItem);
            console.log('[Inventory] DB update success for:', item.name);
        } catch (error) {
            console.error("[Inventory] DB update failed:", error);
            alert('فشل تحديث الكمية في قاعدة البيانات');
            // Revert on error
            setItems(prev => prev.map(i => i.id === item.id ? item : i));
        } finally {
            // Wait slightly longer for background sync to stabilize
            setTimeout(() => {
                isConsumingRef.current = false;
                console.log('[Inventory] Consumption lock released');
            }, 2000);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
            await db.deleteInventoryItem(id);
        }
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                return;
            }

            const text = await file.text();
            const lines = text.split('\n');
            let count = 0;

            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) {
                    continue;
                }

                // Expected CSV: Name, Type, Quantity, ExpiryDate
                const parts = line.split(',');
                if (parts.length >= 1) {
                    const name = parts[0]?.trim();
                    // Basic mapping for CSV import if types don't match exactly
                    let type: InventoryCategory = 'Restorative'; // default
                    const csvType = parts[1]?.trim();
                    if (INVENTORY_CATEGORIES.some(c => c.id === csvType)) {
                        type = csvType as InventoryCategory;
                    }

                    const quantity = parseInt(parts[2]?.trim() || '0');
                    const expiryDate = parts[3]?.trim();

                    if (name) {
                        await db.saveInventoryItem({
                            id: crypto.randomUUID(),
                            name,
                            category: type,
                            quantity,
                            expiryDate,
                            createdAt: Date.now()
                        });
                        count++;
                    }
                }
            }
            alert(`تم استيراد ${count} عنصر بنجاح`);
            loadFullInventory();
        };
        input.click();
    };

    const _handleSyncExternal = async () => {
        /*
        if (confirm('هل تريد حذف البيانات الحالية واستيراد البيانات الجديدة من العيادة المحددة؟')) {
            const result = await (db as any).importFromExternalDB('inventory', true); // true = clear existing
            if (result.success) {
                alert(`تم استيراد ${result.count} عنصر وتحديث القائمة بنجاح.`);
                // Force reload to clear any stale state
                window.location.reload();
            } else {
                alert('فشل الاستيراد: ' + result.error);
            }
        }
        */
    };

    const filteredItems = items
        .filter(item => (item.category || item.type) === activeTab)
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const visibleItems = filteredItems.slice(0, displayCount);

    // Scroll Handler for "Infinite Scroll" behavior (local modulation)
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            // Near bottom
            if (displayCount < filteredItems.length) {
                setDisplayCount(prev => prev + 20);
            }
        }
    };

    const getCategoryIcon = (id: InventoryCategory) => {
        switch (id) {
            case 'Restorative': return <Stethoscope size={18} />;
            case 'Endodontic': return <Brain size={18} />;
            case 'General instrument': return <Scissors size={18} />;
            case 'Surgery': return <Syringe size={18} />;
            case 'Orthodontic': return <ShieldCheck size={18} />;
            default: return <Package size={18} />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-2xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">المخزون</h2>
                        <p className="text-gray-400 text-xs mt-0.5">إدارة المواد والمعدات</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleImport}
                        className="p-2.5 bg-gray-800/60 text-gray-400 rounded-xl border border-gray-700 hover:text-white transition-all shadow-sm"
                        title="استيراد من CSV"
                    >
                        <FileDown size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setNewItem(prev => ({ ...prev, category: activeTab }));
                            setShowAddForm(true);
                        }}
                        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition active:scale-95 shadow-lg shadow-violet-600/20"
                    >
                        <Plus size={20} />
                        إضافة
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 backdrop-blur-sm">
                    <span className="text-gray-400 text-xs block mb-1">إجمالي العناصر ({activeTab})</span>
                    <span className="text-2xl font-bold text-white">{filteredItems.length}</span>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 backdrop-blur-sm">
                    <span className="text-gray-400 text-xs block mb-1">منخفض المخزون</span>
                    <span className="text-2xl font-bold text-orange-400">
                        {filteredItems.filter(i => i.quantity < 5).length}
                    </span>
                </div>
            </div>

            {/* AI Depletion Alerts Banner */}
            {depletionAlerts.length > 0 && (
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-2xl border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={18} className="text-orange-400" />
                        <span className="text-white font-bold text-sm">تنبيهات النفاذ الذكية</span>
                        <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">AI</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {depletionAlerts.slice(0, 5).map(alert => (
                            <div
                                key={alert.itemId}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${alert.urgency === 'critical'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : alert.urgency === 'warning'
                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}
                            >
                                <AlertTriangle size={12} />
                                <span>{alert.itemName}</span>
                                <span className="opacity-70">
                                    {alert.daysRemaining > 0
                                        ? `(${alert.daysRemaining} يوم)`
                                        : `(متبقي ${alert.currentQuantity})`
                                    }
                                </span>
                            </div>
                        ))}
                        {depletionAlerts.length > 5 && (
                            <span className="text-xs text-gray-400 self-center">+{depletionAlerts.length - 5} أخرى</span>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs - Scrollable */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {INVENTORY_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2
                            ${activeTab === cat.id
                                ? 'bg-violet-600 text-white shadow-lg'
                                : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'}
                        `}
                    >
                        <span className={activeTab === cat.id ? 'text-white' : cat.color}>
                            {getCategoryIcon(cat.id)}
                        </span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-3 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="بحث في المخزون..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-violet-500 transition"
                />
            </div>

            {/* List - No internal scroll container anymore */}
            <div
                className="space-y-3 pb-8"
                onScroll={handleScroll}
            >
                {filteredItems.length === 0 && !isLoading ? (
                    <div className="text-center py-10 text-gray-500">
                        لا توجد عناصر في قسم {activeTab}
                    </div>
                ) : (
                    visibleItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItemDetails(item)}
                            className="bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-700 flex justify-between items-start group cursor-pointer hover:bg-gray-800 hover:border-violet-500/30 transition-all"
                        >
                            <div className="flex gap-4">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Package size={24} className="text-gray-600" />
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-white font-bold text-lg">{item.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-md border ${item.category}`}>
                                            {item.category || item.type}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-md border ${item.quantity < (item.minStock || 5) ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                                            الكمية: {item.quantity}
                                        </span>
                                        {item.expiryDate && (
                                            <span className="text-xs px-2 py-1 rounded-md bg-gray-700 text-gray-300 border border-gray-600 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {item.expiryDate}
                                            </span>
                                        )}
                                        {/* AI Depletion Prediction Badge - REMOVED per user request due to unrealistic estimates */}
                                        {/* 
                                        {depletionPredictions.has(item.id) && item.consumptionRate && item.consumptionRate > 0 && (
                                            <span className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${depletionPredictions.get(item.id)!.days <= 3
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : depletionPredictions.get(item.id)!.days <= 7
                                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                <Clock size={12} />
                                                {depletionPredictions.get(item.id)!.days} يوم
                                            </span>
                                        )} 
                                        */}
                                    </div>
                                    {item.notes && !item.notes.includes('AI Confidence') && <p className="text-sm text-gray-400 mt-2 line-clamp-1">{item.notes}</p>}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}
                                className="p-2 text-gray-500 hover:text-red-400 transition"
                                title="حذف العنصر"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
                {isLoading && items.length === 0 && (
                    <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
                )}
                {/* Loader for infinite scroll bottom */}
                {displayCount < filteredItems.length && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        تحميل المزيد...
                    </div>
                )}
            </div>

            {/* Item Details Modal */}
            <InventoryItemDetailsModal
                isOpen={!!selectedItemDetails}
                item={selectedItemDetails}
                onClose={() => setSelectedItemDetails(null)}
                onSave={handleSaveDetails}
            />

            {showAddForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {addMode === 'choose' && 'إضافة مخزون'}
                                {addMode === 'new' && 'إضافة مادة جديدة'}
                                {addMode === 'existing_search' && 'بحث عن مادة موجودة'}
                                {addMode === 'existing_form' && 'تحديث الكمية'}
                            </h3>
                            <button
                                onClick={resetAddForm}
                                className="text-gray-500 hover:text-white transition"
                                title="إغلاق"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {addMode === 'choose' && (
                            <div className="space-y-4 py-4">
                                <button
                                    onClick={() => setAddMode('existing_search')}
                                    className="w-full bg-violet-600/10 border border-violet-500/30 hover:bg-violet-600/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group"
                                >
                                    <div className="bg-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform">
                                        <RefreshCw size={24} />
                                    </div>
                                    <span className="text-white font-bold text-lg">إضافة لمادة موجودة</span>
                                    <span className="text-gray-500 text-xs text-center px-4">استخدم هذا الخيار لزيادة كمية مادة مسجلة مسبقاً في النظام</span>
                                </button>

                                <button
                                    onClick={() => setAddMode('new')}
                                    className="w-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group"
                                >
                                    <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-white font-bold text-lg">إضافة مادة جديدة كلياً</span>
                                    <span className="text-gray-500 text-xs text-center px-4">استخدم هذا الخيار لإضافة مادة لم يسبق إدخالها في النظام</span>
                                </button>
                            </div>
                        )}

                        {addMode === 'existing_search' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute right-3 top-3 text-gray-500" size={18} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="ابحث عن المادة..."
                                        value={existingAddQuery}
                                        onChange={e => setExistingAddQuery(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>
                                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {existingAddQuery.length > 0 ? (
                                        items
                                            .filter(i => i.name.toLowerCase().includes(existingAddQuery.toLowerCase()))
                                            .slice(0, 10)
                                            .map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedExistingItem(item);
                                                        setNewItem({ ...newItem, quantity: 1, expiryDate: item.expiryDate });
                                                        setAddMode('existing_form');
                                                    }}
                                                    className="w-full bg-gray-800/50 p-3 rounded-2xl border border-gray-700 flex justify-between items-center hover:bg-violet-500/10 transition-colors"
                                                >
                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-sm truncate">{item.name}</p>
                                                        <p className="text-gray-500 text-xs">{item.category || item.type} | متوفر: {item.quantity}</p>
                                                    </div>
                                                    <ChevronRight size={18} className="text-gray-600" />
                                                </button>
                                            ))
                                    ) : (
                                        <p className="text-center py-10 text-gray-600 text-sm">أدخل اسم المادة للبحث...</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setAddMode('choose')}
                                    className="w-full py-3 text-gray-400 hover:text-white transition text-sm font-bold"
                                >
                                    عودة للخيارات
                                </button>
                            </div>
                        )}

                        {addMode === 'existing_form' && selectedExistingItem && (
                            <form onSubmit={handleUpdateExisting} className="space-y-4">
                                <div className="bg-violet-500/5 border border-violet-500/20 p-4 rounded-2xl mb-4">
                                    <p className="text-xs text-violet-400 mb-1">المادة المختارة:</p>
                                    <p className="text-white font-bold">{selectedExistingItem.name}</p>
                                    <p className="text-xs text-gray-500">الكمية الحالية: {selectedExistingItem.quantity}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">الكمية المضافة</label>
                                        <input
                                            autoFocus
                                            type="number"
                                            required
                                            min="1"
                                            title="الكمية المضافة"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">تاريخ الانتهاء</label>
                                        <input
                                            type="date"
                                            title="تاريخ انتهاء الصلاحية"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none text-sm"
                                            value={newItem.expiryDate}
                                            onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setAddMode('existing_search')}
                                        className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition"
                                    >
                                        تعديل الاختيار
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition disabled:bg-gray-600"
                                    >
                                        {isSaving ? 'جاري الحفظ...' : 'تحديث'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {addMode === 'new' && (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">القسم</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {INVENTORY_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setNewItem({ ...newItem, category: cat.id })}
                                                title={cat.label}
                                                className={`
                                                    flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition
                                                    ${newItem.category === cat.id
                                                        ? 'bg-violet-600 text-white border-violet-500'
                                                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}
                                                `}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">الاسم</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        title="اسم المادة"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">الكمية</label>
                                        <input
                                            type="number"
                                            title="الكمية"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">تاريخ انتهاء الصلاحية</label>
                                        <input
                                            type="date"
                                            title="تاريخ الانتهاء"
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none text-sm"
                                            value={newItem.expiryDate}
                                            onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm mb-1 block">ملاحظات</label>
                                    <textarea
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none h-20 resize-none"
                                        title="ملاحظات"
                                        value={newItem.notes}
                                        onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setAddMode('choose')}
                                        className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition"
                                    >
                                        عودة
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition disabled:bg-gray-600"
                                    >
                                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Consume Modal */}
            {showConsumeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-gray-900 border border-violet-500/30 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                                <Minus size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">استهلاك مادة</h3>
                            <button
                                onClick={() => {
                                    setShowConsumeModal(false);
                                    setConsumeSearchQuery('');
                                }}
                                className="mr-auto text-gray-500 hover:text-white"
                                title="إغلاق التبويب"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-3 text-gray-500" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="ابحث عن المادة..."
                                value={consumeSearchQuery}
                                onChange={e => setConsumeSearchQuery(e.target.value)}
                                title="اسم المادة"
                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-rose-500 transition"
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {consumeSearchQuery.length > 0 ? (
                                items
                                    .filter(i => i.name.toLowerCase().includes(consumeSearchQuery.toLowerCase()))
                                    .slice(0, 10)
                                    .map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-800/50 p-3 rounded-2xl border border-gray-700 flex justify-between items-center group hover:bg-rose-500/5 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold truncate">{item.name}</p>
                                                <p className="text-gray-500 text-xs">متوفر: {item.quantity}</p>
                                            </div>
                                            <button
                                                onClick={() => handleConsume(item)}
                                                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition active:scale-95 whitespace-nowrap"
                                                title="استهلك وحدة"
                                            >
                                                <Zap size={14} />
                                                استهلك
                                            </button>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-center py-10 text-gray-600 text-sm">أدخل اسم المادة للبحث...</p>
                            )}
                            {consumeSearchQuery.length > 0 && items.filter(i => i.name.toLowerCase().includes(consumeSearchQuery.toLowerCase())).length === 0 && (
                                <p className="text-center py-10 text-gray-600 text-sm">لا توجد نتائج</p>
                            )}
                        </div>

                        <button
                            onClick={() => setShowConsumeModal(false)}
                            className="w-full mt-6 py-3 bg-gray-800 text-gray-300 rounded-2xl font-bold hover:bg-gray-700 transition"
                            title="إغلاق"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Action Button (FAB) */}
            <button
                onClick={() => setShowConsumeModal(true)}
                className="fixed bottom-24 left-6 z-40 bg-rose-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-rose-600/30 flex items-center justify-center hover:bg-rose-500 transition-all hover:scale-110 active:scale-90 group"
                title="استهلاك مادة سريع"
            >
                <Zap size={28} className="group-hover:animate-pulse" />
                <div className="absolute -top-2 -right-2 bg-white text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    OUT
                </div>
            </button>
        </div>
    );
};
