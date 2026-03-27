import { db } from './db';
import { InventoryItem, OrderCandidate } from '../types';
import { storage } from './storage';

// Interface for consumption log entries
interface ConsumptionLog {
    itemId: string;
    amount: number;
    timestamp: number;
}

// Interface for depletion alert
export interface DepletionAlert {
    itemId: string;
    itemName: string;
    currentQuantity: number;
    daysRemaining: number;
    depletionDate: Date;
    urgency: 'critical' | 'warning' | 'info';
}

class InventoryService {
    private readonly CONSUMPTION_LOG_KEY = 'inventory_consumption_log';

    /**
     * Decrement inventory items based on procedure notes or AI analysis
     * Now also tracks consumption for AI learning
     */
    async decrementStock(itemName: string, amount: number = 1): Promise<void> {
        const inventory = await db.getInventory();
        const item = inventory.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

        if (item && item.quantity >= amount) {
            const updatedItem: InventoryItem = {
                ...item,
                quantity: item.quantity - amount
            };
            await db.saveInventoryItem(updatedItem);

            // Track consumption for AI learning
            await this.trackConsumption(item.id, amount);

            // Auto-update consumption rate
            await this.autoLearnConsumptionRate(item.id);

            console.log(`[Inventory] Auto-decremented ${amount} of ${item.name}`);
        }
    }

    /**
     * Track consumption event for AI learning
     */
    async trackConsumption(itemId: string, amount: number): Promise<void> {
        try {
            const logs = await storage.getItem<ConsumptionLog[]>(this.CONSUMPTION_LOG_KEY) || [];

            logs.push({
                itemId,
                amount,
                timestamp: Date.now()
            });

            // Keep only last 500 logs to prevent storage bloat
            const trimmedLogs = logs.slice(-500);
            await storage.setItem(this.CONSUMPTION_LOG_KEY, trimmedLogs);
        } catch (error) {
            console.error('[Inventory] Failed to track consumption:', error);
        }
    }

    /**
     * Auto-learn consumption rate from recent usage patterns
     */
    async autoLearnConsumptionRate(itemId: string): Promise<void> {
        try {
            const logs = await storage.getItem<ConsumptionLog[]>(this.CONSUMPTION_LOG_KEY) || [];
            const itemLogs = logs.filter(l => l.itemId === itemId);

            if (itemLogs.length < 2) {
                return;
            } // Need at least 2 data points

            // Calculate consumption over last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const recentLogs = itemLogs.filter(l => l.timestamp > thirtyDaysAgo);

            if (recentLogs.length < 2) {
                return;
            }

            const totalConsumed = recentLogs.reduce((sum, l) => sum + l.amount, 0);
            const firstLog = recentLogs[0].timestamp;
            const lastLog = recentLogs[recentLogs.length - 1].timestamp;
            const daysPassed = Math.max(1, (lastLog - firstLog) / (24 * 60 * 60 * 1000));

            const _calculatedRate = totalConsumed / daysPassed;

            // Update with smooth learning
            await this.updateConsumptionRate(itemId, totalConsumed, daysPassed);
        } catch (error) {
            console.error('[Inventory] Failed to auto-learn rate:', error);
        }
    }

    /**
     * Get items that need restocking
     */
    async getRestockCandidates(): Promise<OrderCandidate[]> {
        const inventory = await db.getInventory();
        const candidates: OrderCandidate[] = [];

        for (const item of inventory) {
            const minStock = item.minStock || 5;
            if (item.quantity < minStock) {
                candidates.push({
                    id: item.id,
                    name: item.name,
                    currentQuantity: item.quantity,
                    suggestedAmount: (minStock * 3) - item.quantity,
                    reason: item.quantity === 0 ? 'نفذت الكمية تماماً' : 'وصلت للحد الأدنى'
                });
            }
        }

        return candidates;
    }

    /**
     * Predict how long an item will last based on recent consumption
     */
    async predictDepletionDate(itemId: string): Promise<number | null> {
        const inventory = await db.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item || !item.consumptionRate || item.consumptionRate === 0) {
            return null;
        }

