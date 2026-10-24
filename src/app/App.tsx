import { Suspense, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppRouter } from "./providers/router";
import { PageLoader } from "@/widgets/PageLoader";
import { Sidebar } from "@/widgets/Sidebar";
import { Header } from "@/widgets/Header";
import { CashAssistantBar } from "@/widgets/CashAssistantBar";
import { useUserActions } from "@/entities/User";
import { useAppSelector } from "@/shared/lib/hooks";
import {
	getRouteLogin,
	getRouteOnboarding,
	getRouteRegister,
} from "@/shared/consts/router";
import styles from "./App.module.scss";

const App = () => {
	const location = useLocation();
	const { initAuthData } = useUserActions();
	const inited = useAppSelector((state) => state.user._inited);
	const auth = useAppSelector((state) => state.user.authData);
	const onboardingDone = useAppSelector((state) => state.user.onboardingDone);

	useEffect(() => {
		initAuthData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!inited) {
		return <PageLoader />;
	}

	const isAuthRoute =
		location.pathname === getRouteLogin() || location.pathname === getRouteRegister();
	const isOnboardingRoute = location.pathname === getRouteOnboarding();

	if (!auth || isAuthRoute) {
		return (
			<div className={styles.app}>
				<div className={styles["app__auth"]}>
					<Suspense fallback={<PageLoader />}>
						<AppRouter />
					</Suspense>
				</div>
			</div>
		);
	}

	if (!onboardingDone) {
		if (!isOnboardingRoute) {
			return <Navigate to={getRouteOnboarding()} replace />;
		}
		return (
			<div className={styles.app}>
				<div className={styles["app__auth"]}>
					<Suspense fallback={<PageLoader />}>
						<AppRouter />
					</Suspense>
				</div>
			</div>
		);
	}

	if (isOnboardingRoute) {
		return <Navigate to="/" replace />;
	}

	return (
		<div className={styles.app}>
			<Sidebar />
			<div className={styles.app__main}>
				<div className={styles.app__column}>
					<Header />
					<div className={styles.app__content}>
						<Suspense fallback={<PageLoader />}>
							<AppRouter />
						</Suspense>
					</div>
					<CashAssistantBar />
				</div>
			</div>
		</div>
	);
};

export default App;
