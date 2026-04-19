export const RECALCULATE_SUMMARY_USE_CASE = Symbol(
	'RECALCULATE_SUMMARY_USE_CASE',
);

export interface RecalculateSummaryInput {
	userId: string;
	fromMonth: string;
}

export interface IRecalculateSummaryUseCase {
	execute(input: RecalculateSummaryInput): Promise<void>;
}
