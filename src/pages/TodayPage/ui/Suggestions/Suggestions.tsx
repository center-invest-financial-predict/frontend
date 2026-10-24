import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./Suggestions.module.scss";

type SuggestionItem = {
	titleKey: string;
	badge?: string;
	badgeKey?: string;
	variant: "green" | "neutral";
};

const ITEMS: SuggestionItem[] = [
	{
		titleKey: "today.items.delta",
		badge: "+340 000 ₽",
		variant: "green",
	},
	{
		titleKey: "today.items.grain",
		badgeKey: "today.items.frees",
		variant: "green",
	},
	{
		titleKey: "today.items.overdraft",
		badgeKey: "today.items.noTerms",
		variant: "neutral",
	},
];

const ScenarioMiniChart: FC = () => {
	const { t } = useTranslation();
	const ptsGreen = "0,30 20,10 40,24 60,18 80,36 100,28 120,24 140,16 160,12";
	const ptsNeg = "0,35 20,30 40,42 60,38 80,54 90,48 110,32 130,28 160,20";

	return (
		<div className={styles.suggestions__scenario}>
			<div className={styles["suggestions__chart-wrap"]}>
				<svg width="100%" height="80" viewBox="0 0 160 80" preserveAspectRatio="none">
					<line x1="0" y1="10" x2="160" y2="10" stroke="#f3f4f6" strokeWidth="1" />
					<line x1="0" y1="40" x2="160" y2="40" stroke="#f3f4f6" strokeWidth="1" />
					<line x1="0" y1="70" x2="160" y2="70" stroke="#e5e7eb" strokeWidth="1" />
					<polyline
						points={ptsGreen}
						fill="none"
						stroke="#22c55e"
						strokeWidth="2"
						strokeLinecap="round"
					/>
					<polyline
						points={ptsNeg}
						fill="none"
						stroke="#1f2937"
						strokeWidth="1.8"
						strokeDasharray="4 3"
						strokeLinecap="round"
					/>
				</svg>
			</div>

			<div className={styles.suggestions__dates}>
				<span>23.10</span>
				<span>22.11</span>
			</div>

			<div className={styles.suggestions__legend}>
				<div className={styles["suggestions__legend-row"]}>
					<span className={styles["suggestions__legend-label"]}>
						<span className={styles.suggestions__swatch} />
						{t("today.base")}
					</span>
					<span className={styles["suggestions__legend-value"]}>309 900 ₽</span>
				</div>
				<div className={styles["suggestions__legend-row"]}>
					<span className={styles["suggestions__legend-label"]}>
						<span
							className={cn(
								styles.suggestions__swatch,
								styles["suggestions__swatch--dashed"],
							)}
						/>
						{t("today.negative")}
					</span>
					<span
						className={cn(
							styles["suggestions__legend-value"],
							styles["suggestions__legend-value--danger"],
						)}
					>
						−30 100 ₽, 5 ноя
					</span>
				</div>
			</div>
		</div>
	);
};

export const Suggestions = memo(() => {
	const { t } = useTranslation();

	return (
		<div className={styles.suggestions}>
			<Card as="section">
				<h2 className={styles.suggestions__title}>{t("today.suggestions")}</h2>
				{ITEMS.map((item) => (
					<div key={item.titleKey} className={styles.suggestions__item}>
						<div className={styles["suggestions__item-content"]}>
							<span className={styles["suggestions__item-title"]}>
								{t(item.titleKey)}
							</span>
							<span className={styles["suggestions__item-sub"]}>
								{t("today.checkOption")}
							</span>
						</div>
						<Badge variant={item.variant === "green" ? "green" : "neutral"}>
							{item.badge ?? (item.badgeKey ? t(item.badgeKey) : "")}
						</Badge>
					</div>
				))}
			</Card>

			<Card as="section">
				<h2 className={styles.suggestions__title}>{t("today.scenario")}</h2>
				<ScenarioMiniChart />
			</Card>
		</div>
	);
});
