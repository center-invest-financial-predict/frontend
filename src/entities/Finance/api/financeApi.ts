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
	OperationsDto,
	OperationsQueryArgs,
	ParseEventsResultDto,
	PlanFactDto,
	RegularOperationDto,
	SavedScenarioDto,
	SourcesDto,
	StrategiesDto,
	UpdateStrategiesArgs,
} from "../model/types";

const noInnError = (): FetchBaseQueryError => ({
	status: 400,
	data: { message: "Company INN is not set" },
});

const asError = (result: { error?: FetchBaseQueryError }): FetchBaseQueryError =>
	result.error ?? { status: 500, data: { message: "Request failed" } };

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
				const result = await baseQuery({
					url: `/api/companies/${inn}/forecast`,
					params: { horizonDays: horizon },
				});
				if (result.error) return { error: asError(result) };
				const body = result.data as {
					points?: {
						date: string;
						baseBalance?: number;
						negativeBalance?: number;
						confidenceLow?: number;
						confidenceHigh?: number;
					}[];
				};
				const points = (body.points ?? []).map((p) => ({
					date: p.date,
					balance: p.baseBalance ?? 0,
					pessimisticBalance: p.negativeBalance ?? null,
					lowerBound: p.confidenceLow ?? null,
					upperBound: p.confidenceHigh ?? null,
				}));
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
						scenarios: [],
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
					method: "PUT",
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
					points?: { date: string; fact?: number; plan?: number }[];
					missedOnTime?: { title?: string; amount?: number; expectedDate?: string; overdueDays?: number }[];
				};
				const missed = body.missedOnTime?.[0];
				const journalItems = journal.error
					? []
					: (((journal.data as { entries?: { at?: string; text?: string }[] })?.entries ??
							(Array.isArray(journal.data) ? journal.data : [])) as {
							at?: string;
							text?: string;
							createdAt?: string;
							message?: string;
						}[]);
				return {
					data: {
						cashflow: {
							points: (body.points ?? []).map((p) => ({
								date: p.date,
								balance: p.fact ?? 0,
								pessimisticBalance: p.plan ?? null,
							})),
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
							at: j.at || j.createdAt || "",
							text: j.text || j.message || "",
						})),
					},
				};
			},
			providesTags: ["PlanFact"],
		}),

		getOperations: build.query<OperationsDto, OperationsQueryArgs | void>({
			async queryFn(args, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations`,
					params: { size: 100, sort: "operationDate,DESC" },
				});
				if (result.error) return { error: asError(result) };
				const page = result.data as {
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
				return {
					data: {
						items,
						categories,
						balanceHistory: { points: [] },
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
					}[];
				};
				return {
					data: {
						items: (body.sources ?? []).map((s) => ({
							id: s.code ?? s.name ?? "",
							name: s.name ?? s.code ?? "",
							description: s.operationCount != null ? String(s.operationCount) : "",
							connected: Boolean(s.connected),
						})),
					},
				};
			},
			providesTags: ["Sources"],
		}),

		toggleSource: build.mutation<SourcesDto, { id: string; connected: boolean }>({
			queryFn: () => ({
				error: {
					status: 501,
					data: { message: "Source toggle is not available on backend yet" },
				},
			}),
			invalidatesTags: ["Sources"],
		}),

		uploadSourceFile: build.mutation<{ ok: boolean }, FormData>({
			async queryFn(body, _api, _extra, baseQuery) {
				const inn = getActiveInn();
				if (!inn) return { error: noInnError() };
				const result = await baseQuery({
					url: `/api/companies/${inn}/operations/csv`,
					method: "POST",
					body,
				});
				if (result.error) return { error: asError(result) };
				return { data: { ok: true } };
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
				const preset = {
					haircutPct: 0,
					delayDays: 0,
					minBalanceK: Math.round((s.minBalance ?? 0) / 1000),
				};
				return {
					data: {
						active,
						presets: { cons: preset, base: preset, opt: preset, own: preset },
						impact: {
							probabilityPct: 0,
							gapLabel: "",
							cashflow: { points },
							showRisk: points.some((p) => (p.pessimisticBalance ?? 0) < 0),
						},
						rules: Object.entries(s.notifyRules ?? {}).map(([id, enabled]) => ({
							id,
							label: id,
							enabled: Boolean(enabled),
						})),
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
						minBalance: (body.own?.minBalanceK ?? 100) * 1000,
						salaryDay: 5,
						notifyRules: Object.fromEntries((body.rules ?? []).map((r) => [r.id, r.enabled])),
					},
				});
				if (result.error) return { error: asError(result) };
				return {
					data: {
						active: body.active,
						presets: {
							cons: body.own ?? { haircutPct: 0, delayDays: 0, minBalanceK: 100 },
							base: body.own ?? { haircutPct: 0, delayDays: 0, minBalanceK: 100 },
							opt: body.own ?? { haircutPct: 0, delayDays: 0, minBalanceK: 100 },
							own: body.own ?? { haircutPct: 0, delayDays: 0, minBalanceK: 100 },
						},
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
			invalidatesTags: ["Strategies", "Forecast", "Today"],
		}),

		createEvent: build.mutation<{ id: string }, CreateEventArgs>({
			queryFn: () => ({
				error: {
					status: 501,
					data: {
						message:
							"Create event body schema is ambiguous in OpenAPI (CreateRequest). Deferred.",
					},
				},
			}),
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
		}),

		confirmParsedEvents: build.mutation<{ ok: boolean }, { rows: ParseEventsResultDto["rows"] }>({
			queryFn: () => ({
				error: {
					status: 501,
					data: { message: "Confirm parsed events is not available as a separate endpoint" },
				},
			}),
			invalidatesTags: ["Events", "Today", "Forecast", "Operations"],
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
	useGetPlanFactQuery,
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
} = financeApi;
