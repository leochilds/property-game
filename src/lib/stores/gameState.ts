import { writable } from 'svelte/store';
import type { GameState, Property, TimeSpeed, GameDate, RentMarkup, TenancyPeriod, Tenancy } from '../types/game';
import { BASE_RATE, BASE_FILL_CHANCE } from '../types/game';
import { createDate, addDays, addMonths, isAfterOrEqual } from '../utils/date';

const STORAGE_KEY = 'property-game-state';
const GAME_VERSION = 2;

function createStarterHome(): Property {
	return {
		id: 'starter-home',
		name: 'Starter Home',
		baseValue: 1000,
		totalIncomeEarned: 0,
		tenancy: null,
		vacantSettings: {
			rentMarkup: 5,
			periodMonths: 12,
			autoRelist: false
		}
	};
}

function createInitialState(): GameState {
	const startDate = createDate(1, 1, 1);
	return {
		player: {
			cash: 0,
			properties: [createStarterHome()]
		},
		gameTime: {
			currentDate: startDate,
			lastRentCollectionDate: createDate(1, 1, 0), // Start before day 1 so first rent can be collected
			speed: 1,
			isPaused: false
		},
		version: GAME_VERSION
	};
}

function loadStateFromStorage(): GameState {
	if (typeof window === 'undefined') {
		return createInitialState();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as GameState;
			if (parsed.version === GAME_VERSION) {
				return parsed;
			}
		}
	} catch (error) {
		console.error('Failed to load game state:', error);
	}

	return createInitialState();
}

function saveStateToStorage(state: GameState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error('Failed to save game state:', error);
	}
}

function calculateMonthlyRent(property: Property): number {
	if (!property.tenancy) return 0;
	const annualRate = BASE_RATE + property.tenancy.rentMarkup;
	const annualRent = (property.baseValue * annualRate) / 100;
	return annualRent / 12;
}

function calculateFillChance(rentMarkup: RentMarkup): number {
	if (rentMarkup < 5) {
		return BASE_FILL_CHANCE + 1; // 4%
	} else if (rentMarkup <= 6) {
		return BASE_FILL_CHANCE; // 3%
	} else {
		return BASE_FILL_CHANCE - 1; // 2%
	}
}

function tryFillProperty(property: Property, currentDate: GameDate): Property {
	if (property.tenancy) return property; // Already occupied

	const fillChance = calculateFillChance(property.vacantSettings.rentMarkup);
	const roll = Math.random() * 100;

	if (roll < fillChance) {
		// Property filled!
		const endDate = addMonths(currentDate, property.vacantSettings.periodMonths);
		const tenancy: Tenancy = {
			rentMarkup: property.vacantSettings.rentMarkup,
			periodMonths: property.vacantSettings.periodMonths,
			startDate: currentDate,
			endDate: endDate
		};
		return { ...property, tenancy };
	}

	return property;
}

function createGameStore() {
	const { subscribe, set, update } = writable<GameState>(loadStateFromStorage());

	return {
		subscribe,
		advanceDay: () => {
			update((state) => {
				const newDate = addDays(state.gameTime.currentDate, 1);

				// Check if it's the 1st of the month for rent collection
				if (newDate.day === 1) {
					let totalRent = 0;
					state.player.properties = state.player.properties.map((property) => {
						if (property.tenancy) {
							const rent = calculateMonthlyRent(property);
							totalRent += rent;
							return {
								...property,
								totalIncomeEarned: property.totalIncomeEarned + rent
							};
						}
						return property;
					});

					state.player.cash += totalRent;
					state.gameTime.lastRentCollectionDate = newDate;
				}

				// Check for tenancy expiration and auto-relist
				state.player.properties = state.player.properties.map((property) => {
					if (property.tenancy && isAfterOrEqual(newDate, property.tenancy.endDate)) {
						// Tenancy has expired
						if (property.vacantSettings.autoRelist) {
							// Try to fill immediately
							return tryFillProperty({ ...property, tenancy: null }, newDate);
						}
						return { ...property, tenancy: null };
					}
					return property;
				});

				// Try to fill vacant properties
				state.player.properties = state.player.properties.map((property) => {
					if (!property.tenancy) {
						return tryFillProperty(property, newDate);
					}
					return property;
				});

				state.gameTime.currentDate = newDate;
				saveStateToStorage(state);
				return state;
			});
		},
		setSpeed: (speed: TimeSpeed) => {
			update((state) => {
				state.gameTime.speed = speed;
				saveStateToStorage(state);
				return state;
			});
		},
		togglePause: () => {
			update((state) => {
				state.gameTime.isPaused = !state.gameTime.isPaused;
				saveStateToStorage(state);
				return state;
			});
		},
		setPropertyVacantSettings: (
			propertyId: string,
			rentMarkup: RentMarkup,
			periodMonths: TenancyPeriod,
			autoRelist: boolean
		) => {
			update((state) => {
				state.player.properties = state.player.properties.map((property) => {
					if (property.id === propertyId) {
						return {
							...property,
							vacantSettings: { rentMarkup, periodMonths, autoRelist }
						};
					}
					return property;
				});
				saveStateToStorage(state);
				return state;
			});
		},
		reset: () => {
			const newState = createInitialState();
			set(newState);
			saveStateToStorage(newState);
		}
	};
}

export const gameState = createGameStore();
