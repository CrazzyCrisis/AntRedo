/**
 * ParticleSystem - Simple particle effect system
 * 
 * Listens to PARTICLE_SPAWN events and creates visual particle effects
 * Currently a stub implementation - can be enhanced with proper particle rendering
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { Renderer } from '../rendering/Renderer';
import { RenderLayer } from '../rendering/RenderLayer';
import { Renderable } from '../rendering/Renderable';

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
    private unregisterRenderable: (() => void) | null = null;
    
    private constructor() {
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
        
        // Convert grid coordinates to world coordinates (assuming TILE_SIZE = 16)
        const TILE_SIZE = 16;
        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Create particles in random directions
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = velocity * (0.5 + Math.random() * 0.5);
            
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: lifetime,
                maxLife: lifetime,
                color: color as [number, number, number]
            });
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
            
            // Remove dead particles
            if (particle.life <= 0) {
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
     * Clear all particles
     */
    public clear(): void {
        this.particles = [];
        if (this.renderer) {
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        if (this.unregisterRenderable) {
            this.unregisterRenderable();
            this.unregisterRenderable = null;
        }
        this.particles = [];
    }
}
