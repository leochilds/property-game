export type TenancyPeriod = 6 | 12 | 18 | 24 | 36; // months
export type RentMarkup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10; // percentage points above base

export type PropertyType = 'flat' | 'terraced' | 'semi-detached' | 'detached';
export type Bedrooms = 1 | 2 | 3 | 4 | 5;
export type GardenType = 'none' | 'small' | 'large';
export type ParkingType = 'none' | 'street' | 'driveway' | 'garage';

export type District = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DistrictName = 
	| 'Industrial Quarter'
	| 'Docklands'
	| 'Old District'
	| 'Midtown'
	| 'Riverside District'
	| 'Garden District'
	| 'Hillside'
	| 'Upmarket Heights'
	| 'Royal Borough'
	| 'Capital';

export type AreaName = 
	| 'City Center'
	| 'Suburbs'
	| 'Uptown'
	| 'Industrial District'
	| 'Riverside'
	| 'Old Town'
	| 'Green Belt'
	| 'Business Quarter';

export type AreaRating = 1 | 2 | 3 | 4 | 5;

export interface AreaRatings {
	crime: AreaRating; // 1=High Crime, 5=Very Safe
	schools: AreaRating; // 1=Poor, 5=Excellent
	transport: AreaRating; // 1=Poor, 5=Excellent
	economy: AreaRating; // 1=Depressed, 5=Thriving
}

export interface Area {
	name: AreaName;
	ratings: AreaRatings;
}

export interface PropertyFeatures {
	propertyType: PropertyType;
	bedrooms: Bedrooms;
	garden: GardenType;
	parking: ParkingType;
}

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
	marketValueAtStart: number; // Market value when tenancy began (baseValue * maintenance%)
}

export interface VacantSettings {
	rentMarkup: RentMarkup;
	periodMonths: TenancyPeriod;
	autoRelist: boolean;
}

export interface SaleInfo {
	askingPricePercentage: number; // 75-125 in 5% increments
	listedDate: GameDate;
	daysOnMarket: number;
}

export interface Property {
	id: string;
	name: string;
	baseValue: number;
	features: PropertyFeatures;
	area: AreaName;
	district: District;
	districtModifier: number;
	totalIncomeEarned: number;
	tenancy: Tenancy | null; // null = vacant
	vacantSettings: VacantSettings;
	maintenance: number; // 0-100, percentage of maintenance level
	isUnderMaintenance: boolean;
	scheduleMaintenance: boolean;
	maintenanceStartDate: GameDate | null;
	saleInfo: SaleInfo | null; // null = not for sale
}

export interface MarketProperty {
	id: string;
	baseValue: number;
	features: PropertyFeatures;
	area: AreaName;
	district: District;
	districtModifier: number;
	maintenance: number; // 1-100, percentage of maintenance level
}

export interface GameState {
	player: {
		cash: number;
		properties: Property[];
	};
	propertyMarket: MarketProperty[];
	areas: Area[];
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
	1: 2000,    // 2 seconds per day (default)
	5: 500      // 0.5 seconds per day
};

export const BASE_RATE = 5; // Fixed base rate percentage
export const BASE_FILL_CHANCE = 3; // Base chance per day to fill a property (%)
export const BASE_SALE_CHANCE = 10; // Base chance per day to sell a property (%)
export const MAX_MARKET_PROPERTIES = 10; // Maximum properties on market at once
export const PROPERTY_BASE_VALUE = 1000; // Base value before feature multipliers

// District names
export const DISTRICT_NAMES: Record<District, DistrictName> = {
	1: 'Industrial Quarter',
	2: 'Docklands',
	3: 'Old District',
	4: 'Midtown',
	5: 'Riverside District',
	6: 'Garden District',
	7: 'Hillside',
	8: 'Upmarket Heights',
	9: 'Royal Borough',
	10: 'Capital'
};

// Property feature multipliers
export const PROPERTY_TYPE_MULTIPLIERS: Record<PropertyType, number> = {
	flat: 0.8,
	terraced: 1.0,
	'semi-detached': 1.2,
	detached: 1.5
};

export const BEDROOM_MULTIPLIERS: Record<Bedrooms, number> = {
	1: 0.7,
	2: 0.9,
	3: 1.0,
	4: 1.3,
	5: 1.6
};

export const GARDEN_MULTIPLIERS: Record<GardenType, number> = {
	none: 0.9,
	small: 1.0,
	large: 1.15
};

export const PARKING_MULTIPLIERS: Record<ParkingType, number> = {
	none: 0.95,
	street: 1.0,
	driveway: 1.1,
	garage: 1.15
};

// Area rating multipliers
export const CRIME_MULTIPLIERS: Record<AreaRating, number> = {
	1: 0.85,
	2: 0.92,
	3: 1.0,
	4: 1.08,
	5: 1.15
};

export const SCHOOLS_MULTIPLIERS: Record<AreaRating, number> = {
	1: 0.88,
	2: 0.94,
	3: 1.0,
	4: 1.1,
	5: 1.2
};

export const TRANSPORT_MULTIPLIERS: Record<AreaRating, number> = {
	1: 0.9,
	2: 0.95,
	3: 1.0,
	4: 1.08,
	5: 1.15
};

export const ECONOMY_MULTIPLIERS: Record<AreaRating, number> = {
	1: 0.85,
	2: 0.92,
	3: 1.0,
	4: 1.1,
	5: 1.2
};

// Initial area definitions
export const INITIAL_AREAS: Area[] = [
	{
		name: 'City Center',
		ratings: { crime: 2, schools: 2, transport: 5, economy: 5 }
	},
	{
		name: 'Suburbs',
		ratings: { crime: 4, schools: 4, transport: 3, economy: 3 }
	},
	{
		name: 'Uptown',
		ratings: { crime: 5, schools: 5, transport: 4, economy: 4 }
	},
	{
		name: 'Industrial District',
		ratings: { crime: 2, schools: 2, transport: 3, economy: 3 }
	},
	{
		name: 'Riverside',
		ratings: { crime: 3, schools: 3, transport: 4, economy: 4 }
	},
	{
		name: 'Old Town',
		ratings: { crime: 3, schools: 3, transport: 2, economy: 2 }
	},
	{
		name: 'Green Belt',
		ratings: { crime: 4, schools: 4, transport: 2, economy: 3 }
	},
	{
		name: 'Business Quarter',
		ratings: { crime: 3, schools: 3, transport: 5, economy: 5 }
	}
];
