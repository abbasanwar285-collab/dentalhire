import React from 'react';
import { Brain, ThumbsUp, ThumbsDown } from 'lucide-react';

export interface AISuggestion {
    id: string;
    type: 'action' | 'insight' | 'warning';
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    confidence?: number; // 0-100
}

interface AISuggestionCardProps {
    suggestion: AISuggestion;
    onFeedback?: (suggestionId: string, helpful: boolean) => void;
    doctorId: string;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
    suggestion,
    onFeedback,
    doctorId: _doctorId
}) => {
    const [feedbackGiven, setFeedbackGiven] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleFeedback = async (helpful: boolean) => {
        if (feedbackGiven || !onFeedback) {
return;
}

        setIsLoading(true);
        try {
            await onFeedback(suggestion.id, helpful);
            setFeedbackGiven(true);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const typeConfig = {
        action: {
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/30',
            icon: 'text-violet-400'
        },
        insight: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            icon: 'text-blue-400'
        },
        warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            icon: 'text-amber-400'
        }
    };

    const config = typeConfig[suggestion.type];

    return (
        <div
            className={`${config.bg} ${config.border} border rounded-2xl p-4 backdrop-blur-md animate-in slide-in-from-right-2 fade-in`}
            role="article"
            aria-label="اقتراح من الذكاء الاصطناعي"
        >
            <div className="flex items-start gap-3">
                {/* AI Icon */}
                <div className="flex-shrink-0">
                    <div className={`${config.bg} rounded-full p-2`}>
                        <Brain size={20} className={config.icon} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">
                            {suggestion.title}
                        </h4>
                        {suggestion.confidence !== undefined && (
                            <span className="text-xs text-gray-400">
                                {suggestion.confidence}% دقة
                            </span>
                        )}
                    </div>

                    <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                        {suggestion.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {suggestion.actionLabel && suggestion.onAction && (
                            <button
                                onClick={suggestion.onAction}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${config.bg} hover:${config.bg}/80 transition text-white`}
                            >
                                {suggestion.actionLabel}
                            </button>
                        )}

                        {/* Feedback Buttons */}
                        {!feedbackGiven && onFeedback && (
                            <div className="flex gap-1 mr-auto">
                                <button
                                    onClick={() => handleFeedback(true)}
                                    disabled={isLoading}
                                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-emerald-600/20 text-gray-400 hover:text-emerald-400 transition disabled:opacity-50"
                                    aria-label="مفيد"
                                    title="مفيد"
                                >
                                    <ThumbsUp size={14} />
                                </button>
                                <button
                                    onClick={() => handleFeedback(false)}
                                    disabled={isLoading}
                                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition disabled:opacity-50"
                                    aria-label="غير مفيد"
                                    title="غير مفيد"
                                >
                                    <ThumbsDown size={14} />
                                </button>
                            </div>
                        )}

                        {feedbackGiven && (
                            <span className="text-xs text-emerald-400 mr-auto">
                                ✓ شكراً على رأيك
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Container for multiple AI suggestions
 */
interface AISuggestionsListProps {
    suggestions: AISuggestion[];
    onFeedback?: (suggestionId: string, helpful: boolean) => void;
    doctorId: string;
    className?: string;
}

export const AISuggestionsList: React.FC<AISuggestionsListProps> = ({
    suggestions,
    onFeedback,
    doctorId,
    className = ''
}) => {
    if (suggestions.length === 0) {
return null;
}

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Brain size={20} className="text-violet-400" />
                <h3 className="font-bold text-white">اقتراحات Iris AI</h3>
            </div>

            {suggestions.map(suggestion => (
                <AISuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onFeedback={onFeedback}
                    doctorId={doctorId}
                />
            ))}
        </div>
    );
};
