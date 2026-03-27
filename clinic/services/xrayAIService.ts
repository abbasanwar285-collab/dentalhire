/**
 * X-Ray AI Analysis Service
 * 
 * Local AI-powered dental X-ray analysis for detecting potential issues.
 * 
 * ⚠️ DISCLAIMER: This is for assistance only and does NOT replace 
 * professional medical diagnosis. Always consult a qualified dentist.
 */

export interface XrayAnalysisResult {
    confidence: number; // 0-100
    findings: XrayFinding[];
    summary: string;
    processedImageUrl?: string; // Image with markers
}

export interface XrayFinding {
    id: string;
    type: 'cavity' | 'bone_loss' | 'root_canal' | 'periapical' | 'crown' | 'filling' | 'unknown';
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: { x: number; y: number; width: number; height: number };
    confidence: number;
}

class XrayAIService {
    /**
     * Analyze dental X-ray image for potential issues
     */
    async analyzeXray(imageBase64: string): Promise<XrayAnalysisResult> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas for analysis
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const findings = this.detectFindings(imageData, canvas.width, canvas.height);

                // Create annotated image
                const annotatedImage = this.createAnnotatedImage(ctx, canvas, findings);

                // Calculate overall confidence
                const avgConfidence = findings.length > 0
                    ? Math.round(findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length)
                    : 0;

                // Generate summary
                const summary = this.generateSummary(findings);

