/**
 * Formats a number as currency with comma separators
 * @param amount The monetary amount to format
 * @returns Formatted currency string (e.g., "£1,234,567.89")
 */
export function formatCurrency(amount: number): string {
	return `£${amount.toLocaleString('en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}
