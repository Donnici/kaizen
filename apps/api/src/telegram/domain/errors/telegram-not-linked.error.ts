export class TelegramNotLinkedError extends Error {
	constructor() {
		super('Telegram account not linked');
		this.name = 'TelegramNotLinkedError';
	}
}
