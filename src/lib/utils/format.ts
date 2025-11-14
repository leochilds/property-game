/**
 * Formats a number as currency with comma separators
 * @param amount The monetary amount to format
 * @returns Formatted currency string (e.g., "£1,234,567.89")
 */
export function formatCurrency(amount: number): string {
	// Handle undefined, null, or NaN values
	const safeAmount = amount ?? 0;
	return `£${safeAmount.toLocaleString('en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}

/**
 * Formats a number as a percentage
 * @param value The value to format as percentage
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export function formatPercent(value: number, decimals: number = 2): string {
	return `${value.toFixed(decimals)}%`;
}
