import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CREATE_FIXED_EXPENSE_USE_CASE } from './application/use-cases/create-fixed-expense.use-case';
import { CreateFixedExpenseUseCaseImpl } from './application/use-cases/create-fixed-expense.use-case.impl';
import { LIST_FIXED_EXPENSES_USE_CASE } from './application/use-cases/list-fixed-expenses.use-case';
import { ListFixedExpensesUseCaseImpl } from './application/use-cases/list-fixed-expenses.use-case.impl';
import { UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE } from './application/use-cases/update-fixed-expense-amount.use-case';
import { UpdateFixedExpenseAmountUseCaseImpl } from './application/use-cases/update-fixed-expense-amount.use-case.impl';
import { FIXED_EXPENSE_REVISION_REPOSITORY } from './domain/repositories/fixed-expense-revision.repository.interface';
import { FIXED_EXPENSE_REPOSITORY } from './domain/repositories/fixed-expense.repository.interface';
import { MongooseFixedExpenseRevisionRepository } from './infrastructure/repositories/mongoose-fixed-expense-revision.repository';
import { MongooseFixedExpenseRepository } from './infrastructure/repositories/mongoose-fixed-expense.repository';
import {
	FixedExpenseRevisionRecord,
	FixedExpenseRevisionSchema,
} from './infrastructure/schemas/fixed-expense-revision.schema';
import {
	FixedExpenseRecord,
	FixedExpenseSchema,
} from './infrastructure/schemas/fixed-expense.schema';
import { FinancialController } from './presentation/controllers/financial.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: FixedExpenseRecord.name, schema: FixedExpenseSchema },
			{
				name: FixedExpenseRevisionRecord.name,
				schema: FixedExpenseRevisionSchema,
			},
		]),
	],
	controllers: [FinancialController],
	providers: [
		{
			provide: FIXED_EXPENSE_REPOSITORY,
			useClass: MongooseFixedExpenseRepository,
		},
		{
			provide: FIXED_EXPENSE_REVISION_REPOSITORY,
			useClass: MongooseFixedExpenseRevisionRepository,
		},
		{
			provide: CREATE_FIXED_EXPENSE_USE_CASE,
			useClass: CreateFixedExpenseUseCaseImpl,
		},
		{
			provide: UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE,
			useClass: UpdateFixedExpenseAmountUseCaseImpl,
		},
		{
			provide: LIST_FIXED_EXPENSES_USE_CASE,
			useClass: ListFixedExpensesUseCaseImpl,
		},
	],
})
export class FinancialModule {}
