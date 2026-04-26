export class LinkCodeNotFoundError extends Error {
	constructor() {
		super('Link code not found or already used');
		this.name = 'LinkCodeNotFoundError';
	}
}
