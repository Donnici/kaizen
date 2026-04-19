import { z } from 'zod';

const isEmailOrPhone = (val: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\+[1-9]\d{1,14}$/.test(val);

export const RequestCodeSchema = z.object({
	identifier: z
		.string()
		.min(1, 'Identifier is required')
		.refine(isEmailOrPhone, 'Must be a valid email or E.164 phone number'),
});

export type RequestCodeDto = z.infer<typeof RequestCodeSchema>;
