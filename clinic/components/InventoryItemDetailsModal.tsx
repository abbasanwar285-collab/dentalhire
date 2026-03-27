import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, INVENTORY_CATEGORIES, InventoryCategory } from '../types';
import { X, Save, AlertTriangle, Calendar, Package, AlertCircle, Camera, Trash2, Image as ImageIcon, Check } from 'lucide-react';

interface InventoryItemDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onSave: (updatedItem: InventoryItem) => Promise<void>;
}

export const InventoryItemDetailsModal: React.FC<InventoryItemDetailsModalProps> = ({
    isOpen,
    onClose,
    item,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (item) {
            setFormData({ ...item });
            // Reset saving state when opening with new item
            setIsSaving(false);
        }
    }, [item]);

    useEffect(() => {
        if (webcamStream && videoRef.current) {
            videoRef.current.srcObject = webcamStream;
        }
    }, [webcamStream, showWebcam]);

    useEffect(() => {
        return () => {
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [webcamStream]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !showWebcam && !showImageSourceModal) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, showWebcam, showImageSourceModal]);

    const handleClose = () => {
        // Clean up any webcam before closing
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            setWebcamStream(null);
        }
        setShowWebcam(false);
        setShowImageSourceModal(false);
        setIsCameraReady(false);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const startWebcam = async () => {
        setShowImageSourceModal(false);
        setIsCameraReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            setWebcamStream(stream);
            setShowWebcam(true);
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("لا يمكن الوصول للكاميرا. تأكد من السماح بالوصول للكاميرا في المتصفح.");
        }
    };

    const stopWebcam = () => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            setWebcamStream(null);
        }
        setShowWebcam(false);
        setIsCameraReady(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
return;
}

        const context = canvas.getContext('2d');
        if (!context) {
return;
}

        // Keep original resolution
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Save as high quality JPEG - no processing
        const image = canvas.toDataURL('image/jpeg', 0.95);
        setFormData(prev => ({ ...prev, image }));
        stopWebcam();
    };

    if (!isOpen || !item) {
return null;
}

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
return;
}

        setShowImageSourceModal(false);

        const reader = new FileReader();
        reader.onload = (event) => {
            // Keep original image without any processing
            const image = event.target?.result as string;
            setFormData(prev => ({ ...prev, image }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) {
return;
}

        setIsSaving(true);
        try {
            await onSave({
                ...item,
                ...formData,
                quantity: formData.quantity ?? 0,
                minStock: formData.minStock ?? 5
            } as InventoryItem);

            // Show success feedback
            setShowSaveSuccess(true);
            setTimeout(() => {
                setShowSaveSuccess(false);
                handleClose();
            }, 800);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
        }
    };

    const isLowStock = (formData.quantity || 0) < (formData.minStock || 5);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-gray-900 border border-violet-500/30 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Success Overlay */}
                {showSaveSuccess && (
                    <div className="absolute inset-0 bg-emerald-600/90 z-[60] flex items-center justify-center animate-in zoom-in">
                        <div className="text-center">
                            <Check size={64} className="text-white mx-auto mb-4" />
                            <p className="text-white text-xl font-bold">تم الحفظ بنجاح!</p>
                        </div>
                    </div>
                )}

                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">تفاصيل المادة</h3>
                            <p className="text-gray-400 text-xs">تعديل المعلومات والحد الأدنى</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition"
                        title="إغلاق"
                        aria-label="إغلاق النافذة"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    <form id="inventory-form" onSubmit={handleSubmit} className="space-y-5">

                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className={`w-28 h-28 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-black transition-all ${formData.image ? 'border-violet-500 shadow-lg shadow-violet-500/30' : 'border-gray-700 hover:border-violet-500/50'}`}>
                                    {formData.image ? (
                                        <img src={formData.image} alt="Item" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={32} className="text-gray-700" />
                                    )}
                                </div>

                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageSourceModal(true)}
                                        className="p-2 bg-violet-600 text-white rounded-lg shadow-lg hover:bg-violet-700 hover:scale-110 transition active:scale-95"
                                        title="إضافة صورة"
                                        aria-label="إضافة صورة للمادة"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    {formData.image && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                            className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 hover:scale-110 transition active:scale-95"
                                            title="حذف الصورة"
                                            aria-label="حذف صورة المادة"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs font-bold mb-1.5 block">اسم المادة</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none font-bold"
                                    placeholder="اسم المادة"
                                    title="اسم المادة"
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs font-bold mb-1.5 block">القسم</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as InventoryCategory })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none text-sm"
                                    title="قسم المادة"
                                >
                                    {INVENTORY_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold mb-2">
                                <AlertCircle size={18} className="text-violet-400" />
                                إعدادات المخزون
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-400 text-xs font-bold mb-1.5 block">الكمية الحالية</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.quantity?.toString() ?? ''}
                                        onChange={e => setFormData({
                                            ...formData,
                                            quantity: e.target.value === '' ? undefined : parseInt(e.target.value)
                                        })}
                                        className={`w-full bg-gray-800 border rounded-xl p-3 text-white font-bold text-xl text-center outline-none transition ${isLowStock ? 'border-red-500 text-red-500' : 'border-gray-700'}`}
                                        placeholder="0"
                                        title="الكمية الحالية"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs font-bold mb-1.5 block flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        الحد الأدنى
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.minStock?.toString() ?? ''}
                                        onChange={e => setFormData({
                                            ...formData,
                                            minStock: e.target.value === '' ? undefined : parseInt(e.target.value)
                                        })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none text-center font-bold text-lg"
                                        placeholder="5"
                                        title="الحد الأدنى للتنبيه"
                                    />
                                </div>
                            </div>

                            {isLowStock && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    <AlertTriangle size={14} />
                                    <span>الكمية أقل من الحد الأدنى!</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-gray-400 text-xs font-bold mb-1.5 block">تاريخ الانتهاء</label>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-3 text-gray-500" size={18} />
                                <input
                                    type="date"
                                    value={formData.expiryDate || ''}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pr-10 text-white focus:border-violet-500 outline-none text-sm"
                                    title="تاريخ انتهاء الصلاحية"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-xs font-bold mb-1.5 block">ملاحظات</label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none h-16 resize-none text-sm"
                                placeholder="أي تفاصيل إضافية..."
                                title="ملاحظات"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex gap-3 p-4 border-t border-gray-700/50 bg-gray-900 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        form="inventory-form"
                        disabled={isSaving}
                        className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition disabled:bg-gray-600 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                    >
                        {isSaving ? 'جاري الحفظ...' : (<><Save size={20} />حفظ</>)}
                    </button>
                </div>

                {/* Image Source Modal */}
                {showImageSourceModal && (
                    <div
                        className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-6 animate-in fade-in"
                        onClick={(e) => e.target === e.currentTarget && setShowImageSourceModal(false)}
                    >
                        <div className="w-full max-w-xs space-y-4">
                            <h4 className="text-white text-center font-bold text-lg mb-6">اختر مصدر الصورة</h4>

                            <button
                                type="button"
                                onClick={startWebcam}
                                className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl flex items-center gap-4 transition group"
                                title="التقاط صورة من الكاميرا"
                            >
                                <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Camera size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">التقاط صورة</p>
                                    <p className="text-gray-500 text-xs">استخدام الكاميرا</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl flex items-center gap-4 transition group"
                                title="اختيار صورة من المعرض"
                            >
                                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <ImageIcon size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">معرض الصور</p>
                                    <p className="text-gray-500 text-xs">اختيار من الجهاز</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowImageSourceModal(false)}
                                className="w-full py-3 text-gray-500 hover:text-white font-bold text-sm mt-4"
                                title="إلغاء"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}

                {/* Webcam Capture */}
                {showWebcam && (
                    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-in fade-in">
                        <div className="w-full h-full relative flex flex-col items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onCanPlay={() => setIsCameraReady(true)}
                                className="max-w-full max-h-[70vh] rounded-2xl border-2 border-violet-500/30"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {!isCameraReady && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-white text-lg animate-pulse">جاري تشغيل الكاميرا...</div>
                                </div>
                            )}

                            <div className="absolute bottom-10 flex gap-6 items-center">
                                <button
                                    type="button"
                                    onClick={stopWebcam}
                                    className="p-4 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition"
                                    title="إلغاء التصوير"
                                    aria-label="إلغاء التصوير"
                                >
                                    <X size={24} />
                                </button>

                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={!isCameraReady}
                                    className={`p-6 rounded-full transition shadow-xl ${isCameraReady ? 'bg-white text-violet-600 hover:scale-110 active:scale-95' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                    title="التقاط الصورة"
                                    aria-label="التقاط صورة"
                                >
                                    <Camera size={32} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    aria-label="اختيار صورة من الجهاز"
                />
            </div>
        </div>
    );
};
