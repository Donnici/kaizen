import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CREATE_FIXED_EXPENSE_USE_CASE } from './application/use-cases/create-fixed-expense.use-case';
import { CreateFixedExpenseUseCaseImpl } from './application/use-cases/create-fixed-expense.use-case.impl';
import { CREATE_VARIABLE_EXPENSE_USE_CASE } from './application/use-cases/create-variable-expense.use-case';
import { CreateVariableExpenseUseCaseImpl } from './application/use-cases/create-variable-expense.use-case.impl';
import { DELETE_VARIABLE_EXPENSE_USE_CASE } from './application/use-cases/delete-variable-expense.use-case';
import { DeleteVariableExpenseUseCaseImpl } from './application/use-cases/delete-variable-expense.use-case.impl';
import { LIST_FIXED_EXPENSES_USE_CASE } from './application/use-cases/list-fixed-expenses.use-case';
import { ListFixedExpensesUseCaseImpl } from './application/use-cases/list-fixed-expenses.use-case.impl';
import { LIST_VARIABLE_EXPENSES_USE_CASE } from './application/use-cases/list-variable-expenses.use-case';
import { ListVariableExpensesUseCaseImpl } from './application/use-cases/list-variable-expenses.use-case.impl';
import { UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE } from './application/use-cases/update-fixed-expense-amount.use-case';
import { UpdateFixedExpenseAmountUseCaseImpl } from './application/use-cases/update-fixed-expense-amount.use-case.impl';
import { FIXED_EXPENSE_REPOSITORY } from './domain/repositories/fixed-expense.repository.interface';
import { FIXED_EXPENSE_REVISION_REPOSITORY } from './domain/repositories/fixed-expense-revision.repository.interface';
import { VARIABLE_EXPENSE_REPOSITORY } from './domain/repositories/variable-expense.repository.interface';
import { MongooseFixedExpenseRepository } from './infrastructure/repositories/mongoose-fixed-expense.repository';
import { MongooseFixedExpenseRevisionRepository } from './infrastructure/repositories/mongoose-fixed-expense-revision.repository';
import { MongooseVariableExpenseRepository } from './infrastructure/repositories/mongoose-variable-expense.repository';
import {
	FixedExpenseRecord,
	FixedExpenseSchema,
} from './infrastructure/schemas/fixed-expense.schema';
import {
	FixedExpenseRevisionRecord,
	FixedExpenseRevisionSchema,
} from './infrastructure/schemas/fixed-expense-revision.schema';
import {
	VariableExpenseRecord,
	VariableExpenseSchema,
} from './infrastructure/schemas/variable-expense.schema';
import { FinancialController } from './presentation/controllers/financial.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: FixedExpenseRecord.name, schema: FixedExpenseSchema },
			{
				name: FixedExpenseRevisionRecord.name,
				schema: FixedExpenseRevisionSchema,
			},
			{ name: VariableExpenseRecord.name, schema: VariableExpenseSchema },
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
			provide: VARIABLE_EXPENSE_REPOSITORY,
			useClass: MongooseVariableExpenseRepository,
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
		{
			provide: CREATE_VARIABLE_EXPENSE_USE_CASE,
			useClass: CreateVariableExpenseUseCaseImpl,
		},
		{
			provide: LIST_VARIABLE_EXPENSES_USE_CASE,
			useClass: ListVariableExpensesUseCaseImpl,
		},
		{
			provide: DELETE_VARIABLE_EXPENSE_USE_CASE,
			useClass: DeleteVariableExpenseUseCaseImpl,
		},
	],
})
export class FinancialModule {}
