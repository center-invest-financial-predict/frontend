import { memo } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import { PageTitle } from "@/shared/ui/PageTitle";
import { Page } from "@/widgets/Page";
import styles from "./CalendarPage.module.scss";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const CalendarPage = memo(() => {
	return (
		<Page>
			<PageTitle className={styles["calendar-page__title"]}>Календарь</PageTitle>

			<div className={styles["calendar-page__card"]}>
				<div className={styles["calendar-page__weekdays"]}>
					{weekdays.map((w) => (
						<span key={w} className={styles["calendar-page__weekday"]}>{w}</span>
					))}
				</div>

				<div className={styles["calendar-page__days"]}>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>19</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>20</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--green"])}>
							Сити-Фуд +146 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>21</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--peach"])}>
							Мельница +128 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>22</span>
					</div>
					<div className={cn(styles["calendar-page__day"], styles["calendar-page__day--today"])}>
						<span
							className={cn(
								styles["calendar-page__day-number"],
								styles["calendar-page__day-number--today"],
							)}
						>
							23
						</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>24</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>25</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>26</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>27</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--green"])}>
							Дельта-Сервис +340 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>28</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							ЕНП −186 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>29</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>30</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							Поставщик зерна −214 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>31</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>1 ноя</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>2</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							Аренда −180 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>3</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>4</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>5</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							Зарплата −248 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>6</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>7</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>8</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>9</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>10</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							Кредит −96 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>11</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>12</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>13</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>14</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>15</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>16</span>
						<div className={cn(styles["calendar-page__event"], styles["calendar-page__event--gray"])}>
							Аванс −120 тыс
						</div>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>17</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>18</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>19</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>20</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>21</span>
					</div>
					<div className={styles["calendar-page__day"]}>
						<span className={styles["calendar-page__day-number"]}>22</span>
					</div>
				</div>
			</div>
		</Page>
	);
});

export default CalendarPage;
