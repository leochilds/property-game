import { writable, get } from 'svelte/store';
import type { GameState, Property, TimeSpeed } from '../types/game';

const STORAGE_KEY = 'property-game-state';
const GAME_VERSION = 1;

function createStarterHome(): Property {
	return {
		id: 'starter-home',
		name: 'Starter Home',
		baseValue: 1000,
		monthlyIncome: 8,
		totalIncomeEarned: 0
	};
}

function createInitialState(): GameState {
	return {
		player: {
			cash: 0,
			properties: [createStarterHome()]
		},
		gameTime: {
			currentDay: 0,
			lastIncomeDay: 0,
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
			// Version migration logic can go here in the future
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

function createGameStore() {
	const { subscribe, set, update } = writable<GameState>(loadStateFromStorage());

	return {
		subscribe,
		advanceDay: () => {
			update((state) => {
				const newDay = state.gameTime.currentDay + 1;
				const monthsPassed = Math.floor(newDay / 30) - Math.floor(state.gameTime.lastIncomeDay / 30);

				if (monthsPassed > 0) {
					// Calculate and add monthly income
					const totalIncome = state.player.properties.reduce(
						(sum, property) => sum + property.monthlyIncome * monthsPassed,
						0
					);

					state.player.cash += totalIncome;

					// Update property income tracking
					state.player.properties = state.player.properties.map((property) => ({
						...property,
						totalIncomeEarned: property.totalIncomeEarned + property.monthlyIncome * monthsPassed
					}));

					state.gameTime.lastIncomeDay = newDay;
				}

				state.gameTime.currentDay = newDay;
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
		reset: () => {
			const newState = createInitialState();
			set(newState);
			saveStateToStorage(newState);
		}
	};
}

export const gameState = createGameStore();
