export class CodeExpiredError extends Error {
	constructor() {
		super('Code has expired');
		this.name = 'CodeExpiredError';
	}
}