        const daysRemaining = item.quantity / item.consumptionRate;
        const now = Date.now();
        return now + (daysRemaining * 24 * 60 * 60 * 1000);
    }

    /**
     * Get days remaining until item depletes
     */
    async getDaysRemaining(itemId: string): Promise<number | null> {
        const inventory = await db.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item || !item.consumptionRate || item.consumptionRate === 0) {
            return null;
        }

        return Math.round(item.quantity / item.consumptionRate);
    }

    /**
     * Get all items with depletion predictions
     * ONLY returns predictions for items with REAL consumption data
     */
    async getAllDepletionPredictions(): Promise<Map<string, { days: number; date: Date }>> {
        const predictions = new Map<string, { days: number; date: Date }>();
        const inventory = await db.getInventory();

        for (const item of inventory) {
            // CRITICAL: Only predict if we have REAL consumption rate from actual usage
            // Without this data, any prediction would be fake/misleading
            if (item.consumptionRate && item.consumptionRate > 0 && item.quantity > 0) {
                const daysRemaining = Math.round(item.quantity / item.consumptionRate);
                const depletionDate = new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000));
                predictions.set(item.id, { days: daysRemaining, date: depletionDate });
            }
            // Items without consumption rate = NO prediction shown
        }

        return predictions;
    }

    /**
     * Get depletion alerts for items running low
     */
    async getDepletionAlerts(withinDays: number = 14): Promise<DepletionAlert[]> {
        const alerts: DepletionAlert[] = [];
        const inventory = await db.getInventory();

        for (const item of inventory) {
            // Skip items with zero quantity (already depleted - handle separately)
            if (item.quantity <= 0) {
                continue;
            }

            const minStock = item.minStock || 5;
            let daysRemaining: number | null = null;
            let urgency: 'critical' | 'warning' | 'info';

            // Priority 1: Check if already below minimum stock (CRITICAL ALERT)
            if (item.quantity < minStock) {
                // Calculate rough days remaining based on how far below minStock
                const percentageRemaining = item.quantity / minStock;
                daysRemaining = Math.max(1, Math.round(percentageRemaining * 7)); // 1-7 days based on %
                urgency = item.quantity === 1 ? 'critical' : item.quantity <= minStock / 2 ? 'critical' : 'warning';
            } else if (item.consumptionRate && item.consumptionRate > 0) {
                daysRemaining = Math.round(item.quantity / item.consumptionRate);

                if (daysRemaining > withinDays) {
                    continue;
                } // Not urgent yet

                if (daysRemaining <= 3) {
                    urgency = 'critical';
                } else if (daysRemaining <= 7) {
                    urgency = 'warning';
                } else {
                    urgency = 'info';
                }
            } else if (item.quantity === minStock) {
                daysRemaining = 7; // Assume 7 days as default
                urgency = 'info';
            } else {
                continue;
            }

            // Add alert if we determined it's worth alerting
            if (daysRemaining !== null) {
                alerts.push({
                    itemId: item.id,
                    itemName: item.name,
                    currentQuantity: item.quantity,
                    daysRemaining,
                    depletionDate: new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)),
                    urgency
                });
            }
        }

        // Sort by urgency (critical first), then by days remaining
        return alerts.sort((a, b) => {
            const urgencyOrder = { critical: 0, warning: 1, info: 2 };
            const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            if (urgencyDiff !== 0) {
                return urgencyDiff;
            }
            return a.daysRemaining - b.daysRemaining;
        });
    }

    /**
     * Update consumption rate for an item based on usage patterns
     */
    async updateConsumptionRate(itemId: string, unitsUsed: number, days: number): Promise<void> {
        const inventory = await db.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item) {
            return;
        }

        const currentRate = item.consumptionRate || 0;
        const newRate = unitsUsed / days;

        // Use moving average (smooth training)
        const updatedRate = currentRate > 0
            ? (currentRate * 0.7) + (newRate * 0.3)
            : newRate;

        const updatedItem: InventoryItem = {
            ...item,
            consumptionRate: updatedRate
        };
        await db.saveInventoryItem(updatedItem);
    }

    /**
     * Manual consumption tracking (for procedures)
     */
    async recordUsage(itemId: string, amount: number): Promise<void> {
        const inventory = await db.getInventory();
        const item = inventory.find(i => i.id === itemId);
        if (!item || item.quantity < amount) {
            return;
        }

        // Update quantity
        const updatedItem: InventoryItem = {
            ...item,
            quantity: item.quantity - amount
        };
        await db.saveInventoryItem(updatedItem);

        // Track for AI learning
        await this.trackConsumption(itemId, amount);
        await this.autoLearnConsumptionRate(itemId);
    }
}

export const inventoryService = new InventoryService();
