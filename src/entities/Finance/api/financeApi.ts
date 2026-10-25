import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { rtkApi } from "@/shared/api/rtkApi";
import { getActiveInn } from "@/shared/lib/companyInn";
import { pickIsoDate } from "@/shared/lib/format/formatDate";
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
	StrategyKey,
	StrategyParamsDto,
	SyncResultDto,
	UpdateStrategiesArgs,
} from "../model/types";

const noInnError = (): FetchBaseQueryError => ({
	status: 400,
	data: { message: "Company INN is not set" },
});

const asError = (result: { error?: FetchBaseQueryError }): FetchBaseQueryError =>
	result.error ?? { status: 500, data: { message: "Request failed" } };

const toProbabilityPct = (raw: number | null | undefined) => {
	if (raw == null || Number.isNaN(Number(raw))) return 0;
	const n = Number(raw);
	return n <= 1 ? Math.round(n * 100) : Math.round(n);
};

const strategyKeyFromCode = (code?: string | null): StrategyKey | null => {
	const c = (code ?? "").toLowerCase();
	if (c === "cons" || c === "conservative") return "cons";
	if (c === "base" || c === "balanced" || c === "moderate") return "base";
	if (c === "opt" || c === "optimistic") return "opt";
	if (c === "own" || c === "custom") return "own";
	return null;
};

const cautionToStrategyKey = (cautionLevel?: string | null): StrategyKey =>
	strategyKeyFromCode(cautionLevel) ?? "base";

const cautionLevelName = (key: StrategyKey) =>
	key === "cons" ? "conservative" : key === "opt" ? "optimistic" : key === "own" ? "custom" : "balanced";

const DEFAULT_PRESET_PARAMS: Record<StrategyKey, Pick<StrategyParamsDto, "haircutPct" | "delayDays">> = {
	cons: { haircutPct: 15, delayDays: 14 },
	base: { haircutPct: 5, delayDays: 7 },
	opt: { haircutPct: 0, delayDays: 0 },
	own: { haircutPct: 5, delayDays: 7 },
};

const flattenConditions = (conditions: unknown): Record<string, string> => {
	if (!conditions) return {};
	if (Array.isArray(conditions)) {
		return conditions.reduce<Record<string, string>>((acc, item) => {
			if (item && typeof item === "object") {
				Object.entries(item as Record<string, unknown>).forEach(([k, v]) => {
					if (v != null && typeof v !== "object") acc[k] = String(v);
				});
			}
			return acc;
		}, {});
	}
	if (typeof conditions === "object") {
		return Object.fromEntries(
			Object.entries(conditions as Record<string, unknown>)
				.filter(([, v]) => v != null && typeof v !== "object")
				.map(([k, v]) => [k, String(v)]),
		);
	}
	return {};
};

type RawForecastPreset = {
	code?: string;
	active?: boolean;
	conditions?: unknown;
	minBalance?: number;
	gapDate?: string | null;
	gapAmount?: number;
	gapProbability?: number;
};

const paramsFromPreset = (key: StrategyKey, p: RawForecastPreset | undefined, minBalanceK: number): StrategyParamsDto => {
	const cond = flattenConditions(p?.conditions);
	const delay = Number(cond.delay ?? cond.delayDays);
	const haircut = Number(cond.haircut ?? cond.haircutPct ?? cond.drop);
	const fallback = DEFAULT_PRESET_PARAMS[key];
	return {
		haircutPct: Number.isFinite(haircut) ? haircut : fallback.haircutPct,
		delayDays: Number.isFinite(delay) ? delay : fallback.delayDays,
		minBalanceK: p?.minBalance != null ? Math.round(p.minBalance / 1000) : minBalanceK,
	};
};

const asList = <T>(data: unknown): T[] => {
	if (Array.isArray(data)) return data as T[];
	if (data && typeof data === "object") {
		const o = data as { content?: unknown; items?: unknown; data?: unknown };
		if (Array.isArray(o.content)) return o.content as T[];
		if (Array.isArray(o.items)) return o.items as T[];
		if (Array.isArray(o.data)) return o.data as T[];
	}
	return [];
};

