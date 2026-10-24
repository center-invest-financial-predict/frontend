import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import {
	useGetForecastQuery,
	useGetMyScenariosQuery,
	useGetSavedScenariosQuery,
	useRenameScenarioMutation,
	useSaveScenarioMutation,
	type ForecastScenarioKey,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatDayMonthShort } from "@/shared/lib/format/formatDate";
import { formatMoneyAbs } from "@/shared/lib/format/formatMoney";
import { getRouteAssistant, getRoutePlanFact, getRouteStrategies } from "@/shared/consts/router";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./ForecastPage.module.scss";

type LocalScen = {
	key: ForecastScenarioKey;
	on: boolean;
	opt: string;
};

export const ForecastPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const navigate = useNavigate();
	const [local, setLocal] = useState<LocalScen[] | null>(null);
	const [renaming, setRenaming] = useState<string | null>(null);
	const [scenarioId, setScenarioId] = useState<string | null>(null);

	const queryArgs = useMemo(() => {
		const active = (local ?? []).filter((s) => s.on);
		const params: Record<string, string> = { range: "30" };
		active.forEach((s) => {
			params[s.key] = s.opt;
		});
		if (scenarioId && active.length === 0) params.scenarioId = scenarioId;
		return params;
	}, [local, scenarioId]);

	const { data, isLoading, isError, refetch, isFetching } = useGetForecastQuery(queryArgs);
	const { data: saved = [] } = useGetSavedScenariosQuery();
	const { data: mine = [] } = useGetMyScenariosQuery();
	const [saveScenario] = useSaveScenarioMutation();
	const [renameScenario] = useRenameScenarioMutation();

	const scens = useMemo(() => {
		if (!data?.scenarios) return [];
		return data.scenarios.map((s) => {
			const fromLocal = local?.find((l) => l.key === s.key);
			return {
				...s,
				on: fromLocal?.on ?? false,
				opt: fromLocal?.opt ?? s.defaultValue,
			};
		});
	}, [data?.scenarios, local]);

	const active = scens.filter((s) => s.on);
	const hasRisk = data?.hasGap ?? false;

	const toggle = (key: ForecastScenarioKey) => {
		setScenarioId(null);
		setLocal((prev) => {
			const base =
				prev ??
				data?.scenarios.map((s) => ({
					key: s.key,
					on: false,
					opt: s.defaultValue,
				})) ??
				[];
			return base.map((s) => (s.key === key ? { ...s, on: !s.on } : s));
		});
	};

	const setOpt = (key: ForecastScenarioKey, opt: string) => {
		setScenarioId(null);
		setLocal((prev) => {
			const base =
				prev ??
				data?.scenarios.map((s) => ({
					key: s.key,
					on: false,
					opt: s.defaultValue,
				})) ??
				[];
			return base.map((s) => (s.key === key ? { ...s, opt, on: true } : s));
		});
	};

	const reset = () => {
		setScenarioId(null);
		setLocal(
			data?.scenarios.map((s) => ({
				key: s.key,
				on: false,
				opt: s.defaultValue,
			})) ?? [],
		);
	};

	const save = async () => {
		const label = active.map((s) => `${s.title} ${s.opt}`).join(", ") || t("forecast.base");
		await saveScenario({
			name: label,
			params: queryArgs,
		});
	};

	return (
		<Page className={styles["forecast-page"]}>
			<div>
				<h1 className={styles["forecast-page__title"]}>{t("forecast.title")}</h1>
				<p className={styles["forecast-page__sub"]}>{t("forecast.subtitle")}</p>
			</div>

			<div className={styles["forecast-page__toolbar"]}>
				<div className={styles["forecast-page__tabs"]}>
					<button type="button" className={styles["forecast-page__tab--on"]}>
						{t("forecast.tabScens")}
					</button>
					<button type="button" className={styles["forecast-page__tab"]} onClick={() => navigate(getRoutePlanFact())}>
						{t("forecast.tabPlanFact")}
					</button>
				</div>
				<button
					type="button"
					className={styles["forecast-page__settings"]}
					onClick={() => navigate(getRouteStrategies())}
				>
					<SlidersHorizontal size={18} strokeWidth={1.3} aria-hidden />
					{t("forecast.settings")}
				</button>
			</div>

			{isError && !data ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{isLoading && !data ? (
				<div className={styles["forecast-page__grid"]} aria-busy="true" aria-label={t("states.loading")}>
					<Card className={styles["forecast-page__scens"]}>
						<Skeleton variant="title" />
						<Skeleton variant="row" count={4} />
					</Card>
					<Card className={styles["forecast-page__chart"]}>
						<Skeleton variant="title" />
						<Skeleton variant="chart" />
					</Card>
				</div>
			) : null}

			{data ? (
				<>
					<div className={styles["forecast-page__grid"]}>
						<Card id="forecast-scenarios" className={styles["forecast-page__scens"]}>
							<div className={styles["forecast-page__card-title"]}>{t("forecast.scens")}</div>
							<p className={styles["forecast-page__card-sub"]}>{t("forecast.scensHint")}</p>
							{scens.map((s) => (
								<div
									key={s.key}
									className={cn(styles["forecast-page__scen"], s.on && styles["forecast-page__scen--on"])}
								>
									<button type="button" className={styles["forecast-page__scen-tog"]} onClick={() => toggle(s.key)}>
										<span className={cn(styles["forecast-page__check"], s.on && styles["forecast-page__check--on"])} />
										{s.title}
									</button>
									<div className={styles["forecast-page__opts"]}>
										{s.options.map((o) => (
											<button
												key={o.value}
												type="button"
												className={cn(
													styles["forecast-page__opt"],
													s.on && s.opt === o.value && styles["forecast-page__opt--on"],
												)}
												onClick={() => setOpt(s.key, o.value)}
											>
												{o.label}
											</button>
										))}
									</div>
								</div>
							))}
						</Card>

						<Card id="forecast-chart" className={styles["forecast-page__chart"]}>
							<div className={styles["forecast-page__chart-head"]}>
								<div>
									<div className={styles["forecast-page__card-title"]}>{t("forecast.chartTitle")}</div>
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
							<CashflowChart series={data.cashflow} showRisk={hasRisk} isLoading={isFetching && !data} />
							<div className={cn(styles["forecast-page__result"], hasRisk && styles["forecast-page__result--bad"])}>
								{hasRisk ? t("forecast.resGap") : t("forecast.resOk")}
							</div>
							<div className={styles["forecast-page__chips"]}>
								{active.length === 0 ? (
									<span className={styles["forecast-page__chip-empty"]}>{t("forecast.noConditions")}</span>
								) : (
									active.map((s) => (
										<span key={s.key} className={styles["forecast-page__chip"]}>
											{s.title}: {s.options.find((o) => o.value === s.opt)?.label ?? s.opt}
										</span>
									))
								)}
								{active.length > 0 ? (
									<button type="button" className={styles["forecast-page__chip-reset"]} onClick={reset}>
										{t("forecast.reset")}
									</button>
								) : null}
							</div>
							<div className={styles["forecast-page__cta"]}>
								<button type="button" className={styles["forecast-page__cta-primary"]} onClick={() => void save()}>
									{t("forecast.save")}
								</button>
								<button
									type="button"
									className={styles["forecast-page__cta-secondary"]}
									onClick={() => navigate(getRouteAssistant())}
								>
									{t("forecast.explain")}
								</button>
							</div>
						</Card>
					</div>

					{mine.length > 0 ? (
						<Card className={styles["forecast-page__mine"]}>
							<div className={styles["forecast-page__card-title"]}>{t("forecast.mine")}</div>
							<p className={styles["forecast-page__card-sub"]}>{t("forecast.mineSub")}</p>
							{mine.map((m) => (
								<div key={m.id} className={styles["forecast-page__mine-row"]}>
									{renaming === m.id ? (
										<input
											className={styles["forecast-page__mine-input"]}
											defaultValue={m.name}
											onBlur={(e) => {
												const v = e.target.value.trim();
												setRenaming(null);
												if (v && v !== m.name) {
													void renameScenario({ id: m.id, name: v });
												}
											}}
										/>
									) : (
										<span className={styles["forecast-page__mine-name"]}>{m.name}</span>
									)}
									<div className={styles["forecast-page__mine-actions"]}>
										<button
											type="button"
											className={styles["forecast-page__mine-btn"]}
											onClick={() => {
												setLocal(
													data?.scenarios.map((s) => ({
														key: s.key,
														on: false,
														opt: s.defaultValue,
													})) ?? [],
												);
												setScenarioId(m.id);
											}}
										>
											{t("forecast.open")}
										</button>
										<button
											type="button"
											className={styles["forecast-page__mine-btn"]}
											onClick={() => setRenaming(m.id)}
										>
											{t("forecast.rename")}
										</button>
									</div>
								</div>
							))}
						</Card>
					) : null}

					<Card className={styles["forecast-page__saved"]}>
						<div className={styles["forecast-page__card-title"]}>{t("forecast.saved")}</div>
						<p className={styles["forecast-page__card-sub"]}>{t("forecast.savedSub")}</p>
						<div className={styles["forecast-page__table-head"]}>
							<span>{t("forecast.colScen")}</span>
							<span>{t("forecast.colMin")}</span>
							<span>{t("forecast.colDate")}</span>
							<span>{t("forecast.colGap")}</span>
						</div>
						{saved.map((r) => (
							<div key={r.id} className={styles["forecast-page__table-row"]}>
								<span>{r.name}</span>
								<span>{formatMoneyAbs(r.minBalance, locale)}</span>
								<span>{r.gapDate ? formatDayMonthShort(r.gapDate, locale) : "—"}</span>
								<span className={r.hasGap ? styles["forecast-page__gap-bad"] : undefined}>
									{r.hasGap ? t("forecast.gapYes") : t("forecast.gapNo")}
								</span>
							</div>
						))}
					</Card>
				</>
			) : null}
		</Page>
	);
});

export default ForecastPage;
