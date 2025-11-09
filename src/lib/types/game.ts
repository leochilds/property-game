export interface Property {
	id: string;
	name: string;
	baseValue: number;
	monthlyIncome: number;
	totalIncomeEarned: number;
}

export interface GameState {
	player: {
		cash: number;
		properties: Property[];
	};
	gameTime: {
		currentDay: number;
		lastIncomeDay: number;
		speed: TimeSpeed;
		isPaused: boolean;
	};
	version: number;
}

export type TimeSpeed = 0.5 | 1 | 5; // Multipliers: 0.5x = slowest (10s/day), 1x = default (2s/day), 5x = fastest (0.5s/day)

export const TIME_SPEED_MS: Record<TimeSpeed, number> = {
	0.5: 10000, // 10 seconds per day
	1: 2000,    // 2 seconds per day (default)
	5: 500      // 0.5 seconds per day
};
