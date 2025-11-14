import { writable } from 'svelte/store';
import type { GameState, Property, TimeSpeed, GameDate, RentMarkup, TenancyPeriod, Tenancy, MarketProperty, AuctionProperty, PropertyFeatures, PropertyType, Bedrooms, GardenType, ParkingType, AreaName, Area, AreaRating, District, EconomicPhase, Economy, StaffType, EstateAgent, Caretaker, Staff, ExperienceLevel, Mortgage, MortgageType, DepositPercentage, TermLength, FixedPeriod } from '../types/game';
import { INITIAL_BASE_RATE, MIN_BASE_RATE, TARGET_QUARTERLY_INFLATION, BASE_FILL_CHANCE, BASE_SALE_CHANCE, MAX_MARKET_PROPERTIES, MAX_AUCTION_PROPERTIES, PROPERTY_BASE_VALUE, PROPERTY_TYPE_MULTIPLIERS, BEDROOM_MULTIPLIERS, GARDEN_MULTIPLIERS, PARKING_MULTIPLIERS, CRIME_MULTIPLIERS, SCHOOLS_MULTIPLIERS, TRANSPORT_MULTIPLIERS, ECONOMY_MULTIPLIERS, INITIAL_AREAS, DISTRICT_BASE_SALARIES, EXPERIENCE_THRESHOLDS, PROPERTIES_PER_LEVEL, PROMOTION_BONUS_MULTIPLIER, PROMOTION_WAGE_INCREASE, XP_PER_PROPERTY_PER_DAY, MAX_UNPAID_MONTHS, STAFF_FIRST_NAMES, STAFF_LAST_NAMES, DEPOSIT_RATE_PREMIUMS, BTL_RATE_PREMIUM } from '../types/game';
import { createDate, addDays, addMonths, isAfterOrEqual, isNewQuarter, calculateDaysRemaining, isUKTaxYearStart } from '../utils/date';
import { calculateOverallBalanceSheet } from '../utils/balanceSheet';

const STORAGE_KEY = 'property-game-state';
const GAME_VERSION = 20;

// Foreclosure constants
const FORECLOSURE_GRACE_PERIOD_DAYS = 30;

// Calculate daily interest rate: (1 + (baseRate - 1%)) ^ (1/365) - 1
// For 5% base rate: (1 + 0.04) ^ (1/365) - 1 ≈ 0.00010738
function calculateDailyInterestRate(baseRate: number): number {
	const annualRate = (baseRate - 1) / 100; // Base rate minus 1%
	return Math.pow(1 + annualRate, 1 / 365) - 1;
}

function randomChoice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function generateStaffName(): string {
	const firstName = randomChoice(STAFF_FIRST_NAMES);
	const lastName = randomChoice(STAFF_LAST_NAMES);
	return `${firstName} ${lastName}`;
}

function generateDistrictInfo(): { district: District; modifier: number } {
	const randomFloat = Math.random() * 9 + 1; // 1-10
	const district = Math.round(randomFloat) as District;
	const modifier = Math.pow(randomFloat, 3); // Cube of random value
	return { district, modifier };
}

function generateRandomFeatures(): PropertyFeatures {
	const propertyTypes: PropertyType[] = ['flat', 'terraced', 'semi-detached', 'detached'];
	const bedroomOptions: Bedrooms[] = [1, 2, 3, 4, 5];
	const gardenOptions: GardenType[] = ['none', 'small', 'large'];
	const parkingOptions: ParkingType[] = ['none', 'street', 'driveway', 'garage'];

	return {
		propertyType: randomChoice(propertyTypes),
		bedrooms: randomChoice(bedroomOptions),
		garden: randomChoice(gardenOptions),
		parking: randomChoice(parkingOptions)
	};
}

function calculateBaseValueFromFeatures(features: PropertyFeatures, areaRatings: Area['ratings'], districtModifier: number): number {
	const typeMultiplier = PROPERTY_TYPE_MULTIPLIERS[features.propertyType];
	const bedroomMultiplier = BEDROOM_MULTIPLIERS[features.bedrooms];
	const gardenMultiplier = GARDEN_MULTIPLIERS[features.garden];
	const parkingMultiplier = PARKING_MULTIPLIERS[features.parking];
	const crimeMultiplier = CRIME_MULTIPLIERS[areaRatings.crime];
	const schoolsMultiplier = SCHOOLS_MULTIPLIERS[areaRatings.schools];
	const transportMultiplier = TRANSPORT_MULTIPLIERS[areaRatings.transport];
	const economyMultiplier = ECONOMY_MULTIPLIERS[areaRatings.economy];
	
	return Math.round(PROPERTY_BASE_VALUE * typeMultiplier * bedroomMultiplier * gardenMultiplier * parkingMultiplier * crimeMultiplier * schoolsMultiplier * transportMultiplier * economyMultiplier * districtModifier);
}

function getAreaRatings(areaName: AreaName, areas: Area[]): Area['ratings'] {
	const area = areas.find(a => a.name === areaName);
	if (!area) {
		// Fallback to average ratings if area not found
		return { crime: 3, schools: 3, transport: 3, economy: 3 };
	}
	return area.ratings;
}

function calculateAreaQualityModifier(ratings: Area['ratings']): number {
	const avgScore = (ratings.crime + ratings.schools + ratings.transport + ratings.economy) / 4;
	// Map 1-5 range to 0.7-1.3 range
	return 0.7 + (avgScore - 1) * 0.15;
}

function generatePropertyName(features: PropertyFeatures): string {
	const typeNames: Record<PropertyType, string> = {
		flat: 'Flat',
		terraced: 'Terraced House',
		'semi-detached': 'Semi-Detached House',
		detached: 'Detached House'
	};
	
	return `${features.bedrooms}-Bed ${typeNames[features.propertyType]}`;
}

function createStarterHome(areas: Area[], currentDate: GameDate): Property {
	const features: PropertyFeatures = {
		propertyType: 'terraced',
		bedrooms: 2,
		garden: 'small',
		parking: 'street'
	};
	const area: AreaName = 'Suburbs';
	const areaRatings = getAreaRatings(area, areas);
	const { district, modifier: districtModifier } = generateDistrictInfo();
	const baseValue = calculateBaseValueFromFeatures(features, areaRatings, districtModifier);
	
	return {
		id: 'starter-home',
		name: generatePropertyName(features),
		baseValue,
		purchaseBaseValue: baseValue,
		purchasePrice: baseValue,
		purchaseDate: currentDate,
		totalMaintenancePaid: 0,
		features,
		area,
		district,
		districtModifier,
		totalIncomeEarned: 0,
		tenancy: null,
		vacantSettings: {
			rentMarkup: 5.0,
			periodMonths: 12
		},
		maintenance: 100,
		isUnderMaintenance: false,
		maintenanceStartDate: null,
		saleInfo: null,
		assignedEstateAgent: null,
		assignedCaretaker: null,
		listedDate: null
	};
}

function generateMarketProperty(areas: Area[], currentDate: GameDate): MarketProperty {
	const id = `market-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const maintenance = Math.floor(Math.random() * 26) + 75; // 75-100%
	const features = generateRandomFeatures();
	const areaNames: AreaName[] = areas.map(a => a.name);
	const area = randomChoice(areaNames);
	const areaRatings = getAreaRatings(area, areas);
	const { district, modifier: districtModifier } = generateDistrictInfo();
	const baseValue = calculateBaseValueFromFeatures(features, areaRatings, districtModifier);
	const daysUntilRemoval = Math.floor(Math.random() * 701) + 30; // 30-730 days (30 days to 2 years)
	
	return {
		id,
		baseValue,
		features,
		area,
		district,
		districtModifier,
		maintenance,
		daysUntilRemoval,
		daysOnMarket: 0,
		listedDate: currentDate
	};
}

function generateInitialMarket(areas: Area[], startDate: GameDate): MarketProperty[] {
	const count = MAX_MARKET_PROPERTIES; // Full market of 50 properties
	return Array.from({ length: count }, () => generateMarketProperty(areas, startDate));
}

function generateAuctionProperty(areas: Area[], currentDate: GameDate): AuctionProperty {
	const id = `auction-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const maintenance = Math.floor(Math.random() * 50); // 0-49% (distressed properties)
	const features = generateRandomFeatures();
	const areaNames: AreaName[] = areas.map(a => a.name);
	const area = randomChoice(areaNames);
	const areaRatings = getAreaRatings(area, areas);
	const { district, modifier: districtModifier } = generateDistrictInfo();
	const baseValue = calculateBaseValueFromFeatures(features, areaRatings, districtModifier);
	
	return {
		id,
		baseValue,
		features,
		area,
		district,
		districtModifier,
		maintenance,
		daysOnMarket: 0,
		listedDate: currentDate
	};
}

function generateInitialAuction(): AuctionProperty[] {
	return []; // No initial auction properties
}

function applyInflationToAuction(auctionProperties: AuctionProperty[], inflationRate: number): AuctionProperty[] {
	if (inflationRate === 0) return auctionProperties;
	
	const multiplier = 1 + (inflationRate / 100);
	
	return auctionProperties.map(property => ({
		...property,
		baseValue: Math.round(property.baseValue * multiplier)
	}));
}

