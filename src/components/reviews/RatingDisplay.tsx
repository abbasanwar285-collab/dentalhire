
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingDisplayProps {
    rating: number;
    count?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    className?: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
    rating,
    count,
    size = 'md',
    showCount = true,
    className = '',
}) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center text-yellow-400">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className={`${sizeClasses[size]} fill-current`} />
                ))}
                {hasHalfStar && <StarHalf className={`${sizeClasses[size]} fill-current`} />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`} />
                ))}
            </div>
            {showCount && count !== undefined && (
                <span className="text-sm text-gray-500 ml-1">({count})</span>
            )}
        </div>
    );
};

export default RatingDisplay;
