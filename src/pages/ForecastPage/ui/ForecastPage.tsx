import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteAssistant, getRoutePlanFact, getRouteStrategies } from "@/shared/consts/router";
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

const MINE = [{ name: "Разрыв 5 ноября", recalc: "23.10 08:40" }];

export const ForecastPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [scens, setScens] = useState(INITIAL);
	const [mine, setMine] = useState(MINE);
	const [renaming, setRenaming] = useState<number | null>(null);
	const hasRisk = scens.some((s) => s.on && (s.key === "delay" || s.key === "drop"));
	const active = scens.filter((s) => s.on);

	const toggle = (key: ScenKey) => {
		setScens((prev) => prev.map((s) => (s.key === key ? { ...s, on: !s.on } : s)));
	};

	const setOpt = (key: ScenKey, opt: string) => {
		setScens((prev) => prev.map((s) => (s.key === key ? { ...s, opt, on: true } : s)));
	};

	const reset = () => {
		setScens(INITIAL.map((s) => ({ ...s, on: false })));
	};

	const save = () => {
		const label = active.map((s) => `${t(s.titleKey)} ${s.opt}`).join(", ") || t("forecast.base");
		setMine((prev) => [{ name: label, recalc: "23.10 08:40" }, ...prev]);
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

			<div className={styles["forecast-page__grid"]}>
				<Card className={styles["forecast-page__scens"]}>
					<div className={styles["forecast-page__card-title"]}>{t("forecast.scens")}</div>
					<p className={styles["forecast-page__card-sub"]}>{t("forecast.scensHint")}</p>
					{scens.map((s) => (
						<div key={s.key} className={cn(styles["forecast-page__scen"], s.on && styles["forecast-page__scen--on"])}>
							<button type="button" className={styles["forecast-page__scen-tog"]} onClick={() => toggle(s.key)}>
								<span className={cn(styles["forecast-page__check"], s.on && styles["forecast-page__check--on"])} />
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
					<CashflowChart showRisk={hasRisk} range={30} />
					<div className={cn(styles["forecast-page__result"], hasRisk && styles["forecast-page__result--bad"])}>
						{hasRisk ? t("forecast.resGap") : t("forecast.resOk")}
					</div>
					<div className={styles["forecast-page__chips"]}>
						{active.length === 0 ? (
							<span className={styles["forecast-page__chip-empty"]}>{t("forecast.noConditions")}</span>
						) : (
							active.map((s) => (
								<span key={s.key} className={styles["forecast-page__chip"]}>
									{t(s.titleKey)}: {s.opt}
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
						<button type="button" className={styles["forecast-page__cta-primary"]} onClick={save}>
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
					{mine.map((m, i) => (
						<div key={`${m.name}-${i}`} className={styles["forecast-page__mine-row"]}>
							{renaming === i ? (
								<input
									className={styles["forecast-page__mine-input"]}
									value={m.name}
									onChange={(e) => {
										const v = e.target.value;
										setMine((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: v } : x)));
									}}
									onBlur={() => setRenaming(null)}
								/>
							) : (
								<span className={styles["forecast-page__mine-name"]}>{m.name}</span>
							)}
							<div className={styles["forecast-page__mine-actions"]}>
								<button type="button" className={styles["forecast-page__mine-btn"]}>
									{t("forecast.open")}
								</button>
								<button type="button" className={styles["forecast-page__mine-btn"]} onClick={() => setRenaming(i)}>
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
				{SAVED.map((r) => (
					<div key={r.n} className={styles["forecast-page__table-row"]}>
						<span>{r.n}</span>
						<span>{r.min}</span>
						<span>{r.d}</span>
						<span className={r.bad ? styles["forecast-page__gap-bad"] : undefined}>{r.gap}</span>
					</div>
				))}
			</Card>
		</Page>
	);
});

export default ForecastPage;
