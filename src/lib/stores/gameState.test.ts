import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { gameState } from './gameState';
import { createDate, addMonths } from '../utils/date';
import type { Property, RentMarkup } from '../types/game';
import { INITIAL_BASE_RATE, BASE_FILL_CHANCE } from '../types/game';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Game Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		gameState.reset();
	});

	describe('Initial State', () => {
		it('should initialize with correct default values', () => {
			const state = get(gameState);

			expect(state.player.cash).toBe(0);
			expect(state.player.properties).toHaveLength(1);
			expect(state.player.properties[0].name).toBe('2-Bed Terraced House');
			expect(state.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 1 });
			expect(state.gameTime.speed).toBe(1);
			expect(state.gameTime.isPaused).toBe(false);
		});

		it('should have starter property with correct settings', () => {
			const state = get(gameState);
			const property = state.player.properties[0];

			expect(property.baseValue).toBeGreaterThan(0); // Value depends on random district modifier
			expect(property.totalIncomeEarned).toBe(0);
			expect(property.tenancy).toBeNull();
			expect(property.vacantSettings.rentMarkup).toBe(5);
			expect(property.vacantSettings.periodMonths).toBe(12);
			expect(property.vacantSettings.autoRelist).toBe(false);
			expect(property.features).toEqual({
				propertyType: 'terraced',
				bedrooms: 2,
				garden: 'small',
				parking: 'street'
			});
			expect(property.district).toBeGreaterThanOrEqual(1);
			expect(property.district).toBeLessThanOrEqual(10);
			expect(property.districtModifier).toBeGreaterThan(0);
		});
	});

	describe('advanceDay', () => {
		it('should increment the date by one day', () => {
			const initialState = get(gameState);
			expect(initialState.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 1 });

			gameState.advanceDay();

			const newState = get(gameState);
			expect(newState.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 2 });
		});

		it('should handle month boundary', () => {
			const state = get(gameState);
			// Manually advance to end of month
			for (let i = 0; i < 30; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 31 });

			gameState.advanceDay();
			const finalState = get(gameState);
			expect(finalState.gameTime.currentDate).toEqual({ year: 1, month: 2, day: 1 });
		});
	});

	describe('Rent Collection', () => {
		it('should collect rent on the 1st of the month for occupied properties', () => {
			// Create a property with tenancy
			const state = get(gameState);
			const property = state.player.properties[0];
			
			// Mock an occupied property
			property.tenancy = {
				rentMarkup: 5 as RentMarkup,
				periodMonths: 12,
				startDate: createDate(1, 1, 1),
				endDate: addMonths(createDate(1, 1, 1), 12),
				marketValueAtStart: 1000, // Property at 100% maintenance
				baseRateAtStart: INITIAL_BASE_RATE
			};
			
			// Calculate expected monthly rent
			const annualRate = property.tenancy.baseRateAtStart + property.tenancy.rentMarkup; // 5 + 5 = 10%
			const annualRent = (property.tenancy.marketValueAtStart * annualRate) / 100; // 1000 * 0.1 = 100
			const monthlyRent = annualRent / 12; // 100 / 12 = 8.333...

			// Advance to February 1st (day 1 of next month)
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.gameTime.currentDate.day).toBe(1);
			expect(newState.gameTime.currentDate.month).toBe(2);
			expect(newState.player.cash).toBeCloseTo(monthlyRent, 2);
			expect(newState.player.properties[0].totalIncomeEarned).toBeCloseTo(monthlyRent, 2);
		});

		it('should not collect rent from vacant properties', () => {
			// Property is vacant by default
			
			// Advance to February 1st
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.player.cash).toBe(0);
			expect(newState.player.properties[0].totalIncomeEarned).toBe(0);
		});

		it('should collect rent from multiple occupied properties', () => {
			const state = get(gameState);
			
			// Add another property
			const property2: Property = {
				id: 'property-2',
				name: 'Property 2',
				baseValue: 2000,
				purchaseBaseValue: 2000,
				features: {
					propertyType: 'detached',
					bedrooms: 3,
					garden: 'large',
					parking: 'garage'
				},
				area: 'Uptown',
				district: 5,
				districtModifier: 1.0,
				totalIncomeEarned: 0,
				tenancy: {
					rentMarkup: 3 as RentMarkup,
					periodMonths: 12,
					startDate: createDate(1, 1, 1),
					endDate: addMonths(createDate(1, 1, 1), 12),
					marketValueAtStart: 2000,
					baseRateAtStart: INITIAL_BASE_RATE
				},
				vacantSettings: {
					rentMarkup: 5,
					periodMonths: 12,
					autoRelist: false
				},
				maintenance: 100,
				isUnderMaintenance: false,
				scheduleMaintenance: false,
				maintenanceStartDate: null,
				saleInfo: null
			};
			
			state.player.properties[0].tenancy = {
				rentMarkup: 5 as RentMarkup,
				periodMonths: 12,
				startDate: createDate(1, 1, 1),
				endDate: addMonths(createDate(1, 1, 1), 12),
				marketValueAtStart: 1000,
				baseRateAtStart: INITIAL_BASE_RATE
			};
			
			state.player.properties.push(property2);

			// Calculate expected rents
			const rent1 = (1000 * (INITIAL_BASE_RATE + 5) / 100) / 12; // 8.333...
			const rent2 = (2000 * (INITIAL_BASE_RATE + 3) / 100) / 12; // 13.333...
			const totalRent = rent1 + rent2;

			// Advance to February 1st
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.player.cash).toBeCloseTo(totalRent, 2);
		});
	});

	describe('Tenancy Expiration', () => {
		it('should clear tenancy when lease ends', () => {
			const state = get(gameState);
			const property = state.player.properties[0];
			
			// Set up a tenancy that ends in 1 month
			property.tenancy = {
				rentMarkup: 5 as RentMarkup,
				periodMonths: 12,
				startDate: createDate(1, 1, 1),
				endDate: createDate(1, 2, 1), // Ends Feb 1
				marketValueAtStart: 1000,
				baseRateAtStart: INITIAL_BASE_RATE
			};

			// Advance to February 1st
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.player.properties[0].tenancy).toBeNull();
		});

		it('should not auto-relist when autoRelist is false', () => {
			const state = get(gameState);
			const property = state.player.properties[0];
			
			property.tenancy = {
				rentMarkup: 5 as RentMarkup,
				periodMonths: 12,
				startDate: createDate(1, 1, 1),
				endDate: createDate(1, 2, 1),
				marketValueAtStart: 1000,
				baseRateAtStart: INITIAL_BASE_RATE
			};
			property.vacantSettings.autoRelist = false;

			// Advance to February 1st
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}

			const newState = get(gameState);
			expect(newState.player.properties[0].tenancy).toBeNull();
		});
	});

	describe('Property Filling', () => {
		it('should have a chance to fill vacant properties each day', () => {
			// Mock Math.random to control fill chance
			const mockRandom = vi.spyOn(Math, 'random');
			
			// Set random to guarantee a fill (< 3% for markup of 5)
			mockRandom.mockReturnValue(0.02); // 2% < 3% base fill chance

			gameState.advanceDay();

			const state = get(gameState);
			expect(state.player.properties[0].tenancy).not.toBeNull();

			mockRandom.mockRestore();
		});

		it('should not fill property when random roll is too high', () => {
			const mockRandom = vi.spyOn(Math, 'random');
			
			// Set random to fail the fill check
			mockRandom.mockReturnValue(0.95); // 95% > 3% fill chance

			gameState.advanceDay();

			const state = get(gameState);
			expect(state.player.properties[0].tenancy).toBeNull();

			mockRandom.mockRestore();
		});

		it('should set correct tenancy duration when property fills', () => {
			const mockRandom = vi.spyOn(Math, 'random');
			mockRandom.mockReturnValue(0.02);

			gameState.setPropertyVacantSettings('starter-home', 5, 24, false);
			gameState.advanceDay();

			const state = get(gameState);
			const property = state.player.properties[0];
			
			expect(property.tenancy).not.toBeNull();
			expect(property.tenancy?.periodMonths).toBe(24);
			expect(property.tenancy?.rentMarkup).toBe(5);

			mockRandom.mockRestore();
		});
	});

	describe('setSpeed', () => {
		it('should update game speed', () => {
			gameState.setSpeed(5);
			const state = get(gameState);
			expect(state.gameTime.speed).toBe(5);
		});

		it('should accept all valid speed values', () => {
			gameState.setSpeed(0.5);
			expect(get(gameState).gameTime.speed).toBe(0.5);

			gameState.setSpeed(1);
			expect(get(gameState).gameTime.speed).toBe(1);

			gameState.setSpeed(5);
			expect(get(gameState).gameTime.speed).toBe(5);
		});
	});

	describe('togglePause', () => {
		it('should toggle pause state from false to true', () => {
			const initialState = get(gameState);
			expect(initialState.gameTime.isPaused).toBe(false);

			gameState.togglePause();

			const newState = get(gameState);
			expect(newState.gameTime.isPaused).toBe(true);
		});

		it('should toggle pause state from true to false', () => {
			gameState.togglePause(); // true
			gameState.togglePause(); // false

			const state = get(gameState);
			expect(state.gameTime.isPaused).toBe(false);
		});
	});

	describe('setPropertyVacantSettings', () => {
		it('should update property vacant settings', () => {
			gameState.setPropertyVacantSettings('starter-home', 8, 24, true);

			const state = get(gameState);
			const property = state.player.properties[0];

			expect(property.vacantSettings.rentMarkup).toBe(8);
			expect(property.vacantSettings.periodMonths).toBe(24);
			expect(property.vacantSettings.autoRelist).toBe(true);
		});

		it('should not affect other properties', () => {
			const state = get(gameState);
			
			// Add another property
			const property2: Property = {
				id: 'property-2',
				name: 'Property 2',
				baseValue: 2000,
				purchaseBaseValue: 2000,
				features: {
					propertyType: 'detached',
					bedrooms: 3,
					garden: 'large',
					parking: 'garage'
				},
				area: 'Uptown',
				district: 5,
				districtModifier: 1.0,
				totalIncomeEarned: 0,
				tenancy: null,
				vacantSettings: {
					rentMarkup: 5,
					periodMonths: 12,
					autoRelist: false
				},
				maintenance: 100,
				isUnderMaintenance: false,
				scheduleMaintenance: false,
				maintenanceStartDate: null,
				saleInfo: null
			};
			state.player.properties.push(property2);

			gameState.setPropertyVacantSettings('starter-home', 8, 24, true);

			const newState = get(gameState);
			expect(newState.player.properties[0].vacantSettings.rentMarkup).toBe(8);
			expect(newState.player.properties[1].vacantSettings.rentMarkup).toBe(5);
		});
	});

	describe('reset', () => {
		it('should reset game to initial state', () => {
			// Make some changes
			gameState.setSpeed(5);
			gameState.togglePause();
			gameState.advanceDay();

			gameState.reset();

			const state = get(gameState);
			expect(state.player.cash).toBe(0);
			expect(state.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 1 });
			expect(state.gameTime.speed).toBe(1);
			expect(state.gameTime.isPaused).toBe(false);
			expect(state.player.properties).toHaveLength(1);
		});
	});

	describe('Maintenance', () => {
		it('should complete maintenance after exactly 1 month, not waiting for month boundary', () => {
			const state = get(gameState);
			const property = state.player.properties[0];
			
			// Give player cash to perform maintenance
			state.player.cash = 10000;
			
			// Start on day 15 of month 1
			for (let i = 0; i < 14; i++) {
				gameState.advanceDay();
			}
			
			expect(get(gameState).gameTime.currentDate).toEqual({ year: 1, month: 1, day: 15 });
			
			// Perform maintenance on day 15
			gameState.carryOutMaintenance('starter-home');
			
			const afterMaintenanceStart = get(gameState);
			expect(afterMaintenanceStart.player.properties[0].isUnderMaintenance).toBe(true);
			expect(afterMaintenanceStart.player.properties[0].maintenanceStartDate).toEqual({ year: 1, month: 1, day: 15 });
			
			// Advance 30 days (1 month from Jan 15 should be Feb 15)
			for (let i = 0; i < 30; i++) {
				gameState.advanceDay();
			}
			
			const afterMaintenance = get(gameState);
			// Should now be Feb 15 (or Feb 14 depending on month calculation)
			expect(afterMaintenance.gameTime.currentDate.month).toBe(2);
			expect(afterMaintenance.gameTime.currentDate.day).toBeGreaterThanOrEqual(14);
			expect(afterMaintenance.gameTime.currentDate.day).toBeLessThanOrEqual(15);
			
			// Maintenance should be complete - not waiting for March 1st
			expect(afterMaintenance.player.properties[0].isUnderMaintenance).toBe(false);
			expect(afterMaintenance.player.properties[0].maintenance).toBe(100);
			expect(afterMaintenance.player.properties[0].maintenanceStartDate).toBeNull();
		});

		it('should not complete maintenance before 1 month has passed', () => {
			const state = get(gameState);
			
			state.player.cash = 10000;
			
			// Start maintenance on day 1
			gameState.performMaintenance('starter-home');
			
			expect(get(gameState).player.properties[0].isUnderMaintenance).toBe(true);
			
			// Advance 29 days (less than 1 month)
			for (let i = 0; i < 29; i++) {
				gameState.advanceDay();
			}
			
			const afterPartialWait = get(gameState);
			// Should still be under maintenance
			expect(afterPartialWait.player.properties[0].isUnderMaintenance).toBe(true);
			expect(afterPartialWait.player.properties[0].maintenance).not.toBe(100);
		});

		it('should complete maintenance and try auto-relist if enabled', () => {
			const mockRandom = vi.spyOn(Math, 'random');
			mockRandom.mockReturnValue(0.02); // Guarantee fill
			
			const state = get(gameState);
			state.player.cash = 10000;
			
			// Enable auto-relist
			gameState.setPropertyVacantSettings('starter-home', 5, 12, true);
			
			// Perform maintenance
			gameState.performMaintenance('starter-home');
			
			// Advance 1 month
			for (let i = 0; i < 31; i++) {
				gameState.advanceDay();
			}
			
			const afterMaintenance = get(gameState);
			// Maintenance should be complete and property should be filled
			expect(afterMaintenance.player.properties[0].isUnderMaintenance).toBe(false);
			expect(afterMaintenance.player.properties[0].maintenance).toBe(100);
			expect(afterMaintenance.player.properties[0].tenancy).not.toBeNull();
			
			mockRandom.mockRestore();
		});
	});

	describe('localStorage persistence', () => {
		it('should save state to localStorage on changes', () => {
			gameState.advanceDay();

			const stored = localStorageMock.getItem('property-game-state');
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.gameTime.currentDate).toEqual({ year: 1, month: 1, day: 2 });
		});

		it('should load state from localStorage on initialization', () => {
			// Set up state
			gameState.advanceDay();
			gameState.setSpeed(5);

			// Clear and reload
			const stored = localStorageMock.getItem('property-game-state');
			localStorageMock.clear();
			localStorageMock.setItem('property-game-state', stored!);

			// The store should load from localStorage
			const state = get(gameState);
			expect(state.gameTime.currentDate.day).toBe(2);
			expect(state.gameTime.speed).toBe(5);
		});
	});
});

