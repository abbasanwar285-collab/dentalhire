
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    targetName: string;
    isSubmitting?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    targetName,
    isSubmitting = false,
}) => {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [error, setError] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (comment.length < 10) {
            setError('Please provide a comment with at least 10 characters');
            return;
        }
        setError('');
        onSubmit(rating, comment);
    };

    const resetForm = () => {
        setRating(0);
        setComment('');
        setError('');
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={resetForm}
            className="relative z-50"
        >
            <div className="fixed inset-0 bg-black/30 w-full" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900"
                        >
                            Rate & Review {targetName}
                        </Dialog.Title>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-2 text-right dir-rtl">
                        <div className="flex flex-col items-center justify-center mb-6 space-y-2">
                            <label className="text-sm font-medium text-gray-700">Overall Rating</label>
                            <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                        aria-label={`Rate ${star} stars`}
                                    >
                                        <Star
                                            className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-semibold text-yellow-600 h-5">
                                {hoveredRating || rating ? (
                                    ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][(hoveredRating || rating) - 1]
                                ) : ''}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1 text-right">
                                Your Experience
                            </label>
                            <textarea
                                id="comment"
                                rows={4}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-right"
                                placeholder="Share your experience working with them..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default ReviewModal;
