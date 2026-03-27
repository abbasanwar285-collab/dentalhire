import { inventoryService } from './inventoryService';

export interface ExtractedAction {
    type: 'procedure' | 'inventory' | 'followup';
    description: string;
    item?: string;
    quantity?: number;
    confidence: number;
}

class AnalysisService {
    // Local keyword mappings for Smart Extraction
    private readonly CLINICAL_MAP = {
        inventory: [
            { patterns: ['بنج', 'كاربول', 'anesthesia', 'carpule'], item: 'Local Anesthesia', quantity: 1 },
            { patterns: ['خيط', 'سوتشر', 'suture'], item: 'Suture Kit', quantity: 1 },
            { patterns: ['قطن', 'cotton'], item: 'Cotton Rolls', quantity: 5 },
            { patterns: ['شاش', 'gauze'], item: 'Gauze Pads', quantity: 5 },
            { patterns: ['زرعة', 'زراعة', 'implant'], item: 'Dental Implant', quantity: 1 },
            { patterns: ['طبعة', 'impression'], item: 'Alginate', quantity: 1 }
        ],
        procedures: [
            { patterns: ['قلع', 'extraction'], label: 'قلع أسنان' },
            { patterns: ['حشوة', 'حشوه', 'filling'], label: 'حشوة ضوئية' },
            { patterns: ['تنظيف', 'scaling', 'cleaning'], label: 'تنظيف وتلميع' },
            { patterns: ['جذر', 'roots', 'endo'], label: 'حشوة جذر' },
            { patterns: ['تبيض', 'whitening'], label: 'تبييض أسنان' }
        ]
    };

    /**
     * Analyze a medical note using local Rule-Based logic (No External API)
     */
    async analyzeNote(note: string, _patientId: string): Promise<ExtractedAction[]> {
        if (!note || note.length < 3) {
return [];
}

        const extracted: ExtractedAction[] = [];
        const lowerNote = note.toLowerCase();

        // 1. Detect Inventory Usage
        for (const mapping of this.CLINICAL_MAP.inventory) {
            const found = mapping.patterns.some(pattern => lowerNote.includes(pattern));
            if (found) {
                // Try to extract quantity if "عدد" or "x" is followed by number
                let qty = mapping.quantity;
                const qtyMatch = lowerNote.match(new RegExp(`(${mapping.patterns.join('|')})\\s*(?:عدد|x|×)?\\s*(\\d+)`));
                if (qtyMatch && qtyMatch[2]) {
                    qty = parseInt(qtyMatch[2]);
                }

                extracted.push({
                    type: 'inventory',
                    description: `تم رصد استخدام: ${mapping.item}`,
                    item: mapping.item,
                    quantity: qty,
                    confidence: 0.95
                });

                // Auto-decrement Stock
                await inventoryService.decrementStock(mapping.item, qty).catch(e =>
                    console.error(`[Analysis] Failed to decrement ${mapping.item}:`, e)
                );
            }
        }

        // 2. Detect Procedure Context
        for (const mapping of this.CLINICAL_MAP.procedures) {
            const found = mapping.patterns.some(pattern => lowerNote.includes(pattern));
            if (found) {
                extracted.push({
                    type: 'procedure',
                    description: mapping.label,
                    confidence: 0.85
                });
            }
        }

        // 3. Detect Follow-ups
        if (lowerNote.includes('مراجعة') || lowerNote.includes('بعد أسبوع') || lowerNote.includes('follow up')) {
            extracted.push({
                type: 'followup',
                description: 'تحديد موعد مراجعة',
                confidence: 0.8
            });
        }

        return extracted;
    }
}

export const analysisService = new AnalysisService();
