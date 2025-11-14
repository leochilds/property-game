import type { Property, Mortgage, GameDate, Staff, PropertySale } from '$lib/types/game';
import { calculateDaysRemaining } from './date';

export interface OverallBalanceSheet {
	// Snapshot Info
	snapshotDate: GameDate;
	
	// Portfolio Overview
	totalProperties: number;
	totalCash: number;
	totalPropertyValue: number;      // Sum of all market values
	totalBaseValue: number;          // Sum of all base values
	totalEquity: number;             // Total property value - total debt
	totalDebt: number;               // Sum of all mortgage balances
	netWorth: number;                // Cash + Equity
	
	// Income & Expenses (All Time)
	totalRentIncome: number;
	totalMaintenanceCosts: number;
	totalMortgageInterest: number;
	totalMortgagePrincipal: number;
	totalMortgagePayments: number;
	totalStaffCosts: number;          // Cumulative staff wages paid (all-time)
	totalInterestEarned: number;      // Cumulative interest earned on savings (all-time)
	
	// Property Sales (All Time)
	totalPropertiesSold: number;     // Number of properties sold
	totalSaleRevenue: number;        // Total revenue from all property sales
	totalSaleGains: number;          // Sum of (salePrice - purchasePrice) for all sold properties
	realizedGains: number;           // Net profit from sold properties (rent - maintenance - interest + sale gain)
	
	// Value Changes
	totalValueChange: number;        // Sum of all (currentBaseValue - purchaseBaseValue)
	totalValueChangePercent: number; // Average percentage change across portfolio
	
	// Profitability
	netOperatingIncome: number;      // Total rent - total maintenance
	netProfit: number;               // NOI - total interest
	totalGain: number;               // Net profit + value change + realized gains
	portfolioROI: number;            // Total gain / total invested (as percentage)
	
	// Average Metrics
	avgPropertyValue: number;
	avgEquityPercent: number;        // Average equity percentage across all properties
	
	// Debt Metrics
	avgInterestRate: number;         // Weighted average by outstanding balance
	debtToValueRatio: number;        // Total debt / total property value (as percentage)
	
	// Cash Flow
	avgMonthlyRentIncome: number;    // Estimated monthly rent from occupied properties
	avgMonthlyMortgagePayment: number; // Total monthly mortgage obligations
	monthlyStaffCosts: number;       // Current monthly staff wage obligations
	monthlyCashFlow: number;         // Estimated monthly rent - mortgage payments - staff costs
}

export interface PropertyBalanceSheet {
	// Purchase Info
	purchasePrice: number;
	purchaseDate: GameDate;
	daysOwned: number;
	yearsOwned: number;
	
	// Current Values
	baseValue: number;
	marketValue: number;
	
	// Value Changes
	baseValueChange: number;
	baseValueChangePercent: number;
	
	// Income & Expenses
	totalRentIncome: number;
	totalMaintenanceCosts: number;
	totalMortgageInterest: number;
	totalMortgagePrincipal: number;
	
	// Profitability
	netOperatingIncome: number;  // Rent - Maintenance
	netProfit: number;            // NOI - Interest
	totalGain: number;            // Net Profit + Value Change
	roi: number;                  // Total Gain / Purchase Price (as percentage)
	
	// Time-Based Averages
	avgAnnualProfit: number;
	avgAnnualAppreciation: number;
	avgAnnualTotalGain: number;
	
	// Mortgage Info (if applicable)
	hasMortgage: boolean;
	currentEquity: number;
	equityPercent: number;
	outstandingBalance: number;
	totalMortgagePayments: number;
	effectiveMortgageCost: number;  // Total interest / Original loan (as percentage)
}

function calculateMarketValue(property: Property): number {
	return property.baseValue * (property.maintenance / 100);
}

