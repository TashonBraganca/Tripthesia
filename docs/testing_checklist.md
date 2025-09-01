# Phase 6 Priority 4: Testing Checklist

**Server**: http://localhost:3005  
**Testing Date**: September 1, 2025

## 🌐 CROSS-BROWSER TESTING

### Chrome/Edge Testing
- [ ] Navigate to http://localhost:3005
- [ ] Test homepage header contrast improvements
- [ ] Navigate to `/new` - trip creation form
  - [ ] Currency bento box displays correctly
  - [ ] Currency selector opens above other elements (z-index fix)
  - [ ] Auto-detection works (allow location permission)
  - [ ] Manual currency selection works
  - [ ] Currency appears in trip summary
- [ ] Navigate to `/transport` - search page  
  - [ ] Currency selector in search form
  - [ ] Location dropdowns appear above elements
  - [ ] Date picker dropdowns position correctly
  - [ ] Currency persists in search parameters
- [ ] Test button improvements:
  - [ ] Skip button contrast (navy-100 text)
  - [ ] Continue button arrow positioning

### 📱 MOBILE TESTING PLAN

**Test Devices/Sizes**:
- [ ] iPhone SE (375px width)
- [ ] iPhone 12 (390px width)  
- [ ] Samsung Galaxy (360px width)
- [ ] Tablet (768px width)

**Mobile Test Cases**:
- [ ] Currency selector touch interactions
- [ ] Geolocation permission flow on mobile
- [ ] Form responsiveness on small screens
- [ ] Button sizing and touch targets

### ♿ ACCESSIBILITY TESTING

**Keyboard Navigation**:
- [ ] Tab through currency selector
- [ ] Enter/Space to open dropdown
- [ ] Arrow keys to navigate currencies
- [ ] Escape to close dropdown

**Screen Reader Testing** (if available):
- [ ] Currency selector announcements
- [ ] Location info descriptions
- [ ] Loading state announcements
- [ ] Error message accessibility

### ⚡ PERFORMANCE TESTING

**Geolocation Performance**:
- [ ] GPS detection speed (< 10 seconds)
- [ ] IP fallback speed (< 3 seconds)
- [ ] Browser locale fallback (instant)
- [ ] Error handling response time

**Page Load Testing**:
- [ ] `/new` page load time
- [ ] `/transport` page load time
- [ ] Bundle size impact measurement
- [ ] Memory usage monitoring

## 🧪 FUNCTIONALITY TESTING SCENARIOS

### Scenario 1: Happy Path
1. [ ] Visit `/new` with location permission allowed
2. [ ] Verify currency auto-detects based on location
3. [ ] Complete trip creation form with detected currency
4. [ ] Navigate to `/transport` 
5. [ ] Verify currency persists from previous selection
6. [ ] Complete search with currency parameter

### Scenario 2: Permission Denied
1. [ ] Visit `/new` and deny location permission
2. [ ] Verify fallback to IP geolocation
3. [ ] If IP fails, verify browser locale fallback
4. [ ] Verify manual currency selection works
5. [ ] Test preference persistence across pages

### Scenario 3: Offline/API Failures
1. [ ] Block network requests to geolocation APIs
2. [ ] Verify graceful fallback to browser locale
3. [ ] Test manual currency selection still works
4. [ ] Verify no app crashes or loading states stuck

### Scenario 4: Mobile Experience
1. [ ] Test on mobile device/responsive mode
2. [ ] Verify currency selector opens properly
3. [ ] Test location permission flow on mobile
4. [ ] Check touch interactions and scroll behavior

## ✅ SUCCESS CRITERIA

### Critical Requirements
- [ ] **Zero crashes** - App remains functional in all scenarios
- [ ] **Dropdown positioning** - All dropdowns appear above other elements
- [ ] **Mobile usability** - Currency selector works on touch devices
- [ ] **Accessibility compliance** - Basic keyboard navigation works
- [ ] **Performance** - No significant page load regression

### Quality Requirements  
- [ ] **Auto-detection accuracy** - Currency matches user location when possible
- [ ] **Smooth animations** - No janky or broken transitions
- [ ] **Error handling** - Clear feedback for failures
- [ ] **Preference persistence** - Settings survive page refresh

## 🚀 TESTING COMMANDS

```bash
# Start dev server
npm run dev

# Production build test
npm run build

# Type checking
npm run typecheck

# Lint check
npm run lint
```

## 📊 ISSUE TRACKING

### Critical Issues Found
```
None yet - testing in progress
```

### Minor Issues Found  
```
None yet - testing in progress
```

### Performance Metrics
```
Before: TBD
After: TBD
Impact: TBD
```

---

**Status**: 🧪 **TESTING IN PROGRESS**  
**Next**: Begin systematic browser testing starting with Chrome/Edge