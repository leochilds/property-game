import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
	it('formats small amounts correctly', () => {
		expect(formatCurrency(10)).toBe('£10.00');
		expect(formatCurrency(99.99)).toBe('£99.99');
	});

	it('formats amounts with thousands separator', () => {
		expect(formatCurrency(1000)).toBe('£1,000.00');
		expect(formatCurrency(1234.56)).toBe('£1,234.56');
		expect(formatCurrency(10000)).toBe('£10,000.00');
	});

	it('formats large amounts with multiple comma separators', () => {
		expect(formatCurrency(100000)).toBe('£100,000.00');
		expect(formatCurrency(1000000)).toBe('£1,000,000.00');
		expect(formatCurrency(1234567.89)).toBe('£1,234,567.89');
	});

	it('handles zero', () => {
		expect(formatCurrency(0)).toBe('£0.00');
	});

	it('rounds to 2 decimal places', () => {
		expect(formatCurrency(10.999)).toBe('£11.00');
		expect(formatCurrency(10.994)).toBe('£10.99');
	});

	it('handles negative amounts', () => {
		expect(formatCurrency(-1000)).toBe('£-1,000.00');
		expect(formatCurrency(-1234.56)).toBe('£-1,234.56');
	});
});
