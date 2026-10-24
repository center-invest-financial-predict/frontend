import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { getRouteSources } from "@/shared/consts/router";
import styles from "./EventsPage.module.scss";

type Mode = "board" | "list" | "calendar";

const COLS = [
	{
		title: "Ожидаются",
		count: 3,
		sum: "−642 400 ₽",
		cards: [
			{ n: "ЕНП", a: "−186 400 ₽", d: "28 окт", src: "Календарь", bad: false, in: false },
			{ n: "Поставщик зерна", a: "−214 000 ₽", d: "30 окт", src: "История", bad: false, in: false },
			{ n: "Аренда", a: "−180 000 ₽", d: "2 ноя", src: "История", bad: false, in: false },
		],
	},
	{
		title: "Поступления",
		count: 1,
		sum: "+340 000 ₽",
		cards: [
			{
				n: "Дельта-Сервис",
				a: "+340 000 ₽",
				d: "27 окт",
				src: "Счёт",
				bad: false,
				in: true,
			},
		],
	},
	{
		title: "Просрочены",
		count: 1,
		sum: "+128 400 ₽",
		late: true,
		cards: [
			{
				n: "Мельница",
				a: "+128 400 ₽",
				d: "Ждали 21.10, просрочка 2 дня",
				src: "Счёт",
				bad: true,
				in: true,
			},
		],
	},
	{
		title: "Прошедшие",
		count: 2,
		sum: "−96 500 ₽",
		cards: [
			{ n: "Кредит", a: "−96 500 ₽", d: "10 окт", src: "Банк", bad: false, in: false },
			{ n: "Аванс", a: "−120 000 ₽", d: "16 окт", src: "Ввод вручную", bad: false, in: false },
		],
	},
];

const ROWS = [
	{ d: "27.10", n: "Дельта-Сервис", src: "Счёт", st: "Ожидается", a: "+340 000 ₽", in: true },
	{ d: "28.10", n: "ЕНП", src: "Календарь", st: "Ожидается", a: "−186 400 ₽", in: false },
	{ d: "30.10", n: "Поставщик зерна", src: "История", st: "Ожидается", a: "−214 000 ₽", in: false },
	{ d: "21.10", n: "Мельница", src: "Счёт", st: "Просрочен", a: "+128 400 ₽", in: true },
	{ d: "16.10", n: "Аванс", src: "Ввод вручную", st: "Прошло", a: "−120 000 ₽", in: false },
];

export const EventsPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [mode, setMode] = useState<Mode>("board");

	return (
		<Page className={styles["events-page"]}>
			<div className={styles["events-page__top"]}>
				<button
					type="button"
					className={styles["events-page__add"]}
					onClick={() => navigate(getRouteSources())}
				>
					{t("events.add")}
				</button>
			</div>

			<div className={styles["events-page__head"]}>
				<div>
					<h1 className={styles["events-page__title"]}>{t("events.title")}</h1>
					<p className={styles["events-page__sub"]}>{t("events.subtitle")}</p>
				</div>
				<div className={styles["events-page__seg"]}>
					{(
						[
							["board", "events.board"],
							["list", "events.list"],
							["calendar", "events.cal"],
						] as const
					).map(([k, label]) => (
						<button
							key={k}
							type="button"
							className={cn(
								styles["events-page__pill"],
								mode === k && styles["events-page__pill--on"],
							)}
							onClick={() => setMode(k)}
						>
							{t(label)}
						</button>
					))}
				</div>
			</div>

			{mode === "board" ? (
				<div className={styles["events-page__board"]}>
					{COLS.map((col) => (
						<Card key={col.title} className={styles["events-page__col"]}>
							<div className={styles["events-page__col-head"]}>
								<span>{col.title}</span>
								<span
									className={cn(
										styles["events-page__count"],
										col.late && styles["events-page__count--late"],
									)}
								>
									{col.count}
								</span>
							</div>
							{col.cards.map((c) => (
								<div key={c.n} className={styles["events-page__card"]}>
									<div className={styles["events-page__card-row"]}>
										<span>{c.n}</span>
										<span
											className={cn(
												styles["events-page__amt"],
												c.in && styles["events-page__amt--in"],
											)}
										>
											{c.a}
										</span>
									</div>
									<div className={styles["events-page__meta"]}>{c.d}</div>
									<span className={styles["events-page__src"]}>{c.src}</span>
								</div>
							))}
							<div className={styles["events-page__sum"]}>
								<span>{t("events.total")}</span>
								<b>{col.sum}</b>
							</div>
						</Card>
					))}
				</div>
			) : null}

			{mode === "list" ? (
				<Card className={styles["events-page__table"]}>
					<div className={styles["events-page__tr-head"]}>
						<span>{t("events.colDate")}</span>
						<span>{t("events.colCp")}</span>
						<span>{t("events.colSrc")}</span>
						<span>{t("events.colSt")}</span>
						<span>{t("events.colAmt")}</span>
					</div>
					{ROWS.map((r) => (
						<div key={r.d + r.n} className={styles["events-page__tr"]}>
							<span>{r.d}</span>
							<span>{r.n}</span>
							<span>{r.src}</span>
							<span>{r.st}</span>
							<span
								className={cn(
									styles["events-page__amt"],
									r.in && styles["events-page__amt--in"],
								)}
							>
								{r.a}
							</span>
						</div>
					))}
				</Card>
			) : null}

			{mode === "calendar" ? (
				<Card className={styles["events-page__cal"]}>
					<div className={styles["events-page__cal-head"]}>
						{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
							<span key={d}>{d}</span>
						))}
					</div>
					<div className={styles["events-page__cal-grid"]}>
						{Array.from({ length: 35 }, (_, i) => {
							const day = i - 2;
							const show = day >= 1 && day <= 31;
							const mark =
								day === 27
									? "Дельта +"
									: day === 28
										? "ЕНП"
										: day === 30
											? "Зерно"
											: "";
							return (
								<div key={i} className={styles["events-page__cal-cell"]}>
									{show ? <span>{day}</span> : null}
									{mark ? (
										<span className={styles["events-page__cal-ev"]}>{mark}</span>
									) : null}
								</div>
							);
						})}
					</div>
				</Card>
			) : null}
		</Page>
	);
});

export default EventsPage;
