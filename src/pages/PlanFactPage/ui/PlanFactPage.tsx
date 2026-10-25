import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useGetPlanFactQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { getRouteForecast, getRouteStrategies } from "@/shared/consts/router";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./PlanFactPage.module.scss";

export const PlanFactPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useGetPlanFactQuery();
	const hasPlanLine = Boolean(
		data?.cashflow.points.some((p) => p.pessimisticBalance != null),
	);

	return (
		<Page className={styles["plan-fact-page"]}>
			<div>
				<h1 className={styles["plan-fact-page__title"]}>{t("planFact.title")}</h1>
				<p className={styles["plan-fact-page__sub"]}>{t("planFact.subtitle")}</p>
			</div>

			<div className={styles["plan-fact-page__toolbar"]}>
				<div className={styles["plan-fact-page__tabs"]}>
					<button type="button" className={styles["plan-fact-page__tab"]} onClick={() => navigate(getRouteForecast())}>
						{t("forecast.tabScens")}
					</button>
					<button type="button" className={styles["plan-fact-page__tab--on"]}>
						{t("forecast.tabPlanFact")}
					</button>
				</div>
				<button
					type="button"
					className={styles["plan-fact-page__settings"]}
					onClick={() => navigate(getRouteStrategies())}
				>
					<SlidersHorizontal size={18} strokeWidth={1.3} aria-hidden />
					{t("forecast.settings")}
				</button>
			</div>

			{isError && !data ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{isLoading && !data ? (
				<div className={styles["plan-fact-page__grid"]} aria-busy="true" aria-label={t("states.loading")}>
					<Card className={styles["plan-fact-page__chart"]}>
						<Skeleton variant="title" />
						<Skeleton variant="chart" />
						<Skeleton variant="row" count={3} />
					</Card>
					<div className={styles["plan-fact-page__side"]}>
						<Card className={styles["plan-fact-page__late"]}>
							<Skeleton variant="title" />
							<Skeleton variant="row" count={2} />
						</Card>
						<Card className={styles["plan-fact-page__journal"]}>
							<Skeleton variant="title" />
							<Skeleton variant="row" count={4} />
						</Card>
					</div>
				</div>
			) : null}

			{data ? (
				<div className={styles["plan-fact-page__grid"]}>
					<Card id="plan-fact-chart" className={styles["plan-fact-page__chart"]}>
						<div className={styles["plan-fact-page__chart-head"]}>
							<div>
								<div className={styles["plan-fact-page__card-title"]}>{t("planFact.chartTitle")}</div>
								<p className={styles["plan-fact-page__card-sub"]}>
									{data.planAvailable ? t("planFact.chartSub") : t("planFact.chartSubForecast")}
								</p>
							</div>
							<div className={styles["plan-fact-page__legend"]}>
								<span>
									<span className={styles["plan-fact-page__leg-fact"]} />
									{t("planFact.fact")}
								</span>
								{hasPlanLine ? (
									<span>
										<span className={styles["plan-fact-page__leg-plan"]} />
										{data.planAvailable ? t("planFact.plan") : t("planFact.planForecast")}
									</span>
								) : null}
							</div>
						</div>
						<CashflowChart series={data.cashflow} showRisk={hasPlanLine} />
						<div className={styles["plan-fact-page__stats"]}>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.factOn")}</div>
								<b className={styles["plan-fact-page__stat-val"]}>{formatMoneyAbs(data.factOn, locale)}</b>
							</div>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>
									{data.planAvailable ? t("planFact.planOn") : t("planFact.planForecast")}
								</div>
								<b className={styles["plan-fact-page__stat-val"]}>{formatMoneyAbs(data.planOn, locale)}</b>
							</div>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.diff")}</div>
								<b
									className={
										data.diff < 0
											? styles["plan-fact-page__stat-bad"]
											: styles["plan-fact-page__stat-val"]
									}
								>
									{formatMoneyAbs(data.diff, locale)}
								</b>
							</div>
						</div>
					</Card>

					<div className={styles["plan-fact-page__side"]}>
						{data.late ? (
							<Card className={styles["plan-fact-page__late"]}>
								<div className={styles["plan-fact-page__card-title"]}>{t("planFact.lateTitle")}</div>
								<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.lateSub")}</p>
								<div className={styles["plan-fact-page__late-row"]}>
									<div>
										<div className={styles["plan-fact-page__late-name"]}>{data.late.name}</div>
										<div className={styles["plan-fact-page__card-sub"]}>{data.late.meta}</div>
									</div>
									<div className={styles["plan-fact-page__stat-bad"]}>
										{formatMoneyAbs(data.late.amount, locale)}
									</div>
								</div>
							</Card>
						) : null}

						<Card className={styles["plan-fact-page__journal"]}>
							<div className={styles["plan-fact-page__card-title"]}>{t("planFact.journal")}</div>
							<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.journalSub")}</p>
							<div className={styles["plan-fact-page__journal-list"]}>
								{data.journal.length === 0 ? (
									<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.journalEmpty")}</p>
								) : (
									data.journal.map((j) => (
										<div key={`${j.at}-${j.text}`} className={styles["plan-fact-page__j-row"]}>
											<div className={styles["plan-fact-page__j-time"]}>{j.at}</div>
											<div>{j.text}</div>
										</div>
									))
								)}
							</div>
						</Card>
					</div>
				</div>
			) : null}
		</Page>
	);
});

export default PlanFactPage;
