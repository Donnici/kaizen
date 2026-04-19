export class FixedIncome {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly name: string,
		public readonly isActive: boolean,
		public readonly createdAt: Date,
	) {}
}
