import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./ForecastPage.module.scss";

type ScenKey = "delay" | "drop" | "fixed" | "skip";

type Scen = {
	key: ScenKey;
	titleKey: string;
	on: boolean;
	opt: string;
	opts: string[];
};

const INITIAL: Scen[] = [
	{
		key: "delay",
		titleKey: "forecast.scen.delay",
		on: true,
		opt: "+14 дн.",
		opts: ["В срок", "+14 дн.", "+21 дн."],
	},
	{
		key: "drop",
		titleKey: "forecast.scen.drop",
		on: false,
		opt: "−20%",
		opts: ["Без спада", "−10%", "−20%"],
	},
	{
		key: "fixed",
		titleKey: "forecast.scen.fixed",
		on: false,
		opt: "+10%",
		opts: ["Без роста", "+10%"],
	},
	{
		key: "skip",
		titleKey: "forecast.scen.skip",
		on: false,
		opt: "Мельница",
		opts: ["Мельница"],
	},
];

const SAVED = [
	{ n: "Дельта-Сервис позже на 14 дней", min: "−30 100 ₽", d: "5 ноя", gap: "Да", bad: true },
	{ n: "Задержка 14 дней и спад выручки 20%", min: "−107 300 ₽", d: "5 ноя", gap: "Да", bad: true },
	{ n: "Выручка ниже на 20%", min: "232 700 ₽", d: "5 ноя", gap: "Нет", bad: false },
	{ n: "Постоянные расходы +10%", min: "280 400 ₽", d: "5 ноя", gap: "Нет", bad: false },
];

export const ForecastPage = memo(() => {
	const { t } = useTranslation();
	const [scens, setScens] = useState(INITIAL);
	const hasRisk = scens.some((s) => s.on && (s.key === "delay" || s.key === "drop"));

	const toggle = (key: ScenKey) => {
		setScens((prev) => prev.map((s) => (s.key === key ? { ...s, on: !s.on } : s)));
	};

	const setOpt = (key: ScenKey, opt: string) => {
		setScens((prev) =>
			prev.map((s) => (s.key === key ? { ...s, opt, on: true } : s)),
		);
	};

	return (
		<Page className={styles["forecast-page"]}>
			<div>
				<h1 className={styles["forecast-page__title"]}>{t("forecast.title")}</h1>
				<p className={styles["forecast-page__sub"]}>{t("forecast.subtitle")}</p>
			</div>

			<div className={styles["forecast-page__grid"]}>
				<Card className={styles["forecast-page__scens"]}>
					<div className={styles["forecast-page__card-title"]}>{t("forecast.scens")}</div>
					<p className={styles["forecast-page__card-sub"]}>{t("forecast.scensHint")}</p>
					{scens.map((s) => (
						<div
							key={s.key}
							className={cn(
								styles["forecast-page__scen"],
								s.on && styles["forecast-page__scen--on"],
							)}
						>
							<button
								type="button"
								className={styles["forecast-page__scen-tog"]}
								onClick={() => toggle(s.key)}
							>
								<span
									className={cn(
										styles["forecast-page__check"],
										s.on && styles["forecast-page__check--on"],
									)}
								/>
								{t(s.titleKey)}
							</button>
							<div className={styles["forecast-page__opts"]}>
								{s.opts.map((o) => (
									<button
										key={o}
										type="button"
										className={cn(
											styles["forecast-page__opt"],
											s.on && s.opt === o && styles["forecast-page__opt--on"],
										)}
										onClick={() => setOpt(s.key, o)}
									>
										{o}
									</button>
								))}
							</div>
						</div>
					))}
				</Card>

				<Card className={styles["forecast-page__chart"]}>
					<div className={styles["forecast-page__chart-head"]}>
						<div>
							<div className={styles["forecast-page__card-title"]}>
								{t("forecast.chartTitle")}
							</div>
							<p className={styles["forecast-page__card-sub"]}>{t("forecast.chartSub")}</p>
						</div>
						<div className={styles["forecast-page__legend"]}>
							<span>
								<span className={styles["forecast-page__leg-base"]} />
								{t("forecast.base")}
							</span>
							<span>
								<span className={styles["forecast-page__leg-neg"]} />
								{t("forecast.neg")}
							</span>
						</div>
					</div>
					<CashflowChart showRisk={hasRisk} range={30} />
					<div
						className={cn(
							styles["forecast-page__result"],
							hasRisk && styles["forecast-page__result--bad"],
						)}
					>
						{hasRisk ? t("forecast.resGap") : t("forecast.resOk")}
					</div>
				</Card>
			</div>

			<Card className={styles["forecast-page__saved"]}>
				<div className={styles["forecast-page__card-title"]}>{t("forecast.saved")}</div>
				<p className={styles["forecast-page__card-sub"]}>{t("forecast.savedSub")}</p>
				<div className={styles["forecast-page__table-head"]}>
					<span>{t("forecast.colScen")}</span>
					<span>{t("forecast.colMin")}</span>
					<span>{t("forecast.colDate")}</span>
					<span>{t("forecast.colGap")}</span>
				</div>
				{SAVED.map((r) => (
					<div key={r.n} className={styles["forecast-page__table-row"]}>
						<span>{r.n}</span>
						<span>{r.min}</span>
						<span>{r.d}</span>
						<span className={r.bad ? styles["forecast-page__gap-bad"] : undefined}>
							{r.gap}
						</span>
					</div>
				))}
			</Card>
		</Page>
	);
});

export default ForecastPage;
