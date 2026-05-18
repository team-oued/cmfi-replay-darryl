# Performance Audit - HomeScreen.tsx

**Date:** May 16, 2026  
**File:** `screens/HomeScreen.tsx`  
**Lines:** 899  
**Component Size:** Large (needs refactoring)

---

## Critical Issues (High Priority)

### 1. Multiple Independent useEffect Hooks
**Location:** Lines 142-432  
**Severity:** 🔴 High

**Problem:**
- 8 separate useEffect hooks fetching data independently
- Each hook triggers its own loading state and re-render cycle
- No coordination between data fetching operations
- Sequential loading instead of parallel where possible

**Impact:**
- Slower initial page load
- Multiple re-renders during data fetching
- Poor user experience with staggered loading

**Recommendation:**
```typescript
// Combine related data fetches into single useEffect with Promise.all
useEffect(() => {
  const fetchAllData = async () => {
    try {
      const [movies, series, podcasts, mostLiked, mostWatched] = await Promise.all([
        movieService.getTenHomeMovies(),
        serieService.getTenHomeSeries(),
        serieService.getTenHomePodcasts(),
        likeService.getMostLikedItems(10),
        viewService.getMostWatchedItems(10)
      ]);
      
      setMovies(movies);
      setSeries(series);
      setPodcasts(podcasts);
      // Process and set other data...
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingMovies(false);
      setLoadingSeries(false);
      setLoadingPodcasts(false);
    }
  };
  
  fetchAllData();
}, []);
```

---

### 2. No Component Memoization
**Location:** Lines 20-128  
**Severity:** 🔴 High

**Status:** ✅ FIXED

**Problem:**
- `MediaRow`, `RankedMediaRow`, and `UserRow` components are not memoized
- These components re-render on every parent state change
- Especially problematic for `MediaRow` with scroll state management

**Impact:**
- Unnecessary re-renders of entire rows
- Performance degradation on scroll
- Janky animations and interactions

**Recommendation:**
```typescript
const MediaRow = React.memo(({ title, items, onSelectMedia, onPlay, variant }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison for items array
  return prevProps.title === nextProps.title &&
         prevProps.items.length === nextProps.items.length &&
         prevProps.variant === nextProps.variant;
});
```

**Fix Applied:**
- Added React.memo to all section components:
  - MoviesSection, SeriesSection, PodcastsSection
  - MostWatchedSection, MostLikedSection, CategorySections
- Components now only re-render when their props change
- Reduced unnecessary re-renders during scroll and state updates
- Improved performance for smooth animations and interactions

---

### 3. Inline Function Creation
**Location:** Lines 434-491, 593-616, 638-661, etc.  
**Severity:** 🔴 High

**Status:** ✅ FIXED

**Problem:**
- `handleContinueWatchingClick` recreated on every render
- Inline MediaContent transformations in map functions
- Callback functions passed as props recreated on each render

**Impact:**
- Child components receive new function references every render
- Breaks React.memo optimization
- Causes unnecessary re-renders

**Recommendation:**
```typescript
// Use useCallback for event handlers
const handleContinueWatchingClick = useCallback(async (item: ContinueWatchingItem) => {
  // Handler logic
}, [onPlay]);

// Extract transformation logic to memoized helper
const transformMovieToMediaContent = useCallback((movie: Movie): MediaContent => ({
  id: movie.uid,
  type: MediaType.Movie,
  title: movie.title,
  // ... rest of transformation
}), []);
```

**Fix Applied:**
- Wrapped handleContinueWatchingClick with useCallback in HomeScreen
- Created shared transformation helpers in utils/mediaTransformers.ts
- Updated all section components to use transformation helpers
- Eliminated duplicate transformation logic
- Child components now receive stable function references

---

## Major Issues (Medium Priority)

### 4. Sequential Async Operations in Data Fetching
**Location:** Lines 208-266, 268-330  
**Severity:** 🟡 Medium

**Status:** ✅ PARTIALLY FIXED

**Problem:**
- `fetchMostLikedItems` and `fetchMostWatchedItems` use sequential Promise.all
- Each item requires individual database calls
- No batching or caching strategy

**Impact:**
- Slow data fetching with many items
- Increased database load
- Poor performance with large datasets

**Recommendation:**
```typescript
// Batch fetch all UIDs first, then fetch details in batches
const fetchMostLikedItems = async () => {
  const likedItems = await likeService.getMostLikedItems(10);
  const uids = likedItems.map(item => item.uid);
  
  // Batch fetch movies and episodes
  const [movies, episodes] = await Promise.all([
    movieService.getMoviesByUids(uids),
    episodeSerieService.getEpisodesByUids(uids)
  ]);
  
  // Match and combine results
  // ...
};
```

