import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Trash2, ZoomIn, ChevronLeft, ChevronRight, RotateCcw, Brain, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { xrayAIService, XrayAnalysisResult, XrayFinding } from '../services/xrayAIService';

interface XrayCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageBase64: string, notes?: string) => void;
    title?: string;
}

export const XrayCaptureModal: React.FC<XrayCaptureModalProps> = ({
    isOpen,
    onClose,
    onCapture,
    title = 'التقاط صورة الأشعة'
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode]);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('لا يمكن الوصول إلى الكاميرا');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            // Limit resolution to max 1280px width
            const MAX_WIDTH = 1280;
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                const imageData = canvas.toDataURL('image/jpeg', 0.6);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setNotes('');
        startCamera();
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage, notes);
            setCapturedImage(null);
            setNotes('');
            onClose();
        }
    };

    const switchCamera = () => {
        stopCamera();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setNotes('');
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

            {/* Modal Container - Bottom Sheet on Mobile */}
            <div className="relative w-full max-w-md bg-gray-900 rounded-t-3xl sm:rounded-3xl sm:mx-4 overflow-y-auto max-h-[90dvh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0 sticky top-0 bg-gray-900 z-10">
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-white transition"
                        title="إغلاق"
                    >
                        <X size={22} />
                    </button>

                    {!capturedImage ? (
                        <button
                            onClick={capturePhoto}
                            className="px-8 py-2.5 bg-white text-gray-900 rounded-full font-extrabold shadow-lg hover:scale-105 transition active:scale-95 flex items-center gap-2"
                            title="التقاط صورة"
                        >
                            <Camera size={20} />
                            <span className="text-sm">التقاط</span>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={retakePhoto}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full font-bold flex items-center gap-2 hover:bg-gray-700 transition text-sm"
                            >
                                <RotateCcw size={16} />
                                إعادة
                            </button>
                            <button
                                onClick={confirmPhoto}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-full font-bold flex items-center gap-2 hover:bg-emerald-700 transition text-sm"
                            >
                                <Check size={18} />
                                حفظ
                            </button>
                        </div>
                    )}

                    <button
                        onClick={switchCamera}
                        className={`p-2 text-gray-400 hover:text-white transition ${capturedImage ? 'opacity-0 pointer-events-none' : ''}`}
                        title="تبديل الكاميرا"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

                {/* Camera/Preview Area */}
                <div className="relative bg-black flex-1 bg-neutral-900 overflow-hidden" style={{ minHeight: '200px', maxHeight: 'calc(100dvh - 250px)' }}>
                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                            <div>
                                <Camera size={40} className="text-red-400 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm mb-3">{error}</p>
                                <button
                                    onClick={startCamera}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold"
                                >
                                    إعادة المحاولة
                                </button>
                            </div>
                        </div>
                    ) : capturedImage ? (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Notes Field - After Capture */}
                {capturedImage && (
                    <div className="p-4 border-t border-gray-800 shrink-0">
                        <input
                            type="text"
                            placeholder="ملاحظات (اختياري)..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-3 bg-gray-800 text-white rounded-xl border border-gray-700 outline-none focus:border-violet-500 text-sm"
                        />
                    </div>
                )}

                {/* Controls - Always visible with guaranteed min height */}
                <div className="p-4 bg-gray-900 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0 min-h-[60px]">
                    {!capturedImage && (
                        <div className="flex justify-center items-center py-2 text-gray-500 text-xs font-bold">
                            <Sparkles size={14} className="text-violet-400 ml-1" />
                            استخدم الزر بالأعلى للالتقاط
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Modal for viewing X-ray images in full HD
interface XrayViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    onDeleteImage?: (index: number) => void;
}

export const XrayViewerModal: React.FC<XrayViewerModalProps> = ({
    isOpen,
    onClose,
    images,
    onDeleteImage
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<XrayAnalysisResult | null>(null);
    const [showAnalyzedImage, setShowAnalyzedImage] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
        setAnalysisResult(null);
        setShowAnalyzedImage(false);
    }, [images]);

    if (!isOpen || images.length === 0) {
        return null;
    }

    const goNext = () => {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setAnalysisResult(null);
        setShowAnalyzedImage(false);
    };

    const goPrev = () => {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
        setAnalysisResult(null);
        setShowAnalyzedImage(false);
    };

    const handleDelete = () => {
        if (onDeleteImage && window.confirm('هل تريد حذف هذه الصورة؟')) {
            onDeleteImage(currentIndex);
            if (images.length === 1) {
                onClose();
            } else if (currentIndex >= images.length - 1) {
                setCurrentIndex(Math.max(0, currentIndex - 1));
            }
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await xrayAIService.analyzeXray(images[currentIndex]);
            setAnalysisResult(result);
            setShowAnalyzedImage(true);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (severity: XrayFinding['severity']) => {
        switch (severity) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    const displayImage = (showAnalyzedImage && analysisResult?.processedImageUrl)
        ? analysisResult.processedImageUrl
        : images[currentIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition"
                    title="إغلاق"
                >
                    <X size={24} className="text-white" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">
                        {currentIndex + 1} / {images.length}
                    </span>

                    {/* AI Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition ${analysisResult
                            ? 'bg-violet-500/30 text-violet-300'
                            : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400'
                            }`}
                        title="تحليل AI"
                    >
                        {isAnalyzing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Brain size={16} />
                        )}
                        <span className="text-xs font-medium">
                            {isAnalyzing ? 'جاري التحليل...' : analysisResult ? 'تم التحليل' : 'تحليل AI'}
                        </span>
                    </button>

                    <ZoomIn size={20} className="text-violet-400" />
                    {onDeleteImage && (
                        <button
                            onClick={handleDelete}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full backdrop-blur-md transition"
                            title="حذف الصورة"
                        >
                            <Trash2 size={20} className="text-red-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-4">
                <img
                    src={displayImage}
                    alt={`X-ray ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
            </div>

            {/* AI Analysis Results Panel */}
            {analysisResult && (
                <div className="absolute bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-violet-500/30 p-4 max-h-[40vh] overflow-y-auto animate-in slide-in-from-bottom">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-violet-400" />
                            <span className="text-white font-bold text-sm">نتائج التحليل</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 rounded-full">
                            <span className="text-violet-300 text-xs">ثقة: {analysisResult.confidence}%</span>
                        </div>
                    </div>

                    {/* Toggle Original/Analyzed */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setShowAnalyzedImage(false)}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition ${!showAnalyzedImage
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-800 text-gray-400'
                                }`}
                        >
                            الأصلية
                        </button>
                        <button
                            onClick={() => setShowAnalyzedImage(true)}
                            className={`flex-1 py-1.5 text-xs rounded-lg transition ${showAnalyzedImage
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-800 text-gray-400'
                                }`}
                        >
                            مع العلامات
                        </button>
                    </div>

                    {/* Findings */}
                    {analysisResult.findings.length > 0 ? (
                        <div className="space-y-2 mb-3">
                            {analysisResult.findings.map((finding, idx) => (
                                <div
                                    key={finding.id}
                                    className={`p-2.5 rounded-xl border ${getSeverityColor(finding.severity)}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm">
                                            {idx + 1}. {xrayAIService.getTypeLabel(finding.type)}
                                        </span>
                                        <span className="text-xs opacity-70">
                                            {finding.confidence}%
                                        </span>
                                    </div>
                                    <p className="text-xs opacity-80">{finding.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm mb-3">لم يتم اكتشاف مناطق تحتاج اهتمام.</p>
                    )}

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-300 text-xs leading-relaxed">
                            للمساعدة فقط - لا يغني عن التشخيص الطبي المتخصص.
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition"
                        title="السابق"
                    >
                        <ChevronLeft size={28} className="text-white" />
                    </button>
                    <button
                        onClick={goNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition"
                        title="التالي"
                    >
                        <ChevronRight size={28} className="text-white" />
                    </button>
                </>
            )}

            {/* Thumbnails */}
            {images.length > 1 && !analysisResult && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setCurrentIndex(idx);
                                setAnalysisResult(null);
                            }}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${idx === currentIndex ? 'border-violet-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Modal for asking to add X-ray during payment (for root canal)
interface XrayPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSkip: () => void;
    onCaptureXray: () => void;
    paymentAmount: string;
    onPaymentChange: (value: string) => void;
    onConfirmPayment: () => void;
    isLoading?: boolean;
}

export const XrayPaymentModal: React.FC<XrayPaymentModalProps> = ({
    isOpen,
    onClose,
    onSkip: _onSkip,
    onCaptureXray,
    paymentAmount,
    onPaymentChange,
    onConfirmPayment,
    isLoading
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal - Always Centered */}
            <div className="relative bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-700 animate-in zoom-in-95 fade-in duration-200">
                {/* Payment Input */}
                <div className="mb-5">
                    <label className="text-sm text-gray-400 mb-2 block">مبلغ الدفعة</label>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full p-4 rounded-2xl bg-gray-800 text-white text-2xl font-bold text-center border border-gray-700 outline-none focus:border-emerald-500 transition"
                        value={paymentAmount}
                        onChange={e => onPaymentChange(e.target.value)}
                        autoFocus
                        disabled={isLoading}
                    />
                </div>

                {/* Actions Row */}
                <div className="flex gap-3">
                    {/* Camera Button (Optional) */}
                    <button
                        onClick={onCaptureXray}
                        disabled={isLoading}
                        className="p-4 rounded-2xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="إرفاق صورة أشعة"
                    >
                        <Camera size={24} />
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={onConfirmPayment}
                        disabled={isLoading}
                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="text-sm">جاري الحفظ...</span>
                        ) : (
                            <>
                                <Check size={22} />
                                حفظ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
