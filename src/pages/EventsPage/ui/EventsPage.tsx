import { memo, useState } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import { Badge } from "@/shared/ui/Badge";
import { PageTitle } from "@/shared/ui/PageTitle";
import { PillSwitch } from "@/shared/ui/PillSwitch";
import { Page } from "@/widgets/Page";
import styles from "./EventsPage.module.scss";

export const EventsPage = memo(() => {
	const [view, setView] = useState<"board" | "list">("board");

	return (
		<Page>
			<div className={styles["events-page__header"]}>
				<div>
					<PageTitle subtitle="Ожидаемые и прошедшие поступления и платежи">
						События
					</PageTitle>
				</div>

				<div className={styles["events-page__actions"]}>
					<button type="button" className={styles["events-page__add-button"]}>
						+ Добавить событие
					</button>
					<PillSwitch
						value={view}
						options={[
							{ value: "list", label: "Список" },
							{ value: "board", label: "Доска" },
						]}
						onChange={setView}
					/>
				</div>
			</div>

			<div className={styles["events-page__columns"]}>
				<div className={styles["events-page__column"]}>
					<div className={styles["events-page__column-header"]}>
						<span className={styles["events-page__column-title"]}>Ожидаются</span>
						<Badge>7</Badge>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Дельта-Сервис</span>
							<span
								className={cn(
									styles["events-page__event-amount"],
									styles["events-page__event-amount--positive"],
								)}
							>
								+340 000 ₽
							</span>
						</div>
						<span className={styles["events-page__event-date"]}>27.10</span>
						<span className={styles["events-page__tag"]}>Счёт</span>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>ЕНП</span>
							<span className={styles["events-page__event-amount"]}>−186 400 ₽</span>
						</div>
						<span className={styles["events-page__event-date"]}>28.10</span>
						<span className={styles["events-page__tag"]}>Налоговый календарь</span>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Поставщик зерна</span>
							<span className={styles["events-page__event-amount"]}>−214 000 ₽</span>
						</div>
						<span className={styles["events-page__event-date"]}>30.10</span>
						<span className={styles["events-page__tag"]}>Договор</span>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Аренда</span>
							<span className={styles["events-page__event-amount"]}>−180 000 ₽</span>
						</div>
						<span className={styles["events-page__event-date"]}>02.11</span>
						<span className={styles["events-page__tag"]}>Договор</span>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Зарплата</span>
							<span className={styles["events-page__event-amount"]}>−248 000 ₽</span>
						</div>
						<span className={styles["events-page__event-date"]}>05.11</span>
						<span className={styles["events-page__tag"]}>Ввод вручную</span>
					</div>
				</div>

				<div className={styles["events-page__column"]}>
					<div className={styles["events-page__column-header"]}>
						<span className={styles["events-page__column-title"]}>Пришли</span>
						<Badge>1</Badge>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Сити-Фуд</span>
							<span
								className={cn(
									styles["events-page__event-amount"],
									styles["events-page__event-amount--positive"],
								)}
							>
								+146 000 ₽
							</span>
						</div>
						<span className={styles["events-page__event-date"]}>20.10</span>
						<span className={styles["events-page__tag"]}>Счёт</span>
					</div>

					<div className={styles["events-page__total"]}>
						<span className={styles["events-page__total-label"]}>Итого</span>
						<span>146 000 ₽</span>
					</div>
				</div>

				<div className={styles["events-page__column"]}>
					<div className={styles["events-page__column-header"]}>
						<span className={styles["events-page__column-title"]}>Просрочены</span>
						<Badge variant="danger">1</Badge>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Мельница</span>
							<span
								className={cn(
									styles["events-page__event-amount"],
									styles["events-page__event-amount--positive"],
								)}
							>
								+128 400 ₽
							</span>
						</div>
						<span className={styles["events-page__event-date"]}>
							Ждали 21.10, просрочка 2 дня
						</span>
						<span className={styles["events-page__tag"]}>Договор</span>
					</div>

					<div className={styles["events-page__total"]}>
						<span className={styles["events-page__total-label"]}>Итого</span>
						<span>128 400 ₽</span>
					</div>
				</div>

				<div className={styles["events-page__column"]}>
					<div className={styles["events-page__column-header"]}>
						<span className={styles["events-page__column-title"]}>Отложены</span>
						<Badge>1</Badge>
					</div>

					<div className={styles["events-page__card"]}>
						<div className={styles["events-page__card-top"]}>
							<span className={styles["events-page__event-name"]}>Ремонт кофемашины</span>
							<span className={styles["events-page__event-amount"]}>−45 000 ₽</span>
						</div>
						<span className={styles["events-page__event-date"]}>25.11</span>
						<span className={styles["events-page__tag"]}>Ввод вручную</span>
					</div>

					<div className={styles["events-page__total"]}>
						<span className={styles["events-page__total-label"]}>Итого</span>
						<span>−45 000 ₽</span>
					</div>
				</div>
			</div>
		</Page>
	);
});

export default EventsPage;
