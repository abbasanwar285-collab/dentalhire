import { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/ui/Layout';
import { Modal } from '../components/ui/Modal';
import { haptic } from '../lib/haptics';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Plus, Package, CheckCircle2, Trash2, AlertTriangle,
  ShoppingCart, User, ChevronDown, Copy, Flame, Clock, FileText
} from 'lucide-react';
import { copyToClipboard } from '../lib/utils';

const COMMON_ITEMS = [
  'قفازات لاتكس', 'كمامات', 'إبر تخدير', 'مادة حشوة ضوئية',
  'خيوط جراحية', 'أقراص تلميع', 'مادة طبع', 'أسمنت مؤقت',
  'شفرات مشرط', 'قطن طبي', 'معقم أسطح', 'أنابيب شفط',
];

export function SupplyRequests() {
  const { supplyRequests, addSupplyRequest, markSupplyPurchased, deleteSupplyRequest } = useClinic();
  const { currentUser, hasPermission, users } = useAuth();

  const canManage = hasPermission('purchase_supplies');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);

  // Purchase price dialog
  const [purchaseDialogItem, setPurchaseDialogItem] = useState<string | null>(null);
  const [purchasePrice, setPurchasePrice] = useState<number | string>(0);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState<number | string>(0);
  const [itemUrgency, setItemUrgency] = useState<'urgent' | 'normal'>('normal');
  const [itemNotes, setItemNotes] = useState('');

  // ── Smart Suggestions Algorithm ──
  // Items purchased > 7 days ago are likely needed again — suggest them
  const smartSuggestions = useMemo(() => {
    const now = new Date();
    const purchasedNames = new Map<string, Date>();

    // Collect all purchased items and their latest purchase date
    supplyRequests.forEach(r => {
      if (r.status === 'purchased' && r.purchasedAt) {
        const existing = purchasedNames.get(r.name);
        const purchaseDate = parseISO(r.purchasedAt);
        if (!existing || purchaseDate > existing) {
          purchasedNames.set(r.name, purchaseDate);
        }
      }
    });

    // Items purchased > 7 days ago (might need restocking)
    const historyItems: string[] = [];
    purchasedNames.forEach((date, name) => {
      const daysSince = differenceInDays(now, date);
      if (daysSince >= 7) {
        historyItems.push(name);
      }
    });

    // Combine: history-based first, then static common items
    const pendingNames = new Set(supplyRequests.filter(r => r.status === 'pending').map(r => r.name));
    const combined = [...new Set([...historyItems, ...COMMON_ITEMS])]
      .filter(name => !pendingNames.has(name));

    return combined.slice(0, 10);
  }, [supplyRequests]);

  const pendingItems = useMemo(() =>
    supplyRequests
      .filter(r => r.status === 'pending')
      .sort((a, b) => {
        if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [supplyRequests]
  );

  const purchasedItems = useMemo(() =>
    supplyRequests
      .filter(r => r.status === 'purchased')
      .sort((a, b) => new Date(b.purchasedAt || b.createdAt).getTime() - new Date(a.purchasedAt || a.createdAt).getTime()),
    [supplyRequests]
  );

  const getRequesterName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || 'غير محدد';
  };

  const handleAdd = () => {
    if (!itemName.trim()) { haptic.error(); return; }
    haptic.success();
    addSupplyRequest({
      name: itemName.trim(),
      quantity: Number(itemQty) || 0,
      urgency: itemUrgency,
      notes: itemNotes.trim() || undefined,
      requestedByUserId: currentUser?.id || '',
    });
    setItemName('');
    setItemQty(0);
    setItemUrgency('normal');
    setItemNotes('');
    setIsAddModalOpen(false);
  };

  const printButton = pendingItems.length > 0 ? (
    <button
      onClick={() => { setIsPrintModalOpen(true); haptic.medium(); }}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm transition-all active:scale-95 opacity-90 hover:opacity-100"
      title="إنشاء قائمة صوریة للمشاركة"
    >
      <FileText className="w-5 h-5" />
    </button>
  ) : undefined;

  return (
    <Layout title="المستلزمات" subtitle="قائمة المواد والأدوات المطلوبة" headerAction={printButton}>
      <div className="space-y-4 pb-8">

        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-black text-amber-500 mb-1">{pendingItems.length}</span>
            <span className="text-xs font-bold text-slate-600">مطلوب شراؤها</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center shadow-sm">
            <span className="text-2xl font-black text-emerald-500 mb-1">{purchasedItems.length}</span>
            <span className="text-xs font-bold text-slate-600">تم شراؤها</span>
          </div>
        </div>

        {/* Pending Items */}
        {pendingItems.length > 0 ? (
          <div className="space-y-2">
            {pendingItems.map(item => (
              <div
                key={item.id}
                className={`rounded-2xl border shadow-sm overflow-hidden active:scale-[0.99] transition-all ${
                  item.urgency === 'urgent'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
                style={{
                  borderRightWidth: '4px',
                  borderRightColor: item.urgency === 'urgent' ? '#ef4444' : '#f59e0b',
                }}
              >
                <div className="p-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 mt-1">
                        <Package className={`w-4 h-4 ${item.urgency === 'urgent' ? 'text-red-500' : 'text-amber-500'}`} />
                        <h3 className="text-[14px] font-bold text-slate-800 leading-snug">{item.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && (
                          <button
                            onClick={() => { haptic.medium(); setPurchaseDialogItem(item.id); setPurchasePrice(0); }}
                            className="px-3 py-1.5 bg-white/60 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-100/50 shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            تم شراؤها
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm('حذف هذا الطلب؟')) { haptic.medium(); deleteSupplyRequest(item.id); } }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/60 transition-all active:scale-95"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md shadow-sm border border-white">
                        الكمية: {item.quantity || 0}
                      </span>
                      {item.urgency === 'urgent' && (
                        <span className="text-[11px] font-bold text-red-500 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-md shadow-sm border border-white">
                          <AlertTriangle className="w-3 h-3" /> عاجل
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-600 mb-1.5 leading-relaxed bg-white/40 p-2 rounded-lg border border-white/50">{item.notes}</p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {getRequesterName(item.requestedByUserId)}
                      </span>
                      <span>{format(parseISO(item.createdAt), 'dd MMM', { locale: ar })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-700 mb-1">لا توجد مستلزمات مطلوبة</h3>
            <p className="text-xs text-slate-400">
              اضغط + لإضافة مادة أو أداة مطلوبة
            </p>
          </div>
        )}

        {/* Purchased Items Section */}
        {purchasedItems.length > 0 && (
          <div>
            <button
              onClick={() => setShowPurchased(!showPurchased)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-[12px] font-bold text-emerald-600 active:scale-[0.98] transition-all mb-2"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                تم شراؤها ({purchasedItems.length})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPurchased ? 'rotate-180' : ''}`} />
            </button>

            {showPurchased && (
              <div className="space-y-1.5">
                {purchasedItems.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-3 opacity-70">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-500 line-through">
                        {item.name} {item.quantity > 0 && item.quantity !== 1 ? `× ${item.quantity}` : ''} {item.unit || ''}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {item.purchasedAt && format(parseISO(item.purchasedAt), 'dd/MM HH:mm', { locale: ar })}
                      </span>
                    </div>
                    <button
                      onClick={() => { haptic.light(); deleteSupplyRequest(item.id); }}
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 transition-all"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة مادة مطلوبة">
        <div className="space-y-4">
          {/* Smart Suggestions */}
          <div className="flex gap-2 flex-wrap">
            {smartSuggestions.map((ci, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setItemName(ci); haptic.light(); }}
                className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-[11px] font-bold active:scale-95 transition-all"
              >
                {ci}
              </button>
            ))}
          </div>

          {/* Item Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">اسم المادة / الأداة *</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="مثال: قفازات، إبر تخدير..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition-all"
            />
          </div>

          {/* Quantity (full width) */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">الكمية</label>
            <input
              type="number"
              min={0}
              value={itemQty}
              onChange={e => setItemQty(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onFocus={() => { if (itemQty === 0) setItemQty(''); }}
              onBlur={() => { if (itemQty === '') setItemQty(0); }}
              placeholder="0"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition-all"
            />
          </div>

          {/* Urgency - Beautiful Circular Buttons */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-3 block uppercase tracking-wider">مدى الحاجة</label>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setItemUrgency('urgent'); haptic.light(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                  itemUrgency === 'urgent'
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200 scale-105'
                    : 'bg-red-50 text-red-400 border border-red-100 hover:bg-red-100'
                }`}
              >
                <Flame className="w-4 h-4" /> عاجل
              </button>
              <button
                type="button"
                onClick={() => { setItemUrgency('normal'); haptic.light(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
                  itemUrgency === 'normal'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-200 scale-105'
                    : 'bg-amber-50 text-amber-400 border border-amber-100 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-4 h-4" /> عادي
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={itemNotes}
              onChange={e => setItemNotes(e.target.value)}
              placeholder="مثال: نفدت تماماً، نوع معين..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            disabled={!itemName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[14px] shadow-lg shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all mt-2"
          >
            <Plus className="w-5 h-5" />
            إضافة للقائمة
          </button>
        </div>
      </Modal>

      {/* Floating Add Button */}
      <button
        onClick={() => { haptic.medium(); setIsAddModalOpen(true); }}
        className="fixed bottom-20 left-5 z-40 w-14 h-14 rounded-full bg-orange-500 text-white shadow-xl shadow-orange-300/40 flex items-center justify-center active:scale-90 transition-all hover:bg-orange-600"
        title="إضافة مستلزم"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Printable / Shareable List Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="مشاركة القائمة">
        <div 
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mx-auto w-full relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {/* Decorative header edge */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-500 rounded-t-2xl"></div>
          
          <div className="text-center mb-6 mt-2 border-b-2 border-dashed border-slate-200 pb-5">
            <h2 className="text-[18px] font-black text-slate-800 mb-1">قائمة المستلزمات المطلوبة</h2>
            <p className="text-[12px] font-bold text-slate-500" dir="ltr">
              {format(new Date(), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            {pendingItems.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <span className="text-slate-300 font-bold text-[14px] mt-0.5">{idx + 1}.</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-slate-800">{item.name}</span>
                      {item.urgency === 'urgent' && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">عاجل 🔥</span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed bg-slate-50 p-1.5 rounded-lg border border-slate-100 inline-block">ملاحظة: {item.notes}</p>
                    )}
                  </div>
                </div>
                <div className="font-bold text-[13px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0 select-all">
                  الكمية: {item.quantity || 1}
                </div>
              </div>
            ))}
            
            {pendingItems.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-4 font-bold">لا توجد مواد مطلوبة حالياً</div>
            )}
          </div>
          
          {/* Footer note for screenshot */}
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl text-[11px] text-center font-bold border border-amber-100">
            📸 يمكنك الآن أخذ "صورة شاشة" (Screenshot) لهذه القائمة وإرسالها
          </div>
        </div>
      </Modal>

      {/* Purchase Price Dialog */}
      {purchaseDialogItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setPurchaseDialogItem(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full min-w-[300px] max-w-[95vw] sm:max-w-xs bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col mx-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">تسجيل سعر الشراء</h3>
              <p className="text-xs text-slate-500 mb-4">
                كم كان سعر شراء هذه المادة؟ (سيُسجّل كصرفية)
              </p>
              <input
                type="number"
                min="0"
                value={purchasePrice || ''}
                onChange={e => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={() => { if (purchasePrice === 0) setPurchasePrice(''); }}
                className="w-full p-3 bg-slate-50 border-2 border-emerald-200 rounded-xl text-center text-lg font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all mb-1"
                placeholder="السعر (د.ع)"
                autoFocus
              />
              <p className="text-[10px] text-slate-400 mb-4">اتركه 0 إذا لا تريد تسجيل السعر</p>
            </div>
            <div className="border-t border-slate-200 flex">
              <button
                onClick={() => setPurchaseDialogItem(null)}
                className="flex-1 py-3.5 text-base font-semibold text-slate-500 active:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <div className="w-[0.5px] bg-slate-200" />
              <button
                onClick={() => {
                  haptic.success();
                  markSupplyPurchased(purchaseDialogItem, Number(purchasePrice) || 0, currentUser?.id);
                  setPurchaseDialogItem(null);
                }}
                className="flex-1 py-3.5 text-base font-bold text-emerald-600 active:bg-emerald-50 transition-colors"
              >
                تأكيد الشراء ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
