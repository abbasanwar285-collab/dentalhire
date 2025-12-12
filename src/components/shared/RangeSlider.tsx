
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: { min: number; max: number };
    onChange: (value: { min: number; max: number }) => void;
    formatLabel?: (value: number) => string;
    className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    formatLabel,
    className = '',
}) => {
    const [minValue, setMinValue] = useState(value.min);
    const [maxValue, setMaxValue] = useState(value.max);

    // Update local state when value prop changes
    useEffect(() => {
        setMinValue(value.min);
        setMaxValue(value.max);
    }, [value.min, value.max]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.min(Number(e.target.value), maxValue - step);
        setMinValue(newVal);
        onChange({ min: newVal, max: maxValue });
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.max(Number(e.target.value), minValue + step);
        setMaxValue(newVal);
        onChange({ min: minValue, max: newVal });
    };

    const minPos = ((minValue - min) / (max - min)) * 100;
    const maxPos = ((maxValue - min) / (max - min)) * 100;

    return (
        <div className={`range-slider-container w-full ${className}`}>
            <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    className="absolute top-0 bottom-0 bg-blue-500 rounded-full"
                    style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                />

                {/* Thumb 1 */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minValue}
                    onChange={handleMinChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none"
                    style={{ zIndex: minValue > max - 100 ? 5 : 3 }}
                />

                {/* Thumb 2 */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxValue}
                    onChange={handleMaxChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none"
                />

                {/* Custom visible thumbs for styling */}
                <div
                    className="absolute top-1/2 -mt-2.5 -ml-2.5 w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-md z-10 pointer-events-none"
                    style={{ left: `${minPos}%` }}
                />
                <div
                    className="absolute top-1/2 -mt-2.5 -ml-2.5 w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-md z-10 pointer-events-none"
                    style={{ left: `${maxPos}%` }}
                />
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatLabel ? formatLabel(minValue) : minValue}
                </div>
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    -
                </div>
                <div className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatLabel ? formatLabel(maxValue) : maxValue}
                </div>
            </div>
        </div>
    );
};
