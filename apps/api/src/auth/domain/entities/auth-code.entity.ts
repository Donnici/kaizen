export class AuthCode {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly codeHash: string,
		public readonly expiresAt: Date,
		public readonly usedAt: Date | null,
		public readonly createdAt: Date,
	) {}

	get isExpired(): boolean {
		return new Date() > this.expiresAt;
	}

	get isUsed(): boolean {
		return this.usedAt !== null;
	}
}
