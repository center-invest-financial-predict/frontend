import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	mapTodayDashboard,
	useGetTodayAlertsQuery,
	useGetTodayCategoriesQuery,
	useGetTodayForecastBlockQuery,
	useGetTodayOverviewQuery,
	useGetTodayRecommendationsQuery,
	useGetTodayUpcomingQuery,
	useGetTodayWeeklyQuery,
	type TodayDayRowDto,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import {
	dayOfMonth,
	formatDateTimeShort,
	formatDayMonth,
	formatDayMonthShort,
	formatMonthShort,
} from "@/shared/lib/format/formatDate";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { toHeightLevel, toWidthLevel } from "@/shared/lib/format/toBarLevel";
import { getRouteAssistant, getRouteForecast, getRouteSources } from "@/shared/consts/router";
import { CashflowChart } from "./CashflowChart/CashflowChart";
import { KpiCards } from "./KpiCards/KpiCards";
import styles from "./TodayPage.module.scss";

type View = "chart" | "days";

const TodayPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const overview = useGetTodayOverviewQuery();
	const forecast = useGetTodayForecastBlockQuery();
	const weekly = useGetTodayWeeklyQuery();
	const categoriesQ = useGetTodayCategoriesQuery();
	const alertsQ = useGetTodayAlertsQuery();
	const upcomingQ = useGetTodayUpcomingQuery();
	const recommendationsQ = useGetTodayRecommendationsQuery();
	const [view, setView] = useState<View>("chart");
	const [aboutOpen, setAboutOpen] = useState(false);
	const [period, setPeriod] = useState<"day" | "week" | "month">("week");
	const [dayOpen, setDayOpen] = useState<TodayDayRowDto | null>(null);

	const data = useMemo(
		() =>
			mapTodayDashboard({
				dashboard: overview.data,
				forecast: forecast.data,
				weeks: weekly.data,
				categories: categoriesQ.data,
				alerts: alertsQ.data,
				upcoming: upcomingQ.data,
				recommendations: recommendationsQ.data,
			}),
		[
			overview.data,
			forecast.data,
			weekly.data,
			categoriesQ.data,
			alertsQ.data,
			upcomingQ.data,
			recommendationsQ.data,
		],
	);

	const buckets = data.periods[period] ?? [];
	const maxBucket = useMemo(() => {
		let m = 1;
		buckets.forEach((b) => {
			m = Math.max(m, b.inflow, b.outflow);
		});
		return m;
	}, [buckets]);
	const maxOutflow = useMemo(() => Math.max(0, ...buckets.map((b) => b.outflow)), [buckets]);
	const peakLevel = maxOutflow > 0 ? toHeightLevel(maxOutflow / maxBucket) : null;

	const maxCat = useMemo(() => Math.max(1, ...data.categories.map((c) => c.amount), 1), [data.categories]);
	const maxStrip = useMemo(
		() => Math.max(data.strip.today, data.strip.min, data.strip.day30, 1),
		[data.strip],
	);
	const maxFlowBar = useMemo(
		() => Math.max(1, ...data.flows.inflowBars, ...data.flows.outflowBars, 1),
		[data.flows],
	);

	const queries = [overview, forecast, weekly, categoriesQ, alertsQ, upcomingQ, recommendationsQ];
	const allSettled = queries.every((q) => !q.isLoading);
	const allFailed = queries.every((q) => q.isError);
	const refetchAll = () => {
		queries.forEach((q) => {
			void q.refetch();
		});
	};

	const periodLoading = period === "day" ? forecast.isLoading : weekly.isLoading;
	const periodError = period === "day" ? forecast.isError : weekly.isError;
	const periodRefetch = period === "day" ? forecast.refetch : weekly.refetch;

	if (allFailed) {
		return (
			<Page className={styles["today-page"]}>
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={refetchAll}
				/>
			</Page>
		);
	}

	if (allSettled && !data.kpis.length && !data.cashflow.points.length) {
		return (
			<Page className={styles["today-page"]}>
				<StateBanner
					variant="empty"
					title={t("states.emptyTitle")}
					hint={t("states.emptyHint")}
					actionLabel={t("states.emptyCta")}
					onAction={() => navigate(getRouteSources())}
				/>
			</Page>
		);
	}

	return (
		<Page className={styles["today-page"]}>
			<h1 className={styles["today-page__title"]}>{t("today.title")}</h1>

			{overview.isError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => overview.refetch()}
				/>
			) : null}
			{data.risk ? (
				<div id="today-risk" className={styles["today-page__risk"]}>
					<div className={styles["today-page__risk-text"]}>
						<div className={styles["today-page__risk-title"]}>
							{t("today.riskTitle", {
								sum: formatMoneyAbs(Math.abs(data.risk.amount), locale),
								date: formatDayMonthShort(data.risk.date, locale),
							})}
						</div>
						{data.risk.calculatedAt ? (
							<div className={styles["today-page__risk-sub"]}>
								{t("today.riskCalcAt", {
									date: formatDateTimeShort(data.risk.calculatedAt, locale),
								})}
							</div>
						) : data.risk.subtitle ? (
							<div className={styles["today-page__risk-sub"]}>{data.risk.subtitle}</div>
						) : null}
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
			) : null}

			{overview.isLoading ? (
				<div id="today-kpi" className={styles["today-page__kpi-skel"]} aria-busy="true" aria-label={t("states.loading")}>
					{Array.from({ length: 4 }, (_, i) => (
						<Skeleton key={i} variant="card" />
					))}
				</div>
			) : null}
			{!overview.isLoading && data.kpis.length > 0 ? (
				<div id="today-kpi">
					<KpiCards items={data.kpis} />
				</div>
			) : null}

			<div className={styles["today-page__main"]}>
				<Card id="today-balance" className={styles["today-page__chart-card"]}>
					<div className={styles["today-page__chart-head"]}>
						<div className={styles["today-page__chart-title"]}>{t("today.balance30")}</div>
						<div
							className={styles["today-page__seg"]}
							role="radiogroup"
							aria-label={t("today.viewChart")}
						>
							{(
								[
									["chart", "today.viewChart"],
									["days", "today.viewDays"],
								] as const
							).map(([key, label]) => (
								<button
									key={key}
									type="button"
									role="radio"
									aria-checked={view === key}
									className={cn(styles["today-page__pill"], view === key && styles["today-page__pill--active"])}
									onClick={() => setView(key)}
								>
									{t(label)}
								</button>
							))}
						</div>
					</div>

					<div className={styles["today-page__chart-tools"]}>
						<button type="button" className={styles["today-page__link"]} onClick={() => setAboutOpen((v) => !v)}>
							{t("today.about")}
						</button>
					</div>

					{aboutOpen ? <div className={styles["today-page__about"]}>{t("today.aboutText")}</div> : null}

					{forecast.isLoading ? <Skeleton variant="chart" label={t("states.loading")} /> : null}
					{forecast.isError ? (
						<StateBanner
							variant="error"
							title={t("states.errorTitle")}
							actionLabel={t("states.errorRetry")}
							onAction={() => forecast.refetch()}
						/>
					) : null}
					{!forecast.isLoading && !forecast.isError && view === "chart" ? (
						<div className={styles["today-page__chart-plot"]}>
							<CashflowChart series={data.cashflow} showRisk />
						</div>
					) : null}
					{!forecast.isLoading && !forecast.isError && view === "days" ? (
						<div className={styles["today-page__days"]}>
							<div className={styles["today-page__days-head"]}>
								<span>{t("today.colDate")}</span>
								<span>{t("today.colIn")}</span>
								<span>{t("today.colOut")}</span>
								<span>{t("today.colBal")}</span>
								<span>{t("today.colNeg")}</span>
							</div>
							{data.days.map((row) => (
								<button
									key={row.id}
									type="button"
									className={styles["today-page__days-row"]}
									onClick={() => setDayOpen(row)}
								>
									<span>{formatDayMonth(row.date, locale)}</span>
									<span className={styles["today-page__days-in"]}>
										{Math.abs(row.inflow).toLocaleString(locale)}
									</span>
									<span>{Math.abs(row.outflow).toLocaleString(locale)}</span>
									<span className={styles["today-page__days-bal"]}>
										{formatMoneyAbs(row.balance, locale).replace(/\u00A0₽$/, "")}
									</span>
									<span
										className={cn(
											styles["today-page__days-bal"],
											row.negativeBalance < 0 && styles["today-page__days-neg"],
										)}
									>
										{formatMoneyAbs(row.negativeBalance, locale).replace(/\u00A0₽$/, "")}
									</span>
								</button>
							))}
						</div>
					) : null}

					{overview.data || forecast.data ? (
						<div className={styles["today-page__strip"]}>
							{(
								[
									["today.stripToday", data.strip.today],
									["today.stripMin", data.strip.min],
									["today.strip30", data.strip.day30],
								] as const
							).map(([label, value]) => {
								const w = toWidthLevel(value / maxStrip);
								return (
									<div key={label} className={styles["today-page__strip-item"]}>
										<span className={styles["today-page__strip-label"]}>{t(label)}</span>
										<span className={styles["today-page__strip-value"]}>{formatMoneyAbs(value, locale)}</span>
										<div className={styles["today-page__strip-bar"]}>
											<div
												className={cn(styles["today-page__strip-fill"], styles[`today-page__strip-fill--${w}`])}
											/>
										</div>
									</div>
								);
							})}
						</div>
					) : null}
				</Card>

				<div className={styles["today-page__side"]}>
					<Card id="today-variants" className={styles["today-page__actions"]}>
						<div className={styles["today-page__actions-head"]}>
							<div className={styles["today-page__chart-title"]}>{t("today.variants")}</div>
							<button type="button" className={styles["today-page__link"]} onClick={() => navigate(getRouteForecast())}>
								{t("today.allVariants")}
							</button>
						</div>
						{recommendationsQ.isLoading ? (
							<Skeleton variant="row" count={3} label={t("states.loading")} />
						) : null}
						{recommendationsQ.isError ? (
							<StateBanner
								variant="error"
								title={t("states.errorTitle")}
								actionLabel={t("states.errorRetry")}
								onAction={() => recommendationsQ.refetch()}
							/>
						) : null}
						{!recommendationsQ.isLoading && !recommendationsQ.isError
							? data.actions.map((a) => (
									<div key={a.id} className={styles["today-page__action"]}>
										<span className={styles["today-page__action-title"]}>{a.title}</span>
										<span className={styles["today-page__action-concl"]}>{a.conclusion}</span>
										<div className={styles["today-page__action-pills"]}>
											{a.comparable ? (
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
								))
							: null}
					</Card>
				</div>
			</div>

			{alertsQ.isLoading ? (
				<div className={styles["today-page__alerts-skel"]} aria-busy="true" aria-label={t("states.loading")}>
					{Array.from({ length: 3 }, (_, i) => (
						<Skeleton key={i} variant="row" />
					))}
				</div>
			) : null}
			{alertsQ.isError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => alertsQ.refetch()}
				/>
			) : null}
			{!alertsQ.isLoading && !alertsQ.isError && data.alerts.length > 0 ? (
				<div id="today-alerts" className={styles["today-page__alerts"]}>
					{data.alerts.map((a) => (
						<button
							key={a.id}
							type="button"
							className={styles["today-page__alert"]}
							onClick={() => navigate(getRouteForecast())}
						>
							<span className={cn(styles["today-page__alert-dot"], styles[`today-page__alert-dot--${a.tone}`])} />
							<span>
								<span className={styles["today-page__alert-title"]}>{a.title}</span>
								<span className={styles["today-page__alert-meta"]}>{a.meta}</span>
							</span>
						</button>
					))}
				</div>
			) : null}

			<div className={styles["today-page__bottom"]}>
				<Card id="today-weeks" className={styles["today-page__weeks"]}>
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
					{periodLoading ? <Skeleton variant="chart" label={t("states.loading")} /> : null}
					{periodError ? (
						<StateBanner
							variant="error"
							title={t("states.errorTitle")}
							actionLabel={t("states.errorRetry")}
							onAction={() => periodRefetch()}
						/>
					) : null}
					{!periodLoading && !periodError && buckets.length === 0 ? (
						<StateBanner variant="empty" title={t("states.emptyTitle")} hint={t("states.emptyHint")} />
					) : null}
					{!periodLoading && !periodError && buckets.length > 0 ? (
						<>
							<div
								className={cn(
									styles["today-page__week-chart"],
									buckets.length > 7 && styles["today-page__week-chart--dense"],
								)}
							>
								{peakLevel ? (
									<div className={styles["today-page__peak-track"]} aria-hidden>
										<div
											className={cn(
												styles["today-page__peak-line"],
												styles[`today-page__peak-line--${peakLevel}`],
											)}
										>
											<span className={styles["today-page__peak"]}>{t("today.peak")}</span>
										</div>
									</div>
								) : null}
								{buckets.map((w) => {
									const dense = buckets.length > 7;
									return (
										<button key={w.id} type="button" className={styles["today-page__week"]}>
											<div className={styles["today-page__week-bars"]}>
												<div className={styles["today-page__week-col"]}>
													{!dense && w.inflow > 0 ? (
														<span>{Math.round(w.inflow / 1000)}</span>
													) : null}
													<div
														className={cn(
															styles["today-page__week-bar"],
															styles["today-page__week-bar--in"],
															styles[`today-page__week-bar--${toHeightLevel(w.inflow / maxBucket)}`],
														)}
													/>
												</div>
												<div className={styles["today-page__week-col"]}>
													{!dense && w.outflow > 0 ? (
														<span>{Math.round(w.outflow / 1000)}</span>
													) : null}
													<div
														className={cn(
															styles["today-page__week-bar"],
															styles["today-page__week-bar--out"],
															styles[`today-page__week-bar--${toHeightLevel(w.outflow / maxBucket)}`],
														)}
													/>
												</div>
											</div>
											<span className={styles["today-page__week-label"]}>{w.label}</span>
										</button>
									);
								})}
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
						</>
					) : null}
				</Card>

				<Card id="today-categories" className={styles["today-page__cats"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.whereMoney")}</div>
					{categoriesQ.isLoading ? (
						<Skeleton variant="row" count={4} label={t("states.loading")} />
					) : null}
					{categoriesQ.isError ? (
						<StateBanner
							variant="error"
							title={t("states.errorTitle")}
							actionLabel={t("states.errorRetry")}
							onAction={() => categoriesQ.refetch()}
						/>
					) : null}
					{!categoriesQ.isLoading && !categoriesQ.isError
						? data.categories.map((c) => (
								<div key={c.id} className={styles["today-page__cat"]}>
									<div className={styles["today-page__cat-row"]}>
										<span>{c.name}</span>
										<span>{formatMoneyAbs(c.amount, locale)}</span>
									</div>
									<div className={styles["today-page__cat-track"]}>
										<div
											className={cn(
												styles["today-page__cat-fill"],
												styles[`today-page__cat-fill--${toWidthLevel(c.amount / maxCat)}`],
											)}
										/>
									</div>
								</div>
							))
						: null}
				</Card>

				<Card id="today-payments" className={styles["today-page__pays"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.upcomingTitle")}</div>
					{upcomingQ.isLoading ? (
						<Skeleton variant="row" count={4} label={t("states.loading")} />
					) : null}
					{upcomingQ.isError ? (
						<StateBanner
							variant="error"
							title={t("states.errorTitle")}
							actionLabel={t("states.errorRetry")}
							onAction={() => upcomingQ.refetch()}
						/>
					) : null}
					{!upcomingQ.isLoading && !upcomingQ.isError
						? data.upcoming.map((p) => (
								<div key={p.id} className={styles["today-page__pay"]}>
									<div className={styles["today-page__pay-date"]}>
										<span>{dayOfMonth(p.date)}</span>
										<span>{formatMonthShort(p.date, locale)}</span>
									</div>
									<span className={styles["today-page__pay-name"]}>{p.name}</span>
									<span className={styles["today-page__pay-amt"]}>{formatMoneyAbs(p.amount, locale)}</span>
								</div>
							))
						: null}
				</Card>

				<Card id="today-flows" className={styles["today-page__flows"]}>
					<div className={styles["today-page__chart-title"]}>{t("today.flows")}</div>
					{(weekly.isLoading || forecast.isLoading) && !weekly.data && !forecast.data ? (
						<Skeleton variant="row" count={2} label={t("states.loading")} />
					) : null}
					{weekly.isError && forecast.isError ? (
						<StateBanner
							variant="error"
							title={t("states.errorTitle")}
							actionLabel={t("states.errorRetry")}
							onAction={() => {
								void weekly.refetch();
								void forecast.refetch();
							}}
						/>
					) : null}
					{weekly.data || forecast.data ? (
						<>
							<div className={styles["today-page__flow"]}>
								<div className={styles["today-page__flow-row"]}>
									<span>{t("today.in30")}</span>
									<span className={cn(styles["today-page__flow-value"], styles["today-page__flow-value--in"])}>
										{formatMoneyAbs(data.flows.inflow30, locale)}
									</span>
								</div>
								<div className={styles["today-page__flow-bars"]}>
									{data.flows.inflowBars.map((h, i) => (
										<div
											key={`in-${i}`}
											className={cn(
												styles["today-page__flow-bar"],
												styles["today-page__flow-bar--in"],
												styles[`today-page__flow-bar--${toHeightLevel(h / maxFlowBar)}`],
											)}
										/>
									))}
								</div>
							</div>
							<div className={styles["today-page__flow"]}>
								<div className={styles["today-page__flow-row"]}>
									<span>{t("today.out30")}</span>
									<span className={styles["today-page__flow-value"]}>
										{formatMoneyAbs(data.flows.outflow30, locale)}
									</span>
								</div>
								<div className={styles["today-page__flow-bars"]}>
									{data.flows.outflowBars.map((h, i) => (
										<div
											key={`out-${i}`}
											className={cn(
												styles["today-page__flow-bar"],
												styles["today-page__flow-bar--out"],
												styles[`today-page__flow-bar--${toHeightLevel(h / maxFlowBar)}`],
											)}
										/>
									))}
								</div>
							</div>
						</>
					) : null}
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
							<div className={styles["today-page__chart-title"]}>
								{t("today.dayCalc", { date: formatDayMonth(dayOpen.date, locale) })}
							</div>
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
								<b>{formatMoneyAbs(dayOpen.startBalance, locale)}</b>
							</div>
							<div>
								<span>{t("today.dayIn")}</span>
								<b className={styles["today-page__days-in"]}>{formatMoneyAbs(dayOpen.inflow, locale)}</b>
							</div>
							<div>
								<span>{t("today.dayOut")}</span>
								<b>{formatMoneyAbs(dayOpen.outflow, locale)}</b>
							</div>
							<div>
								<span>{t("today.dayEnd")}</span>
								<b>{formatMoneyAbs(dayOpen.endBalance, locale)}</b>
							</div>
						</div>
						<div className={styles["today-page__drawer-section"]}>{t("today.dayEvents")}</div>
						{dayOpen.events.map((v) => (
							<div key={v.id} className={styles["today-page__drawer-ev"]}>
								<div className={styles["today-page__drawer-ev-row"]}>
									<span>{v.name}</span>
									<b className={v.amount > 0 ? styles["today-page__days-in"] : undefined}>
										{formatMoneyAbs(v.amount, locale)}
									</b>
								</div>
								<div className={styles["today-page__drawer-ev-src"]}>{t("today.daySrc", { src: v.source })}</div>
								{v.basis ? <div className={styles["today-page__drawer-ev-basis"]}>{v.basis}</div> : null}
							</div>
						))}
						{dayOpen.residual != null && dayOpen.residual > 0 ? (
							<div className={styles["today-page__drawer-rest"]}>
								<span>{t("today.dayRest")}</span>
								<b>{formatMoneyAbs(dayOpen.residual, locale)}</b>
							</div>
						) : null}
						<div className={styles["today-page__drawer-neg"]}>
							{t("today.dayNeg")}{" "}
							<b className={dayOpen.negativeBalance < 0 ? styles["today-page__days-neg"] : undefined}>
								{formatMoneyAbs(dayOpen.negativeBalance, locale)}
							</b>
							{dayOpen.negativeBalance < 0 ? t("today.dayNegWarn") : null}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</Page>
	);
});

export default TodayPage;
