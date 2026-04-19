export class VariableExpense {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly name: string,
		public readonly amount: number,
		public readonly category: string | undefined,
		public readonly date: string,
		public readonly createdAt: Date,
	) {}
}
