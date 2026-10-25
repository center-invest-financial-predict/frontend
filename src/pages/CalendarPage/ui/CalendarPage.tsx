import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetCalendarQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { dayOfMonth } from "@/shared/lib/format/formatDate";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import { getRouteAdd, getRouteEvents } from "@/shared/consts/router";
import styles from "./CalendarPage.module.scss";

export const CalendarPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const navigate = useNavigate();
	const now = useMemo(() => new Date(), []);
	const [cursor, setCursor] = useState(() => ({
		year: now.getFullYear(),
		month: now.getMonth() + 1,
	}));
	const { year, month } = cursor;
	const { data, isError, isFetching, refetch } = useGetCalendarQuery({ year, month });

	const weekdays = useMemo(() => {
		const base = new Date(2024, 0, 1);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(base);
			d.setDate(base.getDate() + i);
			return d.toLocaleDateString(locale, { weekday: "short" });
		});
	}, [locale]);

	const monthTitle = useMemo(
		() => new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" }),
		[year, month, locale],
	);

	const eventsByDay = useMemo(() => {
		const map: Record<number, { label: string; amount?: number }[]> = {};
		data?.events.forEach((e) => {
			const day = dayOfMonth(e.date);
			if (!day) return;
			const label = (e.label || "").trim() || "•";
			if (!map[day]) map[day] = [];
			map[day].push({ label, amount: e.amount });
		});
		return map;
	}, [data?.events]);

	const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
	const todayDay = isCurrentMonth
		? data?.today
			? dayOfMonth(data.today) || now.getDate()
			: now.getDate()
		: -1;
	const daysInMonth = new Date(year, month, 0).getDate();
	const startWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;

	const shiftMonth = (delta: number) => {
		setCursor((prev) => {
			const d = new Date(prev.year, prev.month - 1 + delta, 1);
			return { year: d.getFullYear(), month: d.getMonth() + 1 };
		});
	};

	return (
		<Page className={styles["calendar-page"]}>
			<div className={styles["calendar-page__head"]}>
				<div>
					<h1 className={styles["calendar-page__title"]}>{t("events.title")}</h1>
					<p className={styles["calendar-page__sub"]}>{t("events.subtitle")}</p>
				</div>
				<div className={styles["calendar-page__actions"]}>
					<div className={styles["calendar-page__seg"]}>
						<button type="button" className={styles["calendar-page__pill"]} onClick={() => navigate(getRouteEvents())}>
							{t("events.list")}
						</button>
						<button type="button" className={styles["calendar-page__pill--on"]}>
							{t("events.cal")}
						</button>
					</div>
					<button type="button" className={styles["calendar-page__add"]} onClick={() => navigate(getRouteAdd())}>
						{t("events.add")}
					</button>
				</div>
			</div>

			{isError && !data ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			<Card className={styles["calendar-page__card"]} aria-busy={isFetching && !data}>
				<div className={styles["calendar-page__month"]}>
					<button
						type="button"
						className={styles["calendar-page__month-btn"]}
						aria-label={t("events.monthPrev")}
						onClick={() => shiftMonth(-1)}
					>
						<ChevronLeft size={20} strokeWidth={2} aria-hidden />
					</button>
					<div className={styles["calendar-page__month-title"]}>{monthTitle}</div>
					<button
						type="button"
						className={styles["calendar-page__month-btn"]}
						aria-label={t("events.monthNext")}
						onClick={() => shiftMonth(1)}
					>
						<ChevronRight size={20} strokeWidth={2} aria-hidden />
					</button>
				</div>
				<div className={styles["calendar-page__weekdays"]}>
					{weekdays.map((w, i) => (
						<span key={`${w}-${i}`}>{w}</span>
					))}
				</div>
				<div className={styles["calendar-page__grid"]}>
					{Array.from({ length: 42 }, (_, i) => {
						const day = i - startWeekday + 1;
						const show = day >= 1 && day <= daysInMonth;
						const events = show ? eventsByDay[day] ?? [] : [];
						const weekend = i % 7 >= 5;
						const today = show && day === todayDay;
						return (
							<div
								key={i}
								className={cn(
									styles["calendar-page__day"],
									weekend && styles["calendar-page__day--weekend"],
									today && styles["calendar-page__day--today"],
								)}
							>
								{show ? <span>{day}</span> : null}
								{events.map((ev, idx) => (
									<span key={`${day}-${idx}-${ev.label}`} className={styles["calendar-page__ev"]}>
										<span className={styles["calendar-page__ev-name"]}>{ev.label}</span>
										{ev.amount != null ? (
											<span className={styles["calendar-page__ev-amt"]}>
												{formatMoney(ev.amount, locale)}
											</span>
										) : null}
									</span>
								))}
							</div>
						);
					})}
				</div>
			</Card>
		</Page>
	);
});

export default CalendarPage;
