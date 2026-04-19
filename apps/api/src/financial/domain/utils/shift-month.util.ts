export function shiftMonth(month: string, delta: number): string {
	const [year, m] = month.split('-').map(Number);
	const date = new Date(year, m - 1 + delta);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
