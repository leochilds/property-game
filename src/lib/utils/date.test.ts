import { describe, it, expect } from 'vitest';
import {
	createDate,
	addDays,
	addMonths,
	getDaysInMonth,
	isLeapYear,
	isSameDate,
	isAfterOrEqual,
	calculateDaysRemaining
} from './date';

describe('Date Utilities', () => {
	describe('createDate', () => {
		it('should create a date object with correct properties', () => {
			const date = createDate(2024, 3, 15);
			expect(date).toEqual({ year: 2024, month: 3, day: 15 });
		});
	});

	describe('isLeapYear', () => {
		it('should return true for years divisible by 4 but not 100', () => {
			expect(isLeapYear(2024)).toBe(true);
			expect(isLeapYear(2020)).toBe(true);
			expect(isLeapYear(2016)).toBe(true);
		});

		it('should return false for years divisible by 100 but not 400', () => {
			expect(isLeapYear(1900)).toBe(false);
			expect(isLeapYear(2100)).toBe(false);
		});

		it('should return true for years divisible by 400', () => {
			expect(isLeapYear(2000)).toBe(true);
			expect(isLeapYear(2400)).toBe(true);
		});

		it('should return false for non-leap years', () => {
			expect(isLeapYear(2023)).toBe(false);
			expect(isLeapYear(2021)).toBe(false);
		});
	});

	describe('getDaysInMonth', () => {
		it('should return correct days for 31-day months', () => {
			expect(getDaysInMonth(2024, 1)).toBe(31); // January
			expect(getDaysInMonth(2024, 3)).toBe(31); // March
			expect(getDaysInMonth(2024, 5)).toBe(31); // May
			expect(getDaysInMonth(2024, 7)).toBe(31); // July
			expect(getDaysInMonth(2024, 8)).toBe(31); // August
			expect(getDaysInMonth(2024, 10)).toBe(31); // October
			expect(getDaysInMonth(2024, 12)).toBe(31); // December
		});

		it('should return correct days for 30-day months', () => {
			expect(getDaysInMonth(2024, 4)).toBe(30); // April
			expect(getDaysInMonth(2024, 6)).toBe(30); // June
			expect(getDaysInMonth(2024, 9)).toBe(30); // September
			expect(getDaysInMonth(2024, 11)).toBe(30); // November
		});

		it('should return 28 days for February in non-leap years', () => {
			expect(getDaysInMonth(2023, 2)).toBe(28);
			expect(getDaysInMonth(2021, 2)).toBe(28);
		});

		it('should return 29 days for February in leap years', () => {
			expect(getDaysInMonth(2024, 2)).toBe(29);
			expect(getDaysInMonth(2020, 2)).toBe(29);
			expect(getDaysInMonth(2000, 2)).toBe(29);
		});
	});

	describe('addDays', () => {
		it('should add days within the same month', () => {
			const date = createDate(2024, 3, 15);
			const result = addDays(date, 10);
			expect(result).toEqual({ year: 2024, month: 3, day: 25 });
		});

		it('should handle month overflow', () => {
			const date = createDate(2024, 3, 25);
			const result = addDays(date, 10); // March has 31 days
			expect(result).toEqual({ year: 2024, month: 4, day: 4 });
		});

		it('should handle year overflow', () => {
			const date = createDate(2024, 12, 25);
			const result = addDays(date, 10);
			expect(result).toEqual({ year: 2025, month: 1, day: 4 });
		});

		it('should handle adding days across multiple months', () => {
			const date = createDate(2024, 1, 15);
			const result = addDays(date, 50);
			expect(result).toEqual({ year: 2024, month: 3, day: 5 }); // Jan 31 + Feb 29 (leap year) + 5
		});

		it('should handle February in leap years', () => {
			const date = createDate(2024, 2, 28);
			const result = addDays(date, 2);
			expect(result).toEqual({ year: 2024, month: 3, day: 1 }); // Feb 29, then March 1
		});

		it('should handle February in non-leap years', () => {
			const date = createDate(2023, 2, 27);
			const result = addDays(date, 2);
			expect(result).toEqual({ year: 2023, month: 3, day: 1 }); // Feb 28, then March 1
		});

		it('should handle adding zero days', () => {
			const date = createDate(2024, 3, 15);
			const result = addDays(date, 0);
			expect(result).toEqual({ year: 2024, month: 3, day: 15 });
		});

		it('should handle single day increment', () => {
			const date = createDate(2024, 3, 31);
			const result = addDays(date, 1);
			expect(result).toEqual({ year: 2024, month: 4, day: 1 });
		});
	});

	describe('addMonths', () => {
		it('should add months within the same year', () => {
			const date = createDate(2024, 3, 15);
			const result = addMonths(date, 3);
			expect(result).toEqual({ year: 2024, month: 6, day: 15 });
		});

		it('should handle year overflow', () => {
			const date = createDate(2024, 11, 15);
			const result = addMonths(date, 3);
			expect(result).toEqual({ year: 2025, month: 2, day: 15 });
		});

		it('should handle day overflow (Jan 31 -> Feb 28)', () => {
			const date = createDate(2023, 1, 31);
			const result = addMonths(date, 1);
			expect(result).toEqual({ year: 2023, month: 2, day: 28 }); // Feb has only 28 days
		});

		it('should handle day overflow (Jan 31 -> Feb 29 in leap year)', () => {
			const date = createDate(2024, 1, 31);
			const result = addMonths(date, 1);
			expect(result).toEqual({ year: 2024, month: 2, day: 29 }); // Leap year
		});

		it('should handle adding 12 months', () => {
			const date = createDate(2024, 3, 15);
			const result = addMonths(date, 12);
			expect(result).toEqual({ year: 2025, month: 3, day: 15 });
		});

		it('should handle adding zero months', () => {
			const date = createDate(2024, 3, 15);
			const result = addMonths(date, 0);
			expect(result).toEqual({ year: 2024, month: 3, day: 15 });
		});

		it('should handle May 31 -> June 30', () => {
			const date = createDate(2024, 5, 31);
			const result = addMonths(date, 1);
			expect(result).toEqual({ year: 2024, month: 6, day: 30 }); // June has only 30 days
		});

		it('should handle adding 24 months', () => {
			const date = createDate(2023, 6, 15);
			const result = addMonths(date, 24);
			expect(result).toEqual({ year: 2025, month: 6, day: 15 });
		});
	});

	describe('isSameDate', () => {
		it('should return true for identical dates', () => {
			const date1 = createDate(2024, 3, 15);
			const date2 = createDate(2024, 3, 15);
			expect(isSameDate(date1, date2)).toBe(true);
		});

		it('should return false for different days', () => {
			const date1 = createDate(2024, 3, 15);
			const date2 = createDate(2024, 3, 16);
			expect(isSameDate(date1, date2)).toBe(false);
		});

		it('should return false for different months', () => {
			const date1 = createDate(2024, 3, 15);
			const date2 = createDate(2024, 4, 15);
			expect(isSameDate(date1, date2)).toBe(false);
		});

		it('should return false for different years', () => {
			const date1 = createDate(2024, 3, 15);
			const date2 = createDate(2025, 3, 15);
			expect(isSameDate(date1, date2)).toBe(false);
		});
	});

	describe('isAfterOrEqual', () => {
		it('should return true when date1 is after date2', () => {
			const date1 = createDate(2024, 3, 16);
			const date2 = createDate(2024, 3, 15);
			expect(isAfterOrEqual(date1, date2)).toBe(true);
		});

		it('should return true when dates are equal', () => {
			const date1 = createDate(2024, 3, 15);
			const date2 = createDate(2024, 3, 15);
			expect(isAfterOrEqual(date1, date2)).toBe(true);
		});

		it('should return false when date1 is before date2', () => {
			const date1 = createDate(2024, 3, 14);
			const date2 = createDate(2024, 3, 15);
			expect(isAfterOrEqual(date1, date2)).toBe(false);
		});

		it('should handle year differences', () => {
			const date1 = createDate(2025, 1, 1);
			const date2 = createDate(2024, 12, 31);
			expect(isAfterOrEqual(date1, date2)).toBe(true);
		});

		it('should handle month differences', () => {
			const date1 = createDate(2024, 4, 1);
			const date2 = createDate(2024, 3, 31);
			expect(isAfterOrEqual(date1, date2)).toBe(true);
		});

		it('should return false for earlier year', () => {
			const date1 = createDate(2023, 12, 31);
			const date2 = createDate(2024, 1, 1);
			expect(isAfterOrEqual(date1, date2)).toBe(false);
		});
	});

	describe('calculateDaysRemaining', () => {
		it('should calculate days remaining correctly', () => {
			const current = createDate(1, 1, 1);
			const end = createDate(1, 1, 11);
			expect(calculateDaysRemaining(current, end)).toBe(10);
		});

		it('should return 0 when current date is past end date', () => {
			const current = createDate(1, 1, 15);
			const end = createDate(1, 1, 10);
			expect(calculateDaysRemaining(current, end)).toBe(0);
		});

		it('should return 0 when dates are equal', () => {
			const current = createDate(1, 1, 15);
			const end = createDate(1, 1, 15);
			expect(calculateDaysRemaining(current, end)).toBe(0);
		});

		it('should handle month boundaries', () => {
			const current = createDate(1, 1, 1);
			const end = createDate(1, 2, 1);
			expect(calculateDaysRemaining(current, end)).toBe(30);
		});

		it('should handle year boundaries', () => {
			const current = createDate(1, 12, 1);
			const end = createDate(2, 1, 1);
			expect(calculateDaysRemaining(current, end)).toBe(30);
		});
	});
});
