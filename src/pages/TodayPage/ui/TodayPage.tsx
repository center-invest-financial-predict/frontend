import { memo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteAssistant, getRouteForecast } from "@/shared/consts/router";
import { CashflowChart } from "./CashflowChart/CashflowChart";
import { KpiCards } from "./KpiCards/KpiCards";
import styles from "./TodayPage.module.scss";

type Mode = "forecast" | "planfact";
type View = "chart" | "days";

const ACTIONS = [
	{
		titleKey: "today.actions.delta",
		conclKey: "today.actions.deltaConcl",
		hasCmp: true,
	},
	{
		titleKey: "today.actions.grain",
		conclKey: "today.actions.grainConcl",
		hasCmp: false,
	},
] as const;

const ALERTS = [
	{ titleKey: "today.alerts.a1t", metaKey: "today.alerts.a1m", tone: "danger" as const },
	{ titleKey: "today.alerts.a2t", metaKey: "today.alerts.a2m", tone: "warning" as const },
	{ titleKey: "today.alerts.a3t", metaKey: "today.alerts.a3m", tone: "ok" as const },
	{ titleKey: "today.alerts.a4t", metaKey: "today.alerts.a4m", tone: "muted" as const },
] as const;

const CATS = [
	{ nameKey: "today.cats.rent", val: "180 000 ₽", w: "w90" as const },
	{ nameKey: "today.cats.salary", val: "368 000 ₽", w: "w80" as const },
	{ nameKey: "today.cats.suppliers", val: "214 000 ₽", w: "w70" as const },
	{ nameKey: "today.cats.tax", val: "186 400 ₽", w: "w55" as const },
	{ nameKey: "today.cats.credit", val: "96 500 ₽", w: "w40" as const },
] as const;

const PAYS = [
	{ day: "27", monKey: "today.mon.oct", nameKey: "today.upcoming.delta", amt: "+340 000 ₽" },
	{ day: "28", monKey: "today.mon.oct", nameKey: "today.upcoming.enp", amt: "−186 400 ₽" },
	{ day: "30", monKey: "today.mon.oct", nameKey: "today.upcoming.grain", amt: "−214 000 ₽" },
	{ day: "2", monKey: "today.mon.nov", nameKey: "today.upcoming.rent", amt: "−180 000 ₽" },
	{ day: "5", monKey: "today.mon.nov", nameKey: "today.upcoming.salary", amt: "−248 000 ₽" },
] as const;

const DAY_ROWS = [
	{
		d: "23.10",
		inn: "38 000",
		out: "12 400",
		bal: "412 300",
		nb: "412 300",
		start: "386 700",
		end: "412 300",
		neg: "412 300",
		negBad: false,
		rest: "38 000",
		ev: [] as { n: string; a: string; src: string; basis: string; in: boolean }[],
	},
	{
		d: "27.10",
		inn: "340 000",
		out: "22 000",
		bal: "759 100",
		nb: "419 100",
		start: "441 100",
		end: "759 100",
		neg: "419 100",
		negBad: false,
		rest: "",
		ev: [
			{
				n: "Дельта-Сервис",
				a: "+340 000 ₽",
				src: "Счёт",
				basis: "Ожидаемая оплата счёта №148",
				in: true,
			},
		],
	},
	{
		d: "05.11",
		inn: "26 000",
		out: "248 000",
		bal: "309 900",
		nb: "−30 100",
		start: "531 900",
		end: "309 900",
		neg: "−30 100",
		negBad: true,
		rest: "26 000",
		ev: [
			{
				n: "Зарплата",
				a: "−248 000 ₽",
				src: "Календарь",
				basis: "Регулярный платёж 5 числа",
				in: false,
			},
		],
	},
] as const;

const WEEKS = [
	{ label: "23–29", inV: "546", outV: "400", inH: "h90", outH: "h70" },
	{ label: "30–5", inV: "312", outV: "642", inH: "h50", outH: "h95" },
	{ label: "6–12", inV: "280", outV: "210", inH: "h45", outH: "h40" },
	{ label: "13–19", inV: "290", outV: "195", inH: "h48", outH: "h35" },
] as const;

const TodayPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const [mode, setMode] = useState<Mode>("forecast");
	const [view, setView] = useState<View>("chart");
	const [aboutOpen, setAboutOpen] = useState(false);
	const [period, setPeriod] = useState<"day" | "week" | "month">("week");
	const [dayOpen, setDayOpen] = useState<(typeof DAY_ROWS)[number] | null>(null);

	return (
		<Page className={styles["today-page"]}>
			<h1 className={styles["today-page__title"]}>{t("today.title")}</h1>

			<div className={styles["today-page__risk"]}>
				<div className={styles["today-page__risk-text"]}>
					<div className={styles["today-page__risk-title"]}>
						{t("today.riskTitle", {
							sum: t("today.riskSum"),
							date: t("today.riskDate"),
						})}
					</div>
					<div className={styles["today-page__risk-sub"]}>{t("today.riskSub")}</div>
				</div>
				<div className={styles["today-page__risk-actions"]}>
					<button
						type="button"
						className={styles["today-page__risk-primary"]}
						onClick={() => navigate(getRouteForecast())}
					>
						{t("today.riskCheck")}
					</button>
					<button
						type="button"
						className={styles["today-page__risk-secondary"]}
						onClick={() => navigate(getRouteAssistant())}
					>
						{t("today.riskAsk")}
					</button>
				</div>
			</div>

			<KpiCards />

			<div className={styles["today-page__main"]}>
				<Card className={styles["today-page__chart-card"]}>
					<div className={styles["today-page__chart-head"]}>
						<div className={styles["today-page__chart-title"]}>{t("today.balance30")}</div>
						<div className={styles["today-page__seg"]}>
							{(
								[
									["forecast", "today.modeForecast"],
									["planfact", "today.modePlanFact"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									className={cn(styles["today-page__pill"], mode === key && styles["today-page__pill--active"])}
									onClick={() => setMode(key)}
								>
									{t(label)}
								</button>
							))}
						</div>
					</div>

					<div className={styles["today-page__chart-tools"]}>
						<div className={styles["today-page__seg"]}>
							{(
								[
									["chart", "today.viewChart"],
									["days", "today.viewDays"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									className={cn(styles["today-page__pill"], view === key && styles["today-page__pill--active"])}
									onClick={() => setView(key)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<button type="button" className={styles["today-page__link"]} onClick={() => setAboutOpen((v) => !v)}>
							{t("today.about")}
						</button>
					</div>

					{aboutOpen ? <div className={styles["today-page__about"]}>{t("today.aboutText")}</div> : null}

					{view === "chart" ? (
						<div className={styles["today-page__chart-plot"]}>
							<CashflowChart showRisk={mode === "forecast"} range={30} />
						</div>
					) : (
						<div className={styles["today-page__days"]}>
							<div className={styles["today-page__days-head"]}>
								<span>{t("today.colDate")}</span>
								<span>{t("today.colIn")}</span>
								<span>{t("today.colOut")}</span>
								<span>{t("today.colBal")}</span>
								<span>{t("today.colNeg")}</span>
							</div>
							{DAY_ROWS.map((row) => (
								<button
									key={row.d}
									type="button"
									className={styles["today-page__days-row"]}
									onClick={() => setDayOpen(row)}
								>
									<span>{row.d}</span>
									<span className={styles["today-page__days-in"]}>{row.inn}</span>
									<span>{row.out}</span>
									<span className={styles["today-page__days-bal"]}>{row.bal}</span>
									<span
										className={cn(
											styles["today-page__days-bal"],
											row.nb.includes("−") && styles["today-page__days-neg"],
										)}
									>
										{row.nb}
									</span>
								</button>
							))}
						</div>
					)}

					<div className={styles["today-page__strip"]}>
						{(
							[
								["today.stripToday", "412 300 ₽", "w70"],
								["today.stripMin", "309 900 ₽", "w55"],
								["today.strip30", "607 200 ₽", "w100"],
							] as const
						).map(([label, value, w]) => (
							<div key={label} className={styles["today-page__strip-item"]}>
								<span className={styles["today-page__strip-label"]}>{t(label)}</span>
								<span className={styles["today-page__strip-value"]}>{value}</span>
								<div className={styles["today-page__strip-bar"]}>
									<div className={cn(styles["today-page__strip-fill"], styles[`today-page__strip-fill--${w}`])} />
								</div>
							</div>
						))}
					</div>
				</Card>

				<div className={styles["today-page__side"]}>
					<Card className={styles["today-page__actions"]}>
						<div className={styles["today-page__actions-head"]}>
							<div className={styles["today-page__chart-title"]}>{t("today.variants")}</div>
							<button type="button" className={styles["today-page__link"]} onClick={() => navigate(getRouteForecast())}>
								{t("today.allVariants")}
							</button>
						</div>
						{ACTIONS.map((a) => (
							<div key={a.titleKey} className={styles["today-page__action"]}>
								<span className={styles["today-page__action-title"]}>{t(a.titleKey)}</span>
								<span className={styles["today-page__action-concl"]}>{t(a.conclKey)}</span>
								<div className={styles["today-page__action-pills"]}>
									{a.hasCmp ? (
										<button
											type="button"
											className={styles["today-page__action-pill--primary"]}
											onClick={() => navigate(getRouteForecast())}
										>
											{t("today.compareScens")}
										</button>
									) : null}
									<button
										type="button"
										className={styles["today-page__action-pill"]}
										onClick={() => navigate(getRouteAssistant())}
									>
										{t("today.askAssist")}
									</button>
								</div>
							</div>
						))}
					</Card>
				</div>
			</div>

			<div className={styles["today-page__alerts"]}>
				{ALERTS.map((a) => (
					<button
						key={a.titleKey}
						type="button"
						className={styles["today-page__alert"]}
						onClick={() => navigate(getRouteForecast())}
					>
						<span className={cn(styles["today-page__alert-dot"], styles[`today-page__alert-dot--${a.tone}`])} />
						<span>
							<span className={styles["today-page__alert-title"]}>{t(a.titleKey)}</span>
							<span className={styles["today-page__alert-meta"]}>{t(a.metaKey)}</span>
						</span>
					</button>
				))}
			</div>

			<div className={styles["today-page__bottom"]}>
				<Card className={styles["today-page__weeks"]}>
					<div className={styles["today-page__weeks-head"]}>
						<div className={styles["today-page__chart-title"]}>{t("today.moneyWeeks")}</div>
						<div className={cn(styles["today-page__seg"], styles["today-page__seg--sm"])}>
							{(
								[
									["day", "today.perDay"],
									["week", "today.perWeek"],
									["month", "today.perMonth"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									className={cn(
										styles["today-page__pill"],
										styles["today-page__pill--sm"],
										period === key && styles["today-page__pill--active"],
									)}
									onClick={() => setPeriod(key)}
								>
									{t(label)}
								</button>
							))}
						</div>
					</div>
					<div className={styles["today-page__week-chart"]}>
						<span className={styles["today-page__peak"]}>{t("today.peak")}</span>
						{WEEKS.map((w) => (
							<button key={w.label} type="button" className={styles["today-page__week"]}>
								<div className={styles["today-page__week-bars"]}>
									<div className={styles["today-page__week-col"]}>
										<span>{w.inV}</span>
										<div
											className={cn(
												styles["today-page__week-bar"],
												styles["today-page__week-bar--in"],
												styles[`today-page__week-bar--${w.inH}`],
											)}
										/>
									</div>
									<div className={styles["today-page__week-col"]}>
										<span>{w.outV}</span>
										<div
											className={cn(
												styles["today-page__week-bar"],
												styles["today-page__week-bar--out"],
												styles[`today-page__week-bar--${w.outH}`],
											)}
										/>
									</div>
								</div>
								<span className={styles["today-page__week-label"]}>{w.label}</span>
							</button>
						))}
					</div>
					<div className={styles["today-page__week-legend"]}>
						<span>
							<span className={cn(styles["today-page__swatch"], styles["today-page__swatch--in"])} />
							{t("today.came")}
						</span>
						<span>
							<span className={cn(styles["today-page__swatch"], styles["today-page__swatch--out"])} />
							{t("today.went")}
						</span>
					</div>
				</Card>

				<Card className={styles["today-page__cats"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.whereMoney")}</div>
					{CATS.map((c) => (
						<div key={c.nameKey} className={styles["today-page__cat"]}>
							<div className={styles["today-page__cat-row"]}>
								<span>{t(c.nameKey)}</span>
								<span>{c.val}</span>
							</div>
							<div className={styles["today-page__cat-track"]}>
								<div className={cn(styles["today-page__cat-fill"], styles[`today-page__cat-fill--${c.w}`])} />
							</div>
						</div>
					))}
				</Card>

				<Card className={styles["today-page__pays"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.upcomingTitle")}</div>
					{PAYS.map((p) => (
						<div key={p.nameKey} className={styles["today-page__pay"]}>
							<div className={styles["today-page__pay-date"]}>
								<span>{p.day}</span>
								<span>{t(p.monKey)}</span>
							</div>
							<span className={styles["today-page__pay-name"]}>{t(p.nameKey)}</span>
							<span className={styles["today-page__pay-amt"]}>{p.amt}</span>
						</div>
					))}
				</Card>

				<Card className={styles["today-page__flows"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.flows")}</div>
					<div className={styles["today-page__flow"]}>
						<div className={styles["today-page__flow-row"]}>
							<span>{t("today.in30")}</span>
							<span className={cn(styles["today-page__flow-value"], styles["today-page__flow-value--in"])}>
								1 428 000 ₽
							</span>
						</div>
						<div className={styles["today-page__flow-bars"]}>
							{[40, 55, 35, 70, 45, 60, 50, 65].map((h, i) => (
								<div
									key={i}
									className={cn(
										styles["today-page__flow-bar"],
										styles["today-page__flow-bar--in"],
										styles[`today-page__flow-bar--h${h}`],
									)}
								/>
							))}
						</div>
					</div>
					<div className={styles["today-page__flow"]}>
						<div className={styles["today-page__flow-row"]}>
							<span>{t("today.out30")}</span>
							<span className={styles["today-page__flow-value"]}>1 233 100 ₽</span>
						</div>
						<div className={styles["today-page__flow-bars"]}>
							{[50, 40, 60, 45, 80, 55, 35, 48].map((h, i) => (
								<div
									key={i}
									className={cn(
										styles["today-page__flow-bar"],
										styles["today-page__flow-bar--out"],
										styles[`today-page__flow-bar--h${h}`],
									)}
								/>
							))}
						</div>
					</div>
				</Card>
			</div>

			<AnimatePresence>
				{dayOpen ? (
					<motion.div
						className={styles["today-page__drawer"]}
						role="dialog"
						aria-modal="true"
						initial={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						transition={{
							duration: reduceMotion ? 0 : 0.3,
							ease: "easeOut",
						}}
					>
						<div className={styles["today-page__drawer-head"]}>
							<div className={styles["today-page__chart-title"]}>{t("today.dayCalc", { date: dayOpen.d })}</div>
							<button
								type="button"
								className={styles["today-page__drawer-close"]}
								aria-label={t("today.close")}
								onClick={() => setDayOpen(null)}
							>
								×
							</button>
						</div>
						<p className={styles["today-page__drawer-hint"]}>{t("today.dayCalcHint")}</p>
						<div className={styles["today-page__drawer-rows"]}>
							<div>
								<span>{t("today.dayStart")}</span>
								<b>{dayOpen.start} ₽</b>
							</div>
							<div>
								<span>{t("today.dayIn")}</span>
								<b className={styles["today-page__days-in"]}>{dayOpen.inn} ₽</b>
							</div>
							<div>
								<span>{t("today.dayOut")}</span>
								<b>{dayOpen.out} ₽</b>
							</div>
							<div>
								<span>{t("today.dayEnd")}</span>
								<b>{dayOpen.end} ₽</b>
							</div>
						</div>
						<div className={styles["today-page__drawer-section"]}>{t("today.dayEvents")}</div>
						{dayOpen.ev.map((v) => (
							<div key={v.n} className={styles["today-page__drawer-ev"]}>
								<div className={styles["today-page__drawer-ev-row"]}>
									<span>{v.n}</span>
									<b className={v.in ? styles["today-page__days-in"] : undefined}>{v.a}</b>
								</div>
								<div className={styles["today-page__drawer-ev-src"]}>{t("today.daySrc", { src: v.src })}</div>
								<div className={styles["today-page__drawer-ev-basis"]}>{v.basis}</div>
							</div>
						))}
						{dayOpen.rest ? (
							<div className={styles["today-page__drawer-rest"]}>
								<span>{t("today.dayRest")}</span>
								<b>{dayOpen.rest} ₽</b>
							</div>
						) : null}
						<div className={styles["today-page__drawer-neg"]}>
							{t("today.dayNeg")}{" "}
							<b className={dayOpen.negBad ? styles["today-page__days-neg"] : undefined}>{dayOpen.neg} ₽</b>
							{dayOpen.negBad ? t("today.dayNegWarn") : null}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</Page>
	);
});

export default TodayPage;
