export class VariableExpenseNotFoundError extends Error {
	constructor() {
		super('Variable expense not found');
		this.name = 'VariableExpenseNotFoundError';
	}
}
