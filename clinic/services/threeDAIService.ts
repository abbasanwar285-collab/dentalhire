import { BufferGeometry, Box3, Vector3 } from 'three';

export interface MeshAnalysis {
    vertexCount: number;
    dimensions: { x: number; y: number; z: number };
    detectedJaw: 'upper' | 'lower' | 'unknown';
    confidence: number;
}

class ThreeDAIService {
    /**
     * Performs local geometry analysis on a 3D mesh
     */
    async analyzeMesh(geometry: BufferGeometry): Promise<MeshAnalysis> {
        // 1. Basic Stats
        const vertexCount = geometry.attributes.position.count;

        // 2. Bounding Box
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }
        const box = geometry.boundingBox as Box3;
        const size = new Vector3();
        box.getSize(size);

        // 3. Jaw Detection Logic (Heuristic based)
        // Concept: Upper jaws typically have a different curvature profile or pallet structure
        // We'll analyze the centroid and the Y-spread (height)
        let detectedJaw: 'upper' | 'lower' | 'unknown' = 'unknown';
        let confidence = 0;

        // Simulating a basic heuristic: 
        // In many dental exports, Y is up. Upper jaws have more surface area at the top.
        // This is a placeholder for a more complex PointNet inference later.
        const averageY = this.calculateAverageY(geometry);
        const centerY = (box.max.y + box.min.y) / 2;

        if (averageY > centerY) {
            detectedJaw = 'upper';
            confidence = 75;
        } else {
            detectedJaw = 'lower';
            confidence = 70;
        }

