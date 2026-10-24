import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { rtkApi } from "@/shared/api/rtkApi";
import { getActiveInn } from "@/shared/lib/companyInn";
import type {
	AlertDto,
	CategoryBucket,
	CashEventDto,
	DashboardResponse,
	ForecastSeriesResponse,
	RecommendationDto,
	WeekBucket,
} from "./mapTodayDashboard";
import type {
	CalendarDto,
	CreateEventArgs,
	EventsDto,
	EventTab,
	ForecastQueryArgs,
	ForecastResultDto,
	ForecastScenarioDto,
	OperationsDto,
	OperationsQueryArgs,
	CompanySearchDto,
	ForecastDayDto,
	ParseEventsResultDto,
	PlanFactDto,
	RegularOperationDto,
	SavedScenarioDto,
	SourcesDto,
	StrategiesDto,
	SyncResultDto,
	UpdateStrategiesArgs,
} from "../model/types";

const noInnError = (): FetchBaseQueryError => ({
	status: 400,
	data: { message: "Company INN is not set" },
});

const asError = (result: { error?: FetchBaseQueryError }): FetchBaseQueryError =>
	result.error ?? { status: 500, data: { message: "Request failed" } };

const normalizeSourceCode = (value: string): string =>
	value.trim().toUpperCase().replace(/-/g, "_");

/** Query param `source` for GET .../operations (`OperationResponse.source` enum). */
const operationsSourceParam = (code: string): string | undefined => {
	const c = normalizeSourceCode(code);
	if (c === "ONE_C" || c === "1C") return "1C";
	if (c === "CSV") return "csv";
	if (c === "GOS_SERVICE") return "Gos_service";
	return undefined;
};

type OperationsPageMeta = {
	totalElements?: number;
};

type ForecastPointRaw = {
	date: string;
	baseBalance?: number;
	negativeBalance?: number;
	confidenceLow?: number;
	confidenceHigh?: number;
};

const DEFAULT_FORECAST_SCENARIOS: ForecastScenarioDto[] = [
	{
		key: "delay",
		title: "Клиент заплатит позже",
		defaultValue: "14",
		options: [
			{ value: "7", label: "7 дн." },
			{ value: "14", label: "14 дн." },
			{ value: "21", label: "21 дн." },
		],
	},
	{
		key: "drop",
		title: "Спад выручки",
		defaultValue: "10",
		options: [
			{ value: "10", label: "−10%" },
			{ value: "20", label: "−20%" },
			{ value: "30", label: "−30%" },
		],
	},
	{
		key: "fixed",
		title: "Рост постоянных расходов",
		defaultValue: "10",
		options: [
			{ value: "5", label: "+5%" },
			{ value: "10", label: "+10%" },
			{ value: "15", label: "+15%" },
		],
	},
	{
		key: "skip",
		title: "Исключить просроченные поступления из риска",
		defaultValue: "1",
		options: [{ value: "1", label: "Да" }],
	},
];

const mapForecastPoints = (raw: ForecastPointRaw[] | undefined) =>
	(raw ?? []).map((p) => ({
		date: p.date,
		balance: p.baseBalance ?? 0,
		pessimisticBalance: p.negativeBalance ?? null,
		lowerBound: p.confidenceLow ?? null,
		upperBound: p.confidenceHigh ?? null,
	}));

const forecastConditions = (args: ForecastQueryArgs | void | undefined) => {
	const conditions: Record<string, string> = {};
	if (!args) return conditions;
	(["delay", "drop", "fixed", "skip"] as const).forEach((key) => {
		const value = args[key];
		if (value != null && String(value).length > 0) conditions[key] = String(value);
	});
	return conditions;
};