const normalizeSourceCode = (value: string): string => {
	const raw = value.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
	if (raw === "1C" || raw === "1С" || raw === "ONEC" || raw === "1_C") return "ONE_C";
	if (raw === "GOS" || raw === "GOSUSLUGI" || raw === "GOS_USLUGI") return "GOS_SERVICE";
	return raw;
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
	income?: number;
	expense?: number;
	balance?: number;
	factBalance?: number;
};

const pointFactBalance = (p: ForecastPointRaw) =>
	Number(p.baseBalance ?? p.balance ?? p.factBalance ?? 0);

const mapPlanFactFactPoints = (raw: ForecastPointRaw[] | undefined) => {
	const list = raw ?? [];
	const hasBalance = list.some((p) => pointFactBalance(p) !== 0);
	const hasFlow = list.some((p) => (p.income ?? 0) !== 0 || (p.expense ?? 0) !== 0);
	if (!hasBalance && hasFlow) {
		let run = 0;
		return list.map((p) => {
			run += (p.income ?? 0) - (p.expense ?? 0);
			return {
				date: p.date,
				balance: run,
				pessimisticBalance: null as number | null,
				lowerBound: null as number | null,
				upperBound: null as number | null,
			};
		});
	}
	return list.map((p) => ({
		date: p.date,
		balance: pointFactBalance(p),
		pessimisticBalance: null as number | null,
		lowerBound: null as number | null,
		upperBound: null as number | null,
	}));
};

const buildOpsBalancePoints = (
	ops: {
		operationDate?: string;
		date?: string;
		createdAt?: string;
		amount?: number;
		direction?: string;
	}[],
) => {
	const byDate = new Map<string, number>();
	ops.forEach((op) => {
		const date = pickIsoDate(op.operationDate, op.date, op.createdAt);
		if (!date) return;
		const rawAmount = Number(op.amount ?? 0);
		const isOut =
			op.direction === "Списание" ||
			op.direction === "OUT" ||
			op.direction === "EXPENSE" ||
			rawAmount < 0;
		const signed = isOut ? -Math.abs(rawAmount) : Math.abs(rawAmount);
		byDate.set(date, (byDate.get(date) ?? 0) + signed);
	});
	const dates = [...byDate.keys()].sort();
	let running = 0;
	return dates.map((date) => {
		running += byDate.get(date) ?? 0;
		return {
			date,
			balance: running,
			pessimisticBalance: null as number | null,
			lowerBound: null as number | null,
			upperBound: null as number | null,
		};
	});
};

