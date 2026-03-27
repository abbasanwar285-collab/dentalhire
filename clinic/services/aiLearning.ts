import { storage } from './storage';

export interface DecisionLog {
    id: string;
    userId: string;
    doctorId?: string;
    actionType: 'complete_procedure' | 'cancel_procedure' | 'choose_treatment';
    context: string;
    difficulty?: 'easy' | 'hard';
    reason?: string;
    timestamp: number;
}

export interface PredictionLog {
    id: string;
    predicted: string;
    actual: string;
    isCorrect: boolean;
    context: string;
    timestamp: number;
}

export interface PredictionStats {
    total: number;
    correct: number;
    weights: Record<string, number>;
}

export interface UserPattern {
    userId: string;
    actionCounts: Record<string, number>;
    hourFrequencies: Record<number, number>;
    commonSequences: Record<string, number>;
    treatmentTypeCounts: Record<string, number>;
    decisionHistory?: DecisionLog[];
    lastAction?: {
        type: string;
        timestamp: number;
    };
    predictionHistory?: PredictionLog[];
    predictionStats?: PredictionStats;
}

class AILearningService {
    private readonly STORAGE_KEY = 'iris_user_patterns';

    async recordAction(userId: string, actionType: string, treatmentType?: string): Promise<void> {
        try {
            const patterns = await this.getPatterns();
            const userPattern = patterns[userId] || this.createEmptyPattern(userId);

            userPattern.actionCounts[actionType] = (userPattern.actionCounts[actionType] || 0) + 1;

            const hour = new Date().getHours();
            userPattern.hourFrequencies[hour] = (userPattern.hourFrequencies[hour] || 0) + 1;

            if (userPattern.lastAction) {
                const sequenceKey = `${userPattern.lastAction.type} -> ${actionType}`;
                if (Date.now() - userPattern.lastAction.timestamp < 10 * 60 * 1000) {
                    userPattern.commonSequences[sequenceKey] = (userPattern.commonSequences[sequenceKey] || 0) + 1;
                }
            }

            if (treatmentType) {
                userPattern.treatmentTypeCounts = userPattern.treatmentTypeCounts || {};
                userPattern.treatmentTypeCounts[treatmentType] = (userPattern.treatmentTypeCounts[treatmentType] || 0) + 1;
            }

            userPattern.lastAction = {
                type: actionType,
                timestamp: Date.now()
            };

            patterns[userId] = userPattern;
            await storage.setItem(this.STORAGE_KEY, patterns);
        } catch (error) {
            console.error('[AI Learning] Failed to record action:', error);
        }
    }

    async recordDecision(log: Omit<DecisionLog, 'id' | 'timestamp'>): Promise<void> {
        try {
            const patterns = await this.getPatterns();
            const userPattern = patterns[log.userId] || this.createEmptyPattern(log.userId);
            userPattern.decisionHistory = userPattern.decisionHistory || [];
            if (userPattern.decisionHistory.length > 50) {
                userPattern.decisionHistory.shift();
            }
            userPattern.decisionHistory.push({
                ...log,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Date.now()
            });
            patterns[log.userId] = userPattern;
            await storage.setItem(this.STORAGE_KEY, patterns);
        } catch (error) {
            console.error('[AI Learning] Failed to record decision:', error);
        }
    }

