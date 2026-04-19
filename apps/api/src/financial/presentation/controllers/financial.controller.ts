import type { RequestUser } from '@kaizen/utils';
import {
	Body,
	Controller,
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
	type IListFixedExpensesUseCase,
	LIST_FIXED_EXPENSES_USE_CASE,
} from '../../application/use-cases/list-fixed-expenses.use-case';
import {
	type IUpdateFixedExpenseAmountUseCase,
	UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE,
} from '../../application/use-cases/update-fixed-expense-amount.use-case';
import { FixedExpenseNotFoundError } from '../../domain/errors/fixed-expense-not-found.error';
import {
	type CreateFixedExpenseDto,
	CreateFixedExpenseSchema,
} from '../dtos/create-fixed-expense.dto';
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
	) {}

	@Post('fixed-expenses')
	@HttpCode(201)
	async createFixedExpense(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(CreateFixedExpenseSchema))
		dto: CreateFixedExpenseDto,
	) {
		try {
			return await this.createFixedExpenseUseCase.execute({ ...dto, user });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}

	@Patch('fixed-expenses/:id')
	@HttpCode(200)
	async updateFixedExpenseAmount(
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

	@Get('fixed-expenses')
	@HttpCode(200)
	async listFixedExpenses(
		@CurrentUser() user: RequestUser,
		@Query(new ZodValidationPipe(ListFixedExpensesSchema))
		query: ListFixedExpensesDto,
	) {
		try {
			return await this.listFixedExpensesUseCase.execute({
				user,
				month: query.month,
			});
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}
}
