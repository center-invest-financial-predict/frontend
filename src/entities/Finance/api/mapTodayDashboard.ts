import type { TodayDashboardDto } from "../model/types";

type DashboardResponse = {
	currentBalance?: number;
	balanceChange7d?: number;
	balanceSparkline?: number[];
	minBalance30d?: number;
	minBalanceDate?: string;
	gapAmount?: number;
	gapDate?: string;
	gapProbability?: number;
	weeklyIncome?: number;
	weeklyExpense?: number;
	weeklyIncomeChangePct?: number;
	weeklyExpenseChangePct?: number;
	calculatedAt?: string;
};

type DayPoint = {
	date: string;
	baseBalance?: number;
	negativeBalance?: number;
	confidenceLow?: number;
	confidenceHigh?: number;
	income?: number;
	expense?: number;
};

type ForecastSeriesResponse = {
	points?: DayPoint[];
};

type WeekBucket = {
	weekStart: string;
	weekEnd: string;
	income: number;
	expense: number;
};

type CategoryBucket = {
	category: string;
	amount: number;
};

type AlertDto = {
	id: string;
	title: string;
	description?: string;
	severity?: string;
	date?: string;
};

type CashEventDto = {
	id?: number | null;
	title?: string;
	amount?: number;
	eventDate?: string;
	direction?: string;
};

type RecommendationDto = {
	id: string;
	title: string;
	description?: string;
};

const severityTone = (severity?: string): "danger" | "warning" | "ok" | "muted" => {
	if (severity === "critical") return "danger";
	if (severity === "warning") return "warning";
	if (severity === "info") return "muted";
	return "muted";
};

export const mapTodayDashboard = (args: {
	dashboard: DashboardResponse;
	forecast: ForecastSeriesResponse;
	weeks: WeekBucket[];
	categories: CategoryBucket[];
	alerts: AlertDto[];
	upcoming: CashEventDto[];
	recommendations: RecommendationDto[];
}): TodayDashboardDto => {
	const { dashboard: d, forecast, weeks, categories, alerts, upcoming, recommendations } = args;
	const points = (forecast.points ?? []).map((p) => ({
		date: p.date,
		balance: p.baseBalance ?? 0,
		pessimisticBalance: p.negativeBalance ?? null,
		lowerBound: p.confidenceLow ?? null,
		upperBound: p.confidenceHigh ?? null,
	}));

	const gapAmount = d.gapAmount ?? 0;
	const gapDate = d.gapDate ?? "";

	const weekBuckets = weeks.map((w, i) => ({
		id: `w${i}`,
		label: w.weekStart,
		inflow: w.income,
		outflow: w.expense,
	}));

	const dayRows = (forecast.points ?? []).slice(0, 14).map((p, i) => ({
		id: `d${i}`,
		date: p.date,
		inflow: p.income ?? 0,
		outflow: p.expense ?? 0,
		balance: p.baseBalance ?? 0,
		negativeBalance: p.negativeBalance ?? 0,
		startBalance: p.baseBalance ?? 0,
		endBalance: p.baseBalance ?? 0,
		events: [] as { id: string; name: string; amount: number; source: string }[],
	}));

	const inflow30 = (forecast.points ?? []).reduce((s, p) => s + (p.income ?? 0), 0);
	const outflow30 = (forecast.points ?? []).reduce((s, p) => s + (p.expense ?? 0), 0);

	return {
		risk: gapDate
			? {
					amount: -Math.abs(gapAmount),
					date: gapDate,
					subtitle: d.calculatedAt ? `Расчёт от ${d.calculatedAt}` : "",
				}
			: null,
		kpis: [
			{
				id: "balance",
				value: d.currentBalance ?? 0,
				trendValue: d.balanceChange7d ?? null,
				sparkline: d.balanceSparkline,
			},
			{
				id: "min30",
				value: d.minBalance30d ?? 0,
				trendValue: null,
			},
			{ id: "in30", value: inflow30 || (d.weeklyIncome ?? 0) * 4 },
			{ id: "out30", value: outflow30 || (d.weeklyExpense ?? 0) * 4 },
		],
		cashflow: {
			points,
			gap: gapDate ? { date: gapDate, balance: -Math.abs(gapAmount) } : null,
			todayIndex: 0,
		},
		days: dayRows,
		periods: {
			day: dayRows.map((r) => ({
				id: r.id,
				label: r.date,
				inflow: r.inflow,
				outflow: r.outflow,
			})),
			week: weekBuckets,
			month: weekBuckets,
		},
		categories: categories.map((c, i) => ({
			id: `c${i}`,
			name: c.category,
			amount: c.amount,
		})),
		upcoming: upcoming.map((e, i) => ({
			id: String(e.id ?? `u${i}`),
			date: e.eventDate ?? "",
			name: e.title ?? "",
			amount: e.direction === "Поступление" ? Math.abs(e.amount ?? 0) : -Math.abs(e.amount ?? 0),
		})),
		alerts: alerts.map((a) => ({
			id: a.id,
			title: a.title,
			meta: a.description || a.date || "",
			tone: severityTone(a.severity),
		})),
		actions: recommendations.map((r) => ({
			id: r.id,
			title: r.title,
			conclusion: r.description || "",
			comparable: true,
		})),
		strip: {
			today: d.currentBalance ?? 0,
			min: d.minBalance30d ?? 0,
			day30: points[points.length - 1]?.balance ?? d.currentBalance ?? 0,
		},
		flows: {
			inflow30: inflow30 || (d.weeklyIncome ?? 0) * 4,
			outflow30: outflow30 || (d.weeklyExpense ?? 0) * 4,
			inflowBars: weeks.map((w) => w.income),
			outflowBars: weeks.map((w) => w.expense),
		},
	};
};
