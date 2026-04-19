import { z } from 'zod';

export const UpdateFixedExpenseAmountSchema = z.object({
	amount: z
		.number({ error: 'Amount must be a number' })
		.int('Amount must be an integer')
		.positive('Amount must be a positive integer'),
});

export type UpdateFixedExpenseAmountDto = z.infer<
	typeof UpdateFixedExpenseAmountSchema
>;
