import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import styles from "./KpiCards.module.scss";

type TrendDirection = "up" | "down";
type ChartType = "sparkline" | "none";

type KpiCardData = {
	labelKey: string;
	trendBadge?: string;
	trendDirection?: TrendDirection;
	value: string;
	subKey?: string;
	chartType: ChartType;
};

const SparkLineGreen: FC = () => {
	const pts = "0,40 20,36 40,42 60,32 80,36 100,24 120,28 140,18 160,10 180,14 200,6 220,12";
	const fillPts = `0,52 ${pts} 220,52`;
	return (
		<svg width="100%" height="52" viewBox="0 0 220 52" preserveAspectRatio="none">
			<polygon points={fillPts} fill="var(--color-primary-soft)" fillOpacity="1" />
			<polyline
				points={pts}
				fill="none"
				stroke="var(--color-primary-bright)"
				strokeWidth="2.5"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</svg>
	);
};

const MOCK_CARDS: KpiCardData[] = [
	{
		labelKey: "today.kpi.balance",
		trendBadge: "+352 000 ₽",
		trendDirection: "up",
		value: "412 300 ₽",
		chartType: "sparkline",
	},
	{
		labelKey: "today.kpi.min30",
		trendBadge: "−24,8%",
		trendDirection: "down",
		value: "309 900 ₽",
		subKey: "today.kpi.baseNov",
		chartType: "none",
	},
	{
		labelKey: "today.kpi.in30",
		value: "1 428 000 ₽",
		subKey: "today.kpi.baseForecast",
		chartType: "none",
	},
	{
		labelKey: "today.kpi.out30",
		value: "1 233 100 ₽",
		subKey: "today.kpi.baseForecast",
		chartType: "none",
	},
];

export const KpiCards = memo(() => {
	const { t } = useTranslation();

	return (
		<div className={styles["kpi-cards"]}>
			{MOCK_CARDS.map((card) => (
				<Card key={card.labelKey} className={styles["kpi-cards__card"]}>
					<div className={styles["kpi-cards__head"]}>
						<span className={styles["kpi-cards__label"]}>{t(card.labelKey)}</span>
						{card.trendBadge ? (
							<Badge variant={card.trendDirection === "up" ? "up" : "down"}>
								{card.trendDirection === "up" ? "↑ " : "↓ "}
								{card.trendBadge}
							</Badge>
						) : null}
					</div>
					<div className={styles["kpi-cards__value"]}>{card.value}</div>
					{card.subKey ? <span className={styles["kpi-cards__sub"]}>{t(card.subKey)}</span> : null}
					{card.chartType === "sparkline" ? (
						<div className={styles["kpi-cards__chart"]}>
							<SparkLineGreen />
						</div>
					) : null}
				</Card>
			))}
		</div>
	);
});
