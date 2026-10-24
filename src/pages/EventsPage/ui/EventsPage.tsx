import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import {
	getRouteAdd,
	getRouteAssistant,
	getRouteCalendar,
	getRouteForecast,
	getRouteSources,
} from "@/shared/consts/router";
import styles from "./EventsPage.module.scss";

type Tab = "exp" | "over" | "done" | "reg";
type Mode = "list" | "calendar";

type Row = {
	d: string;
	n: string;
	src: string;
	st: string;
	tab: Tab;
	a: string;
	in: boolean;
	basis?: string;
};

const ROWS: Row[] = [
	{
		d: "27.10",
		n: "Дельта-Сервис",
		src: "Счёт",
		st: "Ожидается",
		tab: "exp",
		a: "+340 000 ₽",
		in: true,
		basis: "Оплата счёта №148",
	},
	{
		d: "28.10",
		n: "ЕНП",
		src: "Календарь",
		st: "Ожидается",
		tab: "exp",
		a: "−186 400 ₽",
		in: false,
		basis: "Налоговый календарь",
	},
	{
		d: "30.10",
		n: "Поставщик зерна",
		src: "История",
		st: "Ожидается",
		tab: "exp",
		a: "−214 000 ₽",
		in: false,
	},
	{
		d: "21.10",
		n: "Мельница",
		src: "Счёт",
		st: "Просрочен",
		tab: "over",
		a: "+128 400 ₽",
		in: true,
		basis: "Ждали 21.10, просрочка 2 дня",
	},
	{
		d: "16.10",
		n: "Аванс",
		src: "Ввод вручную",
		st: "Исполнено",
		tab: "done",
		a: "−120 000 ₽",
		in: false,
	},
	{
		d: "05.11",
		n: "Зарплата",
		src: "Календарь",
		st: "Регулярное",
		tab: "reg",
		a: "−248 000 ₽",
		in: false,
		basis: "Каждое 5 число",
	},
];

export const EventsPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const [tab, setTab] = useState<Tab>("exp");
	const [mode, setMode] = useState<Mode>("list");
	const [sel, setSel] = useState<Row | null>(null);

	const filtered = useMemo(() => ROWS.filter((r) => r.tab === tab), [tab]);
	const counts = useMemo(
		() => ({
			exp: ROWS.filter((r) => r.tab === "exp").length,
			over: ROWS.filter((r) => r.tab === "over").length,
			done: ROWS.filter((r) => r.tab === "done").length,
		}),
		[],
	);

	return (
		<Page className={styles["events-page"]}>
			<div className={styles["events-page__head"]}>
				<div>
					<h1 className={styles["events-page__title"]}>{t("events.title")}</h1>
					<p className={styles["events-page__sub"]}>{t("events.subtitle")}</p>
				</div>
				<div className={styles["events-page__head-actions"]}>
					<div className={styles["events-page__seg"]}>
						<button
							type="button"
							className={cn(styles["events-page__pill"], mode === "list" && styles["events-page__pill--on"])}
							onClick={() => setMode("list")}
						>
							{t("events.list")}
						</button>
						<button
							type="button"
							className={cn(styles["events-page__pill"], mode === "calendar" && styles["events-page__pill--on"])}
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
						["reg", "events.tabReg", null],
					] as const
				).map(([k, label, count]) => (
					<button
						key={k}
						type="button"
						className={cn(styles["events-page__tab"], tab === k && styles["events-page__tab--on"])}
						onClick={() => {
							setTab(k);
							setSel(null);
						}}
					>
						{t(label)}
						{count !== null ? ` · ${count}` : ""}
					</button>
				))}
			</div>

			{mode === "list" && filtered.length === 0 ? (
				<StateBanner
					variant="empty"
					title={t("states.emptyTitle")}
					hint={t("states.emptyHint")}
					actionLabel={t("states.emptyCta")}
					onAction={() => navigate(getRouteSources())}
				/>
			) : null}

			{mode === "list" && filtered.length > 0 ? (
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
						<button key={r.d + r.n} type="button" className={styles["events-page__tr"]} onClick={() => setSel(r)}>
							<span>{r.d}</span>
							<span>{r.n}</span>
							<span>{r.in ? t("events.dirIn") : t("events.dirOut")}</span>
							<span>{r.src}</span>
							<span>{r.st}</span>
							<span className={cn(styles["events-page__amt"], r.in && styles["events-page__amt--in"])}>{r.a}</span>
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
							<div className={styles["events-page__drawer-title"]}>{sel.n}</div>
							<button
								type="button"
								className={styles["events-page__drawer-close"]}
								aria-label={t("events.close")}
								onClick={() => setSel(null)}
							>
								×
							</button>
						</div>
						<div className={styles["events-page__drawer-amt"]}>{sel.a}</div>
						<div className={styles["events-page__drawer-meta"]}>
							{sel.d} · {sel.src} · {sel.st}
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
			</AnimatePresence>
		</Page>
	);
});

export default EventsPage;
