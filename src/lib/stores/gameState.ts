import { writable } from 'svelte/store';
import type { GameState, Property, TimeSpeed, GameDate, RentMarkup, TenancyPeriod, Tenancy, MarketProperty, PropertyFeatures, PropertyType, Bedrooms, GardenType, ParkingType, AreaName, Area, AreaRating, District, EconomicPhase, Economy, StaffType, EstateAgent, Caretaker, Staff, ExperienceLevel } from '../types/game';
import { INITIAL_BASE_RATE, MIN_BASE_RATE, TARGET_QUARTERLY_INFLATION, BASE_FILL_CHANCE, BASE_SALE_CHANCE, MAX_MARKET_PROPERTIES, PROPERTY_BASE_VALUE, PROPERTY_TYPE_MULTIPLIERS, BEDROOM_MULTIPLIERS, GARDEN_MULTIPLIERS, PARKING_MULTIPLIERS, CRIME_MULTIPLIERS, SCHOOLS_MULTIPLIERS, TRANSPORT_MULTIPLIERS, ECONOMY_MULTIPLIERS, INITIAL_AREAS, DISTRICT_BASE_SALARIES, EXPERIENCE_THRESHOLDS, PROPERTIES_PER_LEVEL, PROMOTION_BONUS_MULTIPLIER, PROMOTION_WAGE_INCREASE, XP_PER_PROPERTY_PER_DAY, MAX_UNPAID_MONTHS, STAFF_FIRST_NAMES, STAFF_LAST_NAMES } from '../types/game';
import { createDate, addDays, addMonths, isAfterOrEqual, isNewQuarter, calculateDaysRemaining } from '../utils/date';

const STORAGE_KEY = 'property-game-state';
const GAME_VERSION = 11;

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