/** Condition keys accepted by `/scenarios/preview`; titles/labels come from i18n on the page. */
const FORECAST_CONDITION_FIELDS: ForecastScenarioDto[] = [
	{
		key: "delay",
		title: "delay",
		defaultValue: "14",
		options: [
			{ value: "7", label: "7" },
			{ value: "14", label: "14" },
			{ value: "21", label: "21" },
		],
	},
	{
		key: "drop",
		title: "drop",
		defaultValue: "10",
		options: [
			{ value: "10", label: "10" },
			{ value: "20", label: "20" },
			{ value: "30", label: "30" },
		],
	},
	{
		key: "fixed",
		title: "fixed",
		defaultValue: "10",
		options: [
			{ value: "5", label: "5" },
			{ value: "10", label: "10" },
			{ value: "15", label: "15" },
		],
	},
	{
		key: "skip",
		title: "skip",
		defaultValue: "1",
		options: [{ value: "1", label: "1" }],
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
				return { data: asList<CashEventDto>(result.data) };
			},
			providesTags: ["Today"],
		}),

		getTodayRecommendations: build.query<RecommendationDto[], void>({
			async queryFn(_arg, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery(`/api/companies/${inn}/recommendations`);
				if (result.error) return { error: asError(result) };
				return { data: asList<RecommendationDto>(result.data) };
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
				const body = result.data as {
					points?: ForecastPointRaw[];
					summary?: {
						gapDate?: string | null;
						gapAmount?: number;
						riskGapDate?: string | null;
						riskGapAmount?: number;
					};
				};
				const points = mapForecastPoints(body.points);
				const summaryGapDate = body.summary?.gapDate || body.summary?.riskGapDate || null;
				const summaryGapAmount = body.summary?.gapAmount ?? body.summary?.riskGapAmount;
				const gapPoint =
					summaryGapDate != null
						? points.find((p) => p.date === summaryGapDate) ??
							points.find((p) => (p.pessimisticBalance ?? 0) < 0)
						: points.find((p) => (p.pessimisticBalance ?? 0) < 0);
				const gapBalance =
					summaryGapAmount != null
						? -Math.abs(summaryGapAmount)
						: (gapPoint?.pessimisticBalance ?? 0);
				const hasGap = Boolean(summaryGapDate || gapPoint);
				return {
					data: {
						cashflow: {
							points,
							gap:
								hasGap && (summaryGapDate || gapPoint)
									? {
											date: summaryGapDate || gapPoint!.date,
											balance: gapBalance,
										}
									: null,
							todayIndex: 0,
						},
						hasGap,
						resultText: hasGap ? "gap" : "ok",
						scenarios: FORECAST_CONDITION_FIELDS,
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
				const [planFact, journal, forecast] = await Promise.all([
					baseQuery(`/api/companies/${inn}/plan-fact`),
					baseQuery(`/api/companies/${inn}/recalc-journal`),
					baseQuery({
						url: `/api/companies/${inn}/forecast`,
						params: { horizonDays: 30 },
					}),
				]);
				if (planFact.error) return { error: asError(planFact) };
				const body = planFact.data as {
					from?: string;
					to?: string;
					factBalance?: number;
					planBalance?: number;
					deviation?: number;
					planAvailable?: boolean;
					points?: ForecastPointRaw[];
					missedOnTime?: {
						title?: string;
						amount?: number;
						expectedDate?: string;
						overdueDays?: number;
					}[];
				};
				const planAvailable = Boolean(body.planAvailable);
				const forecastPoints = mapForecastPoints(
					(forecast.error ? [] : ((forecast.data as { points?: ForecastPointRaw[] })?.points ?? [])),
				);
				const planByDate = new Map(forecastPoints.map((p) => [p.date, p.balance]));

				let factPoints = mapPlanFactFactPoints(body.points);
				const factBroken =
					factPoints.length === 0 || factPoints.every((p) => p.balance === 0);
				if (factBroken) {
					const opsRes = await baseQuery({
						url: `/api/companies/${inn}/operations`,
						params: { page: 0, size: 2000, sort: "operationDate,ASC" },
					});
					if (!opsRes.error) {
						const page = opsRes.data as {
							content?: {
								operationDate?: string;
								date?: string;
								createdAt?: string;
								amount?: number;
								direction?: string;
							}[];
						};
						factPoints = buildOpsBalancePoints(page.content ?? []);
					}
				}

				const factOn =
					body.factBalance ??
					(factPoints.length ? factPoints[factPoints.length - 1].balance : 0);

				if (factPoints.length === 0 && factOn !== 0) {
					const day = new Date().toISOString().slice(0, 10);
					const axis =
						forecastPoints.length > 0
							? forecastPoints
							: [
									{ date: body.from ?? day, balance: 0 },
									{ date: body.to ?? day, balance: 0 },
								];
					factPoints = axis.map((p) => ({
						date: p.date,
						balance: factOn,
						pessimisticBalance: null,
						lowerBound: null,
						upperBound: null,
					}));
				} else if (factPoints.length > 0 && body.factBalance != null) {
					const last = factPoints[factPoints.length - 1].balance;
					const offset = factOn - last;
					if (offset !== 0) {
						factPoints = factPoints.map((p) => ({
							...p,
							balance: p.balance + offset,
						}));
					}
				}

				const today = new Date().toISOString().slice(0, 10);
				let todayIndex = factPoints.findIndex((p) => p.date >= today);
				if (todayIndex < 0) todayIndex = Math.max(factPoints.length - 1, 0);

				const points = factPoints.map((p) => ({
					...p,
					pessimisticBalance: planByDate.has(p.date) ? planByDate.get(p.date)! : null,
				}));

				const planFromForecast =
					planByDate.get(today) ??
					(forecastPoints.length ? forecastPoints[0].balance : 0);
				const planOn = planAvailable
					? (body.planBalance ?? 0)
					: planFromForecast;
				const diff =
					planAvailable && body.deviation != null
						? body.deviation
						: factOn - planOn;

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
							points,
							todayIndex,
						},
						factOn,
						planOn,
						diff,
						planAvailable,
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
					date: pickIsoDate(op.operationDate, (op as { date?: unknown }).date),
					name: op.counterpartyName || op.paymentPurpose || "",
					amount:
						op.direction === "Списание" ? -Math.abs(op.amount ?? 0) : Math.abs(op.amount ?? 0),
				}));
				const events = (body.events ?? []).map((e) => ({
					id: `ev-${e.id}`,
					kind: "event" as const,
					date: pickIsoDate(e.eventDate, (e as { date?: unknown }).date),
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
				const toApiSource = (value: string): string | undefined => {
					const code = normalizeSourceCode(value);
					if (code === "ONE_C") return "1C";
					if (code === "GOS_SERVICE") return "Gos_service";
					if (code === "CSV") return "csv";
					return value || undefined;
				};
				const sourceParam = args?.source ? toApiSource(args.source) : undefined;
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations`,
					params: {
						...(sourceParam ? { source: sourceParam } : {}),
						...(args?.category && args.category !== "all" ? { category: args.category } : {}),
						page: args?.page ?? 0,
						size: args?.size ?? 2000,
						sort: "operationDate,DESC",
					},
				});
				if (result.error) return { error: asError(result) };
				const page = result.data as OperationsPageMeta & {
					content?: {
						id?: number;
						operationId?: string;
						operationDate?: unknown;
						date?: unknown;
						createdAt?: unknown;
						counterpartyName?: string;
						paymentPurpose?: string;
						title?: string;
						name?: string;
						description?: string;
						amount?: number;
						direction?: string;
						source?: string;
						category?: string;
					}[];
				};
				let items = (page.content ?? []).map((op, index) => {
					const rawAmount = Number(op.amount ?? 0);
					const isOut =
						op.direction === "Списание" ||
						op.direction === "OUT" ||
						op.direction === "EXPENSE" ||
						rawAmount < 0;
					const date = pickIsoDate(op.operationDate, op.date, op.createdAt);
					return {
						id: String(op.id ?? op.operationId ?? `${date || "op"}-${index}`),
						date,
						name:
							op.counterpartyName ||
							op.paymentPurpose ||
							op.title ||
							op.name ||
							op.description ||
							"",
						amount: isOut ? -Math.abs(rawAmount) : Math.abs(rawAmount),
						category: String(op.category ?? "").trim(),
						source: normalizeSourceCode(String(op.source ?? "")),
					};
				});
				const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
				if (args?.dir === "in") items = items.filter((i) => i.amount > 0);
				if (args?.dir === "out") items = items.filter((i) => i.amount < 0);
				if (args?.category && args.category !== "all") {
					items = items.filter((i) => i.category === args.category);
				}
				items = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
				const inflow = items.reduce((s, i) => (i.amount > 0 ? s + i.amount : s), 0);
				const outflow = items.reduce((s, i) => (i.amount < 0 ? s + Math.abs(i.amount) : s), 0);
				const byDate = new Map<string, number>();
				items.forEach((op) => {
					if (!op.date) return;
					byDate.set(op.date, (byDate.get(op.date) ?? 0) + op.amount);
				});
				const dates = [...byDate.keys()].sort();
				let running = 0;
				const balancePoints = dates.map((date) => {
					running += byDate.get(date) ?? 0;
					return { date, balance: running };
				});
				return {
					data: {
						items,
						categories,
						balanceHistory: {
							points: balancePoints,
							todayIndex: Math.max(balancePoints.length - 1, 0),
						},
						totals: {
							total: inflow - outflow,
							inflow,
							outflow,
							count: items.length,
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
				type RawReg = {
					id?: string | number;
					title?: string;
					name?: string;
					direction?: string;
					category?: string;
					cadence?: string;
					cadenceLabel?: string;
					period?: string;
					nextDate?: unknown;
					next?: unknown;
					lastDate?: unknown;
					eventDate?: unknown;
					amount?: number;
					status?: string;
				};
				const list = asList<RawReg>(result.data);
				return {
					data: list.map((r, i) => {
						const directionRaw = String(r.direction ?? "");
						const isIn =
							directionRaw === "INCOME" ||
							directionRaw === "IN" ||
							directionRaw === "Поступление" ||
							directionRaw === "in";
						const amount = Number(r.amount ?? 0);
						const signed = isIn ? Math.abs(amount) : -Math.abs(amount);
						return {
							id: String(r.id ?? `reg-${i}`),
							name: r.title || r.name || "",
							direction: isIn ? ("in" as const) : ("out" as const),
							category: r.category ?? "",
							period: r.cadenceLabel || r.cadence || r.period || "",
							next: pickIsoDate(r.nextDate, r.next, r.lastDate, r.eventDate),
							amount: signed,
							amountLabel: String(Math.abs(amount)),
							status: r.status || "ok",
							needsReview: false,
						};
					}),
				};
			},
			providesTags: ["Events", "Operations"],
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
				type RawEvent = {
					id?: number | null;
					title?: string;
					name?: string;
					amount?: number;
					eventDate?: unknown;
					date?: unknown;
					dueDate?: unknown;
					source?: string;
					status?: string;
					direction?: string;
					category?: string;
				};
				const seen = new Set<string>();
				const raw = [
					...asList<RawEvent>(events.data),
					...(upcoming.error ? [] : asList<RawEvent>(upcoming.data)),
				].filter((e) => {
					const key = String(e.id ?? `${e.title ?? e.name}-${e.eventDate ?? e.date}`);
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
				const items = raw
					.map((e, i) => {
						const date = pickIsoDate(e.eventDate, e.date, e.dueDate);
						const direction = String(e.direction ?? "");
						const isIn =
							direction === "Поступление" ||
							direction === "IN" ||
							direction === "INCOME" ||
							direction === "in";
						return {
							id: String(e.id ?? `e${i}`),
							date,
							name: e.title || e.name || "",
							source: e.source ?? "",
							status: e.status ?? "",
							tab: statusToTab(e.status),
							amount: isIn ? Math.abs(e.amount ?? 0) : -Math.abs(e.amount ?? 0),
							basis: e.category,
						};
					})
					.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
				return { data: { items } };
			},
			providesTags: ["Events"],
		}),

		getCalendar: build.query<CalendarDto, { year: number; month: number }>({
			async queryFn({ year, month }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const monthParam = `${year}-${String(month).padStart(2, "0")}`;
				const n = new Date();
				const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;

				type RawCalEvent = {
					eventDate?: unknown;
					date?: unknown;
					dueDate?: unknown;
					title?: string;
					name?: string;
					direction?: string;
					amount?: number;
					category?: string;
				};

				const mapEvent = (e: RawCalEvent, dateFallback = ""): { date: string; label: string; amount?: number } | null => {
					const date = pickIsoDate(e.eventDate, e.date, e.dueDate) || dateFallback;
					if (!date || !date.startsWith(monthParam)) return null;
					const title = (e.title || e.name || e.category || "").trim() || "Событие";
					const amount = e.amount != null && Number.isFinite(Number(e.amount)) ? Number(e.amount) : undefined;
					return { date, label: title, amount };
				};

				const fromFlatList = (list: RawCalEvent[]) =>
					list.map((e) => mapEvent(e)).filter((e): e is { date: string; label: string; amount?: number } => Boolean(e));

				const fromDaysMap = (
					days: Record<string, RawCalEvent[] | undefined> | RawCalEvent[] | undefined,
				) => {
					const out: { date: string; label: string; amount?: number }[] = [];
					if (!days) return out;
					if (Array.isArray(days)) return fromFlatList(days);
					Object.entries(days).forEach(([key, list]) => {
						if (!Array.isArray(list) || list.length === 0) return;
						const keyDate = /^\d{4}-\d{2}-\d{2}/.test(key)
							? key.slice(0, 10)
							: `${monthParam}-${String(Number(key) || key).padStart(2, "0")}`;
						list.forEach((e) => {
							const mapped = mapEvent(e, keyDate);
							if (mapped) out.push(mapped);
						});
					});
					return out;
				};

				const calendarResult = await baseQuery({
					url: `/api/companies/${inn}/events/calendar`,
					params: { month: monthParam },
				});

				let events: { date: string; label: string; amount?: number }[] = [];
				if (!calendarResult.error && calendarResult.data) {
					const body = calendarResult.data as {
						month?: string;
						days?: Record<string, RawCalEvent[] | undefined> | RawCalEvent[];
						events?: RawCalEvent[];
						items?: RawCalEvent[];
						content?: RawCalEvent[];
					};
					events = [
						...fromDaysMap(body.days),
						...fromFlatList(asList<RawCalEvent>(body.events)),
						...fromFlatList(asList<RawCalEvent>(body.items)),
						...fromFlatList(asList<RawCalEvent>(body.content)),
						...fromFlatList(asList<RawCalEvent>(calendarResult.data)),
					];
				}

				if (events.length === 0) {
					const [eventsRes, upcomingRes] = await Promise.all([
						baseQuery(`/api/companies/${inn}/events`),
						baseQuery(`/api/companies/${inn}/payments/upcoming`),
					]);
					const merged = [
						...asList<RawCalEvent>(eventsRes.error ? null : eventsRes.data),
						...asList<RawCalEvent>(upcomingRes.error ? null : upcomingRes.data),
					];
					events = fromFlatList(merged);
				}

				return {
					data: {
						year,
						month,
						today,
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
				return {
					data: {
						items: (body.sources ?? []).map((s) => {
							const code = normalizeSourceCode(String(s.code ?? s.name ?? ""));
							const operationCount =
								typeof s.operationCount === "number" ? s.operationCount : undefined;
							return {
								id: code,
								name: code || String(s.name ?? ""),
								description: operationCount != null ? String(operationCount) : "",
								connected: Boolean(s.connected),
								operationCount,
								lastDataDate: s.lastDataDate ?? null,
							};
						}),
					},
				};
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

		uploadSourceFile: build.mutation<SyncResultDto, { formData: FormData; inn: string }>({
			async queryFn({ formData, inn: innArg }, _api, _extra, baseQuery) {
				const inn = (innArg || getActiveInn() || "").replace(/\D/g, "");
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations/csv`,
					method: "POST",
					body: formData,
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
				const [settings, forecast, presetsRes] = await Promise.all([
					baseQuery(`/api/companies/${inn}/forecast-settings`),
					baseQuery({ url: `/api/companies/${inn}/forecast`, params: { horizonDays: 30 } }),
					baseQuery(`/api/companies/${inn}/forecast-presets`),
				]);
				if (settings.error) return { error: asError(settings) };
				const s = settings.data as {
					cautionLevel?: string;
					minBalance?: number;
					salaryDay?: number;
					notifyRules?: Record<string, boolean>;
					presets?: Record<string, { haircutPct?: number; delayDays?: number; minBalanceK?: number }>;
				};
				const rawPresets =
					presetsRes.error
						? []
						: (((presetsRes.data as { presets?: RawForecastPreset[] })?.presets ?? []) as RawForecastPreset[]);
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
									summary?: { gapDate?: string | null; gapAmount?: number; gapProbability?: number };
								}).points ?? []
							).map((p) => ({
								date: p.date,
								balance: p.baseBalance ?? 0,
								pessimisticBalance: p.negativeBalance ?? null,
							}));
				const forecastSummary = forecast.error
					? undefined
					: (forecast.data as { summary?: { gapDate?: string | null; gapAmount?: number; gapProbability?: number } })
							?.summary;
				const active = cautionToStrategyKey(s.cautionLevel);
				const minBalanceK = Math.round((s.minBalance ?? 150_000) / 1000);
				const salaryDay = s.salaryDay ?? 5;
				const byKey = new Map<StrategyKey, RawForecastPreset>();
				rawPresets.forEach((p) => {
					const key = strategyKeyFromCode(p.code);
					if (key) byKey.set(key, p);
				});
				const presets: Record<StrategyKey, StrategyParamsDto> = {
					cons: paramsFromPreset("cons", byKey.get("cons"), minBalanceK),
					base: paramsFromPreset("base", byKey.get("base"), minBalanceK),
					opt: paramsFromPreset("opt", byKey.get("opt"), minBalanceK),
					own: paramsFromPreset("own", byKey.get("own"), minBalanceK),
				};
				if (s.presets && typeof s.presets === "object") {
					(["cons", "base", "opt", "own"] as StrategyKey[]).forEach((key) => {
						const fromSettings = s.presets?.[key] ?? s.presets?.[cautionLevelName(key)];
						if (!fromSettings) return;
						presets[key] = {
							haircutPct: fromSettings.haircutPct ?? presets[key].haircutPct,
							delayDays: fromSettings.delayDays ?? presets[key].delayDays,
							minBalanceK: fromSettings.minBalanceK ?? presets[key].minBalanceK,
						};
					});
				}
				const activeRaw =
					rawPresets.find((p) => p.active) ??
					byKey.get(active) ??
					rawPresets.find((p) => strategyKeyFromCode(p.code) === active);
				const probabilityPct = toProbabilityPct(
					activeRaw?.gapProbability ?? forecastSummary?.gapProbability,
				);
				const gapDate = activeRaw?.gapDate || forecastSummary?.gapDate || null;
				const gapAmount = activeRaw?.gapAmount ?? forecastSummary?.gapAmount;
				const rules = Object.entries(s.notifyRules ?? {}).map(([id, enabled]) => ({
					id,
					label: id,
					enabled: Boolean(enabled),
				}));
				return {
					data: {
						active,
						salaryDay,
						presets,
						impact: {
							probabilityPct,
							gapLabel: gapDate ?? "",
							cashflow: {
								points,
								gap:
									gapDate != null
										? {
												date: gapDate,
												balance: gapAmount != null ? -Math.abs(gapAmount) : 0,
											}
										: null,
							},
							showRisk: Boolean(gapDate) || points.some((p) => (p.pessimisticBalance ?? 0) < 0),
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
				const cautionLevel = cautionLevelName(body.active);
				const result = await baseQuery({
					url: `/api/companies/${inn}/forecast-settings`,
					method: "PUT",
					body: {
						cautionLevel,
						minBalance: body.params.minBalanceK * 1000,
						salaryDay: body.salaryDay ?? 5,
						notifyRules: Object.fromEntries((body.rules ?? []).map((r) => [r.id, r.enabled])),
						presets: {
							[body.active]: body.params,
							[cautionLevel]: body.params,
						},
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
						active: cautionToStrategyKey(saved.cautionLevel) || body.active,
						salaryDay: saved.salaryDay ?? body.salaryDay ?? 5,
						presets: { cons: params, base: params, opt: params, own: params },
						impact: {
							probabilityPct: 0,
							gapLabel: "",
							cashflow: { points: [] },
							showRisk: false,
						},
						rules: Object.entries(saved.notifyRules ?? {}).map(([id, enabled]) => ({
							id,
							label: id,
							enabled: Boolean(enabled),
						})),
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
					url: `/api/companies/${inn}/events/import/preview`,
					method: "POST",
					body,
				});
				if (result.error) return { error: asError(result) };
				const preview = result.data as {
					rows?: {
						rowNumber?: number;
						operation?: Record<string, unknown>;
						missingFields?: string[];
						readyForReview?: boolean;
					}[];
				};
				const rows = (preview.rows ?? []).map((r) => {
					const op = r.operation ?? {};
					const amount = Number(op.amount ?? 0);
					return {
						date: pickIsoDate(op.eventDate, op.date, op.dueDate),
						name: String(op.title ?? op.name ?? ""),
						category: String(op.category ?? ""),
						amount,
						ok: Boolean(r.readyForReview) && !(r.missingFields?.length),
					};
				});
				return { data: { rows } };
			},
		}),

		confirmParsedEvents: build.mutation<{ ok: boolean }, { rows: ParseEventsResultDto["rows"] }>({
			async queryFn({ rows }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/events/import/confirm`,
					method: "POST",
					body: {
						rows: rows
							.filter((r) => r.ok)
							.map((r) => ({
								eventDate: r.date,
								title: r.name,
								category: r.category,
								amount: Math.abs(r.amount),
								direction: r.amount >= 0 ? "Поступление" : "Списание",
							})),
					},
				});
				if (result.error) return { error: asError(result) };
				return { data: { ok: true } };
			},
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
		}),

		askAssistant: build.mutation<string, { question: string; conversationId?: string }>({
			async queryFn({ question, conversationId }, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/assistant/ask`,
					method: "POST",
					body: {
						question,
						conversationId: conversationId || undefined,
					},
				});
				if (result.error) return { error: asError(result) };
				const body = result.data as { answer?: string } | string | null;
				const answer =
					typeof body === "string"
						? body.trim()
						: String(body?.answer ?? "").trim();
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
