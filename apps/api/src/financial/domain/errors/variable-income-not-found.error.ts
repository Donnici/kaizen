export class VariableIncomeNotFoundError extends Error {
	constructor() {
		super('Variable income not found');
		this.name = 'VariableIncomeNotFoundError';
	}
}
