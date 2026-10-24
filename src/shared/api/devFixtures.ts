import type { FetchArgs } from "@reduxjs/toolkit/query";

type Args = string | FetchArgs;

const iso = (y: number, m: number, d: number) =>
	`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const FORECAST_BASE = [
	412, 450, 488, 514, 880, 720, 746, 558, 596, 634, 480, 506, 532, 310, 336, 374, 412, 438, 367, 393, 419, 445, 483,
	521, 427, 453, 479, 505, 531, 569, 607,
].map((k) => k * 1000);

const FORECAST_NEG = [
	412, 450, 488, 514, 540, 380, 406, 218, 256, 294, 140, 166, 192, -30, -4, 34, 72, 98, 367, 393, 419, 445, 483, 521,
	427, 453, 479, 505, 531, 569, 607,
].map((k) => k * 1000);

const HISTORY = [
	355, 201, 239, 277, 55, 81, 107, 110, 136, 77, 115, 76, 102, 128, 154, 60, 98, 136, 162, 334, 360, 386, 412,
].map((k) => k * 1000);

const forecastStart = new Date(2026, 9, 23);
const historyStart = new Date(2026, 9, 1);

const forecastPoints = FORECAST_BASE.map((balance, i) => {
	const d = new Date(forecastStart);
	d.setDate(d.getDate() + i);
	const date = iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
	const band = 18_000 * Math.sqrt(i);
	return {
		date,
		balance,
		pessimisticBalance: FORECAST_NEG[i] ?? balance,
		lowerBound: balance - band,
		upperBound: balance + band,
	};
});

const historyPoints = HISTORY.map((balance, i) => {
	const d = new Date(historyStart);
	d.setDate(d.getDate() + i);
	return {
		date: iso(d.getFullYear(), d.getMonth() + 1, d.getDate()),
		balance,
	};
});

const cashflowForecast = {
	points: forecastPoints,
	gap: { date: iso(2026, 11, 5), balance: -30_100 },
	todayIndex: 0,
};

const cashflowHistory = {
	points: historyPoints,
	todayIndex: historyPoints.length - 1,
};

const todayFixture = {
	risk: {
		amount: -30_100,
		date: iso(2026, 11, 5),
		subtitle: "Если Дельта-Сервис задержит оплату на 14 дней. Расчёт от 23.10 08:40",
	},
	kpis: [
		{
			id: "balance",
			value: 412_300,
			trendValue: 352_000,
			sparkline: [380, 360, 390, 350, 370, 340, 360, 330, 320, 340, 360, 412].map((k) => k * 1000),
		},
		{ id: "min30", value: 309_900, trendValue: -24.8, trendUnit: "percent" },
		{ id: "in30", value: 1_428_000 },
		{ id: "out30", value: 1_233_100 },
	],
	cashflow: cashflowForecast,
	days: [
		{
			id: "d1",
			date: iso(2026, 10, 23),
			inflow: 38_000,
			outflow: 12_400,
			balance: 412_300,
			negativeBalance: 412_300,
			startBalance: 386_700,
			endBalance: 412_300,
			residual: 38_000,
			events: [],
		},
		{
			id: "d2",
			date: iso(2026, 10, 27),
			inflow: 340_000,
			outflow: 22_000,
			balance: 759_100,
			negativeBalance: 419_100,
			startBalance: 441_100,
			endBalance: 759_100,
			events: [
				{
					id: "e1",
					name: "Дельта-Сервис",
					amount: 340_000,
					source: "Счёт",
					basis: "Ожидаемая оплата счёта №148",
				},
			],
		},
		{
			id: "d3",
			date: iso(2026, 11, 5),
			inflow: 26_000,
			outflow: 248_000,
			balance: 309_900,
			negativeBalance: -30_100,
			startBalance: 531_900,
			endBalance: 309_900,
			residual: 26_000,
			events: [
				{
					id: "e2",
					name: "Зарплата",
					amount: -248_000,
					source: "Календарь",
					basis: "Регулярный платёж 5 числа",
				},
			],
		},
	],
	periods: {
		day: [
			{ id: "d23", label: "23", inflow: 38_000, outflow: 12_400 },
			{ id: "d24", label: "24", inflow: 26_000, outflow: 18_000 },
		],
		week: [
			{ id: "w1", label: "23–29", inflow: 546_000, outflow: 400_000 },
			{ id: "w2", label: "30–5", inflow: 312_000, outflow: 642_000 },
			{ id: "w3", label: "6–12", inflow: 280_000, outflow: 210_000 },
			{ id: "w4", label: "13–19", inflow: 290_000, outflow: 195_000 },
		],
		month: [{ id: "m11", label: "Ноя", inflow: 1_428_000, outflow: 1_233_100 }],
	},
	categories: [
		{ id: "c1", name: "Аренда", amount: 180_000 },
		{ id: "c2", name: "Зарплата", amount: 368_000 },
		{ id: "c3", name: "Поставщики", amount: 214_000 },
		{ id: "c4", name: "Налоги", amount: 186_400 },
		{ id: "c5", name: "Кредит", amount: 96_500 },
	],
	upcoming: [
		{ id: "p1", date: iso(2026, 10, 27), name: "Дельта-Сервис", amount: 340_000 },
		{ id: "p2", date: iso(2026, 10, 28), name: "ЕНП", amount: -186_400 },
		{ id: "p3", date: iso(2026, 10, 30), name: "Поставщик зерна", amount: -214_000 },
		{ id: "p4", date: iso(2026, 11, 2), name: "Аренда", amount: -180_000 },
		{ id: "p5", date: iso(2026, 11, 5), name: "Зарплата", amount: -248_000 },
	],
	alerts: [
		{ id: "a1", title: "Разрыв 5 ноября", meta: "−30 100 ₽ при задержке оплаты", tone: "danger" },
		{ id: "a2", title: "Просрочка Мельницы", meta: "128 400 ₽, 2 дня", tone: "warning" },
		{ id: "a3", title: "Выручка стабильна", meta: "Эквайринг каждый будний день", tone: "ok" },
		{ id: "a4", title: "Данные обновлены", meta: "23.10, 08:40", tone: "muted" },
	],
	actions: [
		{
			id: "act1",
			title: "Дельта-Сервис позже на 14 дней",
			conclusion: "Разрыв 5 ноября, −30 100 ₽",
			comparable: true,
		},
		{
			id: "act2",
			title: "Перенести оплату зерна",
			conclusion: "Снимает пик расходов 30 октября",
			comparable: false,
		},
	],
	strip: { today: 412_300, min: 309_900, day30: 607_200 },
	flows: {
		inflow30: 1_428_000,
		outflow30: 1_233_100,
		inflowBars: [40, 55, 35, 70, 45, 60, 50, 65],
		outflowBars: [50, 40, 60, 45, 80, 55, 35, 48],
	},
};

const forecastFixture = {
	cashflow: cashflowForecast,
	hasGap: true,
	resultText: "Итог: разрыв 5 ноября, не хватает 30 100 ₽",
	scenarios: [
		{
			key: "delay",
			title: "Дельта-Сервис позже",
			defaultValue: "14",
			options: [
				{ value: "0", label: "В срок" },
				{ value: "14", label: "+14 дн." },
				{ value: "21", label: "+21 дн." },
			],
		},
		{
			key: "drop",
			title: "Спад выручки",
			defaultValue: "20",
			options: [
				{ value: "0", label: "Без спада" },
				{ value: "10", label: "−10%" },
				{ value: "20", label: "−20%" },
			],
		},
		{
			key: "fixed",
			title: "Рост постоянных расходов",
			defaultValue: "10",
			options: [
				{ value: "0", label: "Без роста" },
				{ value: "10", label: "+10%" },
			],
		},
		{
			key: "skip",
			title: "Убрать просрочку Мельницы из риска",
			defaultValue: "mill",
			options: [{ value: "mill", label: "Мельница" }],
		},
	],
};

const savedScenarios = [
	{
		id: "s1",
		name: "Дельта-Сервис позже на 14 дней",
		minBalance: -30_100,
		gapDate: iso(2026, 11, 5),
		hasGap: true,
	},
	{
		id: "s2",
		name: "Задержка 14 дней и спад выручки 20%",
		minBalance: -107_300,
		gapDate: iso(2026, 11, 5),
		hasGap: true,
	},
	{
		id: "s3",
		name: "Выручка ниже на 20%",
		minBalance: 232_700,
		gapDate: iso(2026, 11, 5),
		hasGap: false,
	},
	{
		id: "s4",
		name: "Постоянные расходы +10%",
		minBalance: 280_400,
		gapDate: iso(2026, 11, 5),
		hasGap: false,
	},
];

const myScenarios = [
	{ id: "m1", name: "Разрыв 5 ноября", minBalance: -30_100, gapDate: iso(2026, 11, 5), hasGap: true, recalculatedAt: "2026-10-23T08:40:00" },
];

const planFactFixture = {
	cashflow: { ...cashflowForecast, points: forecastPoints.map(({ date, balance }) => ({ date, balance })) },
	factOn: 412_300,
	planOn: 458_900,
	diff: -46_600,
	late: { name: "Мельница", amount: 128_400, meta: "Ждали 21.10, просрочка 2 дня" },
	journal: [
		{ at: "23.10 08:40", text: "Пересчёт после выписки банка" },
		{ at: "22.10 18:05", text: "Добавлено событие: аренда 02.11" },
		{ at: "21.10 09:12", text: "Мельница отмечена как просрочка" },
		{ at: "20.10 08:40", text: "Ежедневный пересчёт прогноза" },
	],
};

const operationsFixture = {
	items: [
		{ id: "o1", date: iso(2026, 10, 23), name: "Эквайринг, выручка", amount: 26_000, category: "Продажи" },
		{ id: "o2", date: iso(2026, 10, 22), name: "Эквайринг, выручка", amount: 26_000, category: "Продажи" },
		{ id: "o3", date: iso(2026, 10, 21), name: "Поставщик молока", amount: -42_000, category: "Поставщики" },
		{ id: "o4", date: iso(2026, 10, 16), name: "Аванс", amount: -120_000, category: "Зарплата" },
		{ id: "o5", date: iso(2026, 10, 10), name: "Кредит", amount: -96_500, category: "Кредит" },
		{ id: "o6", date: iso(2026, 10, 5), name: "Зарплата", amount: -248_000, category: "Зарплата" },
		{ id: "o7", date: iso(2026, 10, 2), name: "Аренда", amount: -180_000, category: "Аренда" },
		{ id: "o8", date: iso(2026, 10, 1), name: "Эквайринг, выручка", amount: 38_000, category: "Продажи" },
	],
	categories: ["Продажи", "Поставщики", "Налоги", "Аренда", "Зарплата", "Кредит", "Прочее"],
	balanceHistory: cashflowHistory,
	totals: { total: -570_500, inflow: 90_000, outflow: -660_500, count: 8 },
};

const regularOps = [
	{
		id: "r1",
		name: "Эквайринг, выручка",
		direction: "in",
		category: "Продажи",
		period: "Каждый день",
		next: "Ежедневно",
		amountLabel: "26 000 ₽ в будни",
		status: "Ожидаем по истории",
		needsReview: false,
	},
	{
		id: "r2",
		name: "Аренда",
		direction: "out",
		category: "Аренда",
		period: "Раз в месяц",
		next: "02.11",
		amountLabel: "180 000 ₽",
		status: "Ожидаем по истории",
		needsReview: false,
	},
	{
		id: "r3",
		name: "Зарплата",
		direction: "out",
		category: "Зарплата",
		period: "Раз в месяц",
		next: "05.11",
		amountLabel: "248 000 ₽",
		status: "Добавлено пользователем",
		needsReview: false,
	},
	{
		id: "r4",
		name: "Поставщик зерна",
		direction: "out",
		category: "Поставщики",
		period: "Примерно раз в месяц",
		next: "30.10",
		amountLabel: "Суммы отличаются",
		status: "Требует проверки",
		needsReview: true,
		detail: "Суммы отличаются от месяца к месяцу — проверьте перед прогнозом.",
	},
];

const eventsFixture = {
	items: [
		{
			id: "ev1",
			date: iso(2026, 10, 27),
			name: "Дельта-Сервис",
			source: "Счёт",
			status: "Ожидается",
			tab: "exp",
			amount: 340_000,
			basis: "Оплата счёта №148",
		},
		{
			id: "ev2",
			date: iso(2026, 10, 28),
			name: "ЕНП",
			source: "Календарь",
			status: "Ожидается",
			tab: "exp",
			amount: -186_400,
			basis: "Налоговый календарь",
		},
		{
			id: "ev3",
			date: iso(2026, 10, 30),
			name: "Поставщик зерна",
			source: "История",
			status: "Ожидается",
			tab: "exp",
			amount: -214_000,
		},
		{
			id: "ev4",
			date: iso(2026, 10, 21),
			name: "Мельница",
			source: "Счёт",
			status: "Просрочен",
			tab: "over",
			amount: 128_400,
			basis: "Ждали 21.10, просрочка 2 дня",
		},
		{
			id: "ev5",
			date: iso(2026, 10, 16),
			name: "Аванс",
			source: "Ввод вручную",
			status: "Исполнено",
			tab: "done",
			amount: -120_000,
		},
		{
			id: "ev6",
			date: iso(2026, 11, 5),
			name: "Зарплата",
			source: "Календарь",
			status: "Регулярное",
			tab: "reg",
			amount: -248_000,
			basis: "Каждое 5 число",
		},
	],
};

const calendarEvents = [
	{ date: iso(2026, 10, 27), label: "Дельта +340" },
	{ date: iso(2026, 10, 28), label: "ЕНП −186" },
	{ date: iso(2026, 10, 30), label: "Зерно −214" },
	{ date: iso(2026, 11, 5), label: "Зарплата" },
];

const sourcesFixture = {
	items: [
		{ id: "src1", name: "Банк, Центр-инвест", description: "Счёт в банке, операции каждый день", connected: true },
		{ id: "src2", name: "1С", description: "Учётная база, счета и акты", connected: false },
		{ id: "src3", name: "Кассы", description: "Выручка по чекам", connected: false },
		{ id: "src4", name: "Маркетплейсы", description: "Выплаты и удержания", connected: false },
		{ id: "src5", name: "ЭДО", description: "Договоры и счета на оплату", connected: true },
	],
};

const strategiesFixture = {
	active: "base",
	presets: {
		cons: { haircutPct: 10, delayDays: 14, minBalanceK: 300 },
		base: { haircutPct: 0, delayDays: 0, minBalanceK: 200 },
		opt: { haircutPct: -10, delayDays: 0, minBalanceK: 150 },
		own: { haircutPct: 5, delayDays: 7, minBalanceK: 250 },
	},
	impact: {
		probabilityPct: 41,
		gapLabel: "разрыв 5 ноя, −30 100 ₽",
		cashflow: cashflowForecast,
		showRisk: true,
	},
	rules: [
		{ id: "a", label: "Остаток ниже минимума", enabled: true },
		{ id: "b", label: "Кассовый разрыв в ближайшие 30 дней", enabled: true },
		{ id: "c", label: "Просрочка платежа контрагента", enabled: false },
	],
};

const pathOf = (args: Args) => {
	const raw = typeof args === "string" ? args : args.url;
	return raw.split("?")[0].replace(/\/$/, "") || "/";
};

const methodOf = (args: Args) =>
	(typeof args === "string" ? "GET" : (args.method ?? "GET")).toUpperCase();

/** Contract fixtures when backend is unreachable (dev only). */
export const resolveDevFixture = (args: Args): unknown | undefined => {
	const path = pathOf(args);
	const method = methodOf(args);

	if (method === "GET") {
		if (path.endsWith("/dashboard/today") || path === "/dashboard/today") return todayFixture;
		if (path.endsWith("/forecast") || path === "/forecast") return forecastFixture;
		if (path.endsWith("/forecast/scenarios/mine")) return myScenarios;
		if (path.endsWith("/forecast/scenarios")) return savedScenarios;
		if (path.endsWith("/plan-fact") || path === "/plan-fact") return planFactFixture;
		if (path.endsWith("/operations/regular")) return regularOps;
		if (path.endsWith("/operations") || path === "/operations") {
			const params =
				typeof args === "string" ? undefined : (args.params as Record<string, string | undefined> | undefined);
			const dir = params?.dir ?? "all";
			const category = params?.category;
			let items = operationsFixture.items;
			if (dir === "in") items = items.filter((x) => x.amount > 0);
			if (dir === "out") items = items.filter((x) => x.amount < 0);
			if (category) items = items.filter((x) => x.category === category);
			const inflow = items.filter((x) => x.amount > 0).reduce((s, x) => s + x.amount, 0);
			const outflow = items.filter((x) => x.amount < 0).reduce((s, x) => s + x.amount, 0);
			return {
				...operationsFixture,
				items,
				totals: { total: inflow + outflow, inflow, outflow, count: items.length },
			};
		}
		if (path.endsWith("/events") || path === "/events") return eventsFixture;
		if (path.endsWith("/calendar") || path === "/calendar") {
			const params =
				typeof args === "string" ? undefined : (args.params as Record<string, string | number> | undefined);
			const year = Number(params?.year) || 2026;
			const month = Number(params?.month) || 10;
			return {
				year,
				month,
				today: iso(2026, 10, 23),
				events: calendarEvents.filter((e) => {
					const m = Number(e.date.slice(5, 7));
					const y = Number(e.date.slice(0, 4));
					return y === year && m === month;
				}),
			};
		}
		if (path.endsWith("/sources") || path === "/sources") return sourcesFixture;
		if (path.endsWith("/strategies") || path === "/strategies") return strategiesFixture;
		if (path.endsWith("/user") || path === "/user") {
			return { id: "dev", username: "demo", name: "Анна Крылова" };
		}
	}

	if (method === "POST") {
		if (path.includes("/forecast/scenarios")) {
			return { id: `s-${Date.now()}`, name: "Сохранённый сценарий", minBalance: -30_100, gapDate: iso(2026, 11, 5), hasGap: true };
		}
		if (path.endsWith("/sources/upload")) return { ok: true };
		if (path.endsWith("/events/parse")) {
			return {
				rows: [
					{ date: iso(2026, 10, 29), name: "Оплата от Сити-Фуд", category: "Продажи", amount: 120_000, ok: true },
					{ date: iso(2026, 11, 2), name: "Аренда склада", category: "Аренда", amount: -180_000, ok: false },
					{ date: iso(2026, 11, 5), name: "Зарплата", category: "Зарплата", amount: -248_000, ok: false },
				],
			};
		}
		if (path.endsWith("/events/parse/confirm")) return { ok: true };
		if (path.endsWith("/events") || path === "/events") return { id: `ev-${Date.now()}` };
		if (path.includes("/user/")) return { id: "dev", username: "demo", accessToken: "dev-token" };
	}

	if (method === "PATCH" || method === "PUT") {
		if (path.includes("/sources/")) return sourcesFixture;
		if (path.includes("/forecast/scenarios/")) {
			return { id: "m1", name: "Переименовано", minBalance: -30_100, gapDate: iso(2026, 11, 5), hasGap: true };
		}
		if (path.endsWith("/strategies") || path === "/strategies") return strategiesFixture;
	}

	return undefined;
};