        return {
            vertexCount,
            dimensions: { x: size.x, y: size.y, z: size.z },
            detectedJaw,
            confidence
        };
    }

    private calculateAverageY(geometry: BufferGeometry): number {
        const positions = geometry.attributes.position.array;
        let sumY = 0;
        let count = 0;
        // Sample every 10th vertex for speed
        for (let i = 1; i < positions.length; i += 30) {
            sumY += positions[i];
            count++;
        }
        return count > 0 ? sumY / count : 0;
    }

    /**
     * Attempts to segment distinct teeth from the mesh
     */
    async segmentTeeth(geometry: BufferGeometry, jawType: 'upper' | 'lower'): Promise<{ position: Vector3; label: string }[]> {
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }
        const box = geometry.boundingBox as Box3;
        const size = new Vector3();
        box.getSize(size);
        const center = new Vector3();
        box.getCenter(center);

        // 1. Identify "Peaks" using Grid-Based Local Maxima
        // This reduces noise significantly compared to simple thresholding
        const peaks = this.findLocalPeaks(geometry, box, jawType);

        // 2. Filter and Cluster Peaks
        // Merge peaks that are too close (e.g., within 5mm) to consolidate cusps of the same tooth
        const teethCentroids = this.clusterPeaks(peaks, 5.0);

        // 3. Assign FDI Numbers
        // Sort centroids along the arch and assign strict 1-8 numbering per quadrant
        return this.assignFDINumbers(teethCentroids, jawType, center);
    }

    private findLocalPeaks(geometry: BufferGeometry, box: Box3, jawType: 'upper' | 'lower'): Vector3[] {
        const positions = geometry.attributes.position.array;
        const peaks: Vector3[] = [];
        const gridSize = 1.0; // 1mm grid buckets
        const grid: { [key: string]: { y: number, vec: Vector3 } } = {};

        // 1. Bucket vertices into grid cells, keeping the highest/lowest Y
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Filter out low points (gingiva/palate) early
            // Assuming Y is UP. Upper jaw teeth are typically at lower Y in some scans, or higher Y in others.
            // Let's stick to the earlier heuristic: "Peaks" are local maxima in the occlusal direction.
            // If jawType is upper, teeth point DOWN (usually). If lower, teeth point UP.
            // BUT, in standard STL files, usually the "occlusal plane" is considered "Up" for visualization ease?
            // Let's assume standard orientation where teeth grow towards the occlusal plane.
            // Upper Jaw: Teeth are at Min Y (if root is up) or Max Y (if inverted).
            // Let's trust the "Height" heuristic from analyzeMesh:
            // "averageY > centerY" -> Upper Jaw. This implies mass is at top. Teeth are at bottom?
            // Actually, let's look at relative height within the box.

            // Refined Heuristic:
            // For Upper Jaw: Teeth are likely at lowest Y values (if model is oriented with palate up).
            // For Lower Jaw: Teeth are likely at highest Y values.
            // Wait, standard dental scanning software (Exocad) often orients occlusal plane to Z or Y.
            // Let's use a "heightMap" approach relative to the bounding box.

            // Normalized Height (0 to 1)
            const ny = (y - box.min.y) / (box.max.y - box.min.y);

            // Filter: Ignore points in the "base" (gingiva/root area)
            // If Upper (mass at top): Teeth at bottom (ny < 0.4).
            // If Lower (mass at bottom): Teeth at top (ny > 0.6).

            const isRelevantHeight = jawType === 'upper' ? (ny < 0.5) : (ny > 0.5);
            if (!isRelevantHeight) {
                continue;
            }

            const gridX = Math.round(x / gridSize);
            const gridZ = Math.round(z / gridSize);
            const key = `${gridX},${gridZ}`;

            if (!grid[key]) {
                grid[key] = { y, vec: new Vector3(x, y, z) };
            } else {
                // Keep the "peak-iest" point
                // Upper: Keep Minimum Y. Lower: Keep Maximum Y.
                if (jawType === 'upper') {
                    if (y < grid[key].y) {
                        grid[key] = { y, vec: new Vector3(x, y, z) };
                    }
                } else {
                    if (y > grid[key].y) {
                        grid[key] = { y, vec: new Vector3(x, y, z) };
                    }
                }
            }
        }

        // 2. Find local extrema in the grid
        // A point is a peak if it is more extreme than its neighbors
        Object.keys(grid).forEach(key => {
            const [gx, gz] = key.split(',').map(Number);
            const current = grid[key];
            let isPeak = true;

            for (let dx = -4; dx <= 4; dx++) {
                for (let dz = -4; dz <= 4; dz++) {
                    if (dx === 0 && dz === 0) {
                        continue;
                    }
                    const neighborKey = `${gx + dx},${gz + dz}`;
                    const neighbor = grid[neighborKey];

                    if (neighbor) {
                        if (jawType === 'upper') {
                            // Must be lower (or roughly equal) to be a "peak" (which is a minimum Y)
                            if (neighbor.y < current.y - 0.5) {
                                isPeak = false;
                            } // Neighbor is significantly "lower" (more peaky)
                        } else {
                            // Must be higher
                            if (neighbor.y > current.y + 0.5) {
                                isPeak = false;
                            }
                        }
                    }
                }
                if (!isPeak) {
                    break;
                }
            }

            if (isPeak) {
                peaks.push(current.vec);
            }
        });

        return peaks;
    }

    private clusterPeaks(peaks: Vector3[], radius: number): Vector3[] {
        const _clusters: Vector3[] = [];
        // Sort peaks by "prominence" (Y value) to process main cusps first
        // For lower jaw: Max Y first. Upper: Min Y first.
        peaks.sort((a, b) => b.y - a.y); // Default sort desc

        // Simple greedy clustering
        // Iterate through sorted peaks. If a peak is far from existing clusters, start a new one.
        // Otherwise, ignore it (it's part of a bigger peak).

        const validPeaks: Vector3[] = [];

        for (const p of peaks) {
            let isUnique = true;
            for (const existing of validPeaks) {
                if (p.distanceTo(existing) < radius) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                validPeaks.push(p);
            }
        }

        return validPeaks;
    }

    private assignFDINumbers(centroids: Vector3[], jawType: 'upper' | 'lower', center: Vector3): { position: Vector3; label: string }[] {
        // Sort by X coordinate (Right to Left)
        centroids.sort((a, b) => a.x - b.x);

        // Find Midline: The gap between right-side and left-side teeth should be near center.x
        // Or simply finding the centroid closest to X=0

        let _closestToMidlineIdx = 0;
        let minDistX = Infinity;

        centroids.forEach((c, i) => {
            const distX = Math.abs(c.x - center.x);
            if (distX < minDistX) {
                minDistX = distX;
                _closestToMidlineIdx = i;
            }
        });

        // Determine quadrants
        // Patient Right is X < 0? It depends on coordinate system.
        // Let's assume:
        // X < 0 -> Quadrant 1 (Upper Right) or 4 (Lower Right)
        // X > 0 -> Quadrant 2 (Upper Left) or 3 (Lower Left)

        const rightLabel = jawType === 'upper' ? '1' : '4';
        const leftLabel = jawType === 'upper' ? '2' : '3';

        const results: { position: Vector3; label: string }[] = [];

        // Assign numbers outwards from the "Central Incisors"
        // We need to identify which centroids are the central incisors.
        // They are the two points closest to the midline (one likely neg X, one pos X).

        // Split into Left (X > Center) and Right (X < Center) groups
        const rightSide = centroids.filter(c => c.x < center.x).sort((a, b) => b.x - a.x); // Sort closest to center first (descending X)
        const leftSide = centroids.filter(c => c.x >= center.x).sort((a, b) => a.x - b.x); // Sort closest to center first (ascending X)

        // Assign Right Side (1-8)
        rightSide.forEach((pos, idx) => {
            if (idx < 8) {
                results.push({ position: pos, label: `${rightLabel}${idx + 1}` });
            }
        });

        // Assign Left Side (1-8)
        leftSide.forEach((pos, idx) => {
            if (idx < 8) {
                results.push({ position: pos, label: `${leftLabel}${idx + 1}` });
            }
        });

        return results;
    }
}

export const threeDAIService = new ThreeDAIService();