function createInitialState(): GameState {
	const startDate = createDate(1, 1, 1);
	const areas = JSON.parse(JSON.stringify(INITIAL_AREAS)) as Area[];
	
	return {
		player: {
			cash: 50000,
			accruedInterest: 0,
			totalInterestEarned: 0,
			properties: [],
			mortgages: [],
			propertySales: []
		},
		settings: {
			defaultRentMarkup: 5.0 // Default 5% rent markup for all new listings
		},
		propertyMarket: generateInitialMarket(areas, startDate),
		auctionMarket: generateInitialAuction(),
		areas,
		economy: {
			baseRate: INITIAL_BASE_RATE,
			inflationRate: 1.0, // Start at expansion level (1% quarterly = 4% annual)
			economicPhase: 'expansion',
			quarterlyInflationHistory: [1.0, 1.0, 1.0, 1.0], // Initialize with expansion inflation
			lastQuarterDate: startDate,
			quartersSincePhaseChange: 0,
			targetInflationRate: 1.0,
			targetBaseRate: INITIAL_BASE_RATE
		},
		staff: {
			estateAgents: [],
			caretakers: []
		},
		gameTime: {
			currentDate: startDate,
			lastRentCollectionDate: createDate(1, 1, 0), // Start before day 1 so first rent can be collected
			lastInterestCalculationDate: createDate(1, 1, 0), // Start before day 1
			speed: 1,
			isPaused: false,
			showBalanceSheetModal: false
		},
		balanceSheetHistory: [],
		foreclosureWarning: null,
		gameOver: null,
		gameWin: null,
		trackingStats: {
			peakNetWorth: 50000,
			peakNetWorthDate: startDate,
			peakPropertiesOwned: 0,
			totalStaffWagesPaid: 0
		},
		bankComparisonValue: 50000,
		prestigeLevel: 0,
		prestigeBonuses: [],
		canPrestigeNow: false,
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
			} else if (parsed.version < GAME_VERSION) {
				// Migrate old saves
				parsed.player.properties = parsed.player.properties.map((property) => {
					const migratedProperty = {
						...property,
						// Version 3: Added maintenance system
						maintenance: property.maintenance ?? 100,
						isUnderMaintenance: property.isUnderMaintenance ?? false,
						maintenanceStartDate: property.maintenanceStartDate ?? null,
						// Version 5: Added saleInfo
						saleInfo: property.saleInfo ?? null,
						// Version 6: Added property features
						features: property.features ?? {
							propertyType: 'terraced',
							bedrooms: 3,
							garden: 'small',
							parking: 'street'
						}
					} as Property;

					// Version 4: Added marketValueAtStart to tenancies
					if (migratedProperty.tenancy && !(migratedProperty.tenancy as any).marketValueAtStart) {
						// For existing tenancies, calculate market value based on current maintenance
						const marketValue = calculateMarketValue(migratedProperty);
						migratedProperty.tenancy = {
							...migratedProperty.tenancy,
							marketValueAtStart: marketValue
						};
					}
					
					// Version 6: Update property name based on features
					if (!property.features) {
						migratedProperty.name = generatePropertyName(migratedProperty.features);
					}

					return migratedProperty;
				});
				
				// Version 5: Added property market
				// Version 7: Added areas
				if (!parsed.areas) {
					parsed.areas = JSON.parse(JSON.stringify(INITIAL_AREAS)) as Area[];
				}
				
				if (!parsed.propertyMarket) {
					parsed.propertyMarket = generateInitialMarket(parsed.areas, parsed.gameTime.currentDate);
				}
				
				// Version 6: Add features to market properties
				if (parsed.propertyMarket) {
					parsed.propertyMarket = parsed.propertyMarket.map((marketProp) => {
						if (!(marketProp as any).features) {
							const features = generateRandomFeatures();
							const area = (marketProp as any).area ?? 'Suburbs';
							const areaRatings = getAreaRatings(area, parsed.areas);
							const { district, modifier: districtModifier } = generateDistrictInfo();
							return {
								...marketProp,
								features,
								area,
								district,
								districtModifier,
								baseValue: calculateBaseValueFromFeatures(features, areaRatings, districtModifier)
							};
						}
						return marketProp;
					});
				}
				
				// Version 7: Add area to all properties
				parsed.player.properties = parsed.player.properties.map((property) => {
					if (!(property as any).area) {
						return {
							...property,
							area: 'Suburbs' as AreaName
						};
					}
					return property;
				});
				
				// Version 7: Add area to market properties if missing
				parsed.propertyMarket = parsed.propertyMarket.map((marketProp) => {
					if (!(marketProp as any).area) {
						return {
							...marketProp,
							area: 'Suburbs' as AreaName
						};
					}
					return marketProp;
				});
				
				// Version 8: Add district to all properties
				parsed.player.properties = parsed.player.properties.map((property) => {
					if (!(property as any).district) {
						const { district, modifier: districtModifier } = generateDistrictInfo();
						// Recalculate base value with district modifier
						const areaRatings = getAreaRatings(property.area, parsed.areas);
						const baseValue = calculateBaseValueFromFeatures(property.features, areaRatings, districtModifier);
						return {
							...property,
							district,
							districtModifier,
							baseValue
						};
					}
					return property;
				});
				
				// Version 8: Add district to market properties if missing
				parsed.propertyMarket = parsed.propertyMarket.map((marketProp) => {
					if (!(marketProp as any).district) {
						const { district, modifier: districtModifier } = generateDistrictInfo();
						// Recalculate base value with district modifier
						const areaRatings = getAreaRatings(marketProp.area, parsed.areas);
						const baseValue = calculateBaseValueFromFeatures(marketProp.features, areaRatings, districtModifier);
						return {
							...marketProp,
							district,
							districtModifier,
							baseValue
						};
					}
					return marketProp;
				});
				
				// Version 9: Add interest tracking
				if (!(parsed.player as any).accruedInterest) {
					(parsed.player as any).accruedInterest = 0;
				}
				if (!(parsed.player as any).totalInterestEarned) {
					(parsed.player as any).totalInterestEarned = 0;
				}
				if (!(parsed.gameTime as any).lastInterestCalculationDate) {
					(parsed.gameTime as any).lastInterestCalculationDate = parsed.gameTime.currentDate;
				}
				
				// Version 10: Add economy system and baseRateAtStart to tenancies
				if (!(parsed as any).economy) {
					(parsed as any).economy = {
						baseRate: INITIAL_BASE_RATE,
						inflationRate: 0.5,
						economicPhase: 'expansion',
						quarterlyInflationHistory: [0.5, 0.5, 0.5, 0.5],
						lastQuarterDate: parsed.gameTime.currentDate,
						quartersSincePhaseChange: 0,
						targetInflationRate: 0.5,
						targetBaseRate: INITIAL_BASE_RATE
					};
				}
				
				// Add target fields to existing economy objects
				if (!(parsed.economy as any).targetInflationRate) {
					(parsed.economy as any).targetInflationRate = parsed.economy.inflationRate;
				}
				if (!(parsed.economy as any).targetBaseRate) {
					(parsed.economy as any).targetBaseRate = parsed.economy.baseRate;
				}
				
				// Add baseRateAtStart to existing tenancies
				parsed.player.properties = parsed.player.properties.map((property) => {
					let updatedProperty = property;
					
					if (property.tenancy && !(property.tenancy as any).baseRateAtStart) {
						updatedProperty = {
							...updatedProperty,
							tenancy: {
								...updatedProperty.tenancy!,
								baseRateAtStart: INITIAL_BASE_RATE
							}
						};
					}
					
					// Version 10: Add purchaseBaseValue for value change tracking
					if (!(updatedProperty as any).purchaseBaseValue) {
						updatedProperty = {
							...updatedProperty,
							purchaseBaseValue: updatedProperty.baseValue
						};
					}
					
					return updatedProperty;
				});
				
				// Version 11: Add staff system and remove old autoRelist/scheduleMaintenance
				if (!(parsed as any).staff) {
					(parsed as any).staff = {
						estateAgents: [],
						caretakers: []
					};
				}
				
				// Remove autoRelist and scheduleMaintenance, add new staff fields
				parsed.player.properties = parsed.player.properties.map((property: any) => {
					const { autoRelist, scheduleMaintenance, ...rest } = property.vacantSettings || {};
					return {
						...property,
						vacantSettings: {
							rentMarkup: property.vacantSettings?.rentMarkup || 5,
							periodMonths: property.vacantSettings?.periodMonths || 12
						},
						assignedEstateAgent: property.assignedEstateAgent ?? null,
						assignedCaretaker: property.assignedCaretaker ?? null,
						listedDate: property.listedDate ?? null
					};
				});
				
				// Version 12: Add global settings
				if (!(parsed as any).settings) {
					(parsed as any).settings = {
						defaultRentMarkup: 5.0
					};
				}
				
				// Version 13: Add market property time tracking fields and mortgages
				parsed.propertyMarket = parsed.propertyMarket.map((marketProp: any) => {
					if (!(marketProp as any).daysUntilRemoval || !(marketProp as any).daysOnMarket || !(marketProp as any).listedDate) {
						// Generate random days until removal (30-730 days)
						const daysUntilRemoval = Math.floor(Math.random() * 701) + 30;
						// Random days on market (0-90 days to simulate existing listings)
						const daysOnMarket = Math.floor(Math.random() * 91);
						
						return {
							...marketProp,
							maintenance: marketProp.maintenance < 75 ? Math.floor(Math.random() * 26) + 75 : marketProp.maintenance,
							daysUntilRemoval,
							daysOnMarket,
							listedDate: parsed.gameTime.currentDate
						};
					}
					return marketProp;
				});
				
				// Version 14: Add mortgages array and auction market
				if (!(parsed.player as any).mortgages) {
					(parsed.player as any).mortgages = [];
				}
				
				// Version 14: Add auction market
				if (!(parsed as any).auctionMarket) {
					(parsed as any).auctionMarket = [];
				}
				
				// Version 15: Add balance sheet tracking fields
				parsed.player.properties = parsed.player.properties.map((property: any) => {
					let updatedProperty = { ...property };
					
					// Add purchasePrice if missing (use baseValue as fallback)
					if (!(updatedProperty as any).purchasePrice) {
						updatedProperty.purchasePrice = updatedProperty.baseValue;
					}
					
					// Add purchaseDate if missing (use earliest possible date as fallback)
					if (!(updatedProperty as any).purchaseDate) {
						updatedProperty.purchaseDate = createDate(1, 1, 1);
					}
					
					// Add totalMaintenancePaid if missing
					if (!(updatedProperty as any).totalMaintenancePaid) {
						updatedProperty.totalMaintenancePaid = 0;
					}
					
					return updatedProperty;
				});
				
				// Version 15: Add mortgage payment tracking fields
				if (parsed.player.mortgages) {
					parsed.player.mortgages = parsed.player.mortgages.map((mortgage: any) => {
						let updatedMortgage = { ...mortgage };
						
						// Add totalInterestPaid if missing
						if (!(updatedMortgage as any).totalInterestPaid) {
							updatedMortgage.totalInterestPaid = 0;
						}
						
						// Add totalPrincipalPaid if missing
						if (!(updatedMortgage as any).totalPrincipalPaid) {
							updatedMortgage.totalPrincipalPaid = 0;
						}
						
						return updatedMortgage;
					});
				}
				
				// Version 16: Add balance sheet history
				if (!(parsed as any).balanceSheetHistory) {
					(parsed as any).balanceSheetHistory = [];
				}
				
				// Version 17: Add property sales history
				if (!(parsed.player as any).propertySales) {
					(parsed.player as any).propertySales = [];
				}
				
				// Version 19: Replace gameEndState with foreclosure system
				if ((parsed as any).gameEndState) {
					delete (parsed as any).gameEndState;
				}
				if (!(parsed as any).foreclosureWarning) {
					(parsed as any).foreclosureWarning = null;
				}
				if (!(parsed as any).gameOver) {
					(parsed as any).gameOver = null;
				}
				if (!(parsed as any).trackingStats) {
					const netWorth = calculateNetWorth(parsed);
					(parsed as any).trackingStats = {
						peakNetWorth: Math.max(50000, netWorth),
						peakNetWorthDate: parsed.gameTime.currentDate,
						peakPropertiesOwned: parsed.player.properties.length,
						totalStaffWagesPaid: 0
					};
				}
				
				// Version 20: Add prestige and win condition system
				if (!(parsed as any).gameWin) {
					(parsed as any).gameWin = null;
				}
				if (!(parsed as any).bankComparisonValue) {
					// Start from current cash value
					(parsed as any).bankComparisonValue = parsed.player.cash;
				}
				if (!(parsed as any).prestigeLevel) {
					(parsed as any).prestigeLevel = 0;
				}
				if (!(parsed as any).prestigeBonuses) {
					(parsed as any).prestigeBonuses = [];
				}
				if (!(parsed as any).canPrestigeNow) {
					(parsed as any).canPrestigeNow = false;
				}
				
				parsed.version = GAME_VERSION;
				saveStateToStorage(parsed);
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
	const annualRate = property.tenancy.rentMarkup; // Just the markup, no base rate
	const annualRent = (property.tenancy.marketValueAtStart * annualRate) / 100;
	return annualRent / 12;
}

function calculateFillChance(rentMarkup: RentMarkup): number {
	// Daily rental chance: (1 - currentRate/100)^65
	// For 10%: (1 - 0.10)^65 = 0.9^65 = 0.106%
	// For 3%: (1 - 0.03)^65 = 0.97^65 = 13.809%
	return Math.pow(1 - (rentMarkup / 100), 65) * 100;
}

function calculateMarketValue(property: Property): number {
	return property.baseValue * (0.5 + property.maintenance / 200);
}

function calculateMaintenanceCost(property: Property): number {
	const percentageNeeded = 100 - property.maintenance;
	const baseCost = property.baseValue * (percentageNeeded / 100);
	return baseCost * 0.10;
}

function canBeLetOut(property: Property): boolean {
	return property.maintenance >= 25 && !property.isUnderMaintenance;
}

function tryFillProperty(property: Property, currentDate: GameDate, areas: Area[], baseRate: number): Property {
	if (property.tenancy) return property; // Already occupied
	if (!canBeLetOut(property)) return property; // Cannot be let out

	const baseFillChance = calculateFillChance(property.vacantSettings.rentMarkup);
	const areaRatings = getAreaRatings(property.area, areas);
	const areaModifier = calculateAreaQualityModifier(areaRatings);
	const fillChance = baseFillChance * areaModifier;
	const roll = Math.random() * 100;

	if (roll < fillChance) {
		// Property filled! Use market value for new tenancy
		const marketValue = calculateMarketValue(property);
		const endDate = addMonths(currentDate, property.vacantSettings.periodMonths);
		const tenancy: Tenancy = {
			rentMarkup: property.vacantSettings.rentMarkup,
			periodMonths: property.vacantSettings.periodMonths,
			startDate: currentDate,
			endDate: endDate,
			marketValueAtStart: marketValue,
			baseRateAtStart: baseRate
		};
		return { ...property, tenancy };
	}

	return property;
}

function updateAreaRatings(areas: Area[]): Area[] {
	return areas.map(area => {
		const ratings = { ...area.ratings };
		
		// 10% chance for each rating to change
		const ratingKeys: (keyof Area['ratings'])[] = ['crime', 'schools', 'transport', 'economy'];
		ratingKeys.forEach(key => {
			if (Math.random() < 0.1) {
				// Randomly increase or decrease by 1
				const change = Math.random() < 0.5 ? -1 : 1;
				const newValue = ratings[key] + change;
				// Keep within 1-5 bounds
				ratings[key] = Math.max(1, Math.min(5, newValue)) as AreaRating;
			}
		});
		
		return {
			...area,
			ratings
		};
	});
}

// Economic cycle functions
function generateTargetInflation(phase: EconomicPhase): number {
	// Quarterly inflation ranges by economic phase (annual rates divided by 4)
	const ranges: Record<EconomicPhase, { min: number; max: number }> = {
		recession: { min: -0.25, max: 0.5 },   // -1% to +2% annual
		recovery: { min: 0.25, max: 0.75 },    // 1% to 3% annual
		expansion: { min: 0.75, max: 1.5 },    // 3% to 6% annual
		peak: { min: 1.25, max: 2.5 }          // 5% to 10% annual
	};
	
	const range = ranges[phase];
	return range.min + Math.random() * (range.max - range.min);
}

function generateTargetBaseRate(phase: EconomicPhase): number {
	// Base rate ranges by economic phase (matching UK table)
	const ranges: Record<EconomicPhase, { min: number; max: number }> = {
		recession: { min: 0.1, max: 1.5 },     // 0% to 1.5%
		recovery: { min: 1.0, max: 3.0 },      // 1% to 3%
		expansion: { min: 3.0, max: 6.0 },     // 3% to 6%
		peak: { min: 5.0, max: 10.0 }          // 5% to 10%
	};
	
	const range = ranges[phase];
	return range.min + Math.random() * (range.max - range.min);
}

function graduallyAdjustValue(current: number, target: number, adjustmentRate: number = 0.3): number {
	// Move current value towards target by adjustmentRate (30% default)
	const gap = target - current;
	return current + gap * adjustmentRate;
}

function progressEconomicCycle(economy: Economy): EconomicPhase {
	const { economicPhase, quartersSincePhaseChange } = economy;
	
	// Minimum quarters in a phase before considering transition
	const minQuarters = 3;
	
	// Phase transition probabilities (increase with time in phase)
	const transitionChance = Math.min(0.3, 0.05 * quartersSincePhaseChange);
	
	if (quartersSincePhaseChange < minQuarters) {
		return economicPhase; // Stay in current phase
	}
	
	if (Math.random() > transitionChance) {
		return economicPhase; // No transition yet
	}
	
	// Determine next phase in cycle
	const cycle: EconomicPhase[] = ['recession', 'recovery', 'expansion', 'peak'];
	const currentIndex = cycle.indexOf(economicPhase);
	const nextIndex = (currentIndex + 1) % cycle.length;
	
	return cycle[nextIndex];
}

function applyInflationToProperties(properties: Property[], inflationRate: number): Property[] {
	if (inflationRate === 0) return properties;
	
	const multiplier = 1 + (inflationRate / 100);
	
	return properties.map(property => ({
		...property,
		baseValue: Math.round(property.baseValue * multiplier)
	}));
}

function applyInflationToMarket(marketProperties: MarketProperty[], inflationRate: number): MarketProperty[] {
	if (inflationRate === 0) return marketProperties;
	
	const multiplier = 1 + (inflationRate / 100);
	
	return marketProperties.map(property => ({
		...property,
		baseValue: Math.round(property.baseValue * multiplier)
	}));
}

function updateEconomyQuarterly(economy: Economy, properties: Property[], marketProperties: MarketProperty[]): {
	economy: Economy;
	properties: Property[];
	marketProperties: MarketProperty[];
} {
	// Check for phase transition
	const newPhase = progressEconomicCycle(economy);
	const phaseChanged = newPhase !== economy.economicPhase;
	
	// If phase changed, generate new targets for the new phase
	let targetInflation = economy.targetInflationRate;
	let targetBaseRate = economy.targetBaseRate;
	
	if (phaseChanged) {
		targetInflation = generateTargetInflation(newPhase);
		targetBaseRate = generateTargetBaseRate(newPhase);
	} else {
		// 20% chance to update targets within the same phase
		if (Math.random() < 0.2) {
			targetInflation = generateTargetInflation(economy.economicPhase);
			targetBaseRate = generateTargetBaseRate(economy.economicPhase);
		}
	}
	
	// Gradually adjust inflation toward target (30% of gap per quarter)
	const newInflationRate = graduallyAdjustValue(economy.inflationRate, targetInflation, 0.3);
	
	// Gradually adjust base rate toward target (30% of gap per quarter)
	const newBaseRate = Math.max(MIN_BASE_RATE, graduallyAdjustValue(economy.baseRate, targetBaseRate, 0.3));
	
	// Update inflation history (keep last 4 quarters)
	const newHistory = [...economy.quarterlyInflationHistory.slice(-3), newInflationRate];
	
	// Apply inflation to all property base values
	const updatedProperties = applyInflationToProperties(properties, newInflationRate);
	const updatedMarket = applyInflationToMarket(marketProperties, newInflationRate);
	
	return {
		economy: {
			...economy,
			baseRate: newBaseRate,
			inflationRate: newInflationRate,
			economicPhase: newPhase,
			quarterlyInflationHistory: newHistory,
			quartersSincePhaseChange: phaseChanged ? 0 : economy.quartersSincePhaseChange + 1,
			targetInflationRate: targetInflation,
			targetBaseRate: targetBaseRate
		},
		properties: updatedProperties,
		marketProperties: updatedMarket
	};
}

// Mortgage calculation functions
function calculateMortgageInterestRate(
	baseRate: number,
	depositPercentage: DepositPercentage,
	mortgageType: MortgageType
): number {
	const depositPremium = DEPOSIT_RATE_PREMIUMS[depositPercentage];
	const btlPremium = mortgageType === 'btl' ? BTL_RATE_PREMIUM : 0;
	return baseRate + depositPremium + btlPremium;
}

function calculateMonthlyMortgagePayment(
	loanAmount: number,
	annualInterestRate: number,
	termYears: TermLength,
	mortgageType: MortgageType
): number {
	if (mortgageType === 'btl') {
		// BTL: Interest only, no principal repayment
		return 0;
	}
	
	// Standard mortgage: Calculate amortization payment
	const monthlyRate = annualInterestRate / 100 / 12;
	const numPayments = termYears * 12;
	
	// M = P * [r(1+r)^n] / [(1+r)^n - 1]
	const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
		(Math.pow(1 + monthlyRate, numPayments) - 1);
	
	return payment;
}

function calculateMonthlyMortgageInterest(outstandingBalance: number, annualInterestRate: number): number {
	return (outstandingBalance * annualInterestRate / 100) / 12;
}

// Calculate player's net worth
function calculateNetWorth(state: GameState): number {
	// Assets: cash + property market values
	let assets = state.player.cash + state.player.accruedInterest;
	
	state.player.properties.forEach((property) => {
		assets += calculateMarketValue(property);
	});
	
	// Liabilities: outstanding mortgage balances
	let liabilities = 0;
	state.player.mortgages.forEach((mortgage) => {
		liabilities += mortgage.outstandingBalance;
	});
	
	return assets - liabilities;
}

// Calculate total equity (property values - mortgages)
function calculateEquity(state: GameState): number {
	let propertyValues = 0;
	state.player.properties.forEach((property) => {
		propertyValues += calculateMarketValue(property);
	});
	
	let mortgageBalances = 0;
	state.player.mortgages.forEach((mortgage) => {
		mortgageBalances += mortgage.outstandingBalance;
	});
	
	return propertyValues - mortgageBalances;
}

// Calculate cash debt (only negative cash)
function calculateDebt(state: GameState): number {
	return state.player.cash < 0 ? Math.abs(state.player.cash) : 0;
}

function createGameStore() {
	const { subscribe, set, update } = writable<GameState>(loadStateFromStorage());

	return {
		subscribe,
		advanceDay: () => {
			update((state) => {
				const newDate = addDays(state.gameTime.currentDate, 1);

				// Check for quarterly economic update
				if (isNewQuarter(state.economy.lastQuarterDate, newDate)) {
					const result = updateEconomyQuarterly(state.economy, state.player.properties, state.propertyMarket);
					state.economy = { ...result.economy, lastQuarterDate: newDate };
					state.player.properties = result.properties;
					state.propertyMarket = result.marketProperties;
				}

				// Calculate daily interest on cash
				const dailyRate = calculateDailyInterestRate(state.economy.baseRate);
				const dailyInterest = state.player.cash * dailyRate;
				state.player.accruedInterest += dailyInterest;
				state.gameTime.lastInterestCalculationDate = newDate;
				
				// Calculate daily interest on bank comparison value (tracks what money would be if never invested)
				const bankDailyInterest = state.bankComparisonValue * dailyRate;
				state.bankComparisonValue += bankDailyInterest;

				// Staff experience gain (daily) - cap at next level threshold
				state.staff.estateAgents = state.staff.estateAgents.map(agent => {
					if (agent.experienceLevel >= 6) return agent; // Max level, no more XP
					
					const nextLevel = (agent.experienceLevel + 1) as ExperienceLevel;
					const nextThreshold = EXPERIENCE_THRESHOLDS[nextLevel];
					const xpGain = agent.assignedProperties.length * XP_PER_PROPERTY_PER_DAY;
					
					return {
						...agent,
						experiencePoints: Math.min(agent.experiencePoints + xpGain, nextThreshold)
					};
				});
				
				state.staff.caretakers = state.staff.caretakers.map(caretaker => {
					if (caretaker.experienceLevel >= 6) return caretaker; // Max level, no more XP
					
					const nextLevel = (caretaker.experienceLevel + 1) as ExperienceLevel;
					const nextThreshold = EXPERIENCE_THRESHOLDS[nextLevel];
					const xpGain = caretaker.assignedProperties.length * XP_PER_PROPERTY_PER_DAY;
					
					return {
						...caretaker,
						experiencePoints: Math.min(caretaker.experiencePoints + xpGain, nextThreshold)
					};
				});

				// Check and adjust variable rate mortgages daily (when fixed period expires)
				state.player.mortgages = state.player.mortgages.map((mortgage) => {
					if (isAfterOrEqual(newDate, mortgage.fixedPeriodEndDate)) {
						const newRate = calculateMortgageInterestRate(
							state.economy.baseRate,
							mortgage.depositPercentage,
							mortgage.mortgageType
						);
						
						// Only update if rate has changed
						if (newRate !== mortgage.interestRate) {
							const newMonthlyPayment = calculateMonthlyMortgagePayment(
								mortgage.outstandingBalance,
								newRate,
								mortgage.termLengthYears,
								mortgage.mortgageType
							);
							
							return {
								...mortgage,
								interestRate: newRate,
								monthlyPayment: newMonthlyPayment
							};
						}
					}
					return mortgage;
				});

				// Estate agent auto-listing
				state.player.properties = state.player.properties.map((property) => {
					if (property.assignedEstateAgent && !property.tenancy && !property.isUnderMaintenance && property.maintenance >= 25) {
						if (!property.listedDate) {
							return {
								...property,
								listedDate: newDate
							};
						}
					}
					return property;
				});

				// Estate agent monthly adjustments
				state.player.properties = state.player.properties.map((property) => {
					if (property.assignedEstateAgent && property.listedDate && !property.tenancy) {
						const daysSinceListed = calculateDaysRemaining(property.listedDate, newDate);
						
						if (daysSinceListed >= 30) {
							let updatedProperty = { ...property };
							
							// Randomly adjust rent
							const rentAdjustment = Math.random();
							if (rentAdjustment < 0.3) {
								// Increase rent markup by 0.5-1.0% (max 10.0) - testing higher prices
								const increase = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
								updatedProperty.vacantSettings = {
									...updatedProperty.vacantSettings,
									rentMarkup: Math.min(10.0, updatedProperty.vacantSettings.rentMarkup + increase)
								};
							} else if (rentAdjustment < 0.6) {
								// Reduce rent markup by 0.5% (min 1.0)
								updatedProperty.vacantSettings = {
									...updatedProperty.vacantSettings,
									rentMarkup: Math.max(1.0, updatedProperty.vacantSettings.rentMarkup - 0.5)
								};
							}
							// else: 40% chance to keep rent the same
							
							// Also randomly adjust period (independent of rent adjustment)
							const periodAdjustment = Math.random();
							if (periodAdjustment < 0.5) {
								// 50% chance to randomize period
								const periods: TenancyPeriod[] = [6, 12, 18, 24, 36];
								const randomPeriod = periods[Math.floor(Math.random() * periods.length)];
								updatedProperty.vacantSettings = {
									...updatedProperty.vacantSettings,
									periodMonths: randomPeriod
								};
							}
							
							// Reset listedDate for next month's check
							updatedProperty.listedDate = newDate;
							return updatedProperty;
						}
					}
					return property;
				});

				// Try to fill properties with estate agents
				state.player.properties = state.player.properties.map((property) => {
					if (property.assignedEstateAgent && property.listedDate && !property.tenancy) {
						return tryFillProperty(property, newDate, state.areas, state.economy.baseRate);
					}
					return property;
				});

				// Try to fill properties WITHOUT estate agents (manual tenant finding)
				state.player.properties = state.player.properties.map((property) => {
					// Skip if already has estate agent (handled above)
					// Skip if not manually listed (player must click "List Now")
					// Skip if already has tenant
					// Skip if can't be let out (maintenance < 25 or under maintenance)
					if (!property.assignedEstateAgent && property.listedDate && !property.tenancy && canBeLetOut(property)) {
						return tryFillProperty(property, newDate, state.areas, state.economy.baseRate);
					}
					return property;
				});

				// Caretaker auto-maintenance
				state.player.properties = state.player.properties.map((property) => {
					if (property.assignedCaretaker && !property.tenancy && !property.isUnderMaintenance && property.maintenance <= 90) {
						const cost = calculateMaintenanceCost(property);
						
						if (state.player.cash >= cost) {
							state.player.cash -= cost;
							return {
								...property,
								totalMaintenancePaid: property.totalMaintenancePaid + cost,
								isUnderMaintenance: true,
								maintenanceStartDate: newDate
							};
						}
					}
					return property;
				});

				// Check if it's the 1st of the month for rent collection, maintenance, interest payout, and area updates
				if (newDate.day === 1) {
					// Pay out accrued interest
					const interestPaid = state.player.accruedInterest;
					state.player.cash += interestPaid;
					state.player.totalInterestEarned += interestPaid;
					state.player.accruedInterest = 0;
					// Update area ratings monthly
					state.areas = updateAreaRatings(state.areas);
					
					let totalRent = 0;
					state.player.properties = state.player.properties.map((property) => {
						let updatedProperty = { ...property };

						// Collect rent from occupied properties
						if (property.tenancy) {
							const rent = calculateMonthlyRent(property);
							totalRent += rent;
							updatedProperty.totalIncomeEarned = property.totalIncomeEarned + rent;
							
							// Degrade maintenance for occupied properties
							updatedProperty.maintenance = Math.max(0, property.maintenance - 1);
						}

					// Degrade maintenance for vacant properties (not under maintenance)
					if (!property.tenancy && !property.isUnderMaintenance) {
						updatedProperty.maintenance = Math.max(0, property.maintenance - 0.2);
					}

					return updatedProperty;
					});

					state.player.cash += totalRent;
					state.gameTime.lastRentCollectionDate = newDate;

					// Process mortgage payments and interest
					state.player.mortgages = state.player.mortgages.map((mortgage) => {
						let updatedMortgage = { ...mortgage };
						
						// Calculate and deduct monthly payment/interest
						const monthlyInterest = calculateMonthlyMortgageInterest(
							updatedMortgage.outstandingBalance,
							updatedMortgage.interestRate
						);
						
						// For standard mortgages, pay principal + interest
						// For BTL, only pay interest
						const totalMonthlyPayment = updatedMortgage.mortgageType === 'standard' 
							? updatedMortgage.monthlyPayment 
							: monthlyInterest;
						
						state.player.cash -= totalMonthlyPayment;
						
						// Track interest paid
						updatedMortgage.totalInterestPaid += monthlyInterest;
						
						// Reduce outstanding balance and track principal (standard only)
						if (updatedMortgage.mortgageType === 'standard') {
							const principalPayment = totalMonthlyPayment - monthlyInterest;
							updatedMortgage.totalPrincipalPaid += principalPayment;
							updatedMortgage.outstandingBalance = Math.max(
								0,
								updatedMortgage.outstandingBalance - principalPayment
							);
						}
						
						return updatedMortgage;
					});
					
					// Remove fully paid off mortgages
					state.player.mortgages = state.player.mortgages.filter(
						(m) => m.outstandingBalance > 0.01
					);
					
					// Handle negative balance - charge interest at base rate
					if (state.player.cash < 0) {
						const negativeBalanceInterest = Math.abs(state.player.cash) * (state.economy.baseRate / 100) / 12;
						state.player.cash -= negativeBalanceInterest;
					}

					// Calculate total monthly wages
					let totalWages = 0;
					[...state.staff.estateAgents, ...state.staff.caretakers].forEach(staff => {
						totalWages += staff.currentSalary + staff.unpaidWages;
					});

					// Pay wages or track unpaid
					const staffToFire: Array<{ id: string; type: StaffType }> = [];
					
					if (state.player.cash >= totalWages) {
						// Can afford to pay everyone
						state.player.cash -= totalWages;
						state.trackingStats.totalStaffWagesPaid += totalWages;
						
						state.staff.estateAgents = state.staff.estateAgents.map(agent => ({
							...agent,
							unpaidWages: 0,
							monthsUnpaid: 0
						}));
						
						state.staff.caretakers = state.staff.caretakers.map(caretaker => ({
							...caretaker,
							unpaidWages: 0,
							monthsUnpaid: 0
						}));
					} else {
						// Cannot afford wages - track unpaid and check for quitting
						state.staff.estateAgents = state.staff.estateAgents.map(agent => {
							const newMonthsUnpaid = agent.monthsUnpaid + 1;
							if (newMonthsUnpaid >= MAX_UNPAID_MONTHS) {
								staffToFire.push({ id: agent.id, type: 'estate-agent' });
								return agent;
							}
							return {
								...agent,
								unpaidWages: agent.unpaidWages + agent.currentSalary,
								monthsUnpaid: newMonthsUnpaid
							};
						});
						
						state.staff.caretakers = state.staff.caretakers.map(caretaker => {
							const newMonthsUnpaid = caretaker.monthsUnpaid + 1;
							if (newMonthsUnpaid >= MAX_UNPAID_MONTHS) {
								staffToFire.push({ id: caretaker.id, type: 'caretaker' });
								return caretaker;
							}
							return {
								...caretaker,
								unpaidWages: caretaker.unpaidWages + caretaker.currentSalary,
								monthsUnpaid: newMonthsUnpaid
							};
						});
					}

					// Fire staff who have quit due to unpaid wages
					staffToFire.forEach(({ id, type }) => {
						// Unassign properties
						state.player.properties = state.player.properties.map((property) => {
							if (type === 'estate-agent' && property.assignedEstateAgent === id) {
								return {
									...property,
									assignedEstateAgent: null,
									listedDate: null
								};
							} else if (type === 'caretaker' && property.assignedCaretaker === id) {
								return {
									...property,
									assignedCaretaker: null
								};
							}
							return property;
						});

						// Remove from staff arrays
						if (type === 'estate-agent') {
							state.staff.estateAgents = state.staff.estateAgents.filter(s => s.id !== id);
						} else {
							state.staff.caretakers = state.staff.caretakers.filter(s => s.id !== id);
						}
					});

					// Apply inflation to staff wages (only if positive inflation)
					if (state.economy.inflationRate > 0) {
						const inflationMultiplier = 1 + (state.economy.inflationRate / 100);
						
						state.staff.estateAgents = state.staff.estateAgents.map(agent => ({
							...agent,
							currentSalary: agent.currentSalary * inflationMultiplier,
							highestInflationRate: Math.max(agent.highestInflationRate, state.economy.inflationRate)
						}));
						
						state.staff.caretakers = state.staff.caretakers.map(caretaker => ({
							...caretaker,
							currentSalary: caretaker.currentSalary * inflationMultiplier,
							highestInflationRate: Math.max(caretaker.highestInflationRate, state.economy.inflationRate)
						}));
					}
					
				}
				
				// Capture annual balance sheet snapshot on UK tax year start (April 6th)
				if (isUKTaxYearStart(newDate)) {
					const balanceSheet = calculateOverallBalanceSheet(
						state.player.properties,
						state.player.mortgages,
						state.player.cash,
						newDate,
						state.staff,
						state.player.totalInterestEarned,
						state.player.propertySales
					);
					
					// Add to history and keep only last 50 tax years
					state.balanceSheetHistory.push(balanceSheet);
					
					// Check for 50-year win condition (only if game hasn't ended yet)
					if (state.balanceSheetHistory.length === 50 && !state.gameWin && !state.gameOver) {
						// Calculate comprehensive win stats
						const finalNetWorth = calculateNetWorth(state);
						
						// Calculate best property
						let bestProperty = null;
						let highestProfit = -Infinity;
						
						// Check sold properties
						state.player.propertySales.forEach(sale => {
							const profit = sale.salePrice + sale.totalRentIncome - sale.purchasePrice - 
								sale.totalMaintenancePaid - sale.totalMortgageInterest - sale.totalMortgagePrincipal;
							if (profit > highestProfit) {
								highestProfit = profit;
								bestProperty = { name: sale.name, totalProfit: profit };
							}
						});
						
						// Check current properties
						state.player.properties.forEach(property => {
							const currentValue = calculateMarketValue(property);
							const mortgage = state.player.mortgages.find(m => m.propertyId === property.id);
							const profit = currentValue + property.totalIncomeEarned - property.purchasePrice - 
								property.totalMaintenancePaid - (mortgage?.totalInterestPaid ?? 0);
							if (profit > highestProfit) {
								highestProfit = profit;
								bestProperty = { name: property.name, totalProfit: profit };
							}
						});
						
						// Trigger game win
						state.gameWin = {
							triggeredDate: newDate,
							finalStats: {
								gameDuration: {
									years: newDate.year - 1,
									months: newDate.month - 1,
									days: newDate.day - 1
								},
								totalPropertiesOwned: state.player.properties.length + state.player.propertySales.length,
								totalPropertiesSold: state.player.propertySales.length,
								currentPortfolio: state.player.properties.length,
								totalRentIncome: state.player.properties.reduce((sum, p) => sum + p.totalIncomeEarned, 0) +
									state.player.propertySales.reduce((sum, p) => sum + p.totalRentIncome, 0),
								totalMaintenanceCosts: state.player.properties.reduce((sum, p) => sum + p.totalMaintenancePaid, 0) +
									state.player.propertySales.reduce((sum, p) => sum + p.totalMaintenancePaid, 0),
								totalMortgageInterest: state.player.mortgages.reduce((sum, m) => sum + m.totalInterestPaid, 0) +
									state.player.propertySales.reduce((sum, p) => sum + p.totalMortgageInterest, 0),
								totalStaffWages: state.trackingStats.totalStaffWagesPaid,
								finalNetWorth,
								peakNetWorth: state.trackingStats.peakNetWorth,
								peakNetWorthDate: state.trackingStats.peakNetWorthDate,
								peakPropertiesOwned: state.trackingStats.peakPropertiesOwned,
								bestProperty
							},
							bankComparisonValue: state.bankComparisonValue
						};
						
						// Pause game
						state.gameTime.isPaused = true;
					}
					
					if (state.balanceSheetHistory.length > 50) {
						state.balanceSheetHistory = state.balanceSheetHistory.slice(-50);
					}
					
					// Pause game and show balance sheet modal (if not showing win modal)
					if (!state.gameWin) {
						state.gameTime.isPaused = true;
						state.gameTime.showBalanceSheetModal = true;
					}
				}

				// Check if maintenance is complete (1 month has passed) - runs every day
				state.player.properties = state.player.properties.map((property) => {
					if (property.isUnderMaintenance && property.maintenanceStartDate) {
						const maintenanceEndDate = addMonths(property.maintenanceStartDate, 1);
						if (isAfterOrEqual(newDate, maintenanceEndDate)) {
							return {
								...property,
								maintenance: 100,
								isUnderMaintenance: false,
								maintenanceStartDate: null
							};
						}
					}
					return property;
				});

				// Check for tenancy expiration and reset rent to global default
				state.player.properties = state.player.properties.map((property) => {
					if (property.tenancy && isAfterOrEqual(newDate, property.tenancy.endDate)) {
						// Tenancy has expired - reset to global default rent markup
						return {
							...property,
							tenancy: null,
							vacantSettings: {
								...property.vacantSettings,
								rentMarkup: state.settings.defaultRentMarkup
							},
							listedDate: null // Clear listing date so estate agent can relist
						};
					}
					return property;
				});

				// Check for property sales
				const propertiesToRemove: string[] = [];
				state.player.properties = state.player.properties.map((property) => {
					if (property.saleInfo) {
						// Validate askingPricePercentage is a valid number
						if (typeof property.saleInfo.askingPricePercentage !== 'number' || 
						    isNaN(property.saleInfo.askingPricePercentage) || 
						    property.saleInfo.askingPricePercentage <= 0) {
							console.error('Invalid askingPricePercentage:', property.saleInfo.askingPricePercentage);
							// Reset to 100% if invalid
							return {
								...property,
								saleInfo: {
									...property.saleInfo,
									askingPricePercentage: 100,
									daysOnMarket: property.saleInfo.daysOnMarket + 1
								}
							};
						}
						
						const marketValue = calculateMarketValue(property);
						const askingPrice = marketValue * (property.saleInfo.askingPricePercentage / 100);
						const priceRatio = property.saleInfo.askingPricePercentage / 100;
						const tenantBonus = property.tenancy ? 1.1 : 1.0; // 10% bonus if occupied
						const dailySaleChance = BASE_SALE_CHANCE * (1 / Math.pow(priceRatio, 2)) * tenantBonus;
						
						// Ensure sale chance is a valid positive number
						if (isNaN(dailySaleChance) || dailySaleChance <= 0) {
							console.error('Invalid dailySaleChance:', dailySaleChance, 'for property:', property.name);
							return {
								...property,
								saleInfo: {
									...property.saleInfo,
									daysOnMarket: property.saleInfo.daysOnMarket + 1
								}
							};
						}
						
						const roll = Math.random() * 100;
						if (roll < dailySaleChance) {
							// Property sold!
							// Check if property has a mortgage and pay it off
							const mortgage = state.player.mortgages.find((m) => m.propertyId === property.id);
							
							// Ensure propertySales array exists (migration safety)
							if (!state.player.propertySales) {
								state.player.propertySales = [];
							}
							
							// Record the sale before removing the property
							const propertySale: import('../types/game').PropertySale = {
								id: property.id,
								name: property.name,
								features: property.features,
								area: property.area,
								district: property.district,
								purchasePrice: property.purchasePrice,
								purchaseDate: property.purchaseDate,
								salePrice: askingPrice,
								saleDate: newDate,
								totalRentIncome: property.totalIncomeEarned,
								totalMaintenancePaid: property.totalMaintenancePaid,
								totalMortgageInterest: mortgage?.totalInterestPaid ?? 0,
								totalMortgagePrincipal: mortgage?.totalPrincipalPaid ?? 0,
								hadMortgage: mortgage !== undefined,
								mortgageBalanceAtSale: mortgage?.outstandingBalance ?? 0
							};
							state.player.propertySales.push(propertySale);
							
							// Process sale proceeds
							if (mortgage) {
								const netProceeds = askingPrice - mortgage.outstandingBalance;
								state.player.cash += netProceeds;
								// Mark mortgage propertyId as null (debt remains if underwater)
								state.player.mortgages = state.player.mortgages.map((m) => 
									m.id === mortgage.id ? { ...m, propertyId: null } : m
								);
							} else {
								state.player.cash += askingPrice;
							}
							propertiesToRemove.push(property.id);
							return property;
						}
						
						// Update days on market
						return {
							...property,
							saleInfo: {
								...property.saleInfo,
								daysOnMarket: property.saleInfo.daysOnMarket + 1
							}
						};
					}
					return property;
				});
				
				// Remove sold properties
				state.player.properties = state.player.properties.filter(
					(p) => !propertiesToRemove.includes(p.id)
				);

				// Increment daysOnMarket for all market properties
				state.propertyMarket = state.propertyMarket.map((marketProp) => ({
					...marketProp,
					daysOnMarket: marketProp.daysOnMarket + 1
				}));

				// Remove properties that have exceeded their time on market
				state.propertyMarket = state.propertyMarket.filter((marketProp) => 
					marketProp.daysOnMarket < marketProp.daysUntilRemoval
				);

				// Sporadically add new market properties (if under cap)
				if (state.propertyMarket.length < MAX_MARKET_PROPERTIES) {
					// 10% chance per day to add a new property
					const spawnChance = Math.random() * 100;
					if (spawnChance < 10) {
						state.propertyMarket.push(generateMarketProperty(state.areas, newDate));
					}
				}

				// Increment daysOnMarket for all auction properties
				state.auctionMarket = state.auctionMarket.map((auctionProp) => ({
					...auctionProp,
					daysOnMarket: auctionProp.daysOnMarket + 1
				}));

				// Remove auction properties that have been on market for 30 days
				state.auctionMarket = state.auctionMarket.filter((auctionProp) => 
					auctionProp.daysOnMarket < 30
				);

				// Sporadically add new auction properties (if under cap)
				if (state.auctionMarket.length < MAX_AUCTION_PROPERTIES) {
					// 10% chance per day to add a new property
					const spawnChance = Math.random() * 100;
					if (spawnChance < 10) {
						state.auctionMarket.push(generateAuctionProperty(state.areas, newDate));
					}
				}

				state.gameTime.currentDate = newDate;
				
				// Update tracking stats (peak net worth and properties)
				const currentNetWorth = calculateNetWorth(state);
				if (currentNetWorth > state.trackingStats.peakNetWorth) {
					state.trackingStats.peakNetWorth = currentNetWorth;
					state.trackingStats.peakNetWorthDate = newDate;
				}
				if (state.player.properties.length > state.trackingStats.peakPropertiesOwned) {
					state.trackingStats.peakPropertiesOwned = state.player.properties.length;
				}
				
				// Check foreclosure conditions (only if game hasn't ended)
				if (!state.gameOver) {
					const debt = calculateDebt(state);
					const equity = calculateEquity(state);
					const inForeclosure = debt > 0 && debt >= 2 * equity;
					
					if (inForeclosure && !state.foreclosureWarning) {
						// Start foreclosure warning
						state.foreclosureWarning = {
							isActive: true,
							daysRemaining: FORECLOSURE_GRACE_PERIOD_DAYS,
							triggeredDate: newDate,
							currentDebt: debt,
							currentEquity: equity
						};
						state.gameTime.isPaused = true; // Pause to alert player
					} else if (inForeclosure && state.foreclosureWarning) {
						// Update warning and decrement days
						state.foreclosureWarning.daysRemaining -= 1;
						state.foreclosureWarning.currentDebt = debt;
						state.foreclosureWarning.currentEquity = equity;
						
						// Check if grace period expired
						if (state.foreclosureWarning.daysRemaining <= 0) {
							// Trigger game over - TODO: calculate comprehensive stats
							state.gameOver = {
								triggeredDate: newDate,
								finalStats: {
									gameDuration: {
										years: newDate.year - 1,
										months: newDate.month - 1,
										days: newDate.day - 1
									},
									totalPropertiesOwned: state.player.properties.length + state.player.propertySales.length,
									totalPropertiesSold: state.player.propertySales.length,
									currentPortfolio: state.player.properties.length,
									totalRentIncome: state.player.properties.reduce((sum, p) => sum + p.totalIncomeEarned, 0) +
										state.player.propertySales.reduce((sum, p) => sum + p.totalRentIncome, 0),
									totalMaintenanceCosts: state.player.properties.reduce((sum, p) => sum + p.totalMaintenancePaid, 0) +
										state.player.propertySales.reduce((sum, p) => sum + p.totalMaintenancePaid, 0),
									totalMortgageInterest: state.player.mortgages.reduce((sum, m) => sum + m.totalInterestPaid, 0) +
										state.player.propertySales.reduce((sum, p) => sum + p.totalMortgageInterest, 0),
									totalStaffWages: state.trackingStats.totalStaffWagesPaid,
									totalDebt: debt,
									peakNetWorth: state.trackingStats.peakNetWorth,
									peakNetWorthDate: state.trackingStats.peakNetWorthDate,
									peakPropertiesOwned: state.trackingStats.peakPropertiesOwned,
									bestProperty: null // TODO: calculate best property
								}
							};
							state.foreclosureWarning = null;
							state.gameTime.isPaused = true;
						}
					} else if (!inForeclosure && state.foreclosureWarning) {
						// Condition resolved - cancel warning
						state.foreclosureWarning = null;
					}
				}
				
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
			periodMonths: TenancyPeriod
		) => {
			update((state) => {
				state.player.properties = state.player.properties.map((property) => {
					if (property.id === propertyId) {
						return {
							...property,
							vacantSettings: { rentMarkup, periodMonths }
						};
					}
					return property;
				});
				saveStateToStorage(state);
				return state;
			});
		},
		carryOutMaintenance: (propertyId: string) => {
			update((state) => {
				const property = state.player.properties.find((p) => p.id === propertyId);
				if (!property || property.tenancy || property.isUnderMaintenance) {
					return state; // Cannot perform maintenance
				}

				const cost = calculateMaintenanceCost(property);
				if (state.player.cash < cost) {
					return state; // Not enough cash
				}

				state.player.cash -= cost;
				state.player.properties = state.player.properties.map((p) => {
					if (p.id === propertyId) {
						return {
							...p,
							totalMaintenancePaid: p.totalMaintenancePaid + cost,
							isUnderMaintenance: true,
							maintenanceStartDate: state.gameTime.currentDate
						};
					}
					return p;
				});

				saveStateToStorage(state);
				return state;
			});
		},
		reset: () => {
			const newState = createInitialState();
			set(newState);
			saveStateToStorage(newState);
		},
		buyPropertyInstant: (marketPropertyId: string) => {
			update((state) => {
				const marketProperty = state.propertyMarket.find((p) => p.id === marketPropertyId);
				if (!marketProperty) return state;

				const marketValue = marketProperty.baseValue * (0.5 + marketProperty.maintenance / 200);
				if (state.player.cash < marketValue) {
					return state; // Not enough cash
				}

				// Create new property from market property
				const newProperty: Property = {
					id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					name: generatePropertyName(marketProperty.features),
					baseValue: marketProperty.baseValue,
					purchaseBaseValue: marketProperty.baseValue,
					purchasePrice: marketValue,
					purchaseDate: state.gameTime.currentDate,
					totalMaintenancePaid: 0,
					features: marketProperty.features,
					area: marketProperty.area,
					district: marketProperty.district,
					districtModifier: marketProperty.districtModifier,
					totalIncomeEarned: 0,
					tenancy: null,
					vacantSettings: {
						rentMarkup: 5.0,
						periodMonths: 12
					},
					maintenance: marketProperty.maintenance,
					isUnderMaintenance: false,
					maintenanceStartDate: null,
					saleInfo: null,
					assignedEstateAgent: null,
					assignedCaretaker: null,
					listedDate: null
				};

				state.player.cash -= marketValue;
				state.player.properties.push(newProperty);
				state.propertyMarket = state.propertyMarket.filter((p) => p.id !== marketPropertyId);

				saveStateToStorage(state);
				return state;
			});
		},
		makeOffer: (marketPropertyId: string, offerPercentage: number) => {
			update((state) => {
				const marketProperty = state.propertyMarket.find((p) => p.id === marketPropertyId);
				if (!marketProperty) return state;

				const marketValue = marketProperty.baseValue * (0.5 + marketProperty.maintenance / 200);
				const offerAmount = marketValue * (offerPercentage / 100);
				
				if (state.player.cash < offerAmount) {
					return state; // Not enough cash
				}

				// Calculate base acceptance chance: (offer%)^10
				const baseAcceptanceChance = Math.pow(offerPercentage / 100, 10);
				
				// Calculate time-based bonus: 5% per 6 months (180 days) on market
				const timeBonus = Math.floor(marketProperty.daysOnMarket / 180) * 5;
				
				// Apply additive bonus (convert percentages to decimal for comparison)
				const finalAcceptanceChance = (baseAcceptanceChance * 100 + timeBonus) / 100;
				
				const roll = Math.random();

				if (roll < finalAcceptanceChance) {
					// Offer accepted!
					const newProperty: Property = {
						id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						name: generatePropertyName(marketProperty.features),
						baseValue: marketProperty.baseValue,
						purchaseBaseValue: marketProperty.baseValue,
						purchasePrice: offerAmount,
						purchaseDate: state.gameTime.currentDate,
						totalMaintenancePaid: 0,
						features: marketProperty.features,
						area: marketProperty.area,
						district: marketProperty.district,
						districtModifier: marketProperty.districtModifier,
						totalIncomeEarned: 0,
						tenancy: null,
						vacantSettings: {
							rentMarkup: 5,
							periodMonths: 12
						},
						maintenance: marketProperty.maintenance,
						isUnderMaintenance: false,
						maintenanceStartDate: null,
						saleInfo: null,
						assignedEstateAgent: null,
						assignedCaretaker: null,
						listedDate: null
					};

					state.player.cash -= offerAmount;
					state.player.properties.push(newProperty);
				}

				// Whether accepted or rejected, remove from market
				state.propertyMarket = state.propertyMarket.filter((p) => p.id !== marketPropertyId);

				saveStateToStorage(state);
				return state;
			});
		},
		listPropertyForSale: (propertyId: string, askingPricePercentage: number) => {
			update((state) => {
				const property = state.player.properties.find((p) => p.id === propertyId);
				if (!property || property.isUnderMaintenance || property.saleInfo) {
					return state; // Cannot list
				}

				state.player.properties = state.player.properties.map((p) => {
					if (p.id === propertyId) {
						return {
							...p,
							saleInfo: {
								askingPricePercentage,
								listedDate: state.gameTime.currentDate,
								daysOnMarket: 0
							}
						};
					}
					return p;
				});

				saveStateToStorage(state);
				return state;
			});
		},
		cancelListing: (propertyId: string) => {
			update((state) => {
				state.player.properties = state.player.properties.map((p) => {
					if (p.id === propertyId) {
						return {
							...p,
							saleInfo: null
						};
					}
					return p;
				});

				saveStateToStorage(state);
				return state;
			});
		},
		hireStaff: (type: StaffType, district: District) => {
			update((state) => {
				const id = `staff-${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
				const name = generateStaffName();
				const baseSalary = DISTRICT_BASE_SALARIES[district];
				
				const baseStaff = {
					id,
					name,
					type,
					district,
					baseSalary,
					currentSalary: baseSalary,
					highestInflationRate: state.economy.inflationRate,
					experienceLevel: 1 as ExperienceLevel,
					experiencePoints: 0,
					hiredDate: state.gameTime.currentDate,
					assignedProperties: [],
					unpaidWages: 0,
					monthsUnpaid: 0
				};

				if (type === 'estate-agent') {
					const agent: EstateAgent = {
						...baseStaff,
						type: 'estate-agent',
						lastAdjustmentCheck: state.gameTime.currentDate
					};
					state.staff.estateAgents.push(agent);
				} else {
					const caretaker: Caretaker = {
						...baseStaff,
						type: 'caretaker'
					};
					state.staff.caretakers.push(caretaker);
				}

				saveStateToStorage(state);
				return state;
			});
		},
		fireStaff: (staffId: string, type: StaffType) => {
			update((state) => {
				// Find and unassign all properties
				state.player.properties = state.player.properties.map((property) => {
					if (type === 'estate-agent' && property.assignedEstateAgent === staffId) {
						return {
							...property,
							assignedEstateAgent: null,
							listedDate: null
						};
					} else if (type === 'caretaker' && property.assignedCaretaker === staffId) {
						return {
							...property,
							assignedCaretaker: null
						};
					}
					return property;
				});

				// Remove staff
				if (type === 'estate-agent') {
					state.staff.estateAgents = state.staff.estateAgents.filter(s => s.id !== staffId);
				} else {
					state.staff.caretakers = state.staff.caretakers.filter(s => s.id !== staffId);
				}

				saveStateToStorage(state);
				return state;
			});
		},
		promoteStaff: (staffId: string, type: StaffType) => {
			update((state) => {
				const staffArray = type === 'estate-agent' ? state.staff.estateAgents : state.staff.caretakers;
				const staff = staffArray.find(s => s.id === staffId);
				
				if (!staff) return state;

				// Check if eligible for promotion
				const currentLevel = staff.experienceLevel;
				if (currentLevel >= 6) return state; // Max level
				
				const nextLevel = (currentLevel + 1) as ExperienceLevel;
				const requiredXP = EXPERIENCE_THRESHOLDS[nextLevel];
				if (staff.experiencePoints < requiredXP) return state;

				// Check if can afford bonus
				const bonus = staff.currentSalary * PROMOTION_BONUS_MULTIPLIER;
				if (state.player.cash < bonus) return state;

				// Apply promotion
				state.player.cash -= bonus;
				
				if (type === 'estate-agent') {
					state.staff.estateAgents = state.staff.estateAgents.map(s => {
						if (s.id === staffId) {
							return {
								...s,
								experienceLevel: nextLevel,
								currentSalary: s.currentSalary * (1 + PROMOTION_WAGE_INCREASE)
							};
						}
						return s;
					});
				} else {
					state.staff.caretakers = state.staff.caretakers.map(s => {
						if (s.id === staffId) {
							return {
								...s,
								experienceLevel: nextLevel,
								currentSalary: s.currentSalary * (1 + PROMOTION_WAGE_INCREASE)
							};
						}
						return s;
					});
				}

				saveStateToStorage(state);
				return state;
			});
		},
		assignPropertyToStaff: (propertyId: string, staffId: string, type: StaffType) => {
			update((state) => {
				const staffArray = type === 'estate-agent' ? state.staff.estateAgents : state.staff.caretakers;
				const staff = staffArray.find(s => s.id === staffId);
				const property = state.player.properties.find(p => p.id === propertyId);
				
				if (!staff || !property) return state;

				// Validate district match
				if (property.district !== staff.district) return state;

				// Validate capacity
				const capacity = PROPERTIES_PER_LEVEL[staff.experienceLevel];
				if (staff.assignedProperties.length >= capacity) return state;

				// Validate not already assigned
				if (type === 'estate-agent' && property.assignedEstateAgent) return state;
				if (type === 'caretaker' && property.assignedCaretaker) return state;

				// Assign property
				if (type === 'estate-agent') {
					state.staff.estateAgents = state.staff.estateAgents.map(s => {
						if (s.id === staffId) {
							return {
								...s,
								assignedProperties: [...s.assignedProperties, propertyId]
							};
						}
						return s;
					});
					
					state.player.properties = state.player.properties.map(p => {
						if (p.id === propertyId) {
							// If vacant and can be let, set listedDate
							const updatedProperty = {
								...p,
								assignedEstateAgent: staffId
							};
							
							if (!p.tenancy && !p.isUnderMaintenance && p.maintenance >= 25) {
								updatedProperty.listedDate = state.gameTime.currentDate;
							}
							
							return updatedProperty;
						}
						return p;
					});
				} else {
					state.staff.caretakers = state.staff.caretakers.map(s => {
						if (s.id === staffId) {
							return {
								...s,
								assignedProperties: [...s.assignedProperties, propertyId]
							};
						}
						return s;
					});
					
					state.player.properties = state.player.properties.map(p => {
						if (p.id === propertyId) {
							return {
								...p,
								assignedCaretaker: staffId
							};
						}
						return p;
					});
				}

				saveStateToStorage(state);
				return state;
			});
		},
		unassignProperty: (propertyId: string, type: StaffType) => {
			update((state) => {
				// Find and remove from staff
				if (type === 'estate-agent') {
					state.staff.estateAgents = state.staff.estateAgents.map(s => ({
						...s,
						assignedProperties: s.assignedProperties.filter(id => id !== propertyId)
					}));
					
					state.player.properties = state.player.properties.map(p => {
						if (p.id === propertyId) {
							return {
								...p,
								assignedEstateAgent: null,
								listedDate: null
							};
						}
						return p;
					});
				} else {
					state.staff.caretakers = state.staff.caretakers.map(s => ({
						...s,
						assignedProperties: s.assignedProperties.filter(id => id !== propertyId)
					}));
					
					state.player.properties = state.player.properties.map(p => {
						if (p.id === propertyId) {
							return {
								...p,
								assignedCaretaker: null
							};
						}
						return p;
					});
				}

				saveStateToStorage(state);
				return state;
			});
		},
		listPropertyNow: (propertyId: string) => {
			update((state) => {
				const property = state.player.properties.find(p => p.id === propertyId);
				
				if (!property || property.tenancy || property.isUnderMaintenance || property.maintenance < 25) {
					return state;
				}

				state.player.properties = state.player.properties.map(p => {
					if (p.id === propertyId) {
						return {
							...p,
							listedDate: state.gameTime.currentDate
						};
					}
					return p;
				});

				saveStateToStorage(state);
				return state;
			});
		},
		setDefaultRentMarkup: (rentMarkup: RentMarkup) => {
			update((state) => {
				state.settings.defaultRentMarkup = rentMarkup;
				saveStateToStorage(state);
				return state;
			});
		},
		buyPropertyWithMortgage: (
			marketPropertyId: string,
			mortgageType: MortgageType,
			depositPercentage: DepositPercentage,
			termLength: TermLength,
			fixedPeriod: FixedPeriod
		) => {
			update((state) => {
				const marketProperty = state.propertyMarket.find((p) => p.id === marketPropertyId);
				if (!marketProperty) return state;

				const marketValue = marketProperty.baseValue * (0.5 + marketProperty.maintenance / 200);
				const depositAmount = marketValue * (depositPercentage / 100);
				const loanAmount = marketValue - depositAmount;

				if (state.player.cash < depositAmount) {
					return state; // Not enough cash for deposit
				}

				// Calculate interest rate and monthly payment
				const interestRate = calculateMortgageInterestRate(
					state.economy.baseRate,
					depositPercentage,
					mortgageType
				);
				const monthlyPayment = calculateMonthlyMortgagePayment(
					loanAmount,
					interestRate,
					termLength,
					mortgageType
				);

				// Create property
				const propertyId = `property-${Date.now()}-${Math.random().toString(36).substring(7)}`;
				const newProperty: Property = {
					id: propertyId,
					name: generatePropertyName(marketProperty.features),
					baseValue: marketProperty.baseValue,
					purchaseBaseValue: marketProperty.baseValue,
					purchasePrice: marketValue,
					purchaseDate: state.gameTime.currentDate,
					totalMaintenancePaid: 0,
					features: marketProperty.features,
					area: marketProperty.area,
					district: marketProperty.district,
					districtModifier: marketProperty.districtModifier,
					totalIncomeEarned: 0,
					tenancy: null,
					vacantSettings: {
						rentMarkup: 5.0,
						periodMonths: 12
					},
					maintenance: marketProperty.maintenance,
					isUnderMaintenance: false,
					maintenanceStartDate: null,
					saleInfo: null,
					assignedEstateAgent: null,
					assignedCaretaker: null,
					listedDate: null
				};

				// Create mortgage
				const fixedPeriodEndDate = addMonths(state.gameTime.currentDate, fixedPeriod * 12);
				const mortgage: Mortgage = {
					id: `mortgage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					propertyId: propertyId,
					propertyName: newProperty.name,
					mortgageType,
					originalLoanAmount: loanAmount,
					outstandingBalance: loanAmount,
					depositPercentage,
					termLengthYears: termLength,
					fixedPeriodYears: fixedPeriod,
					fixedPeriodEndDate,
					interestRate,
					monthlyPayment,
					startDate: state.gameTime.currentDate,
					totalInterestPaid: 0,
					totalPrincipalPaid: 0
				};

				state.player.cash -= depositAmount;
				state.player.properties.push(newProperty);
				state.player.mortgages.push(mortgage);
				state.propertyMarket = state.propertyMarket.filter((p) => p.id !== marketPropertyId);

				saveStateToStorage(state);
				return state;
			});
		},
		remortgageProperty: (
			propertyId: string,
			mortgageType: MortgageType,
			depositPercentage: DepositPercentage,
			termLength: TermLength,
			fixedPeriod: FixedPeriod
		) => {
			update((state) => {
				const property = state.player.properties.find((p) => p.id === propertyId);
				const oldMortgage = state.player.mortgages.find((m) => m.propertyId === propertyId);
				
				if (!property || !oldMortgage) return state;

				// Calculate equity
				const currentValue = calculateMarketValue(property);
				const equity = currentValue - oldMortgage.outstandingBalance;

				if (equity <= 0) {
					return state; // No equity or negative equity - cannot remortgage
				}

				// Use ALL equity as deposit (not a percentage)
				const depositAmount = equity;
				const loanAmount = currentValue - depositAmount;

				// Calculate new interest rate and monthly payment
				const interestRate = calculateMortgageInterestRate(
					state.economy.baseRate,
					depositPercentage,
					mortgageType
				);
				const monthlyPayment = calculateMonthlyMortgagePayment(
					loanAmount,
					interestRate,
					termLength,
					mortgageType
				);

				const fixedPeriodEndDate = addMonths(state.gameTime.currentDate, fixedPeriod * 12);

				// Remove old mortgage and create new one
				state.player.mortgages = state.player.mortgages.filter((m) => m.id !== oldMortgage.id);
				
				const newMortgage: Mortgage = {
					id: `mortgage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					propertyId: propertyId,
					propertyName: property.name,
					mortgageType,
					originalLoanAmount: loanAmount,
					outstandingBalance: loanAmount,
					depositPercentage,
					termLengthYears: termLength,
					fixedPeriodYears: fixedPeriod,
					fixedPeriodEndDate,
					interestRate,
					monthlyPayment,
					startDate: state.gameTime.currentDate,
					totalInterestPaid: 0,
					totalPrincipalPaid: 0
				};

				state.player.mortgages.push(newMortgage);

				saveStateToStorage(state);
				return state;
			});
		},
		payOffMortgage: (mortgageId: string) => {
			update((state) => {
				const mortgage = state.player.mortgages.find((m) => m.id === mortgageId);
				if (!mortgage) return state;

				if (state.player.cash < mortgage.outstandingBalance) {
					return state; // Not enough cash
				}

				state.player.cash -= mortgage.outstandingBalance;
				state.player.mortgages = state.player.mortgages.filter((m) => m.id !== mortgageId);

				saveStateToStorage(state);
				return state;
			});
		},
		buyAuctionPropertyInstant: (auctionPropertyId: string) => {
			update((state) => {
				const auctionProperty = state.auctionMarket.find((p) => p.id === auctionPropertyId);
				if (!auctionProperty) return state;

				const marketValue = auctionProperty.baseValue * (0.5 + auctionProperty.maintenance / 200);
				if (state.player.cash < marketValue) {
					return state; // Not enough cash
				}

				// Create new property from auction property (cannot be mortgaged)
				const newProperty: Property = {
					id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					name: generatePropertyName(auctionProperty.features),
					baseValue: auctionProperty.baseValue,
					purchaseBaseValue: auctionProperty.baseValue,
					purchasePrice: marketValue,
					purchaseDate: state.gameTime.currentDate,
					totalMaintenancePaid: 0,
					features: auctionProperty.features,
					area: auctionProperty.area,
					district: auctionProperty.district,
					districtModifier: auctionProperty.districtModifier,
					totalIncomeEarned: 0,
					tenancy: null,
					vacantSettings: {
						rentMarkup: 5.0,
						periodMonths: 12
					},
					maintenance: auctionProperty.maintenance,
					isUnderMaintenance: false,
					maintenanceStartDate: null,
					saleInfo: null,
					assignedEstateAgent: null,
					assignedCaretaker: null,
					listedDate: null
				};

				state.player.cash -= marketValue;
				state.player.properties.push(newProperty);
				state.auctionMarket = state.auctionMarket.filter((p) => p.id !== auctionPropertyId);

				saveStateToStorage(state);
				return state;
			});
		},
		makeAuctionOffer: (auctionPropertyId: string, offerPercentage: number) => {
			update((state) => {
				const auctionProperty = state.auctionMarket.find((p) => p.id === auctionPropertyId);
				if (!auctionProperty) return state;

				const marketValue = auctionProperty.baseValue * (0.5 + auctionProperty.maintenance / 200);
				const offerAmount = marketValue * (offerPercentage / 100);
				
				if (state.player.cash < offerAmount) {
					return state; // Not enough cash
				}

				// Calculate acceptance chance: (offer%)^3 for auction properties (better than regular market)
				const acceptanceChance = Math.pow(offerPercentage / 100, 3);
				
				const roll = Math.random();

				if (roll < acceptanceChance) {
					// Offer accepted!
					const newProperty: Property = {
						id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						name: generatePropertyName(auctionProperty.features),
						baseValue: auctionProperty.baseValue,
						purchaseBaseValue: auctionProperty.baseValue,
						purchasePrice: offerAmount,
						purchaseDate: state.gameTime.currentDate,
						totalMaintenancePaid: 0,
						features: auctionProperty.features,
						area: auctionProperty.area,
						district: auctionProperty.district,
						districtModifier: auctionProperty.districtModifier,
						totalIncomeEarned: 0,
						tenancy: null,
						vacantSettings: {
							rentMarkup: 5,
							periodMonths: 12
						},
						maintenance: auctionProperty.maintenance,
						isUnderMaintenance: false,
						maintenanceStartDate: null,
						saleInfo: null,
						assignedEstateAgent: null,
						assignedCaretaker: null,
						listedDate: null
					};

					state.player.cash -= offerAmount;
					state.player.properties.push(newProperty);
				}

				// Whether accepted or rejected, remove from auction market
				state.auctionMarket = state.auctionMarket.filter((p) => p.id !== auctionPropertyId);

				saveStateToStorage(state);
				return state;
			});
		},
		dismissBalanceSheetModal: () => {
			update((state) => {
				state.gameTime.showBalanceSheetModal = false;
				state.gameTime.isPaused = false;
				saveStateToStorage(state);
				return state;
			});
		},
		dismissGameWinModal: () => {
			update((state) => {
				state.canPrestigeNow = true;
				state.gameWin = null;
				state.gameTime.isPaused = false;
				saveStateToStorage(state);
				return state;
			});
		},
		openPrestigeModal: () => {
			update((state) => {
				state.canPrestigeNow = true;
				state.gameWin = null;
				saveStateToStorage(state);
				return state;
			});
		}
	};
}

export const gameState = createGameStore();
