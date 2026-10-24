import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./InsightCards.module.scss";

const INSIGHTS = [
	{ tone: "danger" as const, key: "today.insights.salary" },
	{ tone: "warning" as const, key: "today.insights.latePay" },
	{ tone: "muted" as const, key: "today.insights.tax" },
	{ tone: "muted" as const, key: "today.insights.data" },
];

export const InsightCards = memo(() => {
	const { t } = useTranslation();

	return (
		<div className={styles["insight-cards"]}>
			{INSIGHTS.map((item) => (
				<Card
					key={item.key}
					compact
					className={styles["insight-cards__card"]}
				>
					<span
						className={cn(
							styles["insight-cards__dot"],
							styles[`insight-cards__dot--${item.tone}`],
						)}
					/>
					<span className={styles["insight-cards__text"]}>{t(item.key)}</span>
				</Card>
			))}
		</div>
	);
});
