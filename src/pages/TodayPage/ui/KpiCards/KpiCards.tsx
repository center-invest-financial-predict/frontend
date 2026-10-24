import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import type { TodayKpiDto, TodayKpiId } from "@/entities/Finance";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { Badge } from "@/shared/ui/Badge";
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
	min30: "today.kpi.baseForecast",
	in30: "today.kpi.baseForecast",
	out30: "today.kpi.baseForecast",
};

export const KpiCards: FC<Props> = memo(({ items }) => {
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
					<div key={card.id} className={styles["kpi-cards__item"]}>
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
					</div>
				);
			})}
		</div>
	);
});
