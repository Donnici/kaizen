import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CREATE_FIXED_EXPENSE_USE_CASE } from './application/use-cases/create-fixed-expense.use-case';
import { CreateFixedExpenseUseCaseImpl } from './application/use-cases/create-fixed-expense.use-case.impl';
import { CREATE_FIXED_INCOME_USE_CASE } from './application/use-cases/create-fixed-income.use-case';
import { CreateFixedIncomeUseCaseImpl } from './application/use-cases/create-fixed-income.use-case.impl';
import { CREATE_VARIABLE_EXPENSE_USE_CASE } from './application/use-cases/create-variable-expense.use-case';
import { CreateVariableExpenseUseCaseImpl } from './application/use-cases/create-variable-expense.use-case.impl';
import { CREATE_VARIABLE_INCOME_USE_CASE } from './application/use-cases/create-variable-income.use-case';
import { CreateVariableIncomeUseCaseImpl } from './application/use-cases/create-variable-income.use-case.impl';
import { DELETE_VARIABLE_EXPENSE_USE_CASE } from './application/use-cases/delete-variable-expense.use-case';
import { DeleteVariableExpenseUseCaseImpl } from './application/use-cases/delete-variable-expense.use-case.impl';
import { DELETE_VARIABLE_INCOME_USE_CASE } from './application/use-cases/delete-variable-income.use-case';
import { DeleteVariableIncomeUseCaseImpl } from './application/use-cases/delete-variable-income.use-case.impl';
import { DELETE_FIXED_EXPENSE_USE_CASE } from './application/use-cases/delete-fixed-expense/delete-fixed-expense.use-case';
import { DeleteFixedExpenseUseCaseImpl } from './application/use-cases/delete-fixed-expense/delete-fixed-expense.use-case.impl';
import { DELETE_FIXED_INCOME_USE_CASE } from './application/use-cases/delete-fixed-income/delete-fixed-income.use-case';
import { DeleteFixedIncomeUseCaseImpl } from './application/use-cases/delete-fixed-income/delete-fixed-income.use-case.impl';
import { GET_FINANCE_SUMMARY_USE_CASE } from './application/use-cases/get-finance-summary.use-case';
import { GetFinanceSummaryUseCaseImpl } from './application/use-cases/get-finance-summary.use-case.impl';
import { LIST_FIXED_EXPENSES_USE_CASE } from './application/use-cases/list-fixed-expenses.use-case';
import { ListFixedExpensesUseCaseImpl } from './application/use-cases/list-fixed-expenses.use-case.impl';
import { LIST_FIXED_INCOMES_USE_CASE } from './application/use-cases/list-fixed-incomes.use-case';
import { ListFixedIncomesUseCaseImpl } from './application/use-cases/list-fixed-incomes.use-case.impl';
import { LIST_VARIABLE_EXPENSES_USE_CASE } from './application/use-cases/list-variable-expenses.use-case';
import { ListVariableExpensesUseCaseImpl } from './application/use-cases/list-variable-expenses.use-case.impl';
import { LIST_VARIABLE_INCOMES_USE_CASE } from './application/use-cases/list-variable-incomes.use-case';
import { ListVariableIncomesUseCaseImpl } from './application/use-cases/list-variable-incomes.use-case.impl';
import { RECALCULATE_SUMMARY_USE_CASE } from './application/use-cases/recalculate-summary.use-case';
import { RecalculateSummaryUseCaseImpl } from './application/use-cases/recalculate-summary.use-case.impl';
import { UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE } from './application/use-cases/update-fixed-expense-amount.use-case';
import { UpdateFixedExpenseAmountUseCaseImpl } from './application/use-cases/update-fixed-expense-amount.use-case.impl';
import { UPDATE_FIXED_INCOME_AMOUNT_USE_CASE } from './application/use-cases/update-fixed-income-amount.use-case';
import { UpdateFixedIncomeAmountUseCaseImpl } from './application/use-cases/update-fixed-income-amount.use-case.impl';
import { FIXED_EXPENSE_REPOSITORY } from './domain/repositories/fixed-expense.repository.interface';
import { FIXED_EXPENSE_REVISION_REPOSITORY } from './domain/repositories/fixed-expense-revision.repository.interface';
import { FIXED_INCOME_REPOSITORY } from './domain/repositories/fixed-income.repository.interface';
import { FIXED_INCOME_REVISION_REPOSITORY } from './domain/repositories/fixed-income-revision.repository.interface';
import { MONTHLY_SUMMARY_REPOSITORY } from './domain/repositories/monthly-summary.repository.interface';
import { VARIABLE_EXPENSE_REPOSITORY } from './domain/repositories/variable-expense.repository.interface';
import { VARIABLE_INCOME_REPOSITORY } from './domain/repositories/variable-income.repository.interface';
import { MongooseFixedExpenseRepository } from './infrastructure/repositories/mongoose-fixed-expense.repository';
import { MongooseFixedExpenseRevisionRepository } from './infrastructure/repositories/mongoose-fixed-expense-revision.repository';
import { MongooseFixedIncomeRepository } from './infrastructure/repositories/mongoose-fixed-income.repository';
import { MongooseFixedIncomeRevisionRepository } from './infrastructure/repositories/mongoose-fixed-income-revision.repository';
import { MongooseMonthlySummaryRepository } from './infrastructure/repositories/mongoose-monthly-summary.repository';
import { MongooseVariableExpenseRepository } from './infrastructure/repositories/mongoose-variable-expense.repository';
import { MongooseVariableIncomeRepository } from './infrastructure/repositories/mongoose-variable-income.repository';
import {
	FixedExpenseRecord,
	FixedExpenseSchema,
} from './infrastructure/schemas/fixed-expense.schema';
import {
	FixedExpenseRevisionRecord,
	FixedExpenseRevisionSchema,
} from './infrastructure/schemas/fixed-expense-revision.schema';
import {
	FixedIncomeRecord,
	FixedIncomeSchema,
} from './infrastructure/schemas/fixed-income.schema';
import {
	FixedIncomeRevisionRecord,
	FixedIncomeRevisionSchema,
} from './infrastructure/schemas/fixed-income-revision.schema';
import {
	MonthlySummaryRecord,
	MonthlySummarySchema,
} from './infrastructure/schemas/monthly-summary.schema';
import {
	VariableExpenseRecord,
	VariableExpenseSchema,
} from './infrastructure/schemas/variable-expense.schema';
import {
	VariableIncomeRecord,
	VariableIncomeSchema,
} from './infrastructure/schemas/variable-income.schema';
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
			{ name: FixedIncomeRecord.name, schema: FixedIncomeSchema },
			{
				name: FixedIncomeRevisionRecord.name,
				schema: FixedIncomeRevisionSchema,
			},
			{ name: VariableIncomeRecord.name, schema: VariableIncomeSchema },
			{ name: MonthlySummaryRecord.name, schema: MonthlySummarySchema },
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
			provide: FIXED_INCOME_REPOSITORY,
			useClass: MongooseFixedIncomeRepository,
		},
		{
			provide: FIXED_INCOME_REVISION_REPOSITORY,
			useClass: MongooseFixedIncomeRevisionRepository,
		},
		{
			provide: VARIABLE_INCOME_REPOSITORY,
			useClass: MongooseVariableIncomeRepository,
		},
		{
			provide: MONTHLY_SUMMARY_REPOSITORY,
			useClass: MongooseMonthlySummaryRepository,
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
		{
			provide: DELETE_FIXED_EXPENSE_USE_CASE,
			useClass: DeleteFixedExpenseUseCaseImpl,
		},
		{
			provide: CREATE_FIXED_INCOME_USE_CASE,
			useClass: CreateFixedIncomeUseCaseImpl,
		},
		{
			provide: UPDATE_FIXED_INCOME_AMOUNT_USE_CASE,
			useClass: UpdateFixedIncomeAmountUseCaseImpl,
		},
		{
			provide: LIST_FIXED_INCOMES_USE_CASE,
			useClass: ListFixedIncomesUseCaseImpl,
		},
		{
			provide: CREATE_VARIABLE_INCOME_USE_CASE,
			useClass: CreateVariableIncomeUseCaseImpl,
		},
		{
			provide: LIST_VARIABLE_INCOMES_USE_CASE,
			useClass: ListVariableIncomesUseCaseImpl,
		},
		{
			provide: DELETE_VARIABLE_INCOME_USE_CASE,
			useClass: DeleteVariableIncomeUseCaseImpl,
		},
		{
			provide: DELETE_FIXED_INCOME_USE_CASE,
			useClass: DeleteFixedIncomeUseCaseImpl,
		},
		{
			provide: RECALCULATE_SUMMARY_USE_CASE,
			useClass: RecalculateSummaryUseCaseImpl,
		},
		{
			provide: GET_FINANCE_SUMMARY_USE_CASE,
			useClass: GetFinanceSummaryUseCaseImpl,
		},
	],
})
export class FinancialModule {}
