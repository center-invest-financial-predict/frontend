import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteEvents, getRouteForecast } from "@/shared/consts/router";
import { CashflowChart } from "./CashflowChart/CashflowChart";
import { KpiCards } from "./KpiCards/KpiCards";
import styles from "./TodayPage.module.scss";

type Mode = "forecast" | "planfact";
type View = "chart" | "days";

const ACTIONS = [
	{ titleKey: "today.actions.delta", effKey: "today.actions.deltaEff" },
	{ titleKey: "today.actions.grain", effKey: "today.actions.grainEff" },
	{ titleKey: "today.actions.overdraft", effKey: "today.actions.overdraftEff" },
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
	{ d: "23.10", inn: "38 000", out: "12 400", bal: "412 300", nb: "412 300" },
	{ d: "24.10", inn: "26 000", out: "8 200", bal: "430 100", nb: "430 100" },
	{ d: "25.10", inn: "26 000", out: "15 000", bal: "441 100", nb: "441 100" },
	{ d: "27.10", inn: "340 000", out: "22 000", bal: "759 100", nb: "419 100" },
	{ d: "28.10", inn: "26 000", out: "186 400", bal: "598 700", nb: "258 700" },
	{ d: "30.10", inn: "26 000", out: "214 000", bal: "410 700", nb: "70 700" },
	{ d: "02.11", inn: "26 000", out: "180 000", bal: "256 700", nb: "−83 300" },
	{ d: "05.11", inn: "26 000", out: "248 000", bal: "309 900", nb: "−30 100" },
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
	const [mode, setMode] = useState<Mode>("forecast");
	const [view, setView] = useState<View>("chart");
	const [aboutOpen, setAboutOpen] = useState(false);
	const [openAction, setOpenAction] = useState<string | null>(null);
	const [period, setPeriod] = useState<"day" | "week" | "month">("week");

	return (
		<Page className={styles["today-page"]}>
			<h1 className={styles["today-page__title"]}>{t("today.titleDate")}</h1>

			<KpiCards />

			<div className={styles["today-page__main"]}>
				<Card className={styles["today-page__chart-card"]}>
					<div className={styles["today-page__chart-head"]}>
						<div className={styles["today-page__chart-title"]}>
							{t("today.balance30")}
						</div>
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
									className={cn(
										styles["today-page__pill"],
										mode === key && styles["today-page__pill--active"],
									)}
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
									className={cn(
										styles["today-page__pill"],
										view === key && styles["today-page__pill--active"],
									)}
									onClick={() => setView(key)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<button
							type="button"
							className={styles["today-page__link"]}
							onClick={() => setAboutOpen((v) => !v)}
						>
							{t("today.about")}
						</button>
					</div>

					{aboutOpen ? (
						<div className={styles["today-page__about"]}>{t("today.aboutText")}</div>
					) : null}

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
								<div key={row.d} className={styles["today-page__days-row"]}>
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
								</div>
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
									<div
										className={cn(
											styles["today-page__strip-fill"],
											styles[`today-page__strip-fill--${w}`],
										)}
									/>
								</div>
							</div>
						))}
					</div>
				</Card>

				<div className={styles["today-page__side"]}>
					<Card className={styles["today-page__actions"]}>
						<div className={styles["today-page__chart-title"]}>
							{t("today.consider")}
						</div>
						{ACTIONS.map((a) => (
							<div key={a.titleKey} className={styles["today-page__action"]}>
								<button
									type="button"
									className={styles["today-page__action-btn"]}
									onClick={() =>
										setOpenAction((v) => (v === a.titleKey ? null : a.titleKey))
									}
								>
									<span>
										<span className={styles["today-page__action-title"]}>
											{t(a.titleKey)}
										</span>
										<span className={styles["today-page__action-hint"]}>
											{t("today.checkVariant")}
										</span>
									</span>
									<span className={styles["today-page__action-eff"]}>
										{t(a.effKey)}
									</span>
								</button>
								{openAction === a.titleKey ? (
									<div className={styles["today-page__action-detail"]}>
										{t("today.actionDetail")}
									</div>
								) : null}
							</div>
						))}
					</Card>

					<Card className={styles["today-page__scenario"]}>
						<div className={styles["today-page__chart-title"]}>
							{t("today.dayScenario")}
						</div>
						<div className={styles["today-page__mini-chart"]}>
							<CashflowChart compact showRisk range={30} />
						</div>
						<div className={styles["today-page__legend"]}>
							<div className={styles["today-page__legend-row"]}>
								<span>
									<span className={styles["today-page__legend-base"]} />
									{t("today.base")}
								</span>
								<b>309 900 ₽</b>
							</div>
							<div className={styles["today-page__legend-row"]}>
								<span>
									<span className={styles["today-page__legend-neg"]} />
									{t("today.negative")}
								</span>
								<b className={styles["today-page__days-neg"]}>−30 100 ₽</b>
							</div>
						</div>
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
						<span
							className={cn(
								styles["today-page__alert-dot"],
								styles[`today-page__alert-dot--${a.tone}`],
							)}
						/>
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
						<div className={styles["today-page__chart-title"]}>
							{t("today.moneyWeeks")}
						</div>
						<div className={styles["today-page__seg"]}>
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
							<div key={w.label} className={styles["today-page__week"]}>
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
							</div>
						))}
					</div>
					<div className={styles["today-page__week-legend"]}>
						<span>
							<span
								className={cn(
									styles["today-page__swatch"],
									styles["today-page__swatch--in"],
								)}
							/>
							{t("today.came")}
						</span>
						<span>
							<span
								className={cn(
									styles["today-page__swatch"],
									styles["today-page__swatch--out"],
								)}
							/>
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
								<div
									className={cn(
										styles["today-page__cat-fill"],
										styles[`today-page__cat-fill--${c.w}`],
									)}
								/>
							</div>
						</div>
					))}
				</Card>

				<Card className={styles["today-page__pays"]}>
					<div className={styles["today-page__pays-head"]}>
						<div className={styles["today-page__chart-title"]}>
							{t("today.upcomingTitle")}
						</div>
						<button
							type="button"
							className={styles["today-page__link"]}
							onClick={() => navigate(getRouteEvents())}
						>
							{t("today.allEvents")}
						</button>
					</div>
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
							<span
								className={cn(
									styles["today-page__flow-value"],
									styles["today-page__flow-value--in"],
								)}
							>
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
		</Page>
	);
});

export default TodayPage;
