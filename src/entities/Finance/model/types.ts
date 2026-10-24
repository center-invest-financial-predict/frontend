/** Amount in rubles (can be negative). Dates are ISO `YYYY-MM-DD`. */

export type CashflowPointDto = {
	date: string;
	balance: number;
	pessimisticBalance?: number | null;
	lowerBound?: number | null;
	upperBound?: number | null;
};

export type CashflowGapDto = {
	date: string;
	balance: number;
};

export type CashflowSeriesDto = {
	points: CashflowPointDto[];
	gap?: CashflowGapDto | null;
	/** Index of "today" marker; default 0 for forecast, last for history. */
	todayIndex?: number;
};

export type TodayKpiId = "balance" | "min30" | "in30" | "out30";

export type TodayKpiDto = {
	id: TodayKpiId;
	value: number;
	trendValue?: number | null;
	/** Default `money`. */
	trendUnit?: "money" | "percent";
	sparkline?: number[];
};

export type TodayDayEventDto = {
	id: string;
	name: string;
	amount: number;
	source: string;
	basis?: string;
};

export type TodayDayRowDto = {
	id: string;
	date: string;
	inflow: number;
	outflow: number;
	balance: number;
	negativeBalance: number;
	startBalance: number;
	endBalance: number;
	residual?: number | null;
	events: TodayDayEventDto[];
};

export type TodayPeriodBucketDto = {
	id: string;
	label: string;
	inflow: number;
	outflow: number;
};

export type TodayCategoryDto = {
	id: string;
	name: string;
	amount: number;
};

export type TodayPaymentDto = {
	id: string;
	date: string;
	name: string;
	amount: number;
};

export type TodayAlertDto = {
	id: string;
	title: string;
	meta: string;
	tone: "danger" | "warning" | "ok" | "muted";
};

export type TodayActionDto = {
	id: string;
	title: string;
	conclusion: string;
	comparable: boolean;
};

export type TodayRiskDto = {
	amount: number;
	date: string;
	subtitle: string;
	calculatedAt?: string;
};

export type TodayStripDto = {
	today: number;
	min: number;
	day30: number;
};

export type TodayFlowsDto = {
	inflow30: number;
	outflow30: number;
	inflowBars: number[];
	outflowBars: number[];
};

export type TodayDashboardDto = {
	risk?: TodayRiskDto | null;
	kpis: TodayKpiDto[];
	cashflow: CashflowSeriesDto;
	days: TodayDayRowDto[];
	periods: {
		day: TodayPeriodBucketDto[];
		week: TodayPeriodBucketDto[];
		month: TodayPeriodBucketDto[];
	};
	categories: TodayCategoryDto[];
	upcoming: TodayPaymentDto[];
	alerts: TodayAlertDto[];
	actions: TodayActionDto[];
	strip: TodayStripDto;
	flows: TodayFlowsDto;
};

export type ForecastScenarioKey = "delay" | "drop" | "fixed" | "skip";

export type ForecastScenarioOptionDto = {
	value: string;
	label: string;
};

export type ForecastScenarioDto = {
	key: ForecastScenarioKey;
	title: string;
	options: ForecastScenarioOptionDto[];
	defaultValue: string;
};

export type ForecastQueryArgs = {
	range?: 14 | 30 | string;
	delay?: string;
	drop?: string;
	fixed?: string;
	skip?: string;
	scenarioId?: string;
};

export type CompanySearchHitDto = {
	id: string;
	kind: "operation" | "event";
	date: string;
	name: string;
	amount: number;
};

export type CompanySearchDto = {
	query: string;
	items: CompanySearchHitDto[];
};

export type ForecastDayDto = {
	date: string;
	startBalance: number;
	income: number;
	expense: number;
	endBalance: number;
	otherIncomeForecast: number;
	negativeEndBalance: number;
	events: { title: string; source: string; amount: number; direction: string }[];
	stub: boolean;
};

export type SyncResultDto = {
	inserted: number;
	duplicates: number;
	invalid: number;
	skipped: number;
};

export type ForecastResultDto = {
	cashflow: CashflowSeriesDto;
	hasGap: boolean;
	resultText: string;
	scenarios: ForecastScenarioDto[];
};

export type SavedScenarioDto = {
	id: string;
	name: string;
	minBalance: number;
	gapDate: string | null;
	hasGap: boolean;
	recalculatedAt?: string;
};

export type PlanFactDto = {
	cashflow: CashflowSeriesDto;
	factOn: number;
	planOn: number;
	diff: number;
	late?: { name: string; amount: number; meta: string } | null;
	journal: { at: string; text: string }[];
};

export type OperationDto = {
	id: string;
	date: string;
	name: string;
	amount: number;
	category: string;
};

export type OperationsQueryArgs = {
	dir?: "all" | "in" | "out";
	category?: string;
	source?: string;
	page?: number;
	size?: number;
};

export type OperationsDto = {
	items: OperationDto[];
	categories: string[];
	balanceHistory: CashflowSeriesDto;
	totals: { total: number; inflow: number; outflow: number; count: number };
};

export type RegularOperationDto = {
	id: string;
	name: string;
	direction: "in" | "out";
	category: string;
	period: string;
	next: string;
	amountLabel: string;
	status: string;
	needsReview: boolean;
	detail?: string;
};

export type EventTab = "exp" | "over" | "done" | "reg";

export type EventDto = {
	id: string;
	date: string;
	name: string;
	source: string;
	status: string;
	tab: EventTab;
	amount: number;
	basis?: string;
};

export type EventsDto = {
	items: EventDto[];
};

export type CalendarEventDto = {
	date: string;
	label: string;
};

export type CalendarDto = {
	year: number;
	month: number;
	today: string;
	events: CalendarEventDto[];
};

export type SourceDto = {
	id: string;
	name: string;
	description: string;
	connected: boolean;
	operationCount?: number;
	lastDataDate?: string | null;
};

export type SourcesDto = {
	items: SourceDto[];
};

export type StrategyKey = "cons" | "base" | "opt" | "own";

export type StrategyParamsDto = {
	haircutPct: number;
	delayDays: number;
	minBalanceK: number;
};

export type StrategyImpactDto = {
	probabilityPct: number;
	gapLabel: string;
	cashflow: CashflowSeriesDto;
	showRisk: boolean;
};

export type StrategiesDto = {
	active: StrategyKey;
	salaryDay: number;
	presets: Record<StrategyKey, StrategyParamsDto>;
	impact: StrategyImpactDto;
	rules: { id: string; label: string; enabled: boolean }[];
};

export type UpdateStrategiesArgs = {
	active: StrategyKey;
	params: StrategyParamsDto;
	salaryDay?: number;
	rules?: { id: string; enabled: boolean }[];
};

export type CreateEventArgs = {
	direction: "in" | "out";
	name: string;
	amount: number;
	date: string;
	category: string;
};

export type ParsedEventRowDto = {
	date: string;
	name: string;
	category: string;
	amount: number;
	ok: boolean;
};

export type ParseEventsResultDto = {
	rows: ParsedEventRowDto[];
};
