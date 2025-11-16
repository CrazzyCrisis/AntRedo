/**
 * ParticleSystem - Simple particle effect system with object pooling
 * 
 * Listens to PARTICLE_SPAWN events and creates visual particle effects
 * Uses object pooling for performance optimization
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { Renderable } from '../rendering/Renderable';
import { TILE_CONFIG } from '../config/tileConfig';
import { ObjectPool } from '../utils/ObjectPool';

interface ParticleSpawnOptions {
    count?: number;
    color?: [number, number, number];
    velocity?: number;
    lifetime?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: [number, number, number];
}

export class ParticleSystem {
    private static instance: ParticleSystem;
    
    private renderer: Renderer | null = null;
    private particles: Particle[] = [];
    private particlePool: ObjectPool<Particle>;
    private unregisterRenderable: (() => void) | null = null;
    
    private constructor() {
        // Initialize object pool for particles (pre-create 100, max 500)
        this.particlePool = new ObjectPool<Particle>(
            () => ({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                life: 0,
                maxLife: 0,
                color: [255, 255, 255]
            }),
            (particle) => {
                particle.x = 0;
                particle.y = 0;
                particle.vx = 0;
                particle.vy = 0;
                particle.life = 0;
                particle.maxLife = 0;
                particle.color = [255, 255, 255];
            },
            100, // Initial pool size
            500  // Max pool size
        );

        // Listen for particle spawn events
        EventBus.on(GameEvents.PARTICLE_SPAWN, 
            (effectType: string, x: number, y: number, options: ParticleSpawnOptions) => {
                this.spawnParticles(effectType, x, y, options);
            }
        );
    }
    
    public static getInstance(): ParticleSystem {
        if (!ParticleSystem.instance) {
            ParticleSystem.instance = new ParticleSystem();
        }
        return ParticleSystem.instance;
    }
    
    /**
     * Initialize particle system with renderer
     */
    public initialize(renderer: Renderer): void {
        this.renderer = renderer;
        
        // Register particle renderable
        const particleRenderable: Renderable = {
            layer: RenderLayer.ABOVE_ENTITIES,
            depth: 10000, // Render on top
            render: (graphics: any) => this.renderParticles(graphics)
        };
        
        this.unregisterRenderable = this.renderer.register(particleRenderable);
    }
    
    /**
     * Spawn particles at position
     */
    private spawnParticles(_effectType: string, x: number, y: number, options: ParticleSpawnOptions): void {
        const count = options.count || 5;
        const color = options.color || [255, 255, 255];
        const velocity = options.velocity || 2;
        const lifetime = options.lifetime || 500;
        
        // Convert grid coordinates to world coordinates
        const worldX = x * TILE_CONFIG.SIZE + TILE_CONFIG.SIZE / 2;
        const worldY = y * TILE_CONFIG.SIZE + TILE_CONFIG.SIZE / 2;
        
        // Create particles in random directions using object pool
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = velocity * (0.5 + Math.random() * 0.5);
            
            const particle = this.particlePool.acquire();
            particle.x = worldX;
            particle.y = worldY;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = lifetime;
            particle.maxLife = lifetime;
            particle.color = color as [number, number, number];
            
            this.particles.push(particle);
        }
        
        // Mark layer dirty for re-render
        if (this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
    }
    
    /**
     * Update particles (call every frame)
     */
    public update(deltaTime: number): void {
        // Update particle positions and lifetime
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity/drag
            particle.vy += 0.1;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Update lifetime
            particle.life -= deltaTime;
            
            // Remove dead particles and return to pool
            if (particle.life <= 0) {
                this.particlePool.release(particle);
                this.particles.splice(i, 1);
            }
        }
        
        // Mark layer dirty if particles exist
        if (this.particles.length > 0 && this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
    }
    
    /**
     * Render all particles
     */
    private renderParticles(graphics: any): void {
        if (this.particles.length === 0) return;
        
        graphics.noStroke();
        
        for (const particle of this.particles) {
            // Fade out based on lifetime
            const alpha = 255 * (particle.life / particle.maxLife);
            
            graphics.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
            
            // Draw small circle
            const size = 3 * (particle.life / particle.maxLife) + 1;
            graphics.circle(particle.x, particle.y, size);
        }
    }
    
    /**
     * Clear all particles and return them to pool
     */
    public clear(): void {
        // Return all particles to pool
        this.particles.forEach(particle => this.particlePool.release(particle));
        this.particles = [];
        
        if (this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
    }
    
    /**
     * Get pool statistics for debugging
     */
    public getPoolStats(): { available: number; inUse: number; total: number } {
        return this.particlePool.getStats();
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        if (this.unregisterRenderable) {
            this.unregisterRenderable();
            this.unregisterRenderable = null;
        }
        
        // Return all particles to pool before clearing
        this.particles.forEach(particle => this.particlePool.release(particle));
        this.particles = [];
        this.particlePool.clear();
    }
}
