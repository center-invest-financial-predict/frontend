import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetOperationsQuery, useGetSourcesQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatDayMonth } from "@/shared/lib/format/formatDate";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import { useAppSelector } from "@/shared/lib/hooks";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./OperationsPage.module.scss";

type Dir = "all" | "in" | "out";

const normalizeSource = (raw: string): string => {
	const code = raw.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
	if (code === "1C" || code === "1С" || code === "ONEC" || code === "1_C") return "ONE_C";
	if (code === "GOS" || code === "GOSUSLUGI" || code === "GOS_USLUGI" || code === "GOS_SERVICE") {
		return "GOS_SERVICE";
	}
	if (code === "CSV" || code === "FILE") return "CSV";
	return code;
};

const sourceLabel = (raw: string, t: (key: string) => string): string => {
	const code = normalizeSource(raw);
	if (code === "ONE_C") return t("sources.names.ONE_C");
	if (code === "CSV") return t("sources.names.CSV");
	if (code === "GOS_SERVICE") return t("sources.names.GOS_SERVICE");
	return raw;
};

const CAT_KEYS = ["sales", "suppliers", "taxes", "rent", "salary", "credit", "other"] as const;

const categoryLabel = (raw: string, t: (key: string) => string): string => {
	const value = raw.trim();
	if (!value) return "—";
	const lower = value.toLowerCase();
	const byId = (CAT_KEYS as readonly string[]).find((k) => k === lower);
	if (byId) return t(`add.cats.${byId}`);
	const ruToId: Record<string, (typeof CAT_KEYS)[number]> = {
		продажи: "sales",
		поставщики: "suppliers",
		налоги: "taxes",
		аренда: "rent",
		зарплата: "salary",
		кредит: "credit",
		прочее: "other",
	};
	const mapped = ruToId[lower];
	if (mapped) return t(`add.cats.${mapped}`);
	return value;
};

