'use client';

import { useEffect, useRef } from 'react';

export default function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const particleCount = 150;
        const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#fcd34d', '#fbbf24', '#f59e0b', '#10b981', '#34d399'];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            rotation: number;
            rotationSpeed: number;

            constructor() {
                this.x = canvas!.width / 2;
                this.y = canvas!.height / 2;
                this.size = Math.random() * 10 + 5;
                this.speedX = Math.random() * 10 - 5;
                this.speedY = Math.random() * 10 - 5;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 10 - 5;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.speedY += 0.1; // Gravity
                this.rotation += this.rotationSpeed;

                if (this.size > 0.2) this.size -= 0.1;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Create particles from center
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Remove tiny particles
                if (particles[i].size <= 0.2) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            if (particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
