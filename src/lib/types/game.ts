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
	baseRateAtStart: number; // Base rate when tenancy began (locked for duration)
}

export interface VacantSettings {
	rentMarkup: RentMarkup;
	periodMonths: TenancyPeriod;
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
	purchaseBaseValue: number; // Base value when property was acquired
	features: PropertyFeatures;
	area: AreaName;
	district: District;
	districtModifier: number;
	totalIncomeEarned: number;
	tenancy: Tenancy | null; // null = vacant
	vacantSettings: VacantSettings;
	maintenance: number; // 0-100, percentage of maintenance level
	isUnderMaintenance: boolean;
	maintenanceStartDate: GameDate | null;
	saleInfo: SaleInfo | null; // null = not for sale
	assignedEstateAgent: string | null; // Staff ID
	assignedCaretaker: string | null; // Staff ID
	listedDate: GameDate | null; // When estate agent listed it
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

export type EconomicPhase = 'recession' | 'recovery' | 'expansion' | 'peak';

export interface Economy {
	baseRate: number; // Current central bank rate (min 0.1%)
	inflationRate: number; // Current quarterly inflation rate (can be negative for deflation)
	economicPhase: EconomicPhase;
	quarterlyInflationHistory: number[]; // Track last 4 quarters
	lastQuarterDate: GameDate; // Track when quarters change (every 3 months)
	quartersSincePhaseChange: number; // Track cycle progression
}

// Staff types
export type StaffType = 'estate-agent' | 'caretaker';
export type ExperienceLevel = 1 | 2 | 3 | 4 | 5;

export interface BaseStaff {
	id: string;
	name: string;
	type: StaffType;
	district: District;
	baseSalary: number; // Original salary when hired
	currentSalary: number; // Current salary (increases with inflation and promotions)
	highestInflationRate: number; // Track highest inflation rate seen (wages never decrease)
	experienceLevel: ExperienceLevel;
	experiencePoints: number;
	hiredDate: GameDate;
	assignedProperties: string[]; // Property IDs
	unpaidWages: number; // Accumulated unpaid wages
	monthsUnpaid: number; // Number of consecutive months unpaid (quit after 3)
}

export interface EstateAgent extends BaseStaff {
	type: 'estate-agent';
	lastAdjustmentCheck: GameDate; // Track weekly adjustments per property
}

export interface Caretaker extends BaseStaff {
	type: 'caretaker';
}

export type Staff = EstateAgent | Caretaker;

export interface GameState {
	player: {
		cash: number;
		accruedInterest: number;
		properties: Property[];
	};
	propertyMarket: MarketProperty[];
	areas: Area[];
	economy: Economy;
	staff: {
		estateAgents: EstateAgent[];
		caretakers: Caretaker[];
	};
	gameTime: {
		currentDate: GameDate;
		lastRentCollectionDate: GameDate;
		lastInterestCalculationDate: GameDate;
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

export const INITIAL_BASE_RATE = 5; // Starting base rate percentage
export const MIN_BASE_RATE = 0.1; // Minimum base rate (0.1%)
export const TARGET_QUARTERLY_INFLATION = 0.5; // Target 2% annually = ~0.5% quarterly
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

// Staff constants
export const DISTRICT_BASE_SALARIES: Record<District, number> = {
	1: 100,   // Industrial Quarter
	2: 130,   // Docklands
	3: 160,   // Old District
	4: 200,   // Midtown
	5: 250,   // Riverside District
	6: 310,   // Garden District
	7: 380,   // Hillside
	8: 470,   // Upmarket Heights
	9: 580,   // Royal Borough
	10: 700   // Capital
};

export const EXPERIENCE_THRESHOLDS: Record<ExperienceLevel, number> = {
	1: 0,
	2: 200,
	3: 1000,   // 200 + 800
	4: 3400,   // 200 + 800 + 2400
	5: 9800    // 200 + 800 + 2400 + 6400
};

export const PROPERTIES_PER_LEVEL: Record<ExperienceLevel, number> = {
	1: 2,
	2: 4,
	3: 6,
	4: 8,
	5: 10
};

export const PROMOTION_BONUS_MULTIPLIER = 2.0;  // 2x current salary one-time
export const PROMOTION_WAGE_INCREASE = 0.2;     // +20% permanent
export const XP_PER_PROPERTY_PER_DAY = 10;
export const MAX_UNPAID_MONTHS = 3;

// Staff name generation
export const STAFF_FIRST_NAMES = [
	'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
	'David', 'Barbara', 'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
	'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
	'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley'
];

export const STAFF_LAST_NAMES = [
	'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
	'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
	'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
	'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright'
];

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
