export type TenancyPeriod = 6 | 12 | 18 | 24 | 36; // months
export type RentMarkup = number; // 1.0 to 10.0 in 0.1% increments (percentage, not points above base)

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

export type MortgageType = 'btl' | 'standard';
export type DepositPercentage = 10 | 25 | 50 | 75;
export type TermLength = 10 | 15 | 20 | 25 | 30;
export type FixedPeriod = 2 | 3 | 5;

export interface Mortgage {
	id: string;
	propertyId: string | null; // null = property sold but debt remains
	propertyName: string; // Keep name for reference even after sale
	mortgageType: MortgageType;
	originalLoanAmount: number;
	outstandingBalance: number;
	depositPercentage: DepositPercentage;
	termLengthYears: TermLength;
	fixedPeriodYears: FixedPeriod;
	fixedPeriodEndDate: GameDate;
	interestRate: number; // Locked rate during fixed period
	monthlyPayment: number; // 0 for BTL (interest only)
	startDate: GameDate;
	totalInterestPaid: number; // Cumulative interest paid
	totalPrincipalPaid: number; // Cumulative principal paid (equity built)
}

export interface PropertySale {
	id: string;
	name: string;
	features: PropertyFeatures;
	area: AreaName;
	district: District;
	purchasePrice: number; // What you paid for it
	purchaseDate: GameDate;
	salePrice: number; // What you sold it for
	saleDate: GameDate;
	totalRentIncome: number; // Total rent earned while owned
	totalMaintenancePaid: number; // Total maintenance paid while owned
	totalMortgageInterest: number; // Total mortgage interest paid (if any)
	totalMortgagePrincipal: number; // Total mortgage principal paid (if any)
	hadMortgage: boolean;
	mortgageBalanceAtSale: number; // Outstanding mortgage at time of sale
}

export interface Property {
	id: string;
	name: string;
	baseValue: number;
	purchaseBaseValue: number; // Base value when property was acquired
	purchasePrice: number; // Actual price paid (may differ from baseValue)
	purchaseDate: GameDate; // When property was acquired
	totalMaintenancePaid: number; // Cumulative maintenance costs
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
	maintenance: number; // 75-100, percentage of maintenance level
	daysUntilRemoval: number; // Hidden: 30-730 days until property leaves market
	daysOnMarket: number; // Visible: days since property was listed
	listedDate: GameDate; // Visible: date when property was first listed
}

export interface AuctionProperty {
	id: string;
	baseValue: number;
	features: PropertyFeatures;
	area: AreaName;
	district: District;
	districtModifier: number;
	maintenance: number; // 0-49, percentage of maintenance level (distressed properties)
	daysOnMarket: number; // Days since property was listed
	listedDate: GameDate; // Date when property was first listed
}

export type EconomicPhase = 'recession' | 'recovery' | 'expansion' | 'peak';

export interface Economy {
	baseRate: number; // Current central bank rate (min 0.1%)
	inflationRate: number; // Current quarterly inflation rate (can be negative for deflation)
	economicPhase: EconomicPhase;
	quarterlyInflationHistory: number[]; // Track last 4 quarters
	lastQuarterDate: GameDate; // Track when quarters change (every 3 months)
	quartersSincePhaseChange: number; // Track cycle progression
	targetInflationRate: number; // Target inflation for gradual adjustment
	targetBaseRate: number; // Target base rate for gradual adjustment
}

// Staff types
export type StaffType = 'estate-agent' | 'caretaker';
export type ExperienceLevel = 1 | 2 | 3 | 4 | 5 | 6;

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

export interface ForeclosureWarning {
	isActive: boolean;
	daysRemaining: number;
	triggeredDate: GameDate;
	currentDebt: number;
	currentEquity: number;
}

