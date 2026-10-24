import { Suspense } from "react";
import { AppRouter } from "./providers/router";
import { PageLoader } from "@/widgets/PageLoader";
import { Sidebar } from "@/widgets/Sidebar";
import { Header } from "@/widgets/Header";
import { CashAssistantBar } from "@/widgets/CashAssistantBar";
import styles from "./App.module.scss";

const App = () => {
	return (
		<div className={styles.app}>
			<Sidebar />
			<div className={styles.app__main}>
				<Header />
				<div className={styles.app__content}>
					<Suspense fallback={<PageLoader />}>
						<AppRouter />
					</Suspense>
					<CashAssistantBar />
				</div>
			</div>
		</div>
	);
};

export default App;
