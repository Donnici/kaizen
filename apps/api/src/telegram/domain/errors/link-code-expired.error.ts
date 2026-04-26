export class LinkCodeExpiredError extends Error {
	constructor() {
		super('Link code has expired');
		this.name = 'LinkCodeExpiredError';
	}
}
