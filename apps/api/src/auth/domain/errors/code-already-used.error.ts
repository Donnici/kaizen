export class CodeAlreadyUsedError extends Error {
	constructor() {
		super('Code has already been used');
		this.name = 'CodeAlreadyUsedError';
	}
}
