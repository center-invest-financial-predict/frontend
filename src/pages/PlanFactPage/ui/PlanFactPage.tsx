import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useGetPlanFactQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
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

			{isLoading ? <StateBanner variant="loading" title={t("states.loading")} /> : null}
			{isError || !data ? (
				isLoading ? null : (
					<StateBanner
						variant="error"
						title={t("states.errorTitle")}
						actionLabel={t("states.errorRetry")}
						onAction={() => refetch()}
					/>
				)
			) : (
				<div className={styles["plan-fact-page__grid"]}>
					<Card className={styles["plan-fact-page__chart"]}>
						<div className={styles["plan-fact-page__chart-head"]}>
							<div>
								<div className={styles["plan-fact-page__card-title"]}>{t("planFact.chartTitle")}</div>
								<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.chartSub")}</p>
							</div>
							<div className={styles["plan-fact-page__legend"]}>
								<span>
									<span className={styles["plan-fact-page__leg-fact"]} />
									{t("planFact.fact")}
								</span>
								<span>
									<span className={styles["plan-fact-page__leg-plan"]} />
									{t("planFact.plan")}
								</span>
							</div>
						</div>
						<CashflowChart series={data.cashflow} showRisk={false} />
						<div className={styles["plan-fact-page__stats"]}>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.factOn")}</div>
								<b className={styles["plan-fact-page__stat-val"]}>{formatMoneyAbs(data.factOn, locale)}</b>
							</div>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.planOn")}</div>
								<b className={styles["plan-fact-page__stat-val"]}>{formatMoneyAbs(data.planOn, locale)}</b>
							</div>
							<div>
								<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.diff")}</div>
								<b className={styles["plan-fact-page__stat-bad"]}>{formatMoneyAbs(data.diff, locale)}</b>
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
							{data.journal.map((j) => (
								<div key={`${j.at}-${j.text}`} className={styles["plan-fact-page__j-row"]}>
									<div className={styles["plan-fact-page__j-time"]}>{j.at}</div>
									<div>{j.text}</div>
								</div>
							))}
						</Card>
					</div>
				</div>
			)}
		</Page>
	);
});

export default PlanFactPage;
