/**
 * Resource Gathering Configuration
 * Defines extraction times, yield ranges, smell detection, and gathering mechanics
 * Config-First Philosophy: All gathering behavior values centralized here
 */

import { ResourceType } from './entityConfig';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ResourceExtractionConfig {
    /** Time in seconds to extract one unit of resource */
    extractionTime: number;
    
    /** Minimum yield (resources per node) */
    minYield: number;
    
    /** Maximum yield (resources per node) */
    maxYield: number;
    
    /** Smell range for this resource type (tiles) */
    smellRange: number;
    
    /** How close ant must be to start extraction (tiles) */
    extractionRange: number;
}

// ============================================================================
// RESOURCE EXTRACTION CONFIGURATION
// ============================================================================

export const RESOURCE_EXTRACTION: Record<ResourceType, ResourceExtractionConfig> = {
    food: {
        extractionTime: 1.5,      // 1.5 seconds per unit
        minYield: 3,
        maxYield: 8,
        smellRange: 8,
        extractionRange: 0.5      // Must be very close
    },
    
    wood: {
        extractionTime: 2.5,      // 2.5 seconds per unit (harder to harvest)
        minYield: 2,
        maxYield: 6,
        smellRange: 6,
        extractionRange: 0.5
    },
    
    stone: {
        extractionTime: 3.0,      // 3 seconds per unit (hardest to harvest)
        minYield: 2,
        maxYield: 5,
        smellRange: 6,
        extractionRange: 0.5
    },
    
    magicCrystal: {
        extractionTime: 4.0,      // 4 seconds per unit (rare, slow extraction)
        minYield: 2,
        maxYield: 10,              // Variable yield
        smellRange: 10,           // Wider smell range (rare resource)
        extractionRange: 0.5
    }
};

// ============================================================================
// GATHERING BEHAVIOR CONFIGURATION
// ============================================================================

export const GATHERING_BEHAVIOR = {
    /** How often to scan for resources (seconds) */
    SCAN_INTERVAL: 1.0,
    
    /** Prioritize closest resources */
    PRIORITIZE_CLOSEST: true,
    
    /** How often to update progress bar (seconds) */
    PROGRESS_UPDATE_INTERVAL: 0.1,
    
    /** Visual settings for progress bars */
    PROGRESS_BAR: {
        WIDTH: 32,
        HEIGHT: 4,
        OFFSET_Y: -20,            // Above ant sprite
        FILL_COLOR: '#4CAF50',    // Green
        BACKGROUND_COLOR: '#333333',
        BORDER_COLOR: '#FFFFFF'
    },
    
    /** Visual settings for depletion bars */
    DEPLETION_BAR: {
        WIDTH: 32,
        HEIGHT: 4,
        OFFSET_Y: -8,             // Above resource sprite
        FILL_COLOR: '#FFC107',    // Amber/Yellow
        BACKGROUND_COLOR: '#333333',
        BORDER_COLOR: '#FFFFFF'
    }
} as const;

