export class InvalidCodeError extends Error {
	constructor() {
		super('Invalid code');
		this.name = 'InvalidCodeError';
	}
}
