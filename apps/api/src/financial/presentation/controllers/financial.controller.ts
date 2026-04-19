import type { RequestUser } from '@kaizen/utils';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	Inject,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import {
	CREATE_FIXED_EXPENSE_USE_CASE,
	type ICreateFixedExpenseUseCase,
} from '../../application/use-cases/create-fixed-expense.use-case';
import {
	CREATE_FIXED_INCOME_USE_CASE,
	type ICreateFixedIncomeUseCase,
} from '../../application/use-cases/create-fixed-income.use-case';
import {
	CREATE_VARIABLE_EXPENSE_USE_CASE,
	type ICreateVariableExpenseUseCase,
} from '../../application/use-cases/create-variable-expense.use-case';
import {
	CREATE_VARIABLE_INCOME_USE_CASE,
	type ICreateVariableIncomeUseCase,
} from '../../application/use-cases/create-variable-income.use-case';
import {
	DELETE_VARIABLE_EXPENSE_USE_CASE,
	type IDeleteVariableExpenseUseCase,
} from '../../application/use-cases/delete-variable-expense.use-case';
import {
	DELETE_VARIABLE_INCOME_USE_CASE,
	type IDeleteVariableIncomeUseCase,
} from '../../application/use-cases/delete-variable-income.use-case';
import {
	type IListFixedExpensesUseCase,
	LIST_FIXED_EXPENSES_USE_CASE,
} from '../../application/use-cases/list-fixed-expenses.use-case';
import {
	type IListFixedIncomesUseCase,
	LIST_FIXED_INCOMES_USE_CASE,
} from '../../application/use-cases/list-fixed-incomes.use-case';
import {
	type IListVariableExpensesUseCase,
	LIST_VARIABLE_EXPENSES_USE_CASE,
} from '../../application/use-cases/list-variable-expenses.use-case';
import {
	type IListVariableIncomesUseCase,
	LIST_VARIABLE_INCOMES_USE_CASE,
} from '../../application/use-cases/list-variable-incomes.use-case';
import {
	type IUpdateFixedExpenseAmountUseCase,
	UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE,
} from '../../application/use-cases/update-fixed-expense-amount.use-case';
import {
	type IUpdateFixedIncomeAmountUseCase,
	UPDATE_FIXED_INCOME_AMOUNT_USE_CASE,
} from '../../application/use-cases/update-fixed-income-amount.use-case';
import { FixedExpenseNotFoundError } from '../../domain/errors/fixed-expense-not-found.error';
import { FixedIncomeNotFoundError } from '../../domain/errors/fixed-income-not-found.error';
import { VariableExpenseNotFoundError } from '../../domain/errors/variable-expense-not-found.error';
import { VariableIncomeNotFoundError } from '../../domain/errors/variable-income-not-found.error';
import {
	type CreateExpenseDto,
	CreateExpenseSchema,
} from '../dtos/create-expense.dto';
import {
	type CreateIncomeDto,
	CreateIncomeSchema,
} from '../dtos/create-income.dto';
import {
	type ListFixedExpensesDto,
	ListFixedExpensesSchema,
} from '../dtos/list-fixed-expenses.dto';
import {
	type UpdateFixedExpenseAmountDto,
	UpdateFixedExpenseAmountSchema,
} from '../dtos/update-fixed-expense-amount.dto';

@Controller('financial')
export class FinancialController {
	constructor(
		@Inject(CREATE_FIXED_EXPENSE_USE_CASE)
		private readonly createFixedExpenseUseCase: ICreateFixedExpenseUseCase,
		@Inject(UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE)
		private readonly updateFixedExpenseAmountUseCase: IUpdateFixedExpenseAmountUseCase,
		@Inject(LIST_FIXED_EXPENSES_USE_CASE)
		private readonly listFixedExpensesUseCase: IListFixedExpensesUseCase,
		@Inject(CREATE_FIXED_INCOME_USE_CASE)
		private readonly createFixedIncomeUseCase: ICreateFixedIncomeUseCase,
		@Inject(UPDATE_FIXED_INCOME_AMOUNT_USE_CASE)
		private readonly updateFixedIncomeAmountUseCase: IUpdateFixedIncomeAmountUseCase,
		@Inject(LIST_FIXED_INCOMES_USE_CASE)
		private readonly listFixedIncomesUseCase: IListFixedIncomesUseCase,
		@Inject(CREATE_VARIABLE_EXPENSE_USE_CASE)
		private readonly createVariableExpenseUseCase: ICreateVariableExpenseUseCase,
		@Inject(LIST_VARIABLE_EXPENSES_USE_CASE)
		private readonly listVariableExpensesUseCase: IListVariableExpensesUseCase,
		@Inject(DELETE_VARIABLE_EXPENSE_USE_CASE)
		private readonly deleteVariableExpenseUseCase: IDeleteVariableExpenseUseCase,
		@Inject(CREATE_VARIABLE_INCOME_USE_CASE)
		private readonly createVariableIncomeUseCase: ICreateVariableIncomeUseCase,
		@Inject(LIST_VARIABLE_INCOMES_USE_CASE)
		private readonly listVariableIncomesUseCase: IListVariableIncomesUseCase,
		@Inject(DELETE_VARIABLE_INCOME_USE_CASE)
		private readonly deleteVariableIncomeUseCase: IDeleteVariableIncomeUseCase,
	) {}

