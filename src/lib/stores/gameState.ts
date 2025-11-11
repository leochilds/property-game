import { writable } from 'svelte/store';
import type { GameState, Property, TimeSpeed, GameDate, RentMarkup, TenancyPeriod, Tenancy, MarketProperty, PropertyFeatures, PropertyType, Bedrooms, GardenType, ParkingType, AreaName, Area, AreaRating, District } from '../types/game';
import { BASE_RATE, BASE_FILL_CHANCE, BASE_SALE_CHANCE, MAX_MARKET_PROPERTIES, PROPERTY_BASE_VALUE, PROPERTY_TYPE_MULTIPLIERS, BEDROOM_MULTIPLIERS, GARDEN_MULTIPLIERS, PARKING_MULTIPLIERS, CRIME_MULTIPLIERS, SCHOOLS_MULTIPLIERS, TRANSPORT_MULTIPLIERS, ECONOMY_MULTIPLIERS, INITIAL_AREAS } from '../types/game';
import { createDate, addDays, addMonths, isAfterOrEqual } from '../utils/date';

const STORAGE_KEY = 'property-game-state';
const GAME_VERSION = 8;

function randomChoice<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
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
	
	return {
		id: 'starter-home',
		name: generatePropertyName(features),
		baseValue: calculateBaseValueFromFeatures(features, areaRatings, districtModifier),
		features,
		area,
		district,
		districtModifier,
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
			properties: [createStarterHome(areas)]
		},
		propertyMarket: generateInitialMarket(areas),
		areas,
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
	const annualRate = BASE_RATE + property.tenancy.rentMarkup;
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

function tryFillProperty(property: Property, currentDate: GameDate, areas: Area[]): Property {
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
			marketValueAtStart: marketValue
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

function createGameStore() {
	const { subscribe, set, update } = writable<GameState>(loadStateFromStorage());

	return {
		subscribe,
		advanceDay: () => {
			update((state) => {
				const newDate = addDays(state.gameTime.currentDate, 1);

				// Check if it's the 1st of the month for rent collection, maintenance, and area updates
				if (newDate.day === 1) {
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

						// Check if maintenance is complete (1 month has passed)
						if (property.isUnderMaintenance && property.maintenanceStartDate) {
							const maintenanceEndDate = addMonths(property.maintenanceStartDate, 1);
							if (isAfterOrEqual(newDate, maintenanceEndDate)) {
								updatedProperty.maintenance = 100;
								updatedProperty.isUnderMaintenance = false;
								updatedProperty.maintenanceStartDate = null;

								// If auto-relist is on, try to fill the property
								if (property.vacantSettings.autoRelist) {
									updatedProperty = tryFillProperty(updatedProperty, newDate, state.areas);
								}
							}
						}

						return updatedProperty;
					});

					state.player.cash += totalRent;
					state.gameTime.lastRentCollectionDate = newDate;
				}

				// Check for tenancy expiration and scheduled maintenance
				state.player.properties = state.player.properties.map((property) => {
					if (property.tenancy && isAfterOrEqual(newDate, property.tenancy.endDate)) {
						// Tenancy has expired
						let updatedProperty = { ...property, tenancy: null };

						// Check if maintenance is scheduled
						if (property.scheduleMaintenance) {
							updatedProperty.isUnderMaintenance = true;
							updatedProperty.maintenanceStartDate = newDate;
							updatedProperty.scheduleMaintenance = false;
							return updatedProperty;
						}

						// Otherwise, try auto-relist if enabled
						if (property.vacantSettings.autoRelist) {
							return tryFillProperty(updatedProperty, newDate, state.areas);
						}

						return updatedProperty;
					}
					return property;
				});

				// Try to fill vacant properties
				state.player.properties = state.player.properties.map((property) => {
					if (!property.tenancy && property.vacantSettings.autoRelist) {
						return tryFillProperty(property, newDate, state.areas);
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
						const dailySaleChance = BASE_SALE_CHANCE * (1 / Math.pow(priceRatio, 2));
						
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
		performMaintenance: (propertyId: string) => {
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
		toggleScheduleMaintenance: (propertyId: string) => {
			update((state) => {
				state.player.properties = state.player.properties.map((property) => {
					if (property.id === propertyId) {
						return {
							...property,
							scheduleMaintenance: !property.scheduleMaintenance
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
					features: marketProperty.features,
					area: marketProperty.area,
					district: marketProperty.district,
					districtModifier: marketProperty.districtModifier,
					totalIncomeEarned: 0,
					tenancy: null,
					vacantSettings: {
						rentMarkup: 5,
						periodMonths: 12,
						autoRelist: false
					},
					maintenance: marketProperty.maintenance,
					isUnderMaintenance: false,
					scheduleMaintenance: false,
					maintenanceStartDate: null,
					saleInfo: null
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
						features: marketProperty.features,
						area: marketProperty.area,
						district: marketProperty.district,
						districtModifier: marketProperty.districtModifier,
						totalIncomeEarned: 0,
						tenancy: null,
						vacantSettings: {
							rentMarkup: 5,
							periodMonths: 12,
							autoRelist: false
						},
						maintenance: marketProperty.maintenance,
						isUnderMaintenance: false,
						scheduleMaintenance: false,
						maintenanceStartDate: null,
						saleInfo: null
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
				if (!property || property.tenancy || property.isUnderMaintenance || property.saleInfo) {
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
		}
	};
}

export const gameState = createGameStore();
