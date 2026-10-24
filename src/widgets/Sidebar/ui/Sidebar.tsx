import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
	Home,
	TrendingUp,
	BarChart3,
	FileText,
	Plus,
	AlignLeft,
	SlidersHorizontal,
	Calendar,
	Database,
	ChevronDown,
	ChevronRight,
	MessageSquarePlus,
	LucideIcon,
} from "lucide-react";
import {
	getRouteAssistant,
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteMain,
	getRouteOperations,
	getRoutePlanFact,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
} from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import { useAppSelector } from "@/shared/lib/hooks";
import styles from "./Sidebar.module.scss";

type WorkLink = {
	labelKey: string;
	path: string;
	icon: LucideIcon;
	matchMain?: boolean;
	badge?: string;
};

const WORK_LINKS: WorkLink[] = [
	{ labelKey: "nav.today", path: getRouteToday(), icon: Home, matchMain: true },
	{ labelKey: "nav.forecast", path: getRouteForecast(), icon: TrendingUp },
	{ labelKey: "nav.planFact", path: getRoutePlanFact(), icon: BarChart3 },
	{ labelKey: "nav.events", path: getRouteEvents(), icon: FileText, badge: "1" },
	{ labelKey: "nav.add", path: getRouteSources(), icon: Plus },
	{ labelKey: "nav.calendar", path: getRouteCalendar(), icon: Calendar },
	{ labelKey: "nav.operations", path: getRouteOperations(), icon: AlignLeft },
];

const EXTRA_LINKS: WorkLink[] = [
	{ labelKey: "nav.sources", path: `${getRouteSources()}?tab=conn`, icon: Database },
	{ labelKey: "nav.strategies", path: getRouteStrategies(), icon: SlidersHorizontal },
];

const CHATS = ["nav.chat1", "nav.chat2", "nav.chat3"] as const;

export const Sidebar: FC = memo(() => {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const profile = useAppSelector((state) => state.user.profile);
	const currentPath = location.pathname;
	const [bizOpen, setBizOpen] = useState(false);
	const [workOpen, setWorkOpen] = useState(true);
	const [assistSectionOpen, setAssistSection] = useState(true);
	const companyName = profile?.business?.name || t("company.name");
	const companyInn = profile?.business?.inn || "6100123456";

	const isActive = (path: string, matchMain?: boolean) => {
		const clean = path.split("?")[0];
		if (matchMain) return currentPath === clean || currentPath === getRouteMain();
		return currentPath === clean;
	};

	const renderLinks = (links: WorkLink[]) =>
		links.map(({ labelKey, path, icon: Icon, matchMain, badge }) => {
			const active = isActive(path, matchMain);
			return (
				<button
					key={labelKey}
					type="button"
					className={cn(
						styles.sidebar__item,
						active && styles["sidebar__item--active"],
					)}
					onClick={() => navigate(path)}
				>
					<Icon size={18} strokeWidth={1.3} />
					<span className={styles["sidebar__item-label"]}>{t(labelKey)}</span>
					{badge ? <span className={styles.sidebar__badge}>{badge}</span> : null}
				</button>
			);
		});

	return (
		<aside className={styles.sidebar}>
			<div className={styles["sidebar__company-wrap"]}>
				<button
					type="button"
					className={styles.sidebar__company}
					onClick={() => setBizOpen((v) => !v)}
					aria-expanded={bizOpen}
				>
					<div className={styles["sidebar__company-text"]}>
						<span className={styles["sidebar__company-name"]}>{companyName}</span>
						<span className={styles["sidebar__company-type"]}>
							{t("company.innLabel", { inn: companyInn })}
						</span>
					</div>
					<ChevronDown size={18} color="currentColor" />
				</button>
				{bizOpen ? (
					<div className={styles["sidebar__biz-list"]}>
						<button type="button" className={styles["sidebar__biz-item"]}>
							{companyName}
						</button>
						<button type="button" className={styles["sidebar__biz-item"]}>
							{t("company.alt1")}
						</button>
						<button type="button" className={styles["sidebar__biz-item"]}>
							{t("company.alt2")}
						</button>
					</div>
				) : null}
			</div>

			<nav className={styles.sidebar__nav}>
				<button
					type="button"
					className={styles["sidebar__section"]}
					onClick={() => setWorkOpen((v) => !v)}
				>
					{workOpen ? (
						<ChevronDown size={10} fill="currentColor" />
					) : (
						<ChevronRight size={10} fill="currentColor" />
					)}
					{t("nav.work")}
				</button>
				{workOpen ? (
					<>
						{renderLinks(WORK_LINKS)}
						{renderLinks(EXTRA_LINKS)}
					</>
				) : null}

				<button
					type="button"
					className={cn(styles["sidebar__section"], styles["sidebar__section--gap"])}
					onClick={() => setAssistSection((v) => !v)}
				>
					{assistSectionOpen ? (
						<ChevronDown size={10} fill="currentColor" />
					) : (
						<ChevronRight size={10} fill="currentColor" />
					)}
					{t("nav.assistant")}
				</button>
				{assistSectionOpen ? (
					<>
						<button
							type="button"
							className={styles["sidebar__new-chat"]}
							onClick={() => navigate(getRouteAssistant(), { state: { reset: true } })}
						>
							<MessageSquarePlus size={18} strokeWidth={1.3} />
							{t("nav.newChat")}
						</button>
						{CHATS.map((key) => (
							<button
								key={key}
								type="button"
								className={styles["sidebar__chat"]}
								onClick={() => navigate(getRouteAssistant())}
							>
								{t(key)}
							</button>
						))}
					</>
				) : null}
			</nav>
		</aside>
	);
});
