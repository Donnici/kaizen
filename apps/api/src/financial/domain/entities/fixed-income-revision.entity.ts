export class FixedIncomeRevision {
	constructor(
		public readonly id: string,
		public readonly fixedIncomeId: string,
		public readonly amount: number,
		public readonly effectiveFromMonth: string,
		public readonly createdAt: Date,
	) {}
}
