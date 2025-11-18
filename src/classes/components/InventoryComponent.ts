/**
 * InventoryComponent - Item Storage and Management (MODEL)
 * Handles item addition, removal, capacity limits, and inventory queries
 * Used by: Ants (resource carrying), potentially Warehouses (building storage)
 */

import { BaseComponent } from './BaseComponent';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';

/**
 * InventoryComponent
 * Manages entity inventory with capacity limits and item tracking
 */
export class InventoryComponent extends BaseComponent {
    private items: Map<string, number>;
    private capacity: number;

    /**
     * Create a new InventoryComponent
     * @param capacity - Maximum number of items that can be stored
     */
    constructor(capacity: number) {
        super();
        this.capacity = Math.max(0, capacity);
        this.items = new Map();
    }

    /**
     * Hook: Clear inventory before detach
     */
    protected onDetaching(): void {
        this.clear();
    }

    /**
     * Lifecycle: Update (no-op for inventory)
     */
    update(_deltaTime: number): void {
        // Inventory doesn't need per-frame updates
    }

    /**
     * Add items to inventory
     * @param type - Item type identifier
     * @param amount - Number of items to add
     * @returns True if added successfully, false if failed
     */
    public addItem(type: string, amount: number): boolean {
        // Validate amount
        if (amount <= 0) {
            return false;
        }

        // Check capacity
        if (this.isFull()) {
            if (this.owner) {
                EventBus.emit(GameEvents.INVENTORY_FULL, this.owner.id);
            }
            return false;
        }

        // Check if adding would exceed capacity
        const totalAfterAdd = this.getTotalItems() + amount;
        if (totalAfterAdd > this.capacity) {
            if (this.owner) {
                EventBus.emit(GameEvents.INVENTORY_FULL, this.owner.id);
            }
            return false;
        }

        // Add items
        const currentAmount = this.items.get(type) || 0;
        this.items.set(type, currentAmount + amount);

        // Emit event
        if (this.owner) {
            EventBus.emit(GameEvents.ITEM_ADDED, this.owner.id, type, amount);
        }

        return true;
    }

    /**
     * Remove items from inventory
     * @param type - Item type identifier
     * @param amount - Number of items to remove
     * @returns True if removed successfully, false if failed
     */
    public removeItem(type: string, amount: number): boolean {
        // Validate amount
        if (amount <= 0) {
            return false;
        }

        // Check if item exists and has enough quantity
        const currentAmount = this.items.get(type) || 0;
        if (currentAmount < amount) {
            return false;
        }

        // Remove items
        const newAmount = currentAmount - amount;
        if (newAmount === 0) {
            this.items.delete(type);
        } else {
            this.items.set(type, newAmount);
        }

        // Emit event
        if (this.owner) {
            EventBus.emit(GameEvents.ITEM_REMOVED, this.owner.id, type, amount);
        }

        return true;
    }

    /**
     * Check if item exists in inventory
     * @param type - Item type identifier
     * @param minAmount - Optional minimum amount to check for
     * @returns True if item exists with sufficient quantity
     */
    public hasItem(type: string, minAmount?: number): boolean {
        const amount = this.items.get(type) || 0;
        if (minAmount !== undefined) {
            return amount >= minAmount;
        }
        return amount > 0;
    }

    /**
     * Get count of specific item type
     * @param type - Item type identifier
     * @returns Number of items of this type
     */
    public getItemCount(type: string): number {
        return this.items.get(type) || 0;
    }

    /**
     * Get total number of items in inventory
     * @returns Sum of all item quantities
     */
    public getTotalItems(): number {
        let total = 0;
        this.items.forEach(amount => {
            total += amount;
        });
        return total;
    }

    /**
     * Get all items in inventory
     * @returns Map of item types to quantities
     */
    public getAllItems(): ReadonlyMap<string, number> {
        return this.items;
    }

    /**
     * Check if inventory is full
     * @returns True if at or over capacity
     */
    public isFull(): boolean {
        return this.getTotalItems() >= this.capacity;
    }

    /**
     * Check if inventory is empty
     * @returns True if no items
     */
    public isEmpty(): boolean {
        return this.items.size === 0;
    }

    /**
     * Get remaining capacity
     * @returns Number of items that can still be added
     */
    public getRemainingCapacity(): number {
        return Math.max(0, this.capacity - this.getTotalItems());
    }

    /**
     * Get inventory capacity
     * @returns Maximum number of items
     */
    public getCapacity(): number {
        return this.capacity;
    }

    /**
     * Set new inventory capacity
     * @param newCapacity - New maximum capacity
     */
    public setCapacity(newCapacity: number): void {
        this.capacity = Math.max(0, newCapacity);
    }

    /**
     * Clear all items from inventory
     */
    public clear(): void {
        this.items.clear();
    }

    /**
     * Clear specific item type from inventory
     * @param type - Item type to clear
     */
    public clearItem(type: string): void {
        this.items.delete(type);
    }
}
