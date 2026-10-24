import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import type { TodayKpiDto, TodayKpiId } from "@/entities/Finance";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import styles from "./KpiCards.module.scss";

type Props = {
	items: TodayKpiDto[];
};

const LABEL_KEY: Record<TodayKpiId, string> = {
	balance: "today.kpi.balance",
	min30: "today.kpi.min30",
	in30: "today.kpi.in30",
	out30: "today.kpi.out30",
};

const SUB_KEY: Partial<Record<TodayKpiId, string>> = {
	min30: "today.kpi.baseNov",
	in30: "today.kpi.baseForecast",
	out30: "today.kpi.baseForecast",
};

const SparkLine: FC<{ values: number[] }> = ({ values }) => {
	if (values.length < 2) return null;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const w = 220;
	const h = 52;
	const pts = values
		.map((v, i) => {
			const x = (i / (values.length - 1)) * w;
			const y = h - 6 - ((v - min) / range) * (h - 12);
			return `${x},${y}`;
		})
		.join(" ");
	const fillPts = `0,${h} ${pts} ${w},${h}`;
	return (
		<svg width="100%" height="52" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
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

export const KpiCards = memo(({ items }: Props) => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";

	return (
		<div className={styles["kpi-cards"]}>
			{items.map((card) => {
				const trend = card.trendValue;
				const trendUp = trend != null && trend >= 0;
				const trendLabel =
					trend == null
						? null
						: card.trendUnit === "percent"
							? `${trendUp ? "" : "−"}${Math.abs(trend).toLocaleString(locale, { maximumFractionDigits: 1 })}%`
							: formatMoneyAbs(trend, locale);
				return (
					<Card key={card.id} className={styles["kpi-cards__card"]}>
						<div className={styles["kpi-cards__head"]}>
							<span className={styles["kpi-cards__label"]}>{t(LABEL_KEY[card.id])}</span>
							{trendLabel ? (
								<Badge variant={trendUp ? "up" : "down"}>
									{trendUp ? "↑ " : "↓ "}
									{trendLabel}
								</Badge>
							) : null}
						</div>
						<div className={styles["kpi-cards__value"]}>{formatMoneyAbs(card.value, locale)}</div>
						{SUB_KEY[card.id] ? <span className={styles["kpi-cards__sub"]}>{t(SUB_KEY[card.id]!)}</span> : null}
						{card.sparkline && card.sparkline.length > 1 ? (
							<div className={styles["kpi-cards__chart"]}>
								<SparkLine values={card.sparkline} />
							</div>
						) : null}
					</Card>
				);
			})}
		</div>
	);
});
