export class MonthlySummary {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly month: string,
		public readonly totalIncomes: number,
		public readonly totalExpenses: number,
		public readonly initialBalance: number,
		public readonly finalBalance: number,
	) {}
}
