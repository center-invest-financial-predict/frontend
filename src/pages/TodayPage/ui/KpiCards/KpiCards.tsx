import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./KpiCards.module.scss";

type TrendDirection = "up" | "down" | "neutral";
type ChartType = "sparkline" | "sparkline-trough" | "donut" | "bars-green" | "bars-dark";

type KpiCardData = {
	labelKey: string;
	trendBadge?: string;
	trendDirection?: TrendDirection;
	value: string;
	subKey: string;
	chartType: ChartType;
};

const SparkLineGreen: FC = () => {
	const pts = "0,35 15,30 30,36 45,28 60,32 75,22 90,26 105,18 120,8 135,14 150,4";
	const fillPts = `0,44 ${pts} 150,44`;
	return (
		<svg width="100%" height="44" viewBox="0 0 150 44" preserveAspectRatio="none">
			<polygon points={fillPts} fill="#22c55e" fillOpacity="0.18" />
			<polyline
				points={pts}
				fill="none"
				stroke="#16a34a"
				strokeWidth="2.2"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</svg>
	);
};

const SparkLineTrough: FC = () => {
	const pts = "0,20 20,12 40,30 60,26 75,38 90,34 110,30 130,24 150,22";
	return (
		<svg width="100%" height="44" viewBox="0 0 150 44" preserveAspectRatio="none">
			<polyline
				points={pts}
				fill="none"
				stroke="#22c55e"
				strokeWidth="2"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<circle cx="75" cy="38" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
		</svg>
	);
};

const DonutChart: FC<{ percent: number }> = ({ percent }) => {
	const r = 18;
	const circ = 2 * Math.PI * r;
	const dash = (percent / 100) * circ;
	return (
		<svg width="44" height="44" viewBox="0 0 44 44">
			<circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
			<circle
				cx="22"
				cy="22"
				r={r}
				fill="none"
				stroke="#ef4444"
				strokeWidth="4"
				strokeDasharray={`${dash} ${circ}`}
				strokeLinecap="round"
				transform="rotate(-90 22 22)"
			/>
		</svg>
	);
};

const BarsGreen: FC = () => (
	<div className={styles["kpi-cards__bars"]}>
		{[4, 4, 4, 32, 4, 4].map((height, i) => (
			<div
				key={i}
				className={cn(
					styles["kpi-cards__bar"],
					height === 4 ? styles["kpi-cards__bar--h4"] : styles["kpi-cards__bar--h32"],
				)}
			/>
		))}
	</div>
);

const BarsDark: FC = () => (
	<div className={styles["kpi-cards__bars"]}>
		{[
			{ h: 4, mod: "muted" as const },
			{ h: 4, mod: "muted" as const },
			{ h: 4, mod: "muted" as const },
			{ h: 24, mod: "muted-active" as const },
			{ h: 32, mod: "dark" as const },
		].map((bar, i) => (
			<div
				key={i}
				className={cn(
					styles["kpi-cards__bar"],
					bar.h === 4 && styles["kpi-cards__bar--h4"],
					bar.h === 24 && styles["kpi-cards__bar--h24"],
					bar.h === 32 && styles["kpi-cards__bar--h32"],
					styles[`kpi-cards__bar--${bar.mod}`],
				)}
			/>
		))}
	</div>
);

const KpiCard: FC<KpiCardData & { t: (key: string) => string }> = ({
	labelKey,
	trendBadge,
	trendDirection = "neutral",
	value,
	subKey,
	chartType,
	t,
}) => (
	<Card className={styles["kpi-cards__card"]}>
		<div className={styles["kpi-cards__top"]}>
			<span className={styles["kpi-cards__label"]}>{t(labelKey)}</span>
			<div className={styles["kpi-cards__badge-row"]}>
				{trendBadge ? (
					<Badge
						variant={
							trendDirection === "up"
								? "up"
								: trendDirection === "down"
									? "down"
									: "neutral"
						}
					>
						{trendDirection === "up" && "↑"}
						{trendDirection === "down" && "↓"} {trendBadge}
					</Badge>
				) : null}
			</div>
			<div className={styles["kpi-cards__value"]}>{value}</div>
			<span className={styles["kpi-cards__sub"]}>{t(subKey)}</span>
		</div>
		<div className={styles["kpi-cards__chart"]}>
			{chartType === "sparkline" && <SparkLineGreen />}
			{chartType === "sparkline-trough" && <SparkLineTrough />}
			{chartType === "donut" && <DonutChart percent={41} />}
			{chartType === "bars-green" && <BarsGreen />}
			{chartType === "bars-dark" && <BarsDark />}
		</div>
	</Card>
);

const MOCK_CARDS: KpiCardData[] = [
	{
		labelKey: "today.kpi.balance",
		trendBadge: "+352 000 ₽",
		trendDirection: "up",
		value: "412 300 ₽",
		subKey: "today.kpi.in7days",
		chartType: "sparkline",
	},
	{
		labelKey: "today.kpi.min30",
		trendBadge: "−24,8%",
		trendDirection: "down",
		value: "309 900 ₽",
		subKey: "today.kpi.baseNov",
		chartType: "sparkline-trough",
	},
	{
		labelKey: "today.kpi.gapProb",
		value: "41%",
		subKey: "today.kpi.nov5",
		chartType: "donut",
	},
	{
		labelKey: "today.kpi.inWeek",
		trendBadge: "+119,9%",
		trendDirection: "up",
		value: "546 000 ₽",
		subKey: "today.kpi.vsAvgWeek",
		chartType: "bars-green",
	},
	{
		labelKey: "today.kpi.outWeek",
		trendBadge: "+79,6%",
		trendDirection: "down",
		value: "400 400 ₽",
		subKey: "today.kpi.vsAvgWeek",
		chartType: "bars-dark",
	},
];

export const KpiCards = memo(() => {
	const { t } = useTranslation();

	return (
		<div className={styles["kpi-cards"]}>
			{MOCK_CARDS.map((card) => (
				<KpiCard key={card.labelKey} {...card} t={t} />
			))}
		</div>
	);
});
