import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./StrategiesPage.module.scss";

type Strat = "cons" | "base" | "opt" | "own";

const STRATS: { key: Strat; labelKey: string }[] = [
	{ key: "cons", labelKey: "strategies.cons" },
	{ key: "base", labelKey: "strategies.base" },
	{ key: "opt", labelKey: "strategies.opt" },
	{ key: "own", labelKey: "strategies.own" },
];

const PRESETS: Record<Strat, { hair: number; delay: number; min: number; prob: string; gap: string }> = {
	cons: { hair: 10, delay: 14, min: 300, prob: "63%", gap: "разрыв 5 ноя, −107 300 ₽" },
	base: { hair: 0, delay: 0, min: 200, prob: "41%", gap: "разрыв 5 ноя, −30 100 ₽" },
	opt: { hair: -10, delay: 0, min: 150, prob: "22%", gap: "разрыва нет" },
	own: { hair: 5, delay: 7, min: 250, prob: "48%", gap: "разрыв 5 ноя, −48 200 ₽" },
};

const RULES = [
	{ key: "a", tKey: "strategies.ruleA" },
	{ key: "b", tKey: "strategies.ruleB" },
	{ key: "c", tKey: "strategies.ruleC" },
];

export const StrategiesPage = memo(() => {
	const { t } = useTranslation();
	const [strat, setStrat] = useState<Strat>("base");
	const [own, setOwn] = useState({ hair: 5, delay: 7, min: 250 });
	const [rulesOn, setRulesOn] = useState({ a: true, b: true, c: false });
	const cur = strat === "own" ? { ...PRESETS.own, ...own } : PRESETS[strat];
	const isOwn = strat === "own";

	return (
		<Page className={styles["strat-page"]}>
			<div className={styles["strat-page__head"]}>
				<div>
					<h1 className={styles["strat-page__title"]}>{t("strategies.title")}</h1>
					<p className={styles["strat-page__sub"]}>{t("strategies.subtitleMaket")}</p>
				</div>
				<div className={styles["strat-page__seg"]}>
					{STRATS.map((s) => (
						<button
							key={s.key}
							type="button"
							className={cn(
								styles["strat-page__pill"],
								strat === s.key && styles["strat-page__pill--on"],
							)}
							onClick={() => setStrat(s.key)}
						>
							{t(s.labelKey)}
						</button>
					))}
				</div>
			</div>

			<div className={styles["strat-page__grid"]}>
				<Card className={styles["strat-page__params"]}>
					<div className={styles["strat-page__card-title"]}>{t("strategies.params")}</div>
					<p className={styles["strat-page__hint"]}>{t(`strategies.${strat}`)}</p>
					{(
						[
							["hair", "strategies.paramHair", -10, 30, 5, "%"],
							["delay", "strategies.paramDelayDays", 0, 21, 7, " дн."],
							["min", "strategies.paramMinK", 0, 500, 50, " тыс"],
						] as const
					).map(([key, label, min, max, step, unit]) => (
						<div key={key} className={styles["strat-page__slider"]}>
							<div className={styles["strat-page__slider-row"]}>
								<span>{t(label)}</span>
								<b>
									{cur[key]}
									{unit}
								</b>
							</div>
							<input
								type="range"
								min={min}
								max={max}
								step={step}
								value={cur[key]}
								disabled={!isOwn}
								onChange={(e) =>
									setOwn((p) => ({ ...p, [key]: Number(e.target.value) }))
								}
							/>
						</div>
					))}
				</Card>

				<Card className={styles["strat-page__chart"]}>
					<div className={styles["strat-page__card-title"]}>{t("strategies.impact")}</div>
					<p className={styles["strat-page__hint"]}>{t("strategies.impactSub")}</p>
					<div className={styles["strat-page__prob"]}>
						<span>{cur.prob}</span>
						<span>{cur.gap}</span>
					</div>
					<CashflowChart showRisk={strat !== "opt"} range={30} />
				</Card>
			</div>

			<Card className={styles["strat-page__rules"]}>
				<div className={styles["strat-page__card-title"]}>{t("strategies.notify")}</div>
				<p className={styles["strat-page__hint"]}>{t("strategies.notifyWhen")}</p>
				{RULES.map((r) => (
					<div key={r.key} className={styles["strat-page__rule"]}>
						<span>{t(r.tKey)}</span>
						<button
							type="button"
							className={cn(
								styles["strat-page__toggle"],
								rulesOn[r.key as "a" | "b" | "c"] && styles["strat-page__toggle--on"],
							)}
							onClick={() =>
								setRulesOn((p) => ({
									...p,
									[r.key]: !p[r.key as "a" | "b" | "c"],
								}))
							}
							aria-pressed={rulesOn[r.key as "a" | "b" | "c"]}
						>
							<span />
						</button>
					</div>
				))}
			</Card>
		</Page>
	);
});

export default StrategiesPage;
