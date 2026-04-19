describe('POST /auth/verify-code', () => {
	describe('happy path (200)', () => {
		it.todo('should return JWT when code is valid and AUTH_VERIFY_CODE is present');

		it.todo('JWT should contain id, modules and features of the user');
	});

	describe('unauthorized (401)', () => {
		it.todo('should reject when identifier is not registered');

		it.todo('should reject when AUTH_VERIFY_CODE has been removed');

		it.todo('should reject when code is incorrect');

		it.todo('should reject when code has expired');

		it.todo('should reject when code has already been used');
	});

	describe('body validation (422)', () => {
		it.todo('should reject when identifier is not provided');

		it.todo('should reject when code is not provided');
	});
});
