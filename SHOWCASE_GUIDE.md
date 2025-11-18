# 🎮 Entity Showcase Scene - Testing Guide

## What is This?

The **EntityShowcaseScene** is a fully interactive demonstration of ALL entity systems implemented in the AntRedo project. It's designed to let you see and test everything working together before we dive into comprehensive integration testing.

## How to Launch

### Method 1: Press 'T' Key (Quick Access)
1. Run the game (`npm run build` + open `index.html`)
2. Press **T** (or **Shift+T**) at any time to instantly jump to the showcase
3. Works from the menu, dev room, or any scene!

### Method 2: From Menu (Future)
- A dedicated "Showcase" button will be added to the level select menu

---

## What's Included?

### ✅ Entities Spawned

1. **Player Queen** (Center of map)
   - All 5 powers unlocked (Lightning, Fireball, Blackhole, Tidalwave, FinalFlash)
   - Player-controlled with WASD/Arrow keys
   - Camera automatically follows

2. **15 Ants** (Circle formation around queen)
   - 5 Gatherers (yellow) - will seek resources autonomously
   - 3 Builders (brown) - construction workers
   - 4 Warriors (red) - combat-focused
   - 3 Scouts (green) - exploration units
   - All have autonomous AI enabled

3. **Boss Enemy** (Top-right corner)
   - Patrols rectangular path
   - Vision cone detection
   - Homing projectile attacks
   - Targets weakest ant in range

4. **20 Resource Nodes** (4 clusters of 5)
   - Food (green cluster)
   - Wood (brown cluster)
   - Stone (gray cluster)
   - Magic Crystals (purple cluster)
   - Ants can smell and gather from these

5. **2 Buildings** (Near queen)
   - Warehouse (completed) - stores resources
   - Barracks (completed) - spawns ants
   - Both start completed for immediate testing

### ✅ UI Components Active

- **Resource Display** (top-left) - Shows faction resources with icons
- **Population Display** (left side) - Ant count with expandable breakdown
- **Power Bar** (bottom-center) - 5 powers with cooldowns
- **Queen Portrait** (bottom-left) - Static portrait with animated border
- **Queen Commands** (bottom mid-left) - Command buttons
- **Minimap** (bottom-right) - Tactical overview with entity markers

---

## 🎮 Controls

### Queen Movement
- **WASD** or **Arrow Keys** - Move queen around
- Camera smoothly follows queen

### Queen Powers
- **1** - Lightning Strike (fast AOE with knockback)
- **2** - Fireball (aimed projectile with burn)
- **3** - Blackhole (spiral pull + center damage)
- **4** - Tidalwave (defensive radial push)
- **5** - Final Flash (screen-wide devastation)

### Camera Controls
- **Click Minimap** - Jump camera to clicked location
- Camera auto-follows queen by default

### Debug Controls
- **D** - Toggle debug overlays (ant states, vision cones, paths)

### UI Interactions
- **Click Population Display** - Expand/collapse ant type breakdown
- **Click Minimap** - Navigate camera
- **Hover Minimap** - Highlight border
- **Click Command Buttons** - Issue commands (Fight, Build, Gather, Follow)

---

## 🔍 What to Test

### Entity Systems
- [ ] **Queen Movement** - Does she respond to WASD/arrows?
- [ ] **Ant Spawning** - Do all 15 ants appear around queen?
- [ ] **Ant AI** - Do gatherers seek resources autonomously?
- [ ] **Boss Patrol** - Does boss follow patrol path?
- [ ] **Boss Detection** - Does boss turn red and chase when ants enter vision cone?
- [ ] **Resource Nodes** - Are 4 clusters visible with correct colors?
- [ ] **Buildings** - Do warehouse and barracks appear near queen?

### Power Systems
- [ ] **Lightning (1)** - Does it strike and knock back enemies?
- [ ] **Fireball (2)** - Aim and fire, does it explode on impact?
- [ ] **Blackhole (3)** - Does it pull entities in a spiral?
- [ ] **Tidalwave (4)** - Does it push enemies away radially?
- [ ] **Final Flash (5)** - Does it kill everything on screen?
- [ ] **Cooldowns** - Do powers go on cooldown after use?