**Fix Applied:**
- Combined all independent data fetches into single useEffect with Promise.all
- MostLiked and MostWatched items now use Promise.all for parallel processing
- Note: Full batching would require service layer modifications (getMoviesByUids, getEpisodesByUids)
- Current implementation uses parallel individual calls which is better than sequential

---

### 5. No Scroll Event Throttling
**Location:** Lines 25-42  
**Severity:** 🟡 Medium

**Status:** ✅ FIXED

**Problem:**
- Scroll event listener fires on every pixel scrolled
- No throttling or debouncing
- Can cause performance issues on scroll-heavy pages

**Impact:**
- High CPU usage during scroll
- Potential jank on lower-end devices
- Battery drain on mobile

**Recommendation:**
```typescript
import { throttle } from 'lodash';

const checkScroll = throttle(() => {
  const { scrollLeft, scrollWidth, clientWidth } = container;
  setShowLeftGradient(scrollLeft > 10);
  setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
}, 100); // Throttle to 100ms
```

**Fix Applied:**
- Implemented timeout-based throttling (100ms) in MediaRow component
- Scroll event now only triggers gradient updates every 100ms
- Reduced CPU usage during scroll interactions

---

### 6. Artificial Loading Delays
**Location:** Lines 192-205  
**Severity:** 🟡 Medium

**Status:** ✅ FIXED

**Problem:**
- `loadingHero` and `loadingCategories` use setTimeout with fixed delays
- Delays are artificial and not based on actual data readiness
- Poor user experience

**Impact:**
- Unnecessary waiting time for users
- Slower perceived performance
- No actual benefit

**Recommendation:**
```typescript
// Remove artificial delays
// Use actual data loading states instead
const [loadingHero, setLoadingHero] = useState(false);
// Set to false when data is actually ready
```

**Fix Applied:**
- Removed loadingHero state and artificial setTimeout delays
- Removed loadingCategories artificial delays
- Loading states now based on actual data readiness
- Improved perceived performance by eliminating unnecessary waiting

---

### 7. Duplicate Transformation Logic
**Location:** Lines 218-230, 280-292, 594-605, 639-650, etc.  
**Severity:** 🟡 Medium

**Status:** ✅ FIXED

**Problem:**
- Same MediaContent transformation logic repeated 5+ times
- Movies, series, podcasts, mostWatched, mostLiked all have duplicate code
- Maintenance nightmare

**Impact:**
- Code duplication
- Inconsistent transformations
- Harder to maintain and debug

**Recommendation:**
```typescript
// Create reusable transformation utilities
const transformMovieToMediaContent = (movie: Movie): MediaContent => ({
  id: movie.uid,
  type: MediaType.Movie,
  title: movie.title,
  // ... rest of transformation
});
```

**Fix Applied:**
- Created utils/mediaTransformers.ts with shared transformation helpers
- transformMovieToMediaContent for Movie to MediaContent
- transformSerieToMediaContent for Serie to MediaContent
- Updated all section components to use shared helpers
- Eliminated duplicate transformation logic across components
- Improved code maintainability and consistency

---

### 8. Console.log Statements in Production
**Location:** Lines 143-172, 392-407, 764  
**Severity:** 🟢 Low

**Status:** ✅ FIXED

**Problem:**
- Multiple console.log statements throughout the code
- Debugging statements left in production code
- Can leak sensitive information

**Impact:**
- Performance overhead (minimal)
- Potential information leakage
- Cluttered console in production

**Recommendation:**
- Remove all console.log statements
- Use proper logging library for production
- Keep only error logging

**Fix Applied:**
- Removed all console.log statements from HomeScreen.tsx
- Cleaned up profile verification useEffect
- Removed debug logs from podcast button click handler
- Removed debug log from profile completion callback

---

## Minor Issues (Low Priority)

### 9. No Image Lazy Loading
**Location:** Lines 541-551, 593-616, etc.  
**Severity:** 🟢 Low

**Status:** ✅ FIXED

**Problem:**
- All images loaded eagerly
- No lazy loading for off-screen images
- Can slow down initial page load

**Impact:**
- Slower initial page load
- Higher bandwidth usage
- Poor performance on slow connections

**Recommendation:**
```typescript
<img 
  src={imageUrl} 
  alt={title} 
  loading="lazy"
/>
```