export function calculateBalanceSheet(
	property: Property,
	mortgage: Mortgage | undefined,
	currentDate: GameDate
): PropertyBalanceSheet {
	// Calculate days owned
	const daysOwned = Math.max(1, calculateDaysRemaining(property.purchaseDate, currentDate));
	const yearsOwned = daysOwned / 365;
	
	// Current values
	const baseValue = property.baseValue;
	const marketValue = calculateMarketValue(property);
	
	// Value changes
	const baseValueChange = baseValue - property.purchaseBaseValue;
	const baseValueChangePercent = property.purchaseBaseValue > 0 
		? (baseValueChange / property.purchaseBaseValue) * 100 
		: 0;
	
	// Income & Expenses
	const totalRentIncome = property.totalIncomeEarned;
	const totalMaintenanceCosts = property.totalMaintenancePaid;
	const totalMortgageInterest = mortgage?.totalInterestPaid ?? 0;
	const totalMortgagePrincipal = mortgage?.totalPrincipalPaid ?? 0;
	
	// Profitability
	const netOperatingIncome = totalRentIncome - totalMaintenanceCosts;
	const netProfit = netOperatingIncome - totalMortgageInterest;
	const totalGain = netProfit + baseValueChange;
	const roi = property.purchasePrice > 0 ? (totalGain / property.purchasePrice) * 100 : 0;
	
	// Time-Based Averages (avoid division by zero)
	const avgAnnualProfit = yearsOwned > 0 ? netProfit / yearsOwned : 0;
	const avgAnnualAppreciation = yearsOwned > 0 ? baseValueChange / yearsOwned : 0;
	const avgAnnualTotalGain = yearsOwned > 0 ? totalGain / yearsOwned : 0;
	
	// Mortgage Info
	const hasMortgage = mortgage !== undefined && mortgage.propertyId === property.id;
	const outstandingBalance = mortgage?.outstandingBalance ?? 0;
	const currentEquity = marketValue - outstandingBalance;
	const equityPercent = marketValue > 0 ? (currentEquity / marketValue) * 100 : 0;
	const totalMortgagePayments = totalMortgageInterest + totalMortgagePrincipal;
	const effectiveMortgageCost = mortgage?.originalLoanAmount && mortgage.originalLoanAmount > 0
		? (totalMortgageInterest / mortgage.originalLoanAmount) * 100
		: 0;
	
	return {
		purchasePrice: property.purchasePrice,
		purchaseDate: property.purchaseDate,
		daysOwned,
		yearsOwned,
		baseValue,
		marketValue,
		baseValueChange,
		baseValueChangePercent,
		totalRentIncome,
		totalMaintenanceCosts,
		totalMortgageInterest,
		totalMortgagePrincipal,
		netOperatingIncome,
		netProfit,
		totalGain,
		roi,
		avgAnnualProfit,
		avgAnnualAppreciation,
		avgAnnualTotalGain,
		hasMortgage,
		currentEquity,
		equityPercent,
		outstandingBalance,
		totalMortgagePayments,
		effectiveMortgageCost
	};
}

