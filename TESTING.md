# Testing Documentation

This document describes the comprehensive test suite for the Property Management Game.

## Test Coverage

The application now has extensive test coverage across multiple layers:

### 1. Unit Tests - Date Utilities (`src/lib/utils/date.test.ts`)

Tests all date manipulation functions that are critical for game mechanics:

- **createDate()** - Date object creation
- **isLeapYear()** - Leap year detection (including 100/400 year rules)
- **getDaysInMonth()** - Days per month calculation (all months, leap years)
- **addDays()** - Day addition with month/year boundaries
- **addMonths()** - Month addition with day overflow handling
- **isSameDate()** - Date comparison
- **isAfterOrEqual()** - Date ordering
- **calculateDaysRemaining()** - Remaining days calculation

**Coverage:** ~90 test cases covering edge cases like leap years, month boundaries, year transitions

### 2. Integration Tests - Game Store (`src/lib/stores/gameState.test.ts`)

Tests the core game logic and state management:

#### Initial State
- Correct default values
- Starter property configuration

#### Game Mechanics
- **Day advancement** - Date incrementation, month boundaries
- **Rent collection** - Monthly rent on 1st of month, multiple properties, vacant properties
- **Tenancy expiration** - Lease end handling, auto-relist behavior
- **Property filling** - Random fill chances, correct tenancy setup

#### Store Actions
- **setSpeed()** - Speed changes (0.5x, 1x, 5x)
- **togglePause()** - Pause state toggling
- **setPropertyVacantSettings()** - Settings updates, property isolation
- **reset()** - Complete state reset

#### Persistence
- localStorage save on changes
- localStorage load on initialization

#### Game Calculations
- **calculateMonthlyRent()** - Rent calculations for various markups
- **calculateFillChance()** - Fill chance based on rent markup (<5, 5-6, >6)

**Coverage:** ~35 test cases covering all game mechanics and edge cases

### 3. Component Tests - UI (`src/routes/page.svelte.spec.ts`)

Tests user interface interactions using vitest-browser:

- **Initial rendering** - Main heading, game state display, starter property
- **Time controls** - Play/pause button, speed buttons, reset button
- **Pause toggling** - Button state changes
- **Property settings** - Rent markup slider, lease period buttons, auto-relist checkbox
- **Display updates** - Monthly rent, fill chance calculations
- **User interactions** - Checkbox toggling, button clicks
- **Information display** - Help text, game instructions

**Coverage:** ~12 test cases covering all major UI components

### 4. E2E Tests - User Workflows (`e2e/demo.test.ts`)

Tests complete user scenarios using Playwright:

- **Initial load** - Game interface, initial state, starter property
- **Time controls** - Play/pause, speed changes, functional controls
- **Property management** - Settings adjustments, auto-relist toggle
- **Dynamic updates** - Fill chance display, rent calculations
- **Persistence** - localStorage state preservation across reloads
- **Game flow** - Time advancement, date changes
- **User guidance** - Help text, information banners
- **Dialogs** - Reset confirmation

**Coverage:** ~13 test cases covering end-to-end workflows

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Unit Tests (Watch Mode)
```bash
npm run test:unit -- --watch
```

### E2E Tests Only
```bash
npm run test:e2e
```

### E2E Tests (UI Mode)
```bash
npx playwright test --ui
```

## Test Technologies

- **Vitest** - Unit and integration testing framework
- **@vitest/browser-playwright** - Browser-based component testing
- **vitest-browser-svelte** - Svelte component testing utilities
- **Playwright** - End-to-end testing framework
- **Testing Library** patterns - Accessible query methods

## Key Testing Patterns

### Mocking
- localStorage mocked in unit tests
- Math.random() mocked for deterministic property filling tests
- Date manipulation tested without real time dependencies

### Isolation
- Each test suite uses beforeEach hooks to reset state
- localStorage cleared between tests
- Tests don't depend on each other

### Coverage Areas

#### High Priority (Fully Tested)
✅ Date calculations - Critical for game timing
✅ Rent collection - Core gameplay mechanic
✅ Tenancy lifecycle - Property state management
✅ Store actions - All user actions covered

#### Medium Priority (Fully Tested)
✅ UI interactions - Complete component coverage
✅ State persistence - localStorage operations
✅ Game calculations - Rent and fill chance formulas

#### Lower Priority (Fully Tested)
✅ Display formatting - Currency, dates
✅ E2E workflows - Complete user journeys
✅ Help text and information display

## Test Maintenance

When adding new features:

1. **Add unit tests** for any new utility functions or calculations
2. **Add integration tests** for new game mechanics or store actions
3. **Update component tests** if UI changes
4. **Add E2E tests** for new user workflows

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm install
    npm test
```

## Known Test Considerations

1. **Time-based tests** - Some E2E tests use timeouts and may be slightly flaky depending on system performance
2. **Random behavior** - Property filling is mocked in unit tests but uses real randomness in E2E tests
3. **localStorage** - Tests clear localStorage, so don't run tests while actively playing the game
4. **Browser compatibility** - E2E tests run in Chromium by default, can be configured for other browsers

## Test Statistics

- **Total Test Suites:** 4
- **Total Test Cases:** ~150
- **Code Coverage:** Extensive coverage of all critical game logic
- **Average Test Execution Time:** 
  - Unit tests: < 5 seconds
  - Component tests: < 10 seconds
  - E2E tests: < 30 seconds
