# Test Organization

This directory contains all test files organized by test type following industry best practices.

## Directory Structure

```
test/
├── unit/               # Unit tests - isolated component testing
├── integration/        # Integration tests - multi-component workflows
├── e2e/               # End-to-end tests (currently empty - browser-based tests)
├── helpers/           # Shared test utilities and mocks
└── tsconfig.json      # TypeScript configuration for tests
```

## Test Categories

### Unit Tests (`test/unit/`)
**Purpose:** Test individual components in isolation
**Count:** 229 tests
**Files:**
- `camera.test.ts` - Camera positioning, transforms, bounds checking
- `eventBus.test.ts` - Event pub/sub system
- `helpers.test.ts` - Utility functions (math, collision, grid, vectors, etc.)
- `menuScene.test.ts` - MenuScene component behavior
- `renderer.test.ts` - Renderer registration, depth sorting, dirty flags
- `rendering.test.ts` - RenderLayer enum, FramebufferManager, Renderable interface
- `sceneManager.test.ts` - SceneManager lifecycle and event forwarding
- `uiComponents.test.ts` - AnimatedSpriteComponent, ButtonComponent, UIContainer

**Characteristics:**
- Fast execution (< 500ms total)
- No external dependencies
- Mock all dependencies (p5.js graphics objects)
- Test single responsibility per test case

### Integration Tests (`test/integration/`)
**Purpose:** Test interactions between multiple components
**Count:** 17 tests (20 tests total across 3 files)
**Files:**
- `factory.test.ts` - PlayerFactory integration with Renderer + EventBus
- `renderingSystem.test.ts` - Full rendering pipeline (Renderer + Camera + Components)
- `sceneSystem.test.ts` - **NEW** Complete scene system (SceneManager + MenuScene + UI Components + EventBus)

**Characteristics:**
- Test complete workflows (create → enter → update → interact → exit)
- Validate EventBus communication between systems
- Test Factory pattern abstraction
- Verify proper cleanup and memory management
- Test real-world usage patterns (game menu workflow, pause menu, etc.)

**New Scene System Integration Tests:**
1. End-to-End Scene Lifecycle
2. SceneManager + Renderer Integration
3. MenuScene + UI Components Integration
4. EventBus + Scene System Integration
5. Error Handling and Edge Cases
6. Performance and Optimization
7. Real-World Usage Patterns

### End-to-End Tests (`test/e2e/`)
**Purpose:** Test complete application in browser environment
**Count:** 0 (placeholder for future browser-based tests)

**Future Use Cases:**
- Full game loop testing in actual browser
- p5.js canvas rendering verification
- User interaction testing (mouse/keyboard)
- Performance profiling in real environment

## Test Helpers (`test/helpers/`)

### `renderingMocks.ts`
Provides mock implementations of p5.js objects for unit/integration testing:
- `createMockP5()` - Mock p5.js instance with createGraphics, loadImage, etc.
- `createMockGraphics()` - Mock p5.Graphics object with drawing methods
- `MockRenderable` - Simple test renderable for renderer testing

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (TDD - runs on file changes)
npm run test:watch

# Run specific test file
npx mocha test/unit/eventBus.test.ts
npx mocha test/integration/sceneSystem.test.ts
```

## Test Statistics

- **Total Tests:** 246
- **Unit Tests:** 229 (93%)
- **Integration Tests:** 17 (7%)
- **Execution Time:** ~500ms
- **Pass Rate:** 100%

## Test-Driven Development (TDD)

All tests were written **before implementation** following strict TDD workflow:

1. **Red:** Write failing test
2. **Green:** Write minimal code to pass
3. **Refactor:** Improve code while keeping tests passing

This ensures:
- All code has test coverage
- Tests validate actual requirements
- Regression detection on changes
- Documentation through test examples

## Adding New Tests

### Unit Test Template
```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { YourComponent } from '../../src/path/to/component';

describe('YourComponent', () => {
    beforeEach(() => {
        // Reset state
    });

    describe('methodName()', () => {
        it('should do specific behavior', () => {
            // Arrange
            const component = new YourComponent();
            
            // Act
            const result = component.methodName();
            
            // Assert
            expect(result).to.equal(expected);
        });
    });
});
```

### Integration Test Template
```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { ComponentA } from '../../src/componentA';
import { ComponentB } from '../../src/componentB';
import { EventBus } from '../../src/utils/eventBus';

describe('ComponentA + ComponentB Integration', () => {
    beforeEach(() => {
        EventBus.clear();
    });

    it('should complete full workflow', () => {
        // Test multi-step process across components
        const a = new ComponentA();
        const b = new ComponentB();
        
        // Verify components work together
        a.doSomething();
        expect(b.state).to.equal(expectedState);
    });
});
```

## Best Practices

1. **Test Organization:**
   - Unit tests in `test/unit/`
   - Integration tests in `test/integration/`
   - Use `beforeEach()` for setup
   - Use `afterEach()` for cleanup

2. **Naming Conventions:**
   - Files: `componentName.test.ts`
   - Describe blocks: Component/feature name
   - It blocks: "should do X when Y"

3. **Test Independence:**
   - Each test should run in isolation
   - Clear EventBus between tests
   - Reset singletons in beforeEach
   - No shared mutable state

4. **Import Paths:**
   - Unit tests: `../../src/...`
   - Integration tests: `../../src/...`
   - Helpers: `../helpers/...`

5. **Coverage:**
   - Test happy paths
   - Test edge cases
   - Test error conditions
   - Test cleanup/memory management

## Recent Changes

### Scene System Integration Tests (NEW)
Added comprehensive integration test suite for scene system:
- **File:** `test/integration/sceneSystem.test.ts`
- **Tests:** 17 new integration tests
- **Coverage:** SceneManager + MenuScene + UI Components + EventBus + Renderer
- **Patterns Tested:** Full lifecycle, event communication, cleanup, performance, real-world workflows

### Test Reorganization (COMPLETED)
- Moved all tests from flat `test/` structure into categorized folders
- Updated import paths (unit: `../../src/`, integration: `../../src/`, helpers: `../helpers/`)
- Created `test/e2e/` placeholder for future browser tests
- All 246 tests passing after reorganization