export const OperationsPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const [dir, setDir] = useState<Dir>("all");
	const [cat, setCat] = useState("all");
	const [src, setSrc] = useState("all");
	const profileSources = useAppSelector((state) => state.user.profile?.sources);

	const { data, isLoading, isError, refetch } = useGetOperationsQuery({ size: 2000 });
	const { data: sourcesData } = useGetSourcesQuery();

	const activeSourceCodes = useMemo(() => {
		const fromProfile = new Set((profileSources ?? []).map((s) => normalizeSource(s)));
		const fromApi = new Set<string>();
		(sourcesData?.items ?? []).forEach((s) => {
			if (s.connected) fromApi.add(normalizeSource(s.id || s.name));
		});

		const active = new Set<string>();
		(["ONE_C", "GOS_SERVICE", "CSV"] as const).forEach((code) => {
			if (fromProfile.has(code) || fromApi.has(code)) active.add(code);
		});
		return active;
	}, [profileSources, sourcesData?.items]);

	const activeItems = useMemo(() => {
		const list = data?.items ?? [];
		if (activeSourceCodes.size === 0) return list;
		return list.filter((i) => {
			const code = normalizeSource(i.source || "");
			if (!code) return true;
			return activeSourceCodes.has(code);
		});
	}, [data?.items, activeSourceCodes]);

	const categories = useMemo(
		() => [...new Set(activeItems.map((i) => i.category).filter(Boolean))].sort(),
		[activeItems],
	);

	const sourceFilters = useMemo(() => {
		const fromItems = [...new Set(
			(data?.items ?? []).map((i) => normalizeSource(i.source || "")).filter(Boolean),
		)];
		const known = (["ONE_C", "GOS_SERVICE", "CSV"] as const).filter(
			(code) => activeSourceCodes.has(code) || fromItems.includes(code),
		);
		const extra = fromItems.filter((code) => !(["ONE_C", "GOS_SERVICE", "CSV"] as string[]).includes(code));
		return [...known, ...extra];
	}, [data?.items, activeSourceCodes]);

	useEffect(() => {
		if (cat !== "all" && !categories.includes(cat)) setCat("all");
	}, [cat, categories]);

	useEffect(() => {
		if (src !== "all" && !sourceFilters.includes(src)) setSrc("all");
	}, [src, sourceFilters]);

	const items = useMemo(() => {
		let list = activeItems;
		if (dir === "in") list = list.filter((i) => i.amount > 0);
		if (dir === "out") list = list.filter((i) => i.amount < 0);
		if (src !== "all") list = list.filter((i) => normalizeSource(i.source || "") === src);
		if (cat !== "all") list = list.filter((i) => i.category === cat);
		return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
	}, [activeItems, dir, src, cat]);

	const balanceHistory = useMemo(() => {
		const byDate = new Map<string, number>();
		activeItems.forEach((op) => {
			if (!op.date) return;
			byDate.set(op.date, (byDate.get(op.date) ?? 0) + op.amount);
		});
		const dates = [...byDate.keys()].sort();
		let running = 0;
		const points = dates.map((date) => {
			running += byDate.get(date) ?? 0;
			return { date, balance: running };
		});
		return { points, todayIndex: Math.max(points.length - 1, 0) };
	}, [activeItems]);

	const totals = useMemo(() => {
		const inflow = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
		const outflow = items.filter((i) => i.amount < 0).reduce((s, i) => s + Math.abs(i.amount), 0);
		return {
			total: inflow - outflow,
			inflow,
			outflow,
			count: items.length,
		};
	}, [items]);

	return (
		<Page className={styles["ops-page"]}>
			<div>
				<h1 className={styles["ops-page__title"]}>{t("operations.title")}</h1>
				<p className={styles["ops-page__sub"]}>{t("operations.subtitle")}</p>
			</div>

			{isError && !data ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{isLoading && !data ? <Skeleton variant="row" count={6} label={t("states.loading")} /> : null}

			{data ? (
				<>
					<Card className={styles["ops-page__chart"]}>
						<div className={styles["ops-page__card-title"]}>{t("operations.balTitle")}</div>
						<p className={styles["ops-page__hint"]}>{t("operations.balSub")}</p>
						<CashflowChart series={balanceHistory} showRisk={false} />
					</Card>

					<Card className={styles["ops-page__list"]}>
						<div className={styles["ops-page__chips"]}>
							{(
								[
									["all", "operations.filterAll"],
									["in", "operations.filterIn"],
									["out", "operations.filterOut"],
								] as const
							).map(([k, label]) => (
								<button
									key={k}
									type="button"
									className={cn(styles["ops-page__chip"], dir === k && styles["ops-page__chip--on"])}
									onClick={() => setDir(k)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<div className={styles["ops-page__filter"]}>
							<div className={styles["ops-page__filter-title"]}>{t("operations.filterSources")}</div>
							<div className={styles["ops-page__chips"]}>
								<button
									type="button"
									className={cn(
										styles["ops-page__chip"],
										styles["ops-page__chip--sm"],
										src === "all" && styles["ops-page__chip--on"],
									)}
									onClick={() => setSrc("all")}
								>
									{t("operations.filterAllSources")}
								</button>
								{sourceFilters.map((code) => (
									<button
										key={code}
										type="button"
										className={cn(
											styles["ops-page__chip"],
											styles["ops-page__chip--sm"],
											src === code && styles["ops-page__chip--on"],
										)}
										onClick={() => setSrc(code)}
									>
										{sourceLabel(code, t)}
									</button>
								))}
							</div>
						</div>
						{categories.length > 0 ? (
							<div className={styles["ops-page__filter"]}>
								<div className={styles["ops-page__filter-title"]}>{t("operations.filterCats")}</div>
								<div className={styles["ops-page__chips"]}>
									<button
										type="button"
										className={cn(
											styles["ops-page__chip"],
											styles["ops-page__chip--sm"],
											cat === "all" && styles["ops-page__chip--on"],
										)}
										onClick={() => setCat("all")}
									>
										{t("operations.filterAllCats")}
									</button>
									{categories.map((c) => (
										<button
											key={c}
											type="button"
											className={cn(
												styles["ops-page__chip"],
												styles["ops-page__chip--sm"],
												cat === c && styles["ops-page__chip--on"],
											)}
											onClick={() => setCat(c)}
										>
											{categoryLabel(c, t)}
										</button>
									))}
								</div>
							</div>
						) : null}
						<div className={styles["ops-page__kpis"]}>
							<div>
								<span>{t("operations.total")}</span>
								<b>{formatMoney(totals.total, locale)}</b>
							</div>
							<div>
								<span>{t("operations.in")}</span>
								<b>{formatMoney(totals.inflow, locale)}</b>
							</div>
							<div>
								<span>{t("operations.out")}</span>
								<b>{formatMoney(totals.outflow, locale)}</b>
							</div>
							<div>
								<span>{t("operations.count")}</span>
								<b>{totals.count}</b>
							</div>
						</div>
						<div className={styles["ops-page__tr-head"]}>
							<span>{t("operations.colDate")}</span>
							<span>{t("operations.colCp")}</span>
							<span>{t("operations.colSrc")}</span>
							<span>{t("operations.colCat")}</span>
							<span className={styles["ops-page__tr-amt"]}>{t("operations.colAmt")}</span>
						</div>
						{items.length === 0 ? (
							<StateBanner variant="empty" title={t("states.emptyTitle")} hint={t("states.emptyHint")} />
						) : (
							items.map((r) => (
								<div key={r.id} className={styles["ops-page__tr"]}>
									<span className={styles["ops-page__tr-date"]}>
										{r.date ? formatDayMonth(r.date, locale) : "—"}
									</span>
									<span className={styles["ops-page__tr-name"]}>{r.name || "—"}</span>
									<span className={styles["ops-page__tr-src"]}>
										{r.source ? sourceLabel(r.source, t) : "—"}
									</span>
									<span className={styles["ops-page__tr-cat"]}>{categoryLabel(r.category, t)}</span>
									<span
										className={cn(
											styles["ops-page__tr-amt"],
											r.amount > 0 && styles["ops-page__in"],
										)}
									>
										{formatMoney(r.amount, locale)}
									</span>
								</div>
							))
						)}
					</Card>
				</>
			) : null}
		</Page>
	);
});

export default OperationsPage;