	@Post('expenses')
	@HttpCode(201)
	async createExpense(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(CreateExpenseSchema)) dto: CreateExpenseDto,
	) {
		try {
			if (dto.type === 'fixed') {
				return await this.createFixedExpenseUseCase.execute({ ...dto, user });
			}
			return await this.createVariableExpenseUseCase.execute({ ...dto, user });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}

	@Get('expenses')
	@HttpCode(200)
	async listExpenses(
		@CurrentUser() user: RequestUser,
		@Query(new ZodValidationPipe(ListFixedExpensesSchema))
		query: ListFixedExpensesDto,
	) {
		try {
			const [fixed, variable] = await Promise.all([
				this.listFixedExpensesUseCase.execute({ user, month: query.month }),
				this.listVariableExpensesUseCase.execute({ user, month: query.month }),
			]);
			return [
				...fixed.map((e) => ({ ...e, type: 'fixed' as const })),
				...variable.map((e) => ({ ...e, type: 'variable' as const })),
			];
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}

	@Patch('expenses/:id')
	@HttpCode(200)
	async updateExpenseAmount(
		@CurrentUser() user: RequestUser,
		@Param('id') id: string,
		@Body(new ZodValidationPipe(UpdateFixedExpenseAmountSchema))
		dto: UpdateFixedExpenseAmountDto,
	) {
		try {
			return await this.updateFixedExpenseAmountUseCase.execute({
				...dto,
				id,
				user,
			});
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			if (error instanceof FixedExpenseNotFoundError)
				throw new NotFoundException(error.message);
			throw error;
		}
	}

	@Delete('expenses/:id')
	@HttpCode(204)
	async deleteExpense(
		@CurrentUser() user: RequestUser,
		@Param('id') id: string,
	) {
		try {
			await this.deleteVariableExpenseUseCase.execute({ user, id });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			if (error instanceof VariableExpenseNotFoundError)
				throw new NotFoundException(error.message);
			throw error;
		}
	}

	@Post('incomes')
	@HttpCode(201)
	async createIncome(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(CreateIncomeSchema)) dto: CreateIncomeDto,
	) {
		try {
			if (dto.type === 'fixed') {
				return await this.createFixedIncomeUseCase.execute({ ...dto, user });
			}
			return await this.createVariableIncomeUseCase.execute({ ...dto, user });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}

	@Get('incomes')
	@HttpCode(200)
	async listIncomes(
		@CurrentUser() user: RequestUser,
		@Query(new ZodValidationPipe(ListFixedExpensesSchema))
		query: ListFixedExpensesDto,
	) {
		try {
			const [fixed, variable] = await Promise.all([
				this.listFixedIncomesUseCase.execute({ user, month: query.month }),
				this.listVariableIncomesUseCase.execute({ user, month: query.month }),
			]);
			return [
				...fixed.map((e) => ({ ...e, type: 'fixed' as const })),
				...variable.map((e) => ({ ...e, type: 'variable' as const })),
			];
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}

	@Patch('incomes/:id')
	@HttpCode(200)
	async updateIncomeAmount(
		@CurrentUser() user: RequestUser,
		@Param('id') id: string,
		@Body(new ZodValidationPipe(UpdateFixedExpenseAmountSchema))
		dto: UpdateFixedExpenseAmountDto,
	) {
		try {
			return await this.updateFixedIncomeAmountUseCase.execute({
				...dto,
				id,
				user,
			});
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			if (error instanceof FixedIncomeNotFoundError)
				throw new NotFoundException(error.message);
			throw error;
		}
	}

	@Delete('incomes/:id')
	@HttpCode(204)
	async deleteIncome(
		@CurrentUser() user: RequestUser,
		@Param('id') id: string,
	) {
		try {
			await this.deleteVariableIncomeUseCase.execute({ user, id });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			if (error instanceof VariableIncomeNotFoundError)
				throw new NotFoundException(error.message);
			throw error;
		}
	}
}
