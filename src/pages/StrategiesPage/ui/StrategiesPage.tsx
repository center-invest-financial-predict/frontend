import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	useGetStrategiesQuery,
	useUpdateStrategiesMutation,
	type StrategyKey,
	type StrategyParamsDto,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
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

const PRESET_SHAPE: Record<Exclude<StrategyKey, "own">, Pick<StrategyParamsDto, "haircutPct" | "delayDays">> = {
	cons: { haircutPct: 15, delayDays: 14 },
	base: { haircutPct: 5, delayDays: 7 },
	opt: { haircutPct: 0, delayDays: 0 },
};

const ruleLabelKey = (id: string, label: string): string => {
	if (label === "ruleA" || label === "ruleB" || label === "ruleC") return `strategies.${label}`;
	if (/min|balance|остат/i.test(id)) return "strategies.ruleA";
	if (/late|inflow|поступ/i.test(id)) return "strategies.ruleB";
	if (/daily|digest|сводк/i.test(id)) return "strategies.ruleC";
	return "";
};

export const StrategiesPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch, isFetching } = useGetStrategiesQuery();
	const [updateStrategies, updateState] = useUpdateStrategiesMutation();
	const [strat, setStrat] = useState<StrategyKey>("base");
	const [params, setParams] = useState<StrategyParamsDto>({
		haircutPct: 5,
		delayDays: 7,
		minBalanceK: 150,
	});
	const [rulesOn, setRulesOn] = useState<Record<string, boolean>>({});
	const [savedFlash, setSavedFlash] = useState(false);
	const skipHydrate = useRef(false);
	const persistTimer = useRef<number | null>(null);

	useEffect(() => {
		if (!data || skipHydrate.current) {
			skipHydrate.current = false;
			return;
		}
		setStrat(data.active);
		setParams(data.presets[data.active] ?? data.presets.base);
		const next: Record<string, boolean> = {};
		data.rules.forEach((r) => {
			next[r.id] = r.enabled;
		});
		setRulesOn(next);
	}, [data]);

	useEffect(
		() => () => {
			if (persistTimer.current != null) window.clearTimeout(persistTimer.current);
		},
		[],
	);

	const persist = async (next: {
		active: StrategyKey;
		params: StrategyParamsDto;
		rules?: Record<string, boolean>;
	}) => {
		if (!data) return;
		skipHydrate.current = true;
		try {
			await updateStrategies({
				active: next.active,
				params: next.params,
				salaryDay: data.salaryDay,
				rules: Object.entries(next.rules ?? rulesOn).map(([id, enabled]) => ({ id, enabled })),
			}).unwrap();
			setSavedFlash(true);
			window.setTimeout(() => setSavedFlash(false), 2200);
		} catch {
			skipHydrate.current = false;
		}
	};

	const persistDebounced = (next: {
		active: StrategyKey;
		params: StrategyParamsDto;
		rules?: Record<string, boolean>;
	}) => {
		if (persistTimer.current != null) window.clearTimeout(persistTimer.current);
		persistTimer.current = window.setTimeout(() => {
			void persist(next);
		}, 400);
	};

	if (isLoading) {
		return (
			<Page className={styles["strat-page"]}>
				<Skeleton variant="title" label={t("states.loading")} />
				<Skeleton variant="row" count={4} />
				<Skeleton variant="chart" />
			</Page>
		);
	}

	if (isError || !data) {
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

	const busy = updateState.isLoading || isFetching;

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
							disabled={busy}
							className={cn(styles["strat-page__pill"], strat === s.key && styles["strat-page__pill--on"])}
							onClick={() => {
								const nextParams =
									s.key === "own"
										? params
										: {
												...PRESET_SHAPE[s.key],
												minBalanceK: params.minBalanceK,
											};
								setStrat(s.key);
								setParams(nextParams);
								void persist({ active: s.key, params: nextParams });
							}}
						>
							{t(s.labelKey)}
						</button>
					))}
				</div>
			</div>

			{savedFlash ? (
				<div className={styles["strat-page__saved"]} role="status">
					{t("strategies.saved")}
				</div>
			) : null}

			<div className={styles["strat-page__grid"]}>
				<Card id="strategies-params" className={styles["strat-page__params"]}>
					<div className={styles["strat-page__card-title"]}>{t("strategies.params")}</div>
					<p className={styles["strat-page__hint"]}>{t(`strategies.${strat}`)}</p>
					{(
						[
							["haircutPct", "strategies.paramHair", -10, 30, 5, "%"],
							["delayDays", "strategies.paramDelayDays", 0, 21, 1, " дн."],
							["minBalanceK", "strategies.paramMinK", 0, 500, 10, " тыс"],
						] as const
					).map(([key, label, min, max, step, unit]) => (
						<div key={key} className={styles["strat-page__slider"]}>
							<div className={styles["strat-page__slider-row"]}>
								<span>{t(label)}</span>
								<b>
									{params[key]}
									{unit}
								</b>
							</div>
							<input
								type="range"
								min={min}
								max={max}
								step={step}
								value={params[key]}
								disabled={busy}
								onChange={(e) => {
									const value = Number(e.target.value);
									const next = { ...params, [key]: value };
									setParams(next);
									setStrat("own");
									persistDebounced({ active: "own", params: next });
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

			<Card id="strategies-notify" className={styles["strat-page__rules"]}>
				<div className={styles["strat-page__card-title"]}>{t("strategies.notify")}</div>
				<p className={styles["strat-page__hint"]}>{t("strategies.notifyWhen")}</p>
				{data.rules.map((r) => {
					const key = ruleLabelKey(r.id, r.label);
					return (
						<div key={r.id} className={styles["strat-page__rule"]}>
							<span>{key ? t(key) : r.label || r.id}</span>
							<button
								type="button"
								disabled={busy}
								className={cn(styles["strat-page__toggle"], rulesOn[r.id] && styles["strat-page__toggle--on"])}
								onClick={() => {
									const next = { ...rulesOn, [r.id]: !rulesOn[r.id] };
									setRulesOn(next);
									void persist({ active: strat, params, rules: next });
								}}
								aria-pressed={Boolean(rulesOn[r.id])}
							>
								<span />
							</button>
						</div>
					);
				})}
			</Card>
		</Page>
	);
});

export default StrategiesPage;