export function calculateOverallBalanceSheet(
	properties: Property[],
	mortgages: Mortgage[],
	cash: number,
	currentDate: GameDate,
	staff: { estateAgents: Staff[]; caretakers: Staff[] },
	totalInterestEarned: number,
	propertySales: PropertySale[] = []
): OverallBalanceSheet {
	// Calculate staff costs
	const allStaff = [...staff.estateAgents, ...staff.caretakers];
	const monthlyStaffCosts = allStaff.reduce((sum, s) => sum + s.currentSalary + s.unpaidWages, 0);
	
	// Calculate total staff costs paid (all-time)
	// Total paid = (current salary - base salary) represents inflation adjustments
	// We need to estimate cumulative wages paid based on hire date
	const totalStaffCosts = allStaff.reduce((sum, s) => {
		// Calculate months employed
		const daysEmployed = calculateDaysRemaining(s.hiredDate, currentDate);
		const monthsEmployed = Math.max(1, Math.floor(daysEmployed / 30));
		
		// Estimate average salary over employment period
		// Simple approximation: (baseSalary + currentSalary) / 2 * months
		const avgSalary = (s.baseSalary + s.currentSalary) / 2;
		const estimatedTotalPaid = avgSalary * monthsEmployed;
		
		return sum + estimatedTotalPaid;
	}, 0);
	
	// Calculate property sales metrics
	const totalPropertiesSold = propertySales.length;
	const totalSaleRevenue = propertySales.reduce((sum, sale) => sum + sale.salePrice, 0);
	const totalSaleGains = propertySales.reduce((sum, sale) => sum + (sale.salePrice - sale.purchasePrice), 0);
	const realizedGains = propertySales.reduce((sum, sale) => {
		const saleGain = sale.salePrice - sale.purchasePrice;
		const operatingProfit = sale.totalRentIncome - sale.totalMaintenancePaid - sale.totalMortgageInterest;
		return sum + operatingProfit + saleGain;
	}, 0);
	
	// If no properties, return zero state
	if (properties.length === 0) {
		return {
			snapshotDate: currentDate,
			totalProperties: 0,
			totalCash: cash,
			totalPropertyValue: 0,
			totalBaseValue: 0,
			totalEquity: 0,
			totalDebt: 0,
			netWorth: cash,
			totalRentIncome: 0,
			totalMaintenanceCosts: 0,
			totalMortgageInterest: 0,
			totalMortgagePrincipal: 0,
			totalMortgagePayments: 0,
			totalStaffCosts,
			totalInterestEarned,
			totalPropertiesSold,
			totalSaleRevenue,
			totalSaleGains,
			realizedGains,
			totalValueChange: 0,
			totalValueChangePercent: 0,
			netOperatingIncome: 0,
			netProfit: 0,
			totalGain: realizedGains,
			portfolioROI: 0,
			avgPropertyValue: 0,
			avgEquityPercent: 0,
			avgInterestRate: 0,
			debtToValueRatio: 0,
			avgMonthlyRentIncome: 0,
			avgMonthlyMortgagePayment: 0,
			monthlyStaffCosts,
			monthlyCashFlow: -monthlyStaffCosts
		};
	}
	
	// Calculate individual balance sheets
	const balanceSheets = properties.map(property => {
		const mortgage = mortgages.find(m => m.propertyId === property.id);
		return calculateBalanceSheet(property, mortgage, currentDate);
	});
	
	// Aggregate totals
	const totalProperties = properties.length;
	const totalPropertyValue = balanceSheets.reduce((sum, bs) => sum + bs.marketValue, 0);
	const totalBaseValue = balanceSheets.reduce((sum, bs) => sum + bs.baseValue, 0);
	const totalDebt = balanceSheets.reduce((sum, bs) => sum + bs.outstandingBalance, 0);
	const totalEquity = totalPropertyValue - totalDebt;
	const netWorth = cash + totalEquity;
	
	// Income & Expenses
	const totalRentIncome = balanceSheets.reduce((sum, bs) => sum + bs.totalRentIncome, 0);
	const totalMaintenanceCosts = balanceSheets.reduce((sum, bs) => sum + bs.totalMaintenanceCosts, 0);
	const totalMortgageInterest = balanceSheets.reduce((sum, bs) => sum + bs.totalMortgageInterest, 0);
	const totalMortgagePrincipal = balanceSheets.reduce((sum, bs) => sum + bs.totalMortgagePrincipal, 0);
	const totalMortgagePayments = totalMortgageInterest + totalMortgagePrincipal;
	
	// Value Changes
	const totalValueChange = balanceSheets.reduce((sum, bs) => sum + bs.baseValueChange, 0);
	const avgValueChangePercent = balanceSheets.reduce((sum, bs) => sum + bs.baseValueChangePercent, 0) / totalProperties;
	
	// Profitability
	const netOperatingIncome = totalRentIncome - totalMaintenanceCosts;
	const netProfit = netOperatingIncome - totalMortgageInterest;
	const totalGain = netProfit + totalValueChange + realizedGains;
	
	// Calculate total invested (purchase prices + sold property purchase prices)
	const totalInvested = properties.reduce((sum, p) => sum + p.purchasePrice, 0) + 
		propertySales.reduce((sum, sale) => sum + sale.purchasePrice, 0);
	const portfolioROI = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
	
	// Average Metrics
	const avgPropertyValue = totalPropertyValue / totalProperties;
	const avgEquityPercent = balanceSheets.reduce((sum, bs) => sum + bs.equityPercent, 0) / totalProperties;
	
	// Debt Metrics
	const weightedInterestSum = mortgages
		.filter(m => m.propertyId !== null)
		.reduce((sum, m) => sum + (m.interestRate * m.outstandingBalance), 0);
	const avgInterestRate = totalDebt > 0 ? weightedInterestSum / totalDebt : 0;
	const debtToValueRatio = totalPropertyValue > 0 ? (totalDebt / totalPropertyValue) * 100 : 0;
	
	// Cash Flow Estimates
	// For monthly rent: sum rent from occupied properties
	let estimatedMonthlyRent = 0;
	properties.forEach(property => {
		if (property.tenancy) {
			const annualRate = property.tenancy.rentMarkup; // Just markup, no base rate
			const annualRent = (property.tenancy.marketValueAtStart * annualRate) / 100;
			estimatedMonthlyRent += annualRent / 12;
		}
	});
	
	// For monthly mortgage payments: sum all mortgage monthly payments
	const totalMonthlyMortgagePayment = mortgages
		.filter(m => m.propertyId !== null)
		.reduce((sum, m) => {
			// For BTL, calculate interest-only payment
			if (m.mortgageType === 'btl') {
				return sum + (m.outstandingBalance * m.interestRate / 100) / 12;
			}
			// For standard, use the monthly payment
			return sum + m.monthlyPayment;
		}, 0);
	
	const monthlyCashFlow = estimatedMonthlyRent - totalMonthlyMortgagePayment - monthlyStaffCosts;
	
	return {
		snapshotDate: currentDate,
		totalProperties,
		totalCash: cash,
		totalPropertyValue,
		totalBaseValue,
		totalEquity,
		totalDebt,
		netWorth,
		totalRentIncome,
		totalMaintenanceCosts,
		totalMortgageInterest,
		totalMortgagePrincipal,
		totalMortgagePayments,
		totalStaffCosts,
		totalInterestEarned,
		totalPropertiesSold,
		totalSaleRevenue,
		totalSaleGains,
		realizedGains,
		totalValueChange,
		totalValueChangePercent: avgValueChangePercent,
		netOperatingIncome,
		netProfit,
		totalGain,
		portfolioROI,
		avgPropertyValue,
		avgEquityPercent,
		avgInterestRate,
		debtToValueRatio,
		avgMonthlyRentIncome: estimatedMonthlyRent,
		avgMonthlyMortgagePayment: totalMonthlyMortgagePayment,
		monthlyStaffCosts,
		monthlyCashFlow
	};
}
