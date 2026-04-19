export class FixedIncomeNotFoundError extends Error {
	constructor() {
		super('Fixed income not found');
		this.name = 'FixedIncomeNotFoundError';
	}
}
