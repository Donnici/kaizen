export class FixedExpenseRevision {
	constructor(
		public readonly id: string,
		public readonly fixedExpenseId: string,
		public readonly amount: number,
		public readonly effectiveFromMonth: string,
		public readonly createdAt: Date,
	) {}
}