                resolve({
                    confidence: avgConfidence,
                    findings,
                    summary,
                    processedImageUrl: annotatedImage
                });
            };
            img.src = imageBase64;
        });
    }

    /**
     * Detect potential findings in X-ray using image analysis
     */
    private detectFindings(imageData: ImageData, width: number, height: number): XrayFinding[] {
        const findings: XrayFinding[] = [];
        const data = imageData.data;

        // Divide image into grid cells for analysis
        const cellSize = Math.min(width, height) / 8;

        for (let y = 0; y < height - cellSize; y += cellSize / 2) {
            for (let x = 0; x < width - cellSize; x += cellSize / 2) {
                const cellAnalysis = this.analyzeCellRegion(data, x, y, cellSize, cellSize, width);

                if (cellAnalysis.isDarkSpot) {
                    // Dark spots could indicate cavities or root infections
                    const finding = this.classifyDarkSpot(cellAnalysis, x, y, cellSize);
                    if (finding && !this.isOverlapping(findings, finding)) {
                        findings.push(finding);
                    }
                }

                if (cellAnalysis.isBrightSpot) {
                    // Bright spots could indicate fillings or crowns
                    const finding = this.classifyBrightSpot(cellAnalysis, x, y, cellSize);
                    if (finding && !this.isOverlapping(findings, finding)) {
                        findings.push(finding);
                    }
                }

                if (cellAnalysis.hasEdgeAnomaly) {
                    // Edge anomalies could indicate bone loss
                    const finding = this.classifyEdgeAnomaly(cellAnalysis, x, y, cellSize);
                    if (finding && !this.isOverlapping(findings, finding)) {
                        findings.push(finding);
                    }
                }
            }
        }

        // Limit to top findings by confidence
        return findings
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
    }

    /**
     * Analyze a region of the image
     */
    private analyzeCellRegion(
        data: Uint8ClampedArray,
        startX: number,
        startY: number,
        cellWidth: number,
        cellHeight: number,
        imageWidth: number
    ): {
        avgBrightness: number;
        variance: number;
        isDarkSpot: boolean;
        isBrightSpot: boolean;
        hasEdgeAnomaly: boolean;
        darkRatio: number;
        brightRatio: number;
    } {
        let sum = 0;
        let sumSq = 0;
        let darkPixels = 0;
        let brightPixels = 0;
        let count = 0;

        const samples: number[] = [];

        for (let y = startY; y < startY + cellHeight && y < data.length / (imageWidth * 4); y += 2) {
            for (let x = startX; x < startX + cellWidth; x += 2) {
                const idx = (Math.floor(y) * imageWidth + Math.floor(x)) * 4;
                if (idx >= 0 && idx < data.length - 3) {
                    // Calculate grayscale value
                    const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    samples.push(gray);
                    sum += gray;
                    sumSq += gray * gray;
                    count++;

                    if (gray < 60) {
darkPixels++;
}
                    if (gray > 200) {
brightPixels++;
}
                }
            }
        }

        if (count === 0) {
            return { avgBrightness: 0, variance: 0, isDarkSpot: false, isBrightSpot: false, hasEdgeAnomaly: false, darkRatio: 0, brightRatio: 0 };
        }

        const avg = sum / count;
        const variance = (sumSq / count) - (avg * avg);
        const darkRatio = darkPixels / count;
        const brightRatio = brightPixels / count;

        // Detect anomalies
        const isDarkSpot = darkRatio > 0.25 && avg < 80;
        const isBrightSpot = brightRatio > 0.3 && avg > 180;
        const hasEdgeAnomaly = variance > 2000 && avg < 120; // High variance + low brightness

        return { avgBrightness: avg, variance, isDarkSpot, isBrightSpot, hasEdgeAnomaly, darkRatio, brightRatio };
    }

    /**
     * Classify a dark spot finding
     */
    private classifyDarkSpot(analysis: { avgBrightness: number; darkRatio: number }, x: number, y: number, size: number): XrayFinding | null {
        const confidence = Math.min(95, Math.round(50 + (analysis.darkRatio * 50)));

        if (confidence < 40) {
return null;
}

        // Determine type based on characteristics
        let type: XrayFinding['type'] = 'cavity';
        let severity: XrayFinding['severity'] = 'low';
        let description = 'منطقة داكنة محتملة';

        if (analysis.avgBrightness < 40 && analysis.darkRatio > 0.5) {
            type = 'periapical';
            severity = 'high';
            description = 'منطقة داكنة حول الجذر - قد تشير إلى التهاب';
        } else if (analysis.avgBrightness < 60) {
            type = 'cavity';
            severity = 'medium';
            description = 'بقعة داكنة - تسوس محتمل';
        }

        return {
            id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            severity,
            description,
            location: { x, y, width: size, height: size },
            confidence
        };
    }

    /**
     * Classify a bright spot finding
     */
    private classifyBrightSpot(analysis: { avgBrightness: number; brightRatio: number }, x: number, y: number, size: number): XrayFinding | null {
        const confidence = Math.min(90, Math.round(40 + (analysis.brightRatio * 40)));

        if (confidence < 35) {
return null;
}

        let type: XrayFinding['type'] = 'filling';
        let description = 'حشوة أو تاج معدني';

        if (analysis.avgBrightness > 220) {
            type = 'crown';
            description = 'تاج أو جسر معدني';
        }

        return {
            id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            severity: 'low',
            description,
            location: { x, y, width: size, height: size },
            confidence
        };
    }

    /**
     * Classify edge anomaly (potential bone loss)
     */
    private classifyEdgeAnomaly(analysis: { avgBrightness: number; variance: number }, x: number, y: number, size: number): XrayFinding | null {
        const confidence = Math.min(85, Math.round(30 + (analysis.variance / 100)));

        if (confidence < 35) {
return null;
}

        return {
            id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'bone_loss',
            severity: 'medium',
            description: 'تغير في كثافة العظم - قد يشير إلى فقدان عظمي',
            location: { x, y, width: size, height: size },
            confidence
        };
    }

    /**
     * Check if a finding overlaps with existing findings
     */
    private isOverlapping(findings: XrayFinding[], newFinding: XrayFinding): boolean {
        const margin = 20;
        return findings.some(f => {
            const overlapX = Math.abs(f.location.x - newFinding.location.x) < f.location.width + margin;
            const overlapY = Math.abs(f.location.y - newFinding.location.y) < f.location.height + margin;
            return overlapX && overlapY;
        });
    }

    /**
     * Create annotated image with findings marked
     */
    private createAnnotatedImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, findings: XrayFinding[]): string {
        // Draw markers for each finding
        findings.forEach((finding, index) => {
            const colors = {
                cavity: '#ef4444',
                bone_loss: '#f97316',
                root_canal: '#eab308',
                periapical: '#dc2626',
                crown: '#22c55e',
                filling: '#3b82f6',
                unknown: '#9ca3af'
            };

            const color = colors[finding.type] || colors.unknown;

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(
                finding.location.x,
                finding.location.y,
                finding.location.width,
                finding.location.height
            );

            // Draw label background
            ctx.fillStyle = color;
            ctx.fillRect(finding.location.x, finding.location.y - 25, 30, 22);

            // Draw label number
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${index + 1}`, finding.location.x + 8, finding.location.y - 8);

            // Draw confidence badge
            const badgeX = finding.location.x + finding.location.width - 40;
            const badgeY = finding.location.y + finding.location.height + 5;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(badgeX, badgeY, 45, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Arial';
            ctx.fillText(`${finding.confidence}%`, badgeX + 5, badgeY + 13);
        });

        return canvas.toDataURL('image/jpeg', 0.9);
    }

    /**
     * Generate summary text for findings
     */
    private generateSummary(findings: XrayFinding[]): string {
        if (findings.length === 0) {
            return 'لم يتم اكتشاف مناطق تحتاج اهتمام خاص. ⚠️ هذا لا يغني عن الفحص الطبي.';
        }

        const cavities = findings.filter(f => f.type === 'cavity' || f.type === 'periapical');
        const boneLoss = findings.filter(f => f.type === 'bone_loss');
        const restorations = findings.filter(f => f.type === 'filling' || f.type === 'crown');

        let summary = `تم اكتشاف ${findings.length} منطقة تستحق المراجعة:\n`;

        if (cavities.length > 0) {
            summary += `• ${cavities.length} منطقة داكنة (تسوس محتمل)\n`;
        }
        if (boneLoss.length > 0) {
            summary += `• ${boneLoss.length} منطقة تغير في العظم\n`;
        }
        if (restorations.length > 0) {
            summary += `• ${restorations.length} حشوة/تاج موجود\n`;
        }

        summary += '\n⚠️ للمساعدة فقط - يرجى استشارة الطبيب للتشخيص الدقيق.';

        return summary;
    }

    /**
     * Get finding type label in Arabic
     */
    getTypeLabel(type: XrayFinding['type']): string {
        const labels: Record<XrayFinding['type'], string> = {
            cavity: 'تسوس',
            bone_loss: 'فقدان عظمي',
            root_canal: 'قناة جذر',
            periapical: 'التهاب حول الجذر',
            crown: 'تاج',
            filling: 'حشوة',
            unknown: 'غير محدد'
        };
        return labels[type] || 'غير محدد';
    }

    /**
     * Get severity label in Arabic
     */
    getSeverityLabel(severity: XrayFinding['severity']): string {
        const labels: Record<XrayFinding['severity'], string> = {
            low: 'منخفض',
            medium: 'متوسط',
            high: 'عالي'
        };
        return labels[severity];
    }
}

export const xrayAIService = new XrayAIService();
