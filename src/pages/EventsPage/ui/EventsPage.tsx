import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	useGetEventsQuery,
	useGetRegularOperationsQuery,
	type EventDto,
	type EventTab,
	type RegularOperationDto,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatDayMonth } from "@/shared/lib/format/formatDate";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import {
	getRouteAdd,
	getRouteAssistant,
	getRouteCalendar,
	getRouteForecast,
	getRouteSources,
} from "@/shared/consts/router";
import styles from "./EventsPage.module.scss";

type Mode = "list" | "calendar";

export const EventsPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const { data, isLoading, isError, refetch } = useGetEventsQuery();
	const regularQ = useGetRegularOperationsQuery();
	const [tab, setTab] = useState<EventTab>("exp");
	const [mode] = useState<Mode>("list");
	const [sel, setSel] = useState<EventDto | null>(null);
	const [selReg, setSelReg] = useState<RegularOperationDto | null>(null);

	const items = data?.items ?? [];
	const regularItems = regularQ.data ?? [];
	const isReg = tab === "reg";

	const filtered = useMemo(
		() =>
			items
				.filter((r) => r.tab === tab)
				.slice()
				.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
		[items, tab],
	);

	const regularSorted = useMemo(
		() =>
			[...regularItems].sort((a, b) =>
				(a.next || "") < (b.next || "") ? -1 : (a.next || "") > (b.next || "") ? 1 : 0,
			),
		[regularItems],
	);

	const counts = useMemo(
		() => ({
			exp: items.filter((r) => r.tab === "exp").length,
			over: items.filter((r) => r.tab === "over").length,
			done: items.filter((r) => r.tab === "done").length,
			reg: regularItems.length,
		}),
		[items, regularItems.length],
	);

	const listLoading = isReg ? regularQ.isLoading : isLoading;
	const listError = isReg ? regularQ.isError : isError;
	const listEmpty = isReg ? regularSorted.length === 0 : filtered.length === 0;
	const listRetry = () => {
		if (isReg) void regularQ.refetch();
		else void refetch();
	};

	return (
		<Page className={styles["events-page"]}>
			<div className={styles["events-page__head"]}>
				<div>
					<h1 className={styles["events-page__title"]}>{t("events.title")}</h1>
					<p className={styles["events-page__sub"]}>{t("events.subtitle")}</p>
				</div>
				<div className={styles["events-page__head-actions"]}>
					<div className={styles["events-page__seg"]}>
						<button type="button" className={cn(styles["events-page__pill"], styles["events-page__pill--on"])}>
							{t("events.list")}
						</button>
						<button
							type="button"
							className={styles["events-page__pill"]}
							onClick={() => navigate(getRouteCalendar())}
						>
							{t("events.cal")}
						</button>
					</div>
					<button type="button" className={styles["events-page__add"]} onClick={() => navigate(getRouteAdd())}>
						{t("events.add")}
					</button>
				</div>
			</div>

			<div className={styles["events-page__tabs"]}>
				{(
					[
						["exp", "events.tabExp", counts.exp],
						["over", "events.tabOver", counts.over],
						["done", "events.tabDone", counts.done],
						["reg", "events.tabReg", counts.reg],
					] as const
				).map(([k, label, count]) => (
					<button
						key={k}
						type="button"
						className={cn(styles["events-page__tab"], tab === k && styles["events-page__tab--on"])}
						onClick={() => {
							setTab(k);
							setSel(null);
							setSelReg(null);
						}}
					>
						{t(label)}
						{` · ${count}`}
					</button>
				))}
			</div>

			{listLoading ? <Skeleton variant="row" count={5} label={t("states.loading")} /> : null}
			{listError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={listRetry}
				/>
			) : null}

			{!listLoading && !listError && mode === "list" && listEmpty ? (
				<StateBanner
					variant="empty"
					title={t("states.emptyTitle")}
					hint={t("states.emptyHint")}
					actionLabel={t("states.emptyCta")}
					onAction={() => navigate(isReg ? getRouteAdd() : getRouteSources())}
				/>
			) : null}

			{!listLoading && !listError && mode === "list" && !listEmpty && isReg ? (
				<Card className={styles["events-page__table"]}>
					<div className={styles["events-page__tr-head"]}>
						<span>{t("events.colNext")}</span>
						<span>{t("events.colCp")}</span>
						<span>{t("events.colDir")}</span>
						<span>{t("events.colPeriod")}</span>
						<span>{t("events.colCat")}</span>
						<span>{t("events.colAmt")}</span>
					</div>
					{regularSorted.map((r) => (
						<button
							key={r.id}
							type="button"
							className={styles["events-page__tr"]}
							onClick={() => setSelReg(r)}
						>
							<span>{r.next ? formatDayMonth(r.next, locale) : "—"}</span>
							<span>{r.name || "—"}</span>
							<span>{r.direction === "in" ? t("events.dirIn") : t("events.dirOut")}</span>
							<span>{r.period || "—"}</span>
							<span>{r.category || "—"}</span>
							<span
								className={cn(
									styles["events-page__amt"],
									r.amount >= 0 && styles["events-page__amt--in"],
								)}
							>
								{formatMoney(r.amount, locale)}
							</span>
						</button>
					))}
				</Card>
			) : null}

			{!listLoading && !listError && mode === "list" && !listEmpty && !isReg ? (
				<Card className={styles["events-page__table"]}>
					<div className={styles["events-page__tr-head"]}>
						<span>{t("events.colDate")}</span>
						<span>{t("events.colCp")}</span>
						<span>{t("events.colDir")}</span>
						<span>{t("events.colSrc")}</span>
						<span>{t("events.colSt")}</span>
						<span>{t("events.colAmt")}</span>
					</div>
					{filtered.map((r) => (
						<button key={r.id} type="button" className={styles["events-page__tr"]} onClick={() => setSel(r)}>
							<span>{formatDayMonth(r.date, locale)}</span>
							<span>{r.name}</span>
							<span>{r.amount >= 0 ? t("events.dirIn") : t("events.dirOut")}</span>
							<span>{r.source}</span>
							<span>{r.status}</span>
							<span className={cn(styles["events-page__amt"], r.amount >= 0 && styles["events-page__amt--in"])}>
								{formatMoney(r.amount, locale)}
							</span>
						</button>
					))}
				</Card>
			) : null}

			<AnimatePresence>
				{sel ? (
					<motion.div
						className={styles["events-page__drawer"]}
						role="dialog"
						aria-modal="true"
						initial={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						transition={{
							duration: reduceMotion ? 0 : 0.3,
							ease: "easeOut",
						}}
					>
						<div className={styles["events-page__drawer-head"]}>
							<div className={styles["events-page__drawer-title"]}>{sel.name}</div>
							<button
								type="button"
								className={styles["events-page__drawer-close"]}
								aria-label={t("events.close")}
								onClick={() => setSel(null)}
							>
								×
							</button>
						</div>
						<div className={styles["events-page__drawer-amt"]}>{formatMoney(sel.amount, locale)}</div>
						<div className={styles["events-page__drawer-meta"]}>
							{formatDayMonth(sel.date, locale)} · {sel.source} · {sel.status}
						</div>
						{sel.basis ? <p className={styles["events-page__drawer-basis"]}>{sel.basis}</p> : null}
						<div className={styles["events-page__drawer-actions"]}>
							<button
								type="button"
								className={styles["events-page__drawer-primary"]}
								onClick={() => navigate(getRouteForecast())}
							>
								{t("events.showChart")}
							</button>
							<button
								type="button"
								className={styles["events-page__drawer-secondary"]}
								onClick={() => navigate(getRouteAssistant())}
							>
								{t("events.askAssist")}
							</button>
						</div>
					</motion.div>
				) : null}
				{selReg ? (
					<motion.div
						className={styles["events-page__drawer"]}
						role="dialog"
						aria-modal="true"
						initial={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: reduceMotion ? 0 : 56 }}
						transition={{
							duration: reduceMotion ? 0 : 0.3,
							ease: "easeOut",
						}}
					>
						<div className={styles["events-page__drawer-head"]}>
							<div className={styles["events-page__drawer-title"]}>{selReg.name}</div>
							<button
								type="button"
								className={styles["events-page__drawer-close"]}
								aria-label={t("events.close")}
								onClick={() => setSelReg(null)}
							>
								×
							</button>
						</div>
						<div className={styles["events-page__drawer-amt"]}>{formatMoney(selReg.amount, locale)}</div>
						<div className={styles["events-page__drawer-meta"]}>
							{[
								selReg.next ? formatDayMonth(selReg.next, locale) : null,
								selReg.period || null,
								selReg.category || null,
								selReg.direction === "in" ? t("events.dirIn") : t("events.dirOut"),
							]
								.filter(Boolean)
								.join(" · ")}
						</div>
						<div className={styles["events-page__drawer-actions"]}>
							<button
								type="button"
								className={styles["events-page__drawer-primary"]}
								onClick={() => navigate(getRouteForecast())}
							>
								{t("events.showChart")}
							</button>
							<button
								type="button"
								className={styles["events-page__drawer-secondary"]}
								onClick={() => navigate(getRouteAssistant())}
							>
								{t("events.askAssist")}
							</button>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</Page>
	);
});

export default EventsPage;
