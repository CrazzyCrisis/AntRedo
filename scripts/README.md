# Manager Refactoring Script

## Overview
PowerShell script to safely refactor all managers to use the BaseManager pattern with automatic backups and rollback capability.

## Features
- ✅ **Automatic backups** - Creates timestamped backups before any changes
- ✅ **Dry run mode** - Preview changes without modifying files
- ✅ **Build verification** - Runs `npm run build` after refactoring
- ✅ **Auto-rollback** - Reverts changes if build fails
- ✅ **Manual rollback** - Restore from any backup on demand
- ✅ **Detailed logging** - Complete logs in `logs/` directory
- ✅ **Line count tracking** - Reports lines saved per manager

## Usage

### Preview Changes (Dry Run)
```powershell
.\scripts\RefactorManagers.ps1 -DryRun
```
Shows what would be changed without modifying files.

### Run Refactoring
```powershell
.\scripts\RefactorManagers.ps1
```
Refactors all managers with automatic backup and build verification.

### Skip Tests (Faster)
```powershell
.\scripts\RefactorManagers.ps1 -SkipTests
```
Skips test suite after refactoring (only runs build verification).

### Rollback Changes
```powershell
.\scripts\RefactorManagers.ps1 -Rollback
```
Restores from the most recent backup.

## What It Does

The script automatically performs these transformations on each manager:

1. **Updates imports**
   ```typescript
   // Before
   import { EventBus, GameEvents } from '../utils/eventBus';
   
   // After
   import { BaseManager } from './BaseManager';
   import { GameEvents } from '../utils/eventBus';
   ```

2. **Extends BaseManager**
   ```typescript
   // Before
   export class ResourceManager {
   
   // After
   export class ResourceManager extends BaseManager {
   ```

3. **Removes unsubscribe array**
   ```typescript
   // Before
   private unsubscribeFunctions: Array<() => void> = [];
   
   // After
   // (removed)
   ```

4. **Adds super() call**
   ```typescript
   private constructor() {
       super(); // Initialize BaseManager
       // ...
   }
   ```

5. **Replaces EventBus.on() + push()**
   ```typescript
   // Before
   this.unsubscribeFunctions.push(
       EventBus.on(GameEvents.SOME_EVENT, (data) => {
           this.handleEvent(data);
       })
   );
   
   // After
   this.subscribe(GameEvents.SOME_EVENT, (data) => {
       this.handleEvent(data);
   });
   ```

6. **Replaces EventBus.emit()**
   ```typescript
   // Before
   EventBus.emit(GameEvents.STATE_CHANGED, newState);
   
   // After
   this.emit(GameEvents.STATE_CHANGED, newState);
   ```

7. **Simplifies cleanup()**
   ```typescript
   // Before
   public cleanup(): void {
       this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
       this.unsubscribeFunctions = [];
       // ...
   }
   
   // After
   public cleanup(): void {
       this.cleanupSubscriptions();
       // ...
   }
   ```

## Managers Refactored

Priority order:
1. ✅ AudioManager (already done manually)
2. ResourceManager
3. PowerManager
4. SpawnManager
5. PathfindingManager
6. BuildingManager
7. EntityManager
8. GameStateManager
9. InputManager

## Safety Features

### Automatic Backups
- Creates backup in `backups/managers_YYYYMMDD_HHMMSS/`
- Includes metadata file with timestamp and file list
- Multiple backups preserved (not overwritten)

### Build Verification
- Runs `npm run build` after refactoring
- **Auto-rollback on failure** - Restores from backup if build fails
- Prevents broken code from being committed

### Logging
- Detailed logs in `logs/refactor_YYYYMMDD_HHMMSS.log`
- Tracks each transformation step
- Records success/failure for each manager
- Shows lines saved per file

## Backup Structure

```
backups/
  managers_20250115_143022/
    metadata.json           # Backup info
    ResourceManager.ts      # Original file
    PowerManager.ts
    ...
```

## Log Format

```
[2025-01-15 14:30:22] [INFO] Manager Refactoring Script Started
[2025-01-15 14:30:22] [INFO] Creating backup in: backups/managers_20250115_143022
[2025-01-15 14:30:22] [INFO] Backed up: ResourceManager.ts
[2025-01-15 14:30:22] [INFO] Refactoring: ResourceManager.ts
[2025-01-15 14:30:22] [INFO]   ✓ Updated imports
[2025-01-15 14:30:22] [INFO]   ✓ Extended BaseManager
[2025-01-15 14:30:22] [INFO]   ✓ Removed unsubscribe array declaration
[2025-01-15 14:30:22] [SUCCESS]   ✓ Saved changes (8 lines saved)
[2025-01-15 14:30:25] [SUCCESS] Build successful
[2025-01-15 14:30:25] [SUCCESS] Refactoring Complete!
```

## Troubleshooting

### Build Fails After Refactoring
The script auto-rolls back, but if you need to manually rollback:
```powershell
.\scripts\RefactorManagers.ps1 -Rollback
```

### Script Execution Policy Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Permission Denied
Run PowerShell as Administrator or check file permissions.

## Manual Review Checklist

After running the script, verify:
- [ ] `npm run build` succeeds
- [ ] `npm test` runs (expected failures are documented)
- [ ] Game loads in browser
- [ ] All event listeners still work
- [ ] No EventBus errors in console
- [ ] Scene transitions work correctly

## Expected Results

**Estimated savings:** ~80-100 lines across all managers

**Typical manager savings:**
- ResourceManager: ~10 lines
- PowerManager: ~8 lines  
- SpawnManager: ~12 lines
- PathfindingManager: ~6 lines
- BuildingManager: ~8 lines
- EntityManager: ~6 lines
- GameStateManager: ~4 lines
- InputManager: ~6 lines

## Related Documentation

- `docs/architecture/BASE_MANAGER_PATTERN.md` - Pattern details
- `docs/checklists/MANAGER_REFACTORING.md` - Manual migration guide
- `src/managers/BaseManager.ts` - Base class implementation
