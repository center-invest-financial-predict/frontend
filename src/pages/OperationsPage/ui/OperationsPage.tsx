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
	return code;
};

const sourceLabel = (raw: string, t: (key: string) => string): string => {
	const code = normalizeSource(raw);
	if (code === "ONE_C") return t("sources.names.ONE_C");
	if (code === "CSV") return t("sources.names.CSV");
	if (code === "GOS_SERVICE") return t("sources.names.GOS_SERVICE");
	return raw;
};

export const OperationsPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const [dir, setDir] = useState<Dir>("all");
	const [cat, setCat] = useState("all");
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
			if (code === "CSV") {
				if (fromApi.has("CSV") || fromProfile.has("CSV")) active.add("CSV");
				return;
			}
			if (profileSources !== undefined) {
				if (fromProfile.has(code)) active.add(code);
				return;
			}
			if (fromApi.has(code)) active.add(code);
		});
		return active;
	}, [profileSources, sourcesData?.items]);

	const activeItems = useMemo(() => {
		const list = data?.items ?? [];
		return list.filter((i) => {
			const code = normalizeSource(i.category);
			if (!code) return false;
			if (activeSourceCodes.has(code)) return true;
			// unknown source codes: keep only when no explicit profile filter yet
			if (profileSources === undefined && !["ONE_C", "GOS_SERVICE", "CSV"].includes(code)) {
				return true;
			}
			return false;
		});
	}, [data?.items, activeSourceCodes, profileSources]);

	const categories = useMemo(
		() => [...new Set(activeItems.map((i) => i.category).filter(Boolean))],
		[activeItems],
	);

	useEffect(() => {
		if (cat !== "all" && !categories.includes(cat)) setCat("all");
	}, [cat, categories]);

	const items = useMemo(() => {
		let list = activeItems;
		if (dir === "in") list = list.filter((i) => i.amount > 0);
		if (dir === "out") list = list.filter((i) => i.amount < 0);
		if (cat !== "all") list = list.filter((i) => i.category === cat);
		return list;
	}, [activeItems, dir, cat]);

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
						<CashflowChart
							series={{
								...data.balanceHistory,
								todayIndex: Math.max((data.balanceHistory.points?.length ?? 1) - 1, 0),
							}}
							showRisk={false}
						/>
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
									{sourceLabel(c, t)}
								</button>
							))}
						</div>
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
							<span>{t("operations.colCat")}</span>
							<span>{t("operations.colAmt")}</span>
						</div>
						{items.length === 0 ? (
							<StateBanner variant="empty" title={t("states.emptyTitle")} hint={t("states.emptyHint")} />
						) : (
							items.map((r) => (
								<div key={r.id} className={styles["ops-page__tr"]}>
									<span className={styles["ops-page__tr-date"]}>{formatDayMonth(r.date, locale)}</span>
									<span className={styles["ops-page__tr-name"]}>{r.name}</span>
									<span className={styles["ops-page__tr-cat"]}>{sourceLabel(r.category, t)}</span>
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
