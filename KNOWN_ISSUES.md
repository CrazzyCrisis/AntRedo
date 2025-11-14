# Known Issues

## Intermittent "Renderer is undefined" Error

**Error Message:**
```
TypeError: can't access property updateDimensions, renderer is undefined
Location: sketch.ts:windowResized
```

**Suspected Cause:**
Race condition during scene transitions. When `windowResized()` is called while a scene is being switched, the `renderer` variable may be temporarily undefined if the scene transition hasn't completed.

**Frequency:**
Intermittent - not consistently reproducible

**Impact:**
Low - error doesn't break core functionality, only prevents window resize handling during scene transitions

**Potential Solutions:**
1. Add null check in `windowResized()`:
   ```typescript
   function windowResized() {
       resizeCanvas(window.innerWidth, window.innerHeight);
       if (renderer) {
           renderer.updateDimensions(window.innerWidth, window.innerHeight);
       }
       SceneManager.getInstance().handleResize(window.innerWidth, window.innerHeight);
   }
   ```

2. Ensure `renderer` is initialized before any scene switches

3. Add proper initialization order checks in `setup()`

**Workaround:**
If error occurs, resize window again to trigger proper resize handling after scene transition completes.

**Status:**
Documented - awaiting consistent reproduction steps for investigation
