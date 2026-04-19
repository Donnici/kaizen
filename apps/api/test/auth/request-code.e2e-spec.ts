describe('POST /auth/request-code', () => {
	describe('sending code (204)', () => {
		it.todo(
			'should send code when identifier is a registered email with AUTH_REQUEST_CODE',
		);

		it.todo(
			'should send code when identifier is a registered phone with AUTH_REQUEST_CODE',
		);

		it.todo('should return 204 silently when identifier is not registered');

		it.todo(
			'should return 204 silently when AUTH_REQUEST_CODE has been removed',
		);
	});

	describe('body validation (422)', () => {
		it.todo('should reject when identifier is not provided');

		it.todo(
			'should reject when identifier is not a valid email or E.164 phone',
		);
	});
});
