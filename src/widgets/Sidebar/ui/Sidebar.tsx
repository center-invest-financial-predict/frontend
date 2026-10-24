import { FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
	Home,
	TrendingUp,
	BarChart3,
	FileText,
	Plus,
	Calendar as CalendarIcon,
	AlignLeft,
	Database,
	SlidersHorizontal,
	ChevronDown,
	LucideIcon,
} from "lucide-react";
import {
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteMain,
	getRouteOperations,
	getRoutePlanFact,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
	getRouteAssistant,
} from "@/shared/consts/router";
import { Badge } from "@/shared/ui/Badge";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./Sidebar.module.scss";

type SidebarGroup = "work" | "assist";

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
	{ labelKey: "nav.add", path: getRouteEvents(), icon: Plus },
	{ labelKey: "nav.calendar", path: getRouteCalendar(), icon: CalendarIcon },
	{ labelKey: "nav.operations", path: getRouteOperations(), icon: AlignLeft },
	{ labelKey: "nav.sources", path: getRouteSources(), icon: Database },
	{ labelKey: "nav.strategies", path: getRouteStrategies(), icon: SlidersHorizontal },
];

const CHAT_KEYS = ["nav.chats.gap", "nav.chats.delay", "nav.chats.taxes"] as const;

export const Sidebar: FC = memo(() => {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const currentPath = location.pathname;
	const [openGroup, setOpenGroup] = useState<SidebarGroup | null>("work");

	const workOpen = openGroup === "work";
	const assistOpen = openGroup === "assist";

	const toggleGroup = (group: SidebarGroup) => {
		setOpenGroup((prev) => (prev === group ? null : group));
	};

	const isActive = (path: string, matchMain?: boolean) => {
		if (matchMain) return currentPath === path || currentPath === getRouteMain();
		return currentPath === path;
	};

	return (
		<aside className={styles.sidebar}>
			<div className={styles.sidebar__company}>
				<div className={styles["sidebar__company-text"]}>
					<span className={styles["sidebar__company-name"]}>{t("company.name")}</span>
					<span className={styles["sidebar__company-type"]}>{t("company.type")}</span>
				</div>
				<ChevronDown size={18} color="currentColor" />
			</div>

			<div className={styles.sidebar__groups}>
				<button
					type="button"
					className={styles.sidebar__section}
					onClick={() => toggleGroup("work")}
					aria-expanded={workOpen}
				>
					<span
						className={cn(styles.sidebar__tri, workOpen && styles["sidebar__tri--open"])}
						aria-hidden
					/>
					<span>{t("nav.work")}</span>
				</button>

				{workOpen && (
					<nav className={styles.sidebar__nav}>
						{WORK_LINKS.map(({ labelKey, path, icon: Icon, matchMain, badge }) => {
							const active = isActive(path, matchMain);
							return (
								<div
									key={labelKey}
									className={cn(
										styles.sidebar__item,
										active && styles["sidebar__item--active"],
									)}
									onClick={() => navigate(path)}
								>
									<div className={styles["sidebar__item-left"]}>
										<Icon size={18} strokeWidth={1.8} />
										<span>{t(labelKey)}</span>
									</div>
									{badge ? <Badge variant="warning">{badge}</Badge> : null}
								</div>
							);
						})}
					</nav>
				)}

				<div className={styles.sidebar__spacer} />

				<button
					type="button"
					className={styles.sidebar__section}
					onClick={() => toggleGroup("assist")}
					aria-expanded={assistOpen}
				>
					<span
						className={cn(
							styles.sidebar__tri,
							assistOpen && styles["sidebar__tri--open"],
						)}
						aria-hidden
					/>
					<span>{t("nav.assistant")}</span>
				</button>

				{assistOpen && (
					<nav className={styles.sidebar__nav}>
						<button
							type="button"
							className={styles["sidebar__new-chat"]}
							onClick={() => navigate(getRouteAssistant())}
						>
							<Plus size={18} strokeWidth={1.8} />
							{t("nav.newChat")}
						</button>
						{CHAT_KEYS.map((key) => (
							<button
								key={key}
								type="button"
								className={styles.sidebar__chat}
								onClick={() => navigate(getRouteAssistant())}
							>
								{t(key)}
							</button>
						))}
					</nav>
				)}
			</div>
		</aside>
	);
});
