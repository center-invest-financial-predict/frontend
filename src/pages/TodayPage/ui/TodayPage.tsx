import { memo } from "react";
import { Page } from "@/widgets/Page";
import { TodayHeader } from "./TodayHeader/TodayHeader";
import { KpiCards } from "./KpiCards/KpiCards";
import { CashflowChart } from "./CashflowChart/CashflowChart";
import { Suggestions } from "./Suggestions/Suggestions";
import { InsightCards } from "./InsightCards/InsightCards";
import styles from "./TodayPage.module.scss";

const TodayPage = memo(() => {
	return (
		<Page>
			<TodayHeader />
			<KpiCards />
			<div className={styles["today-page__grid"]}>
				<CashflowChart />
				<Suggestions />
			</div>
			<InsightCards />
		</Page>
	);
});

export default TodayPage;
