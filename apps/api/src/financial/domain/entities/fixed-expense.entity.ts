export class FixedExpense {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly name: string,
		public readonly deletedAt: Date | null,
		public readonly createdAt: Date,
	) {}
}
