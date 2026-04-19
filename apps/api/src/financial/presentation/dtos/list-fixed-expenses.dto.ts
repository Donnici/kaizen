import { z } from 'zod';

export const ListFixedExpensesSchema = z.object({
	month: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Expected YYYY-MM')
		.optional(),
});

export type ListFixedExpensesDto = z.infer<typeof ListFixedExpensesSchema>;