### UI Systems
- [ ] **Resource Display** - Do resource counts update when ants gather?
- [ ] **Population Display** - Does ant count match spawned ants (15/50)?
- [ ] **Population Expand** - Click to see breakdown by type
- [ ] **Power Bar** - Do all 5 powers show with key numbers?
- [ ] **Queen Portrait** - Does it display at bottom-left?
- [ ] **Minimap** - Do entity markers appear (yellow queen, green ants, red boss)?
- [ ] **Minimap Click** - Does clicking move camera?
- [ ] **Command Buttons** - Do they highlight on hover?

### Rendering Systems
- [ ] **Layer Sorting** - Do entities appear in correct depth order (Y-sorted)?
- [ ] **Camera Follow** - Does camera smoothly track queen?
- [ ] **Debug Mode (D)** - Toggle to see ant states, vision cones, paths
- [ ] **Faction Colors** - Do ants have blue tint (player faction)?

### Manager Systems
- [ ] **EntityManager** - Are all entities tracked? (Check with debug logs)
- [ ] **FactionManager** - Does player faction work correctly?
- [ ] **PathfindingManager** - Do ants navigate around buildings?
- [ ] **PowerManager** - Do power unlocks/cooldowns work?
- [ ] **ResourceManager** - Do resources get added to faction pool?

---

## 🐛 Expected Behaviors

### Ants Should:
- Spawn in circle formation around queen
- Have autonomous AI enabled by default
- Seek nearby resources (gatherers)
- Path around buildings
- Show state labels in debug mode (D key)

### Boss Should:
- Patrol rectangular path continuously
- Scan with vision cone (visible in debug mode)
- Chase weakest ant when detected
- Fire homing projectiles when in range
- Return to patrol when target lost

### Queen Should:
- Be player-controlled (WASD/arrows)
- Have all 5 powers unlocked
- Powers should work instantly (no aiming except fireball/blackhole)
- Camera should follow smoothly

### UI Should:
- Update in real-time
- Respond to mouse hovers
- Minimap should show entity positions
- Population display should be clickable

---

## 🎯 Next Steps After Testing

Once you've verified everything works:

1. **Note any bugs** - Document what doesn't work as expected
2. **Test edge cases** - Spam powers, move queen off-screen, kill all ants, etc.
3. **Performance check** - Does it run smoothly with all entities?
4. **Phase 9: Integration Tests** - Write automated tests for observed behaviors

---

## 🚀 Launch Instructions

```bash
# Build the project
npm run build

# Open index.html in browser
# (Use Live Server extension or similar)

# Press 'T' to launch showcase!
```

---

## 📝 Console Logs to Watch

The showcase logs helpful information:
- `🎮 Entering Entity Showcase Scene!` - Scene loaded
- `✅ Queen spawned at (100, 75) with all powers unlocked` - Queen created
- `✅ Spawned 15 ants (5 Gatherers, 3 Builders, 4 Warriors, 3 Scouts)` - Ants created
- `✅ Boss spawned at (150, 30) with patrol path` - Boss created
- `✅ Spawned 20 resource nodes (4 clusters)` - Resources created
- `✅ Spawned 2 buildings (Warehouse, Barracks)` - Buildings created
- `✅ All UI components initialized` - UI ready
- `⚡ Queen used power: Lightning` - Power activated
- `🌾 Resource collected: 10 food` - Resource gathered
- `💀 Entity died: ant_1234` - Entity death
- `📍 Camera moved to (640, 480)` - Minimap navigation
- `🔧 Debug mode: ON/OFF` - Debug toggle

---

## 🎨 Visual Guide

```
+------------------------------------------------------------+
|  [Resources: 🍖0 🪵0 🪨0 💎0]    [DEBUG MODE]             |
|                                                            |
|  [Population: 15/50]                    🔴 Boss (patrol)  |
|    > Click to expand                       👁️ Vision cone |
|                                                            |
|              🔵 Player Queen                               |
|          🟢🟢🟢 Ants (autonomous)                          |
|                                                            |
|     💎💎 Resources    🏠 Buildings                        |
|                                                            |
|                                                            |
|                                                            |
|                                                            |
| 👑 [⚔️][🔨][🌾][👥]  [⚡1][🔥2][🕳️3][🌊4][⭐5]           |
| Portrait  Commands       Powers Bar                   [MAP]|
+------------------------------------------------------------+
```

---

## 🎉 Enjoy Testing!

This scene showcases 8 months of development work all in one place. Have fun breaking things! 🐜👑⚡