    async getSuggestedNotes(userId: string, actionType: string, context: string): Promise<string[]> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern || !pattern.decisionHistory) {
            return [];
        }
        const relevantLogs = pattern.decisionHistory.filter(d =>
            d.actionType === actionType &&
            (d.context === context || context.includes(d.context) || d.context.includes(context))
        );
        const reasonCounts: Record<string, number> = {};
        relevantLogs.forEach(log => {
            if (log.reason) {
                reasonCounts[log.reason] = (reasonCounts[log.reason] || 0) + 1;
            }
        });
        return Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([reason]) => reason);
    }

    private async getPatterns(): Promise<Record<string, UserPattern>> {
        try {
            return await storage.getItem<Record<string, UserPattern>>(this.STORAGE_KEY) || {};
        } catch (error) {
            console.error('[AI Learning] Failed to load patterns:', error);
            return {};
        }
    }

    async getUserPattern(userId: string): Promise<UserPattern | null> {
        const patterns = await this.getPatterns();
        return patterns[userId] || null;
    }

    async predictNextAction(userId: string, currentAction: string): Promise<string | null> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern) {
            return null;
        }
        const sequences = Object.entries(pattern.commonSequences)
            .filter(([key]) => key.startsWith(`${currentAction} -> `))
            .sort((a, b) => b[1] - a[1]);
        if (sequences.length > 0) {
            return sequences[0][0].split(' -> ')[1];
        }
        return null;
    }

    async isPeakHour(userId: string): Promise<boolean> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern) {
            return false;
        }
        const currentHour = new Date().getHours();
        const frequencies = Object.values(pattern.hourFrequencies);
        if (frequencies.length === 0) {
            return false;
        }
        const maxFreq = Math.max(...frequencies.map(f => Number(f)));
        return (Number(pattern.hourFrequencies[currentHour]) || 0) >= maxFreq * 0.7;
    }

    async getTopTreatmentTypes(userId: string, limit: number = 3): Promise<string[]> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern || !pattern.treatmentTypeCounts) {
            return [];
        }
        return Object.entries(pattern.treatmentTypeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([type]) => type);
    }

    async getStats(userId: string): Promise<{
        totalActions: number;
        topActions: string[];
        peakHours: number[];
        learningScore: number;
    }> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern) {
            return { totalActions: 0, topActions: [], peakHours: [], learningScore: 0 };
        }

        const totalActions = Object.values(pattern.actionCounts).reduce((a, b) => a + Number(b), 0);
        const topActions = Object.entries(pattern.actionCounts)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .slice(0, 3)
            .map(([action]) => action);
        const peakHours = Object.entries(pattern.hourFrequencies)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));

        const sequenceCount = Object.keys(pattern.commonSequences).length;
        const learningScore = Math.min(100, Math.round(
            (totalActions * 0.1) + (sequenceCount * 2) + (Object.keys(pattern.hourFrequencies).length * 1.5)
        ));

        return { totalActions, topActions, peakHours, learningScore };
    }

    async bulkLearn(userId: string, logs: any[]): Promise<void> {
        try {
            console.log(`[AI Learning] Bulk learning for user ${userId} from ${logs.length} operations...`);
            const patterns = await this.getPatterns();
            const userPattern = this.createEmptyPattern(userId);

            const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

            for (const log of sortedLogs) {
                const actionType = log.action;
                if (!actionType) {
                    continue;
                }

                userPattern.actionCounts[actionType] = (userPattern.actionCounts[actionType] || 0) + 1;

                const date = new Date(log.timestamp);
                const hour = date.getHours();
                userPattern.hourFrequencies[hour] = (userPattern.hourFrequencies[hour] || 0) + 1;

                if (userPattern.lastAction) {
                    const sequenceKey = `${userPattern.lastAction.type} -> ${actionType}`;
                    if (log.timestamp - userPattern.lastAction.timestamp < 30 * 60 * 1000) {
                        userPattern.commonSequences[sequenceKey] = (userPattern.commonSequences[sequenceKey] || 0) + 1;
                    }
                }

                userPattern.lastAction = {
                    type: actionType,
                    timestamp: log.timestamp
                };
            }

            patterns[userId] = userPattern;
            await storage.setItem(this.STORAGE_KEY, patterns);
            console.log(`[AI Learning] Bulk learning complete for ${userId}. Actions: ${Object.keys(userPattern.actionCounts).length}`);
        } catch (error) {
            console.error('[AI Learning] Bulk learning failed:', error);
        }
    }

    async evaluatePrediction(userId: string, predicted: string, actual: string, context?: string): Promise<void> {
        try {
            const patterns = await this.getPatterns();
            const userPattern = patterns[userId] || this.createEmptyPattern(userId);
            userPattern.predictionHistory = userPattern.predictionHistory || [];
            userPattern.predictionStats = userPattern.predictionStats || { total: 0, correct: 0, weights: {} };
            const isCorrect = predicted === actual;
            userPattern.predictionHistory.push({
                id: Math.random().toString(36).substr(2, 9),
                predicted, actual, isCorrect, context: context || '', timestamp: Date.now()
            });
            userPattern.predictionStats.total++;
            if (isCorrect) {
                userPattern.predictionStats.correct++;
            }
            if (userPattern.predictionHistory.length > 100) {
                userPattern.predictionHistory = userPattern.predictionHistory.slice(-100);
            }
            patterns[userId] = userPattern;
            await storage.setItem(this.STORAGE_KEY, patterns);
            if (userPattern.predictionStats.total % 10 === 0) {
                await this.adjustWeights(userId);
            }
        } catch (error) {
            console.error('[AI Learning] Failed to evaluate prediction:', error);
        }
    }

    async adjustWeights(userId: string): Promise<void> {
        try {
            const patterns = await this.getPatterns();
            const userPattern = patterns[userId];
            if (!userPattern || !userPattern.predictionHistory) {
                return;
            }
            const recentPredictions = userPattern.predictionHistory.slice(-20);
            const contextAccuracy: Record<string, { correct: number; total: number }> = {};
            recentPredictions.forEach(pred => {
                const ctx = pred.context || 'general';
                if (!contextAccuracy[ctx]) {
                    contextAccuracy[ctx] = { correct: 0, total: 0 };
                }
                contextAccuracy[ctx].total++;
                if (pred.isCorrect) {
                    contextAccuracy[ctx].correct++;
                }
            });
            userPattern.predictionStats.weights = {};
            Object.entries(contextAccuracy).forEach(([ctx, stats]) => {
                userPattern.predictionStats.weights[ctx] = stats.total > 0 ? stats.correct / stats.total : 0.5;
            });
            patterns[userId] = userPattern;
            await storage.setItem(this.STORAGE_KEY, patterns);
        } catch (error) {
            console.error('[AI Learning] Failed to adjust weights:', error);
        }
    }

    async getPredictionAccuracy(userId: string): Promise<{
        totalPredictions: number;
        correctPredictions: number;
        accuracy: number;
        contextWeights: Record<string, number>;
        recentTrend: 'improving' | 'declining' | 'stable';
    }> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern || !pattern.predictionStats) {
            return { totalPredictions: 0, correctPredictions: 0, accuracy: 0, contextWeights: {}, recentTrend: 'stable' };
        }
        const stats = pattern.predictionStats;
        const history = pattern.predictionHistory || [];
        let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (history.length >= 20) {
            const recent10 = history.slice(-10).filter(p => p.isCorrect).length;
            const prev10 = history.slice(-20, -10).filter(p => p.isCorrect).length;
            if (recent10 > prev10 + 1) {
                recentTrend = 'improving';
            } else if (recent10 < prev10 - 1) {
                recentTrend = 'declining';
            }
        }
        return { totalPredictions: stats.total, correctPredictions: stats.correct, accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0, contextWeights: stats.weights || {}, recentTrend };
    }

    async exportModel(userId: string): Promise<string> {
        const pattern = await this.getUserPattern(userId);
        if (!pattern) {
            throw new Error('No model found');
        }
        return btoa(JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), userId, pattern }));
    }

    async importModel(userId: string, encodedData: string): Promise<void> {
        try {
            const data = JSON.parse(atob(encodedData));
            if (data.version !== '1.0') {
                throw new Error('Incompatible version');
            }
            const patterns = await this.getPatterns();
            patterns[userId] = { ...data.pattern, userId };
            await storage.setItem(this.STORAGE_KEY, patterns);
        } catch (error) {
            console.error('[AI Learning] Failed to import model:', error);
            throw new Error('Import failed');
        }
    }

    async getAllUsers(): Promise<string[]> {
        const patterns = await this.getPatterns();
        return Object.keys(patterns);
    }

    private createEmptyPattern(userId: string): UserPattern {
        return {
            userId,
            actionCounts: {},
            hourFrequencies: {},
            commonSequences: {},
            treatmentTypeCounts: {},
            decisionHistory: [],
            predictionHistory: [],
            predictionStats: { total: 0, correct: 0, weights: {} }
        };
    }
}

export const aiLearning = new AILearningService();
