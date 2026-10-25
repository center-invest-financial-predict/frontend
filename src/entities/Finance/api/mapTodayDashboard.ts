import { pickIsoDate } from "@/shared/lib/format/formatDate";
import type { TodayDashboardDto } from "../model/types";

export type DashboardResponse = {
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

export type DayPoint = {
	date: string;
	baseBalance?: number;
	negativeBalance?: number;
	confidenceLow?: number;
	confidenceHigh?: number;
	income?: number;
	expense?: number;
};

export type ForecastSeriesResponse = {
	points?: DayPoint[];
};

export type WeekBucket = {
	weekStart: string;
	weekEnd: string;
	income: number;
	expense: number;
};

export type CategoryBucket = {
	category: string;
	amount: number;
};

export type AlertDto = {
	id: string;
	title: string;
	description?: string;
	severity?: string;
	date?: string;
};

export type CashEventDto = {
	id?: number | null;
	title?: string;
	name?: string;
	amount?: number;
	eventDate?: unknown;
	date?: unknown;
	dueDate?: unknown;
	direction?: string;
};

export type RecommendationDto = {
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

const toDayMonth = (iso: string) => {
	const d = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	return `${day}.${month}`;
};

const toMonthLabel = (iso: string) => {
	const d = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("ru-RU", { month: "short" });
};

const emptyDashboard = (): TodayDashboardDto => ({
	risk: null,
	kpis: [],
	cashflow: { points: [], gap: null, todayIndex: 0 },
	days: [],
	periods: { day: [], week: [], month: [] },
	categories: [],
	upcoming: [],
	alerts: [],
	actions: [],
	strip: { today: 0, min: 0, day30: 0 },
	flows: { inflow30: 0, outflow30: 0, inflowBars: [], outflowBars: [] },
});

export const mapTodayDashboard = (args: {
	dashboard?: DashboardResponse | null;
	forecast?: ForecastSeriesResponse | null;
	weeks?: WeekBucket[] | null;
	categories?: CategoryBucket[] | null;
	alerts?: AlertDto[] | null;
	upcoming?: CashEventDto[] | null;
	recommendations?: RecommendationDto[] | null;
}): TodayDashboardDto => {
	const d = args.dashboard;
	const forecast = args.forecast;
	const weeks = args.weeks ?? [];
	const categories = args.categories ?? [];
	const alerts = args.alerts ?? [];
	const upcoming = args.upcoming ?? [];
	const recommendations = args.recommendations ?? [];

	if (!d && !forecast && !weeks.length && !categories.length && !alerts.length && !upcoming.length && !recommendations.length) {
		return emptyDashboard();
	}

	const points = (forecast?.points ?? []).map((p) => ({
		date: p.date,
		balance: p.baseBalance ?? 0,
		pessimisticBalance: p.negativeBalance ?? null,
		lowerBound: p.confidenceLow ?? null,
		upperBound: p.confidenceHigh ?? null,
	}));

	const gapAmount = d?.gapAmount ?? 0;
	const gapDate = d?.gapDate ?? "";

	const weekBars = weeks.map((w, i) => ({
		id: `w${i}`,
		label: toDayMonth(w.weekStart),
		inflow: w.income,
		outflow: w.expense,
	}));

	const monthBars = (() => {
		const byMonth = new Map<string, { id: string; label: string; inflow: number; outflow: number }>();
		weeks.forEach((w, i) => {
			const key = w.weekStart.slice(0, 7);
			const existing = byMonth.get(key);
			if (existing) {
				existing.inflow += w.income;
				existing.outflow += w.expense;
			} else {
				byMonth.set(key, {
					id: `m${i}`,
					label: toMonthLabel(w.weekStart),
					inflow: w.income,
					outflow: w.expense,
				});
			}
		});
		return [...byMonth.values()];
	})();

	const dayRows = (forecast?.points ?? []).slice(0, 14).map((p, i) => ({
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

	const dayBars = dayRows.map((r) => ({
		id: r.id,
		label: toDayMonth(r.date),
		inflow: r.inflow,
		outflow: r.outflow,
	}));

	const inflow30 = (forecast?.points ?? []).reduce((s, p) => s + (p.income ?? 0), 0);
	const outflow30 = (forecast?.points ?? []).reduce((s, p) => s + (p.expense ?? 0), 0);

	const kpis = d
		? [
				{
					id: "balance" as const,
					value: d.currentBalance ?? 0,
					trendValue: d.balanceChange7d ?? null,
					sparkline: d.balanceSparkline,
				},
				{
					id: "min30" as const,
					value: d.minBalance30d ?? 0,
					trendValue: null,
				},
				{
					id: "in30" as const,
					value: inflow30 || (d.weeklyIncome ?? 0) * 4,
				},
				{
					id: "out30" as const,
					value: outflow30 || (d.weeklyExpense ?? 0) * 4,
				},
			]
		: [];

	return {
		risk: d && gapDate
			? {
					amount: -Math.abs(gapAmount),
					date: gapDate,
					subtitle: "",
					calculatedAt: d.calculatedAt ?? undefined,
				}
			: null,
		kpis,
		cashflow: {
			points,
			gap: d && gapDate ? { date: gapDate, balance: -Math.abs(gapAmount) } : null,
			todayIndex: 0,
		},
		days: dayRows,
		periods: {
			day: dayBars,
			week: weekBars,
			month: monthBars,
		},
		categories: categories.map((c, i) => ({
			id: `c${i}`,
			name: c.category,
			amount: c.amount,
		})),
		upcoming: [...upcoming]
			.map((e, i) => ({
				id: String(e.id ?? `u${i}`),
				date: pickIsoDate(e.eventDate, e.date, e.dueDate),
				name: e.title || e.name || "",
				amount:
					e.direction === "Поступление" || e.direction === "IN" || e.direction === "INCOME"
						? Math.abs(e.amount ?? 0)
						: -Math.abs(e.amount ?? 0),
			}))
			.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
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
			today: d?.currentBalance ?? 0,
			min: d?.minBalance30d ?? 0,
			day30: points[points.length - 1]?.balance ?? d?.currentBalance ?? 0,
		},
		flows: {
			inflow30: inflow30 || (d?.weeklyIncome ?? 0) * 4,
			outflow30: outflow30 || (d?.weeklyExpense ?? 0) * 4,
			inflowBars: weeks.map((w) => w.income),
			outflowBars: weeks.map((w) => w.expense),
		},
	};
};
