import type { GameDate } from '../types/game';

export function createDate(year: number, month: number, day: number): GameDate {
	return { year, month, day };
}

export function addDays(date: GameDate, days: number): GameDate {
	let { year, month, day } = date;
	day += days;

	while (day > getDaysInMonth(year, month)) {
		day -= getDaysInMonth(year, month);
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
	}

	return { year, month, day };
}

export function addMonths(date: GameDate, months: number): GameDate {
	let { year, month, day } = date;
	month += months;

	while (month > 12) {
		month -= 12;
		year++;
	}

	// Handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
	const maxDay = getDaysInMonth(year, month);
	if (day > maxDay) {
		day = maxDay;
	}

	return { year, month, day };
}

export function getDaysInMonth(year: number, month: number): number {
	const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (month === 2 && isLeapYear(year)) {
		return 29;
	}
	return daysInMonth[month - 1];
}

export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isSameDate(date1: GameDate, date2: GameDate): boolean {
	return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
}

export function isAfterOrEqual(date1: GameDate, date2: GameDate): boolean {
	if (date1.year > date2.year) return true;
	if (date1.year < date2.year) return false;
	if (date1.month > date2.month) return true;
	if (date1.month < date2.month) return false;
	return date1.day >= date2.day;
}

export function calculateDaysRemaining(currentDate: GameDate, endDate: GameDate): number {
	// Simple approximation
	const currentDays = currentDate.year * 365 + currentDate.month * 30 + currentDate.day;
	const endDays = endDate.year * 365 + endDate.month * 30 + endDate.day;
	return Math.max(0, endDays - currentDays);
}

export function isNewQuarter(previousDate: GameDate, currentDate: GameDate): boolean {
	// Quarters start in months 1, 4, 7, 10
	const getQuarter = (month: number) => Math.floor((month - 1) / 3);
	const prevQuarter = getQuarter(previousDate.month);
	const currQuarter = getQuarter(currentDate.month);
	
	// Check if we've moved to a new quarter
	return currQuarter !== prevQuarter || currentDate.year !== previousDate.year;
}

export function formatDate(date: GameDate): string {
	const monthNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];
	return `${date.day} ${monthNames[date.month - 1]} ${date.year}`;
}
