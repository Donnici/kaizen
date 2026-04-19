import { z } from 'zod';

const fixedIncomeSchema = z.object({
	type: z.literal('fixed'),
	name: z.string().min(1, 'Name is required'),
	amount: z
		.number({ error: 'Amount must be a number' })
		.int('Amount must be an integer')
		.positive('Amount must be a positive integer'),
});

const variableIncomeSchema = z.object({
	type: z.literal('variable'),
	name: z.string().min(1, 'Name is required'),
	amount: z
		.number({ error: 'Amount must be a number' })
		.int('Amount must be an integer')
		.positive('Amount must be a positive integer'),
	category: z.string().min(1).optional(),
	date: z
		.string()
		.regex(
			/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
			'Invalid date format. Expected YYYY-MM-DD',
		),
});

export const CreateIncomeSchema = z.discriminatedUnion('type', [
	fixedIncomeSchema,
	variableIncomeSchema,
]);

export type CreateIncomeDto = z.infer<typeof CreateIncomeSchema>;
