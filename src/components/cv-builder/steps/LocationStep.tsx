'use client';

// ============================================
// DentalHire - Location Step
// Hierarchical: Province > District > Neighborhood
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Car, Bus, Bike, Plane, Laptop, Navigation } from 'lucide-react';

// Iraqi Provinces with Districts and Neighborhoods
import { iraqLocations } from '@/data/iraq_locations';

// Transportation types
const transportationTypes = [
    { id: 'car', icon: Car, en: 'Personal Car', ar: 'سيارة شخصية' },
    { id: 'public', icon: Bus, en: 'Public Transport', ar: 'نقل عام (خط)' },
    { id: 'motorcycle', icon: Bike, en: 'Motorcycle', ar: 'دراجة نارية' },
    { id: 'other', icon: Navigation, en: 'Other', ar: 'أخرى' },
];

export default function LocationStep() {
    const { location, updateLocation } = useCVStore();
    const { language } = useLanguage();

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
    const [locationDetails, setLocationDetails] = useState(location.details || '');
    const [hasTransportation, setHasTransportation] = useState<boolean | null>(location.hasTransportation ?? null);
    const [transportationType, setTransportationType] = useState<string>(location.transportationType || '');

    // Get province list
    const provinces = Object.entries(iraqLocations).map(([key, value]) => ({
        key,
        name: language === 'ar' ? value.ar : (value.en || key)
    }));

    // Get districts for selected province
    const districts = selectedProvince
        ? iraqLocations[selectedProvince]?.districts.map(d => ({
            key: d.en, // Use English name as key to match structure
            name: language === 'ar' ? d.ar : d.en,
            data: d
        })) || []
        : [];

    // Get neighborhoods for selected district
    const neighborhoods = selectedProvince && selectedDistrict
        ? iraqLocations[selectedProvince]?.districts.find(d =>
            d.en === selectedDistrict // Match by English name directly
        )?.neighborhoods?.map(n => ({
            name: language === 'ar' ? n.ar : n.en
        })) || []
        : [];

    // Memoized update function
    const handleUpdate = useCallback(() => {
        if (!selectedProvince) return;

        const provinceData = iraqLocations[selectedProvince];
        const provinceName = language === 'ar' ? provinceData.ar : (provinceData.en || selectedProvince);

        const districtData = provinceData.districts.find(d =>
            d.en === selectedDistrict
        );
        const districtName = districtData ? (language === 'ar' ? districtData.ar : districtData.en) : '';

        const fullLocation = [provinceName, districtName, selectedNeighborhood].filter(Boolean).join(' - ');

        updateLocation({
            province: provinceName,
            district: districtName,
            details: locationDetails,
            hasTransportation: hasTransportation ?? undefined,
            transportationType: transportationType,
            preferred: fullLocation ? [fullLocation] : []
        });
    }, [selectedProvince, selectedDistrict, selectedNeighborhood, locationDetails, hasTransportation, transportationType, language, updateLocation]);

    // Update store when values change
    useEffect(() => {
        handleUpdate();
    }, [handleUpdate]);

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar'
                    ? 'حدد موقعك الحالي ومعلومات التنقل الخاصة بك.'
                    : 'Specify your current location and transportation information.'}
            </p>

            {/* Province Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={16} className="inline me-1" />
                    {language === 'ar' ? 'المحافظة' : 'Province'} *
                </label>
                <select
                    value={selectedProvince}
                    onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistrict('');
                        setSelectedNeighborhood('');
                    }}
                    aria-label={language === 'ar' ? 'اختر المحافظة' : 'Select Province'}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                    <option value="">{language === 'ar' ? '-- اختر المحافظة --' : '-- Select Province --'}</option>
                    {provinces.map(province => (
                        <option key={province.key} value={province.key}>{province.name}</option>
                    ))}
                </select>
            </div>

            {/* District Selection */}
            {selectedProvince && districts.length > 0 && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ar' ? 'القضاء' : 'District'} *
                    </label>
                    <select
                        value={selectedDistrict}
                        onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedNeighborhood('');
                        }}
                        aria-label={language === 'ar' ? 'اختر القضاء' : 'Select District'}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">{language === 'ar' ? '-- اختر القضاء --' : '-- Select District --'}</option>
                        {districts.map(district => (
                            <option key={district.key} value={district.key}>{district.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Neighborhood Selection */}
            {selectedDistrict && neighborhoods.length > 0 && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'ar' ? 'الحي / المنطقة' : 'Neighborhood / Area'}
                    </label>
                    <select
                        value={selectedNeighborhood}
                        onChange={(e) => setSelectedNeighborhood(e.target.value)}
                        aria-label={language === 'ar' ? 'اختر الحي' : 'Select Neighborhood'}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="">{language === 'ar' ? '-- اختر الحي أو المنطقة --' : '-- Select Neighborhood --'}</option>
                        {neighborhoods.map(neighborhood => (
                            <option key={neighborhood.name} value={neighborhood.name}>{neighborhood.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {language === 'ar' ? `${neighborhoods.length} حي/منطقة متاحة` : `${neighborhoods.length} neighborhoods available`}
                    </p>
                </div>
            )}

            {/* Location Details - Optional */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ar' ? 'تفاصيل إضافية عن الموقع (اختياري)' : 'Additional Location Details (Optional)'}
                </label>
                <textarea
                    value={locationDetails}
                    onChange={(e) => setLocationDetails(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: قرب جامع، قرب سوق، شارع معين...' : 'Example: Near mosque, near market, specific street...'}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    rows={2}
                />
            </div>

            {/* Transportation Question */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {language === 'ar' ? 'هل لديك وسيلة نقل؟' : 'Do you have transportation?'}
                </label>
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => setHasTransportation(true)}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${hasTransportation === true
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {language === 'ar' ? 'نعم' : 'Yes'}
                    </button>
                    <button
                        onClick={() => {
                            setHasTransportation(false);
                            setTransportationType('');
                        }}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${hasTransportation === false
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {language === 'ar' ? 'لا' : 'No'}
                    </button>
                </div>

                {/* Transportation Type */}
                {hasTransportation && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {language === 'ar' ? 'نوع وسيلة النقل' : 'Type of Transportation'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {transportationTypes.map(type => {
                                const IconComponent = type.icon;
                                const isSelected = transportationType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setTransportationType(type.id)}
                                        className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                            }`}>
                                            <IconComponent size={20} />
                                        </div>
                                        <span className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {language === 'ar' ? type.ar : type.en}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
                {/* Willing to Relocate */}
                <button
                    onClick={() => updateLocation({ willingToRelocate: !location.willingToRelocate })}
                    className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-all ${location.willingToRelocate
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${location.willingToRelocate
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>
                        <Plane size={20} />
                    </div>
                    <div className="text-start flex-1">
                        <p className={`font-medium ${location.willingToRelocate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {language === 'ar' ? 'مستعد للانتقال' : 'Willing to Relocate'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'منفتح للانتقال من أجل الفرصة المناسبة' : 'Open to moving for the right opportunity'}
                        </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${location.willingToRelocate
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                        }`}>
                        {location.willingToRelocate && <span className="text-xs">✓</span>}
                    </div>
                </button>

                {/* Remote Work */}
                <button
                    onClick={() => updateLocation({ remoteWork: !location.remoteWork })}
                    className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-all ${location.remoteWork
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${location.remoteWork
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>
                        <Laptop size={20} />
                    </div>
                    <div className="text-start flex-1">
                        <p className={`font-medium ${location.remoteWork ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {language === 'ar' ? 'منفتح للعمل عن بعد' : 'Open to Remote Work'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {language === 'ar' ? 'مهتم بالوظائف عن بعد أو الهجينة' : 'Interested in remote or hybrid positions'}
                        </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${location.remoteWork
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                        }`}>
                        {location.remoteWork && <span className="text-xs">✓</span>}
                    </div>
                </button>
            </div>

            {/* Warning if no province selected */}
            {!selectedProvince && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong> {language === 'ar'
                            ? 'يرجى اختيار المحافظة للمتابعة.'
                            : 'Please select a province to proceed.'}
                    </p>
                </div>
            )}
        </div>
    );
}
