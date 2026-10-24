import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { getRouteForecast, getRouteStrategies } from "@/shared/consts/router";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./PlanFactPage.module.scss";

const JOURNAL = [
	{ t: "23.10 08:40", x: "Пересчёт после выписки банка" },
	{ t: "22.10 18:05", x: "Добавлено событие: аренда 02.11" },
	{ t: "21.10 09:12", x: "Мельница отмечена как просрочка" },
	{ t: "20.10 08:40", x: "Ежедневный пересчёт прогноза" },
];

export const PlanFactPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();

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
					<CashflowChart showRisk={false} range={30} />
					<div className={styles["plan-fact-page__stats"]}>
						<div>
							<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.factOn")}</div>
							<b className={styles["plan-fact-page__stat-val"]}>412 300 ₽</b>
						</div>
						<div>
							<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.planOn")}</div>
							<b className={styles["plan-fact-page__stat-val"]}>458 900 ₽</b>
						</div>
						<div>
							<div className={styles["plan-fact-page__stat-label"]}>{t("planFact.diff")}</div>
							<b className={styles["plan-fact-page__stat-bad"]}>−46 600 ₽</b>
						</div>
					</div>
				</Card>

				<div className={styles["plan-fact-page__side"]}>
					<Card className={styles["plan-fact-page__late"]}>
						<div className={styles["plan-fact-page__card-title"]}>{t("planFact.lateTitle")}</div>
						<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.lateSub")}</p>
						<div className={styles["plan-fact-page__late-row"]}>
							<div>
								<div className={styles["plan-fact-page__late-name"]}>Мельница</div>
								<div className={styles["plan-fact-page__card-sub"]}>{t("planFact.lateMeta")}</div>
							</div>
							<div className={styles["plan-fact-page__stat-bad"]}>128 400 ₽</div>
						</div>
					</Card>

					<Card className={styles["plan-fact-page__journal"]}>
						<div className={styles["plan-fact-page__card-title"]}>{t("planFact.journal")}</div>
						<p className={styles["plan-fact-page__card-sub"]}>{t("planFact.journalSub")}</p>
						{JOURNAL.map((j) => (
							<div key={j.t} className={styles["plan-fact-page__j-row"]}>
								<div className={styles["plan-fact-page__j-time"]}>{j.t}</div>
								<div>{j.x}</div>
							</div>
						))}
					</Card>
				</div>
			</div>
		</Page>
	);
});

export default PlanFactPage;
