export class PhoneAlreadyExistsError extends Error {
	constructor() {
		super('Phone already registered');
		this.name = 'PhoneAlreadyExistsError';
	}
}
