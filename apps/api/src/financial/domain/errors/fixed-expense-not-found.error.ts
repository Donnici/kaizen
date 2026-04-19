export class FixedExpenseNotFoundError extends Error {
	constructor() {
		super('Fixed expense not found');
		this.name = 'FixedExpenseNotFoundError';
	}
}