export interface GameOverStats {
	gameDuration: {
		years: number;
		months: number;
		days: number;
	};
	totalPropertiesOwned: number;
	totalPropertiesSold: number;
	currentPortfolio: number;
	totalRentIncome: number;
	totalMaintenanceCosts: number;
	totalMortgageInterest: number;
	totalStaffWages: number;
	totalDebt: number;
	peakNetWorth: number;
	peakNetWorthDate: GameDate;
	peakPropertiesOwned: number;
	bestProperty: {
		name: string;
		totalProfit: number;
	} | null;
}

export interface GameOver {
	triggeredDate: GameDate;
	finalStats: GameOverStats;
}

export interface GameWinStats {
	gameDuration: {
		years: number;
		months: number;
		days: number;
	};
	totalPropertiesOwned: number;
	totalPropertiesSold: number;
	currentPortfolio: number;
	totalRentIncome: number;
	totalMaintenanceCosts: number;
	totalMortgageInterest: number;
	totalStaffWages: number;
	finalNetWorth: number;
	peakNetWorth: number;
	peakNetWorthDate: GameDate;
	peakPropertiesOwned: number;
	bestProperty: {
		name: string;
		totalProfit: number;
	} | null;
}

export interface GameWin {
	triggeredDate: GameDate;
	finalStats: GameWinStats;
	bankComparisonValue: number;
}

export type PrestigeBonusType = 'cash' | 'property';

export interface PrestigeBonus {
	type: PrestigeBonusType;
	points: number; // How many points allocated to this bonus type
}

export interface GameState {
	player: {
		cash: number;
		accruedInterest: number;
		totalInterestEarned: number;
		properties: Property[];
		mortgages: Mortgage[];
		propertySales: PropertySale[]; // History of all property sales
	};
	settings: {
		defaultRentMarkup: RentMarkup; // Global target rent for all new listings
	};
	propertyMarket: MarketProperty[];
	auctionMarket: AuctionProperty[];
	areas: Area[];
	economy: Economy;
	staff: {
		estateAgents: EstateAgent[];
		caretakers: Caretaker[];
		baseSalaryInflationMultiplier: number; // Tracks cumulative inflation for new hire salaries (capped at 0.5% per quarter)
	};
	gameTime: {
		currentDate: GameDate;
		lastRentCollectionDate: GameDate;
		lastInterestCalculationDate: GameDate;
		speed: TimeSpeed;
		isPaused: boolean;
		showBalanceSheetModal: boolean;
	};
	balanceSheetHistory: Array<import('$lib/utils/balanceSheet').OverallBalanceSheet>;
	foreclosureWarning: ForeclosureWarning | null;
	gameOver: GameOver | null;
	gameWin: GameWin | null;
	trackingStats: {
		peakNetWorth: number;
		peakNetWorthDate: GameDate;
		peakPropertiesOwned: number;
		totalStaffWagesPaid: number;
	};
	bankComparisonValue: number;
	prestigeLevel: number;
	prestigeBonuses: PrestigeBonus[];
	canPrestigeNow: boolean;
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
export const MAX_MARKET_PROPERTIES = 50; // Maximum properties on market at once
export const MAX_AUCTION_PROPERTIES = 5; // Maximum auction properties at once
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
	2: 3640,
	3: 18250,
	4: 146000,
	5: 912500,
	6: 7300000
};

export const PROPERTIES_PER_LEVEL: Record<ExperienceLevel, number> = {
	1: 2,
	2: 5,
	3: 20,
	4: 50,
	5: 200,
	6: 999
};

export const PROMOTION_BONUS_MULTIPLIER = 2.0;  // 2x current salary one-time
export const PROMOTION_WAGE_INCREASE = 0.2;     // +20% permanent
export const XP_PER_PROPERTY_PER_DAY = 10;
export const MAX_UNPAID_MONTHS = 3;

// Mortgage constants
export const DEPOSIT_RATE_PREMIUMS: Record<DepositPercentage, number> = {
	10: 4, // +4% to base rate
	25: 3, // +3% to base rate
	50: 2, // +2% to base rate
	75: 1  // +1% to base rate
};

export const BTL_RATE_PREMIUM = 1; // +1% for BTL mortgages

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
