export class TelegramLinkCode {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly code: string,
		public readonly expiresAt: Date,
		public readonly usedAt: Date | null,
	) {}
}
