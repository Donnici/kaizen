export class TelegramAlreadyLinkedError extends Error {
	constructor() {
		super('This Telegram account is already linked to another user');
		this.name = 'TelegramAlreadyLinkedError';
	}
}