const financeApi = rtkApi.injectEndpoints({
	endpoints: (build) => ({
		getTodayOverview: build.query<DashboardResponse, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/dashboard`);
				if (result.error) return { error: asError(result) };
				return { data: (result.data as DashboardResponse) ?? {} };
			},
			providesTags: ["Today"],
		}),

		getTodayForecastBlock: build.query<ForecastSeriesResponse, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/forecast`,
					params: { horizonDays: 30 },
				});
				if (result.error) return { error: asError(result) };
				return { data: (result.data as ForecastSeriesResponse) ?? { points: [] } };
			},
			providesTags: ["Today"],
		}),

		getTodayWeekly: build.query<WeekBucket[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/cashflow/weekly`);
				if (result.error) return { error: asError(result) };
				return { data: ((result.data as { weeks?: WeekBucket[] })?.weeks ?? []) };
			},
			providesTags: ["Today"],
		}),

		getTodayCategories: build.query<CategoryBucket[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/cashflow/by-category`);
				if (result.error) return { error: asError(result) };
				return {
					data: ((result.data as { categories?: CategoryBucket[] })?.categories ?? []),
				};
			},
			providesTags: ["Today"],
		}),

		getTodayAlerts: build.query<AlertDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/alerts`);
				if (result.error) return { error: asError(result) };
				return { data: (result.data as AlertDto[]) ?? [] };
			},
			providesTags: ["Today"],
		}),

		getTodayUpcoming: build.query<CashEventDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/payments/upcoming`);
				if (result.error) return { error: asError(result) };
				return { data: (result.data as CashEventDto[]) ?? [] };
			},
			providesTags: ["Today"],
		}),

		getTodayRecommendations: build.query<RecommendationDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/recommendations`);
				if (result.error) return { error: asError(result) };
				return { data: (result.data as RecommendationDto[]) ?? [] };
			},
			providesTags: ["Today"],
		}),

		getForecast: build.query<ForecastResultDto, ForecastQueryArgs | void>({
			async queryFn(args, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const horizon =
					typeof args?.range === "number" ? args.range : Number(args?.range) || 30;
				const conditions = forecastConditions(args);
				const scenarioId = args?.scenarioId;
				const result =
					Object.keys(conditions).length > 0
						? await baseQuery({
								url: `/api/companies/${inn}/scenarios/preview`,
								method: "POST",
								body: { conditions },
							})
						: await baseQuery({
								url: `/api/companies/${inn}/forecast`,
								params: {
									horizonDays: horizon,
									...(scenarioId ? { scenarioId } : {}),
								},
							});
				if (result.error) return { error: asError(result) };
				const body = result.data as { points?: ForecastPointRaw[] };
				const points = mapForecastPoints(body.points);
				const gapPoint = points.find((p) => (p.pessimisticBalance ?? 0) < 0);
				return {
					data: {
						cashflow: {
							points,
							gap: gapPoint
								? { date: gapPoint.date, balance: gapPoint.pessimisticBalance ?? 0 }
								: null,
							todayIndex: 0,
						},
						hasGap: Boolean(gapPoint),
						resultText: gapPoint ? "gap" : "ok",
						scenarios: DEFAULT_FORECAST_SCENARIOS,
					},
				};
			},
			providesTags: ["Forecast"],
		}),

		getSavedScenarios: build.query<SavedScenarioDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/scenarios/examples`);
				if (result.error) return { error: asError(result) };
				const list = (result.data as {
					id?: string;
					name?: string;
					minBalance?: number;
					gapDate?: string | null;
					gapAmount?: number;
				}[]) ?? [];
				return {
					data: list.map((s) => ({
						id: String(s.id ?? s.name),
						name: s.name ?? "",
						minBalance: s.minBalance ?? 0,
						gapDate: s.gapDate ?? null,
						hasGap: Boolean(s.gapDate || (s.gapAmount ?? 0) < 0),
					})),
				};
			},
			providesTags: ["Scenarios"],
		}),

		getMyScenarios: build.query<SavedScenarioDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/scenarios`);
				if (result.error) return { error: asError(result) };
				const list = (result.data as {
					id?: number | string;
					name?: string;
					minBalance?: number;
					gapDate?: string | null;
				}[]) ?? [];
				return {
					data: list.map((s) => ({
						id: String(s.id),
						name: s.name ?? "",
						minBalance: s.minBalance ?? 0,
						gapDate: s.gapDate ?? null,
						hasGap: Boolean(s.gapDate),
					})),
				};
			},
			providesTags: ["Scenarios"],
		}),

		saveScenario: build.mutation<SavedScenarioDto, { name: string; params: ForecastQueryArgs }>({
			async queryFn({ name, params }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/scenarios`,
					method: "POST",
					body: { name, conditions: params },
				});
				if (result.error) return { error: asError(result) };
				const s = result.data as { id?: number | string; name?: string; gapDate?: string | null; minBalance?: number };
				return {
					data: {
						id: String(s.id),
						name: s.name ?? name,
						minBalance: s.minBalance ?? 0,
						gapDate: s.gapDate ?? null,
						hasGap: Boolean(s.gapDate),
					},
				};
			},
			invalidatesTags: ["Scenarios"],
		}),

		renameScenario: build.mutation<SavedScenarioDto, { id: string; name: string }>({
			async queryFn({ id, name }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/scenarios/${id}`,
					method: "PATCH",
					body: { name, conditions: {} },
				});
				if (result.error) return { error: asError(result) };
				const s = result.data as { id?: number | string; name?: string; gapDate?: string | null; minBalance?: number };
				return {
					data: {
						id: String(s.id ?? id),
						name: s.name ?? name,
						minBalance: s.minBalance ?? 0,
						gapDate: s.gapDate ?? null,
						hasGap: Boolean(s.gapDate),
					},
				};
			},
			invalidatesTags: ["Scenarios"],
		}),

		deleteScenario: build.mutation<{ ok: boolean }, { id: string }>({
			async queryFn({ id }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/scenarios/${id}`,
					method: "DELETE",
				});
				if (result.error) return { error: asError(result) };
				return { data: { ok: true } };
			},
			invalidatesTags: ["Scenarios", "Forecast"],
		}),

		copyScenario: build.mutation<SavedScenarioDto, { id: string }>({
			async queryFn({ id }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/scenarios/${id}/copy`,
					method: "POST",
				});
				if (result.error) return { error: asError(result) };
				const s = result.data as { id?: number | string; name?: string; gapDate?: string | null; minBalance?: number };
				return {
					data: {
						id: String(s.id ?? ""),
						name: s.name ?? "",
						minBalance: s.minBalance ?? 0,
						gapDate: s.gapDate ?? null,
						hasGap: Boolean(s.gapDate),
					},
				};
			},
			invalidatesTags: ["Scenarios"],
		}),

		getPlanFact: build.query<PlanFactDto, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const [planFact, journal] = await Promise.all([
					baseQuery(`/api/companies/${inn}/plan-fact`),
					baseQuery(`/api/companies/${inn}/recalc-journal`),
				]);
				if (planFact.error) return { error: asError(planFact) };
				const body = planFact.data as {
					factBalance?: number;
					planBalance?: number;
					deviation?: number;
					points?: ForecastPointRaw[];
					missedOnTime?: { title?: string; amount?: number; expectedDate?: string; overdueDays?: number }[];
				};
				const missed = body.missedOnTime?.[0];
				const journalItems = journal.error
					? []
					: ((Array.isArray(journal.data) ? journal.data : []) as {
							occurredAt?: string;
							message?: string;
						}[]);
				return {
					data: {
						cashflow: {
							points: mapForecastPoints(body.points),
						},
						factOn: body.factBalance ?? 0,
						planOn: body.planBalance ?? 0,
						diff: body.deviation ?? 0,
						late: missed
							? {
									name: missed.title ?? "",
									amount: missed.amount ?? 0,
									meta: missed.expectedDate
										? `${missed.expectedDate}${missed.overdueDays != null ? ` · ${missed.overdueDays}d` : ""}`
										: "",
								}
							: null,
						journal: journalItems.map((j) => ({
							at: j.occurredAt ?? "",
							text: j.message ?? "",
						})),
					},
				};
			},
			providesTags: ["PlanFact"],
		}),

		getForecastDay: build.query<ForecastDayDto, { date: string }>({
			async queryFn({ date }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/forecast/day`,
					params: { date },
				});
				if (result.error) return { error: asError(result) };
				const body = result.data as ForecastDayDto;
				return {
					data: {
						date: body.date ?? date,
						startBalance: body.startBalance ?? 0,
						income: body.income ?? 0,
						expense: body.expense ?? 0,
						endBalance: body.endBalance ?? 0,
						otherIncomeForecast: body.otherIncomeForecast ?? 0,
						negativeEndBalance: body.negativeEndBalance ?? 0,
						events: body.events ?? [],
						stub: Boolean(body.stub),
					},
				};
			},
		}),

		searchCompany: build.query<CompanySearchDto, { q: string }>({
			async queryFn({ q }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const query = q.trim();
				if (!query) return { data: { query: "", items: [] } };
				const result = await baseQuery({
					url: `/api/companies/${inn}/search`,
					params: { q: query },
				});
				if (result.error) return { error: asError(result) };
				const body = result.data as {
					query?: string;
					operations?: {
						id?: number;
						operationDate?: string;
						counterpartyName?: string;
						paymentPurpose?: string;
						amount?: number;
						direction?: string;
					}[];
					events?: {
						id?: number;
						eventDate?: string;
						title?: string;
						amount?: number;
						direction?: string;
					}[];
				};
				const ops = (body.operations ?? []).map((op) => ({
					id: `op-${op.id}`,
					kind: "operation" as const,
					date: op.operationDate ?? "",
					name: op.counterpartyName || op.paymentPurpose || "",
					amount:
						op.direction === "Списание" ? -Math.abs(op.amount ?? 0) : Math.abs(op.amount ?? 0),
				}));
				const events = (body.events ?? []).map((e) => ({
					id: `ev-${e.id}`,
					kind: "event" as const,
					date: e.eventDate ?? "",
					name: e.title ?? "",
					amount:
						e.direction === "Поступление" ? Math.abs(e.amount ?? 0) : -Math.abs(e.amount ?? 0),
				}));
				return {
					data: {
						query: body.query ?? query,
						items: [...ops, ...events],
					},
				};
			},
		}),

		syncCompany: build.mutation<SyncResultDto, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/sync`,
					method: "POST",
				});
				if (result.error) return { error: asError(result) };
				const body = (result.data as SyncResultDto) ?? {
					inserted: 0,
					duplicates: 0,
					invalid: 0,
					skipped: 0,
				};
				return { data: body };
			},
			invalidatesTags: ["Sources", "Today", "Operations", "Events", "Forecast", "PlanFact"],
		}),

		deleteEvent: build.mutation<{ ok: boolean }, { id: string }>({
			async queryFn({ id }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events/${id}`,
					method: "DELETE",
				});
				if (result.error) return { error: asError(result) };
				return { data: { ok: true } };
			},
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		updateEvent: build.mutation<{ id: string }, { id: string } & CreateEventArgs>({
			async queryFn({ id, ...args }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events/${id}`,
					method: "PATCH",
					body: {
						title: args.name,
						amount: args.amount,
						eventDate: args.date,
						category: args.category,
						direction: args.direction === "in" ? "Поступление" : "Списание",
					},
				});
				if (result.error) return { error: asError(result) };
				const updated = result.data as { id?: number | string };
				return { data: { id: String(updated.id ?? id) } };
			},
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		getOperations: build.query<OperationsDto, OperationsQueryArgs | void>({
			async queryFn(args, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations`,
					params: {
						...(args?.source ? { source: args.source } : {}),
						page: args?.page ?? 0,
						size: args?.size ?? 100,
						sort: "operationDate,DESC",
					},
				});
				if (result.error) return { error: asError(result) };
				const page = result.data as OperationsPageMeta & {
					content?: {
						id?: number;
						operationDate?: string;
						counterpartyName?: string;
						paymentPurpose?: string;
						amount?: number;
						direction?: string;
						source?: string;
					}[];
				};
				let items = (page.content ?? []).map((op) => {
					const signed =
						op.direction === "Списание" ? -Math.abs(op.amount ?? 0) : Math.abs(op.amount ?? 0);
					return {
						id: String(op.id),
						date: op.operationDate ?? "",
						name: op.counterpartyName || op.paymentPurpose || "",
						amount: signed,
						category: op.source || "",
					};
				});
				if (args?.dir === "in") items = items.filter((i) => i.amount > 0);
				if (args?.dir === "out") items = items.filter((i) => i.amount < 0);
				if (args?.category && args.category !== "all") {
					items = items.filter((i) => i.category === args.category);
				}
				const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
				const inflow = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
				const outflow = items.filter((i) => i.amount < 0).reduce((s, i) => s + Math.abs(i.amount), 0);
				const totalCount =
					typeof page.totalElements === "number" ? page.totalElements : items.length;
				return {
					data: {
						items,
						categories,
						balanceHistory: { points: [] },
						totals: {
							total: inflow - outflow,
							inflow,
							outflow,
							count: totalCount,
						},
					},
				};
			},
			providesTags: ["Operations"],
		}),

		getRegularOperations: build.query<RegularOperationDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/events/regular`);
				if (result.error) return { error: asError(result) };
				const list = (result.data as {
					id?: string;
					title?: string;
					direction?: string;
					category?: string;
					cadence?: string;
					nextDate?: string;
					amount?: number;
				}[]) ?? [];
				return {
					data: list.map((r) => ({
						id: String(r.id),
						name: r.title ?? "",
						direction: r.direction === "INCOME" ? "in" : "out",
						category: r.category ?? "",
						period: r.cadence ?? "",
						next: r.nextDate ?? "",
						amountLabel: String(r.amount ?? 0),
						status: "ok",
						needsReview: false,
					})),
				};
			},
			providesTags: ["Operations"],
		}),

		getEvents: build.query<EventsDto, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const [events, upcoming] = await Promise.all([
					baseQuery(`/api/companies/${inn}/events`),
					baseQuery(`/api/companies/${inn}/payments/upcoming`),
				]);
				if (events.error) return { error: asError(events) };
				const statusToTab = (status?: string): EventTab => {
					if (status === "OVERDUE") return "over";
					if (status === "DONE") return "done";
					return "exp";
				};
				const raw = [
					...((events.data as unknown[]) ?? []),
					...((upcoming.error ? [] : (upcoming.data as unknown[])) ?? []),
				] as {
					id?: number | null;
					title?: string;
					amount?: number;
					eventDate?: string;
					source?: string;
					status?: string;
					direction?: string;
					category?: string;
				}[];
				return {
					data: {
						items: raw.map((e, i) => ({
							id: String(e.id ?? `e${i}`),
							date: e.eventDate ?? "",
							name: e.title ?? "",
							source: e.source ?? "",
							status: e.status ?? "",
							tab: statusToTab(e.status),
							amount:
								e.direction === "Поступление"
									? Math.abs(e.amount ?? 0)
									: -Math.abs(e.amount ?? 0),
							basis: e.category,
						})),
					},
				};
			},
			providesTags: ["Events"],
		}),

		getCalendar: build.query<CalendarDto, { year: number; month: number }>({
			async queryFn({ year, month }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events/calendar`,
					params: { year, month },
				});
				if (result.error) {
					const upcoming = await baseQuery(`/api/companies/${inn}/payments/upcoming`);
					if (upcoming.error) return { error: asError(result) };
					const items = (upcoming.data as { eventDate?: string; title?: string }[]) ?? [];
					return {
						data: {
							year,
							month,
							today: new Date().toISOString().slice(0, 10),
							events: items
								.filter((e) => e.eventDate?.startsWith(`${year}-${String(month).padStart(2, "0")}`))
								.map((e) => ({ date: e.eventDate ?? "", label: e.title ?? "" })),
						},
					};
				}
				const body = result.data as {
					month?: string;
					days?: Record<string, { title?: string; amount?: number }[]>;
				};
				const events = Object.entries(body.days ?? {}).flatMap(([date, list]) =>
					(list ?? []).map((e) => ({ date, label: e.title ?? "" })),
				);
				return {
					data: {
						year,
						month,
						today: new Date().toISOString().slice(0, 10),
						events,
					},
				};
			},
			providesTags: ["Events"],
		}),

		getSources: build.query<SourcesDto, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/sources`);
				if (result.error) return { error: asError(result) };
				const body = result.data as {
					sources?: {
						code?: string;
						name?: string;
						connected?: boolean;
						operationCount?: number;
						lastDataDate?: string | null;
					}[];
				};
				const rawSources = body.sources ?? [];
				const items = await Promise.all(
					rawSources.map(async (s) => {
						const code = normalizeSourceCode(String(s.code ?? s.name ?? ""));
						let operationCount =
							typeof s.operationCount === "number" ? s.operationCount : undefined;
						const sourceParam = operationsSourceParam(code);
						if (sourceParam) {
							const countRes = await baseQuery({
								url: `/api/companies/${inn}/operations`,
								params: {
									source: sourceParam,
									page: 0,
									size: 1,
									sort: "operationDate,DESC",
								},
							});
							if (!countRes.error && countRes.data) {
								const total = (countRes.data as OperationsPageMeta).totalElements;
								if (typeof total === "number") operationCount = total;
							}
						}
						return {
							id: code,
							name: code || String(s.name ?? ""),
							description: operationCount != null ? String(operationCount) : "",
							connected: Boolean(s.connected),
							operationCount,
							lastDataDate: s.lastDataDate ?? null,
						};
					}),
				);
				return { data: { items } };
			},
			providesTags: ["Sources"],
		}),

		toggleSource: build.mutation<SyncResultDto, { id: string; connected: boolean }>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/sync`,
					method: "POST",
				});
				if (result.error) return { error: asError(result) };
				return {
					data: (result.data as SyncResultDto) ?? {
						inserted: 0,
						duplicates: 0,
						invalid: 0,
						skipped: 0,
					},
				};
			},
			invalidatesTags: ["Sources", "Today", "Operations", "Events", "Forecast", "PlanFact"],
		}),

		uploadSourceFile: build.mutation<SyncResultDto, FormData>({
			async queryFn(body, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations/csv`,
					method: "POST",
					body,
				});
				if (result.error) return { error: asError(result) };
				const bodyData = result.data as Partial<SyncResultDto> | undefined;
				return {
					data: {
						inserted: bodyData?.inserted ?? 0,
						duplicates: bodyData?.duplicates ?? 0,
						invalid: bodyData?.invalid ?? 0,
						skipped: bodyData?.skipped ?? 0,
					},
				};
			},
			invalidatesTags: ["Sources", "Today", "Operations", "Events"],
		}),

		getStrategies: build.query<StrategiesDto, void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const [settings, forecast] = await Promise.all([
					baseQuery(`/api/companies/${inn}/forecast-settings`),
					baseQuery({ url: `/api/companies/${inn}/forecast`, params: { horizonDays: 30 } }),
				]);
				if (settings.error) return { error: asError(settings) };
				const s = settings.data as {
					cautionLevel?: string;
					minBalance?: number;
					salaryDay?: number;
					notifyRules?: Record<string, boolean>;
				};
				const points =
					forecast.error
						? []
						: (
								(forecast.data as {
									points?: {
										date: string;
										baseBalance?: number;
										negativeBalance?: number;
									}[];
								}).points ?? []
							).map((p) => ({
								date: p.date,
								balance: p.baseBalance ?? 0,
								pessimisticBalance: p.negativeBalance ?? null,
							}));
				const active =
					s.cautionLevel === "conservative"
						? "cons"
						: s.cautionLevel === "optimistic"
							? "opt"
							: s.cautionLevel === "custom"
								? "own"
								: "base";
				const minBalanceK = Math.round((s.minBalance ?? 150_000) / 1000);
				const salaryDay = s.salaryDay ?? 5;
				const presets = {
					cons: { haircutPct: 15, delayDays: 14, minBalanceK },
					base: { haircutPct: 5, delayDays: 7, minBalanceK },
					opt: { haircutPct: 0, delayDays: 0, minBalanceK },
					own: { haircutPct: 5, delayDays: 7, minBalanceK },
				};
				const ruleEntries = Object.entries(s.notifyRules ?? {});
				const rules =
					ruleEntries.length > 0
						? ruleEntries.map(([id, enabled]) => ({
								id,
								label: id,
								enabled: Boolean(enabled),
							}))
						: [
								{ id: "min_balance", label: "ruleA", enabled: true },
								{ id: "late_inflow", label: "ruleB", enabled: true },
								{ id: "daily_digest", label: "ruleC", enabled: false },
							];
				return {
					data: {
						active,
						salaryDay,
						presets,
						impact: {
							probabilityPct: 0,
							gapLabel: "",
							cashflow: { points },
							showRisk: points.some((p) => (p.pessimisticBalance ?? 0) < 0),
						},
						rules,
					},
				};
			},
			providesTags: ["Strategies"],
		}),

		updateStrategies: build.mutation<StrategiesDto, UpdateStrategiesArgs>({
			async queryFn(body, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const cautionLevel =
					body.active === "cons"
						? "conservative"
						: body.active === "opt"
							? "optimistic"
							: body.active === "own"
								? "custom"
								: "balanced";
				const result = await baseQuery({
					url: `/api/companies/${inn}/forecast-settings`,
					method: "PUT",
					body: {
						cautionLevel,
						minBalance: body.params.minBalanceK * 1000,
						salaryDay: body.salaryDay ?? 5,
						notifyRules: Object.fromEntries((body.rules ?? []).map((r) => [r.id, r.enabled])),
					},
				});
				if (result.error) return { error: asError(result) };
				const saved = (result.data as {
					cautionLevel?: string;
					minBalance?: number;
					salaryDay?: number;
					notifyRules?: Record<string, boolean>;
				}) ?? {};
				const minBalanceK = Math.round((saved.minBalance ?? body.params.minBalanceK * 1000) / 1000);
				const params = { ...body.params, minBalanceK };
				return {
					data: {
						active: body.active,
						salaryDay: saved.salaryDay ?? body.salaryDay ?? 5,
						presets: { cons: params, base: params, opt: params, own: params },
						impact: {
							probabilityPct: 0,
							gapLabel: "",
							cashflow: { points: [] },
							showRisk: false,
						},
						rules: (body.rules ?? []).map((r) => ({ id: r.id, label: r.id, enabled: r.enabled })),
					},
				};
			},
			invalidatesTags: ["Strategies", "Forecast", "Today", "PlanFact"],
		}),

		createEvent: build.mutation<{ id: string }, CreateEventArgs>({
			async queryFn(args, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events`,
					method: "POST",
					body: {
						title: args.name,
						amount: args.amount,
						eventDate: args.date,
						category: args.category,
						direction: args.direction === "in" ? "Поступление" : "Списание",
						status: "EXPECTED",
					},
				});
				if (result.error) return { error: asError(result) };
				const created = result.data as { id?: number | string };
				return { data: { id: String(created.id ?? "") } };
			},
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		parseEventsFile: build.mutation<ParseEventsResultDto, FormData>({
			async queryFn(body, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events/import`,
					method: "POST",
					body,
				});
				if (result.error) return { error: asError(result) };
				const rows = (result.data as {
					eventDate?: string;
					title?: string;
					category?: string;
					amount?: number;
				}[]) ?? [];
				return {
					data: {
						rows: rows.map((r) => ({
							date: r.eventDate ?? "",
							name: r.title ?? "",
							category: r.category ?? "",
							amount: r.amount ?? 0,
							ok: true,
						})),
					},
				};
			},
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		confirmParsedEvents: build.mutation<{ ok: boolean }, { rows: ParseEventsResultDto["rows"] }>({
			// Import endpoint already persists events; confirm only acknowledges UI step.
			queryFn: () => ({ data: { ok: true } }),
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		askAssistant: build.mutation<string, { question: string; conversationId?: string }>({
			async queryFn({ question, conversationId }, _api, _extra, baseQuery) {
				const result = await baseQuery({
					url: "/api/ai/ask",
					params: {
						question,
						conversationId: conversationId || "default",
					},
					responseHandler: async (response) => {
						const text = await response.text();
						if (!text) return "";
						try {
							const parsed = JSON.parse(text) as unknown;
							return typeof parsed === "string" ? parsed : text;
						} catch {
							return text;
						}
					},
				});
				if (result.error) return { error: asError(result) };
				const answer = String(result.data ?? "").trim();
				if (!answer) {
					return { error: { status: 502, data: { message: "Empty assistant reply" } } };
				}
				return { data: answer };
			},
		}),
	}),
});

export const {
	useGetTodayOverviewQuery,
	useGetTodayForecastBlockQuery,
	useGetTodayWeeklyQuery,
	useGetTodayCategoriesQuery,
	useGetTodayAlertsQuery,
	useGetTodayUpcomingQuery,
	useGetTodayRecommendationsQuery,
	useGetForecastQuery,
	useGetSavedScenariosQuery,
	useGetMyScenariosQuery,
	useSaveScenarioMutation,
	useRenameScenarioMutation,
	useDeleteScenarioMutation,
	useCopyScenarioMutation,
	useGetPlanFactQuery,
	useGetForecastDayQuery,
	useLazyGetForecastDayQuery,
	useSearchCompanyQuery,
	useLazySearchCompanyQuery,
	useSyncCompanyMutation,
	useDeleteEventMutation,
	useUpdateEventMutation,
	useGetOperationsQuery,
	useGetRegularOperationsQuery,
	useGetEventsQuery,
	useGetCalendarQuery,
	useGetSourcesQuery,
	useToggleSourceMutation,
	useUploadSourceFileMutation,
	useGetStrategiesQuery,
	useUpdateStrategiesMutation,
	useCreateEventMutation,
	useParseEventsFileMutation,
	useConfirmParsedEventsMutation,
	useAskAssistantMutation,
} = financeApi;