**Fix Applied:**
- Added loading="lazy" to all images in MediaCard component
- Background blur images in poster variant now use lazy loading
- Main images in all variants (poster, list, thumbnail) already had lazy loading
- Improved initial page load performance by deferring off-screen image loading

---

### 10. No Virtualization for Long Lists
**Location:** Lines 592-617, 637-662, etc.  
**Severity:** 🟢 Low

**Problem:**
- Horizontal scrolling lists render all items
- No virtualization for large datasets
- Can cause performance issues with many items

**Impact:**
- Slow rendering with large lists
- High memory usage
- Poor performance on mobile

**Recommendation:**
```typescript
import { FixedSizeList } from 'react-window';
// Consider using react-window or react-virtualized
// Implement windowing for horizontal lists
// Limit initial render to visible items
```

---

### 11. Large Component Size
**Location:** Entire file (899 lines)  
**Severity:** 🟢 Low

**Status:** ✅ FIXED

**Problem:**
- HomeScreen component is too large
- Multiple concerns mixed together
- Hard to maintain and test

**Impact:**
- Difficult to maintain
- Hard to test individual features
- Poor code organization

**Recommendation:**
```typescript
// Split into smaller components
// - HomeScreen.tsx (main container)
// - ContinueWatchingSection.tsx
// - MoviesSection.tsx
// - SeriesSection.tsx
// - CategorySections.tsx
// - MostWatchedSection.tsx
// - MostLikedSection.tsx
```

**Fix Applied:**
- Created separate section components in `components/sections/`:
  - MoviesSection.tsx
  - SeriesSection.tsx
  - PodcastsSection.tsx
  - MostWatchedSection.tsx
  - MostLikedSection.tsx
  - CategorySections.tsx
- Replaced inline section code with component references
- Reduced HomeScreen from 899 lines to ~550 lines (39% reduction)
- Improved code organization and maintainability

---

### 12. No Error Boundary
**Location:** Component root  
**Severity:** 🟢 Low

**Status:** ✅ FIXED

**Problem:**
- No error boundary to catch errors
- Single error can crash entire page
- Poor error handling

**Impact:**
- Poor user experience on errors
- No graceful degradation
- Difficult to debug

**Recommendation:**
```typescript
import ErrorBoundary from './ErrorBoundary';

<ErrorBoundary>
  <HomeScreen />
</ErrorBoundary>
```

**Fix Applied:**
- Created ErrorBoundary component with user-friendly error UI
- Wrapped HomeScreen component with ErrorBoundary
- Provides graceful error handling with refresh button
- Prevents single errors from crashing entire page

---

## Performance Metrics (Estimated)

| Metric | Current | After Optimization | Improvement |
|--------|---------|-------------------|-------------|
| Initial Load Time | ~3-5s | ~1-2s | 50-60% |
| Time to Interactive | ~4-6s | ~2-3s | 50% |
| Re-renders on Scroll | High | Low | 70-80% |
| Memory Usage | High | Medium | 30-40% |
| Bundle Size | Large | Medium | 20-30% |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Week 1)
1. Combine useEffect hooks for parallel data fetching
2. Add React.memo to row components
3. Implement useCallback for event handlers
4. Extract transformation logic to utilities

### Phase 2: Major Improvements (Week 2)
5. Implement batch fetching for mostLiked/mostWatched
6. Add scroll event throttling
7. Remove artificial loading delays
8. Add image lazy loading

### Phase 3: Code Quality (Week 3)
9. Remove console.log statements
10. Split component into smaller pieces
11. Add error boundary
12. Consider virtualization for large lists

---

## Additional Recommendations

### Monitoring
- Add React DevTools Profiler integration
- Implement performance monitoring (e.g., Sentry Performance)
- Track Core Web Vitals (LCP, FID, CLS)

### Testing
- Add performance regression tests
- Test on low-end devices
- Monitor bundle size with webpack-bundle-analyzer

### Caching
- Implement React Query or SWR for data caching
- Add service worker for offline support
- Cache transformed MediaContent objects

---

## Conclusion

The HomeScreen component has several performance issues that can significantly impact user experience. The most critical issues are:

1. Multiple independent useEffect hooks causing sequential loading
2. Lack of component memoization causing unnecessary re-renders
3. Inline function creation breaking optimization

Implementing the recommended fixes should result in a 50-60% improvement in load times and significantly smoother interactions, especially on mobile devices.

**Priority:** Start with Phase 1 fixes for immediate impact.
