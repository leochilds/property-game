export type TenancyPeriod = 6 | 12 | 18 | 24 | 36; // months
export type RentMarkup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // percentage points above base

export interface GameDate {
	year: number;
	month: number; // 1-12
	day: number; // 1-31
}

export interface Tenancy {
	rentMarkup: RentMarkup;
	periodMonths: TenancyPeriod;
	startDate: GameDate;
	endDate: GameDate;
}

export interface VacantSettings {
	rentMarkup: RentMarkup;
	periodMonths: TenancyPeriod;
	autoRelist: boolean;
}

export interface Property {
	id: string;
	name: string;
	baseValue: number;
	totalIncomeEarned: number;
	tenancy: Tenancy | null; // null = vacant
	vacantSettings: VacantSettings;
	hasBeenOccupied: boolean;
	hasAttemptedInitialFill: boolean;
}

export interface GameState {
	player: {
		cash: number;
		properties: Property[];
	};
	gameTime: {
		currentDate: GameDate;
		lastRentCollectionDate: GameDate;
		speed: TimeSpeed;
		isPaused: boolean;
	};
	version: number;
}

export type TimeSpeed = 0.5 | 1 | 5; // Multipliers: 0.5x = slowest (10s/day), 1x = default (2s/day), 5x = fastest (0.5s/day)

export const TIME_SPEED_MS: Record<TimeSpeed, number> = {
	0.5: 10000, // 10 seconds per day
	1: 2000, // 2 seconds per day (default)
	5: 500 // 0.5 seconds per day
};

export const BASE_RATE = 5; // Fixed base rate percentage
export const BASE_FILL_CHANCE = 3; // Base chance per day to fill a property (%)
