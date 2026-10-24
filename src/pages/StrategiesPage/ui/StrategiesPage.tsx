import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGetStrategiesQuery, useUpdateStrategiesMutation, type StrategyKey } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteForecast } from "@/shared/consts/router";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./StrategiesPage.module.scss";

const STRATS: { key: StrategyKey; labelKey: string }[] = [
	{ key: "cons", labelKey: "strategies.cons" },
	{ key: "base", labelKey: "strategies.base" },
	{ key: "opt", labelKey: "strategies.opt" },
	{ key: "own", labelKey: "strategies.own" },
];

export const StrategiesPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useGetStrategiesQuery();
	const [updateStrategies] = useUpdateStrategiesMutation();
	const [strat, setStrat] = useState<StrategyKey>("base");
	const [own, setOwn] = useState({ haircutPct: 5, delayDays: 7, minBalanceK: 250 });
	const [rulesOn, setRulesOn] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!data) return;
		setStrat(data.active);
		if (data.presets.own) {
			setOwn(data.presets.own);
		}
		const next: Record<string, boolean> = {};
		data.rules.forEach((r) => {
			next[r.id] = r.enabled;
		});
		setRulesOn(next);
	}, [data]);

	const cur = strat === "own" ? own : data?.presets[strat];
	const isOwn = strat === "own";

	const persist = (next: {
		active?: StrategyKey;
		own?: typeof own;
		rules?: Record<string, boolean>;
	}) => {
		const active = next.active ?? strat;
		const ownParams = next.own ?? own;
		const rulesMap = next.rules ?? rulesOn;
		void updateStrategies({
			active,
			own: active === "own" ? ownParams : undefined,
			rules: Object.entries(rulesMap).map(([id, enabled]) => ({ id, enabled })),
		});
	};

	if (isLoading) {
		return (
			<Page className={styles["strat-page"]}>
				<StateBanner variant="loading" title={t("states.loading")} />
			</Page>
		);
	}

	if (isError || !data || !cur) {
		return (
			<Page className={styles["strat-page"]}>
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			</Page>
		);
	}

	return (
		<Page className={styles["strat-page"]}>
			<button type="button" className={styles["strat-page__back"]} onClick={() => navigate(getRouteForecast())}>
				← {t("strategies.back")}
			</button>
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
							className={cn(styles["strat-page__pill"], strat === s.key && styles["strat-page__pill--on"])}
							onClick={() => {
								setStrat(s.key);
								persist({ active: s.key });
							}}
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
							["haircutPct", "strategies.paramHair", -10, 30, 5, "%"],
							["delayDays", "strategies.paramDelayDays", 0, 21, 7, " дн."],
							["minBalanceK", "strategies.paramMinK", 0, 500, 50, " тыс"],
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
								onChange={(e) => {
									const value = Number(e.target.value);
									const next = { ...own, [key]: value };
									setOwn(next);
									persist({ own: next, active: "own" });
								}}
							/>
						</div>
					))}
				</Card>

				<Card className={styles["strat-page__chart"]}>
					<div className={styles["strat-page__card-title"]}>{t("strategies.impact")}</div>
					<p className={styles["strat-page__hint"]}>{t("strategies.impactSub")}</p>
					<div className={styles["strat-page__prob"]}>
						<span>{data.impact.probabilityPct}%</span>
						<span>{data.impact.gapLabel}</span>
					</div>
					<CashflowChart series={data.impact.cashflow} showRisk={data.impact.showRisk} />
				</Card>
			</div>

			<Card className={styles["strat-page__rules"]}>
				<div className={styles["strat-page__card-title"]}>{t("strategies.notify")}</div>
				<p className={styles["strat-page__hint"]}>{t("strategies.notifyWhen")}</p>
				{data.rules.map((r) => (
					<div key={r.id} className={styles["strat-page__rule"]}>
						<span>{r.label}</span>
						<button
							type="button"
							className={cn(styles["strat-page__toggle"], rulesOn[r.id] && styles["strat-page__toggle--on"])}
							onClick={() => {
								const next = { ...rulesOn, [r.id]: !rulesOn[r.id] };
								setRulesOn(next);
								persist({ rules: next });
							}}
							aria-pressed={Boolean(rulesOn[r.id])}
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