function createStarterHome(areas: Area[]): Property {
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
		purchaseBaseValue: baseValue, // Track original value
		features,
		area,
		district,
		districtModifier,
		totalIncomeEarned: 0,
		tenancy: null,
		vacantSettings: {
			rentMarkup: 5,
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

function generateMarketProperty(areas: Area[]): MarketProperty {
	const id = `market-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const maintenance = Math.floor(Math.random() * 100) + 1; // 1-100%
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
		maintenance
	};
}

function generateInitialMarket(areas: Area[]): MarketProperty[] {
	const count = Math.floor(Math.random() * 6) + 5; // 5-10 properties
	return Array.from({ length: count }, () => generateMarketProperty(areas));
}

function createInitialState(): GameState {
	const startDate = createDate(1, 1, 1);
	const areas = JSON.parse(JSON.stringify(INITIAL_AREAS)) as Area[];
	
	return {
		player: {
			cash: 0,
			accruedInterest: 0,
			properties: [createStarterHome(areas)]
		},
		propertyMarket: generateInitialMarket(areas),
		areas,
		economy: {
			baseRate: INITIAL_BASE_RATE,
			inflationRate: 0.5, // Start at target
			economicPhase: 'expansion',
			quarterlyInflationHistory: [0.5, 0.5, 0.5, 0.5], // Initialize with target
			lastQuarterDate: startDate,
			quartersSincePhaseChange: 0
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
			} else if (parsed.version < GAME_VERSION) {
				// Migrate old saves
				parsed.player.properties = parsed.player.properties.map((property) => {
					const migratedProperty = {
						...property,
						// Version 3: Added maintenance system
						maintenance: property.maintenance ?? 100,
						isUnderMaintenance: property.isUnderMaintenance ?? false,
						scheduleMaintenance: property.scheduleMaintenance ?? false,
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
					parsed.propertyMarket = generateInitialMarket(parsed.areas);
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
						quartersSincePhaseChange: 0
					};
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
	const annualRate = property.tenancy.baseRateAtStart + property.tenancy.rentMarkup;
	const annualRent = (property.tenancy.marketValueAtStart * annualRate) / 100;
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

function calculateMarketValue(property: Property): number {
	return property.baseValue * (property.maintenance / 100);
}

function calculateMaintenanceCost(property: Property): number {
	const percentageNeeded = 100 - property.maintenance;
	const baseCost = property.baseValue * (percentageNeeded / 100);
	return baseCost * 0.25;
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
function generateQuarterlyInflation(phase: EconomicPhase): number {
	// Base inflation ranges by economic phase
	const ranges: Record<EconomicPhase, { min: number; max: number }> = {
		recession: { min: -0.5, max: 0.3 },    // Deflation possible, low inflation
		recovery: { min: 0.2, max: 0.7 },      // Rising inflation
		expansion: { min: 0.4, max: 1.0 },     // Higher inflation
		peak: { min: 0.6, max: 1.3 }           // Risk of high inflation
	};
	
	const range = ranges[phase];
	return range.min + Math.random() * (range.max - range.min);
}

function adjustBaseRate(currentRate: number, inflationRate: number): number {
	// Calculate how far from target (0.5% quarterly = 2% annually)
	const inflationGap = inflationRate - TARGET_QUARTERLY_INFLATION;
	
	// Sensitivity: how much to adjust rate for each percentage point of inflation gap
	const sensitivity = 2.0;
	
	// Calculate adjustment
	const adjustment = inflationGap * sensitivity;
	
	// Apply adjustment and enforce minimum
	const newRate = currentRate + adjustment;
	return Math.max(MIN_BASE_RATE, newRate);
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
	// Generate new inflation for this quarter
	const newInflationRate = generateQuarterlyInflation(economy.economicPhase);
	
	// Update inflation history (keep last 4 quarters)
	const newHistory = [...economy.quarterlyInflationHistory.slice(-3), newInflationRate];
	
	// Adjust base rate based on inflation
	const newBaseRate = adjustBaseRate(economy.baseRate, newInflationRate);
	
	// Check for phase transition
	const newPhase = progressEconomicCycle(economy);
	const phaseChanged = newPhase !== economy.economicPhase;
	
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
			quartersSincePhaseChange: phaseChanged ? 0 : economy.quartersSincePhaseChange + 1
		},
		properties: updatedProperties,
		marketProperties: updatedMarket
	};
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

				// Estate agent weekly adjustments
				state.player.properties = state.player.properties.map((property) => {
					if (property.assignedEstateAgent && property.listedDate && !property.tenancy) {
						const daysSinceListed = calculateDaysRemaining(property.listedDate, newDate);
						
						if (daysSinceListed >= 7) {
							// Randomly adjust rent and/or period
							const adjustment = Math.random();
							let updatedProperty = { ...property };
							
							if (adjustment < 0.4) {
								// Reduce rent markup (min 1)
								updatedProperty.vacantSettings = {
									...updatedProperty.vacantSettings,
									rentMarkup: Math.max(1, updatedProperty.vacantSettings.rentMarkup - 1) as RentMarkup
								};
							} else if (adjustment < 0.8) {
								// Shorten period
								const currentPeriod = updatedProperty.vacantSettings.periodMonths;
								let newPeriod: TenancyPeriod = currentPeriod;
								
								if (currentPeriod === 36) newPeriod = 24;
								else if (currentPeriod === 24) newPeriod = 18;
								else if (currentPeriod === 18) newPeriod = 12;
								else if (currentPeriod === 12) newPeriod = 6;
								// 6 is minimum, don't change
								
								updatedProperty.vacantSettings = {
									...updatedProperty.vacantSettings,
									periodMonths: newPeriod
								};
							} else {
								// Do both
								updatedProperty.vacantSettings = {
									rentMarkup: Math.max(1, updatedProperty.vacantSettings.rentMarkup - 1) as RentMarkup,
									periodMonths: (() => {
										const currentPeriod = updatedProperty.vacantSettings.periodMonths;
										if (currentPeriod === 36) return 24;
										if (currentPeriod === 24) return 18;
										if (currentPeriod === 18) return 12;
										if (currentPeriod === 12) return 6;
										return 6;
									})()
								};
							}
							
							// Reset listedDate for next week's check
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
					// Skip if already has tenant
					// Skip if can't be let out (maintenance < 25 or under maintenance)
					if (!property.assignedEstateAgent && !property.tenancy && canBeLetOut(property)) {
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
					state.player.cash += state.player.accruedInterest;
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

				// Check for tenancy expiration
				state.player.properties = state.player.properties.map((property) => {
					if (property.tenancy && isAfterOrEqual(newDate, property.tenancy.endDate)) {
						// Tenancy has expired
						return { ...property, tenancy: null };
					}
					return property;
				});

				// Check for property sales
				const propertiesToRemove: string[] = [];
				state.player.properties = state.player.properties.map((property) => {
					if (property.saleInfo) {
						const marketValue = calculateMarketValue(property);
						const askingPrice = marketValue * (property.saleInfo.askingPricePercentage / 100);
						const priceRatio = property.saleInfo.askingPricePercentage / 100;
						const tenantBonus = property.tenancy ? 1.1 : 1.0; // 10% bonus if occupied
						const dailySaleChance = BASE_SALE_CHANCE * (1 / Math.pow(priceRatio, 2)) * tenantBonus;
						
						const roll = Math.random() * 100;
						if (roll < dailySaleChance) {
							// Property sold!
							state.player.cash += askingPrice;
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

				// Sporadically add new market properties (if under cap)
				if (state.propertyMarket.length < MAX_MARKET_PROPERTIES) {
					// 5% chance per day to add a new property
					const spawnChance = Math.random() * 100;
					if (spawnChance < 5) {
						state.propertyMarket.push(generateMarketProperty(state.areas));
					}
				}

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

				const marketValue = marketProperty.baseValue * (marketProperty.maintenance / 100);
				if (state.player.cash < marketValue) {
					return state; // Not enough cash
				}

				// Create new property from market property
				const newProperty: Property = {
					id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					name: generatePropertyName(marketProperty.features),
					baseValue: marketProperty.baseValue,
					purchaseBaseValue: marketProperty.baseValue, // Track purchase value
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

				const marketValue = marketProperty.baseValue * (marketProperty.maintenance / 100);
				const offerAmount = marketValue * (offerPercentage / 100);
				
				if (state.player.cash < offerAmount) {
					return state; // Not enough cash
				}

				// Calculate acceptance chance: (offer%)^10
				const acceptanceChance = Math.pow(offerPercentage / 100, 10);
				const roll = Math.random();

				if (roll < acceptanceChance) {
					// Offer accepted!
					const newProperty: Property = {
						id: `property-${Date.now()}-${Math.random().toString(36).substring(7)}`,
						name: generatePropertyName(marketProperty.features),
						baseValue: marketProperty.baseValue,
						purchaseBaseValue: marketProperty.baseValue, // Track purchase value
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
		}
	};
}

export const gameState = createGameStore();