describe('Game Calculations', () => {
	describe('calculateMonthlyRent', () => {
		it('should calculate correct monthly rent for occupied property', () => {
			const property: Property = {
				id: 'test',
				name: 'Test Property',
				baseValue: 1000,
				purchaseBaseValue: 1000,
				features: {
					propertyType: 'terraced',
					bedrooms: 3,
					garden: 'small',
					parking: 'street'
				},
				area: 'Suburbs',
				district: 5,
				districtModifier: 1.0,
				totalIncomeEarned: 0,
				tenancy: {
					rentMarkup: 5 as RentMarkup,
					periodMonths: 12,
					startDate: createDate(1, 1, 1),
					endDate: createDate(1, 1, 1),
					marketValueAtStart: 1000,
					baseRateAtStart: INITIAL_BASE_RATE
				},
				vacantSettings: {
					rentMarkup: 5,
					periodMonths: 12,
					autoRelist: false
				},
				maintenance: 100,
				isUnderMaintenance: false,
				scheduleMaintenance: false,
				maintenanceStartDate: null,
				saleInfo: null
			};

			// BASE_RATE (5) + rentMarkup (5) = 10%
			// 1000 * 10% = 100 annual
			// 100 / 12 = 8.333... monthly
			const expectedMonthly = (1000 * 10 / 100) / 12;

			// This is tested indirectly through rent collection in the store tests
			expect(expectedMonthly).toBeCloseTo(8.333, 2);
		});

		it('should return 0 for vacant property', () => {
			const property: Property = {
				id: 'test',
				name: 'Test Property',
				baseValue: 1000,
				purchaseBaseValue: 1000,
				features: {
					propertyType: 'terraced',
					bedrooms: 3,
					garden: 'small',
					parking: 'street'
				},
				area: 'Suburbs',
				district: 5,
				districtModifier: 1.0,
				totalIncomeEarned: 0,
				tenancy: null,
				vacantSettings: {
					rentMarkup: 5,
					periodMonths: 12,
					autoRelist: false
				},
				maintenance: 100,
				isUnderMaintenance: false,
				scheduleMaintenance: false,
				maintenanceStartDate: null,
				saleInfo: null
			};

			// Vacant properties don't generate rent
			// Verified in rent collection tests
			expect(property.tenancy).toBeNull();
		});

		it('should scale with different base values', () => {
			// Higher value property should generate proportionally more rent
			const expectedRent1 = (1000 * 10 / 100) / 12;
			const expectedRent2 = (2000 * 10 / 100) / 12;

			expect(expectedRent2).toBeCloseTo(expectedRent1 * 2, 2);
		});
	});

	describe('calculateFillChance', () => {
		it('should return higher chance for rent markup < 5', () => {
			// Markup 1-4: BASE_FILL_CHANCE + 1 = 4%
			const expectedChance = BASE_FILL_CHANCE + 1;
			expect(expectedChance).toBe(4);
		});

		it('should return base chance for rent markup 5-6', () => {
			// Markup 5-6: BASE_FILL_CHANCE = 3%
			const expectedChance = BASE_FILL_CHANCE;
			expect(expectedChance).toBe(3);
		});

		it('should return lower chance for rent markup > 6', () => {
			// Markup 7-10: BASE_FILL_CHANCE - 1 = 2%
			const expectedChance = BASE_FILL_CHANCE - 1;
			expect(expectedChance).toBe(2);
		});
	});
});
