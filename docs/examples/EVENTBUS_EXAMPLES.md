# EventBus Usage Examples

## Basic Usage

### Subscribing to Events
```javascript
// Simple subscription
EventBus.on('player:move', (x, y) => {
    console.log(`Player moved to ${x}, ${y}`);
});

// Subscribe and get unsubscribe function
const unsubscribe = EventBus.on('game:pause', () => {
    console.log('Game paused');
});

// Later, unsubscribe
unsubscribe();
```

### One-time Events
```javascript
// Listen only once
EventBus.once('level:complete', (score) => {
    console.log(`Level completed with score: ${score}`);
});
```

### Emitting Events
```javascript
// Emit event with no data
EventBus.emit('game:start');

// Emit event with single data
EventBus.emit('score:update', 1000);

// Emit event with multiple arguments
EventBus.emit('player:move', x, y, direction);

// Emit event with object data
EventBus.emit('enemy:spawn', {
    type: 'ant',
    x: 100,
    y: 200,
    health: 50
});
```

### Unsubscribing
```javascript
function handleScore(score) {
    console.log('Score:', score);
}

EventBus.on('score:update', handleScore);

// Later, remove specific handler
EventBus.off('score:update', handleScore);

// Or clear all listeners for an event
EventBus.clear('score:update');

// Or clear ALL events
EventBus.clear();
```

## Real Game Examples

### Player Movement System
```javascript
// In your player class
class Player {
    move(x, y) {
        this.x = x;
        this.y = y;
        EventBus.emit(GameEvents.PLAYER_MOVE, this.x, this.y);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        EventBus.emit(GameEvents.PLAYER_DAMAGE, amount, this.health);
        
        if (this.health <= 0) {
            EventBus.emit(GameEvents.PLAYER_DEATH);
        }
    }
}

// In your UI class
class UI {
    constructor() {
        EventBus.on(GameEvents.PLAYER_DAMAGE, (amount, currentHealth) => {
            this.updateHealthBar(currentHealth);
            this.showDamageIndicator(amount);
        });
        
        EventBus.on(GameEvents.PLAYER_DEATH, () => {
            this.showGameOverScreen();
        });
    }
}
```

### Score System
```javascript
// Anywhere in your game
function collectCoin(value) {
    score += value;
    EventBus.emit(GameEvents.SCORE_UPDATE, score);
}

function killEnemy(enemyType) {
    const points = enemyType === 'boss' ? 500 : 100;
    score += points;
    EventBus.emit(GameEvents.SCORE_UPDATE, score);
}

// In UI
EventBus.on(GameEvents.SCORE_UPDATE, (newScore) => {
    document.getElementById('score').textContent = newScore;
});
```

### Audio System
```javascript
// Centralized audio manager
class AudioManager {
    constructor() {
        EventBus.on(GameEvents.AUDIO_PLAY, (soundName) => {
            this.playSound(soundName);
        });
        
        EventBus.on(GameEvents.PLAYER_DAMAGE, () => {
            this.playSound('hurt');
        });
        
        EventBus.on(GameEvents.ENEMY_DEATH, () => {
            this.playSound('enemyDeath');
        });
    }
    
    playSound(name) {
        // Play sound logic
    }
}

// Anywhere in game
EventBus.emit(GameEvents.AUDIO_PLAY, 'jump');
```

### Input Handling
```javascript
// In sketch.js
function keyPressed() {
    EventBus.emit(GameEvents.INPUT_KEY_PRESS, keyCode, key);
}

function mousePressed() {
    EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, mouseX, mouseY, mouseButton);
}

// In your game objects
class Player {
    constructor() {
        EventBus.on(GameEvents.INPUT_KEY_PRESS, (keyCode) => {
            if (keyCode === 32) { // SPACE
                this.jump();
            }
        });
    }
}

class MenuButton {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        EventBus.on(GameEvents.INPUT_MOUSE_CLICK, (mx, my) => {
            if (this.isHovered(mx, my)) {
                this.onClick();
            }
        });
    }
}
```

### Level System
```javascript
class LevelManager {
    startLevel(levelNumber) {
        EventBus.emit(GameEvents.LEVEL_START, levelNumber);
    }
    
    completeLevel(levelNumber, stars) {
        EventBus.emit(GameEvents.LEVEL_COMPLETE, {
            level: levelNumber,
            stars: stars,
            time: this.elapsedTime
        });
    }
}

// Other systems listen
EventBus.on(GameEvents.LEVEL_START, (level) => {
    console.log(`Starting level ${level}`);
    resetGame();
    loadLevelData(level);
});

EventBus.on(GameEvents.LEVEL_COMPLETE, (data) => {
    console.log(`Level ${data.level} completed with ${data.stars} stars`);
    saveProgress(data);
    showCompletionScreen(data);
});
```

### Particle System
```javascript
class ParticleManager {
    constructor() {
        this.particles = [];
        
        // Listen to events and create particles
        EventBus.on(GameEvents.PLAYER_DAMAGE, (amount, health) => {
            this.createBloodParticles(player.x, player.y);
        });
        
        EventBus.on(GameEvents.ENEMY_DEATH, (enemy) => {
            this.createExplosion(enemy.x, enemy.y);
        });
        
        EventBus.on(GameEvents.PLAYER_COLLECT, (item) => {
            this.createSparkles(item.x, item.y);
        });
    }
}
```

### State Management
```javascript
class GameStateManager {
    constructor() {
        this.state = 'menu';
        
        EventBus.on(GameEvents.GAME_START, () => {
            this.setState('playing');
        });
        
        EventBus.on(GameEvents.GAME_PAUSE, () => {
            this.setState('paused');
        });
        
        EventBus.on(GameEvents.GAME_OVER, () => {
            this.setState('gameOver');
        });
    }
    
    setState(newState) {
        this.state = newState;
        EventBus.emit('state:change', newState);
    }
}
```

## Benefits

1. **Decoupling**: Components don't need direct references to each other
2. **Less Code**: No need to pass callbacks through multiple layers
3. **Easy Testing**: Mock events easily for testing
4. **Debugging**: See all event flow in one place
5. **Flexibility**: Add/remove listeners without changing emitter code

## Tips

- Use the `GameEvents` constants instead of strings to avoid typos
- Clean up listeners when objects are destroyed to prevent memory leaks
- Use `once()` for one-time events like level completion
- Group related events with namespaces (e.g., `player:*`, `enemy:*`)
- Emit events with descriptive data objects for complex information
