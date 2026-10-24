import { FC, memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Home, TrendingUp, FileText, Plus, AlignLeft, Database, MessageSquarePlus, LucideIcon } from "lucide-react";
import { CompanyDto, useListCompaniesQuery, useUserActions } from "@/entities/User";
import {
	getRouteAdd,
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
import { useAppDispatch, useAppSelector } from "@/shared/lib/hooks";
import { rtkApi } from "@/shared/api/rtkApi";
import {
	ASSISTANT_CHATS_EVENT,
	getActiveAssistantChatId,
	listAssistantHistory,
	titleOfThread,
	type AssistantThread,
} from "@/shared/lib/assistantChats";
import styles from "./Sidebar.module.scss";

type WorkLink = {
	labelKey: string;
	path: string;
	icon: LucideIcon;
	group: string[];
};

const WORK_LINKS: WorkLink[] = [
	{
		labelKey: "nav.today",
		path: getRouteToday(),
		icon: Home,
		group: [getRouteToday(), getRouteMain()],
	},
	{
		labelKey: "nav.forecast",
		path: getRouteForecast(),
		icon: TrendingUp,
		group: [getRouteForecast(), getRoutePlanFact(), getRouteStrategies()],
	},
	{
		labelKey: "nav.events",
		path: getRouteEvents(),
		icon: FileText,
		group: [getRouteEvents(), getRouteCalendar()],
	},
	{
		labelKey: "nav.add",
		path: getRouteAdd(),
		icon: Plus,
		group: [getRouteAdd()],
	},
	{
		labelKey: "nav.operations",
		path: getRouteOperations(),
		icon: AlignLeft,
		group: [getRouteOperations()],
	},
	{
		labelKey: "nav.sources",
		path: getRouteSources(),
		icon: Database,
		group: [getRouteSources()],
	},
];

const COMPANY_TAGS = [
	"Today",
	"Forecast",
	"Scenarios",
	"PlanFact",
	"Operations",
	"Events",
	"Sources",
	"Strategies",
] as const;

export const Sidebar: FC = memo(() => {
	const { t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [searchParams] = useSearchParams();
	const profile = useAppSelector((state) => state.user.profile);
	const { setProfile } = useUserActions();
	const { data: companies = [] } = useListCompaniesQuery();
	const currentPath = location.pathname;
	const [bizOpen, setBizOpen] = useState(false);
	const [workOpen, setWorkOpen] = useState(true);
	const [assistSectionOpen, setAssistSection] = useState(true);
	const [chats, setChats] = useState<AssistantThread[]>([]);
	const [activeChatId, setActiveChatId] = useState<string | null>(null);

	const activeInn = profile?.business?.inn || companies[0]?.inn || "";

	useEffect(() => {
		if (profile?.business?.inn || !companies.length) return;
		const first = companies[0];
		setProfile({
			...profile,
			business: {
				inn: first.inn,
				name: first.name || first.inn,
				form: first.legalForm || "",
				tax: "",
				city: "",
			},
		});
	}, [companies, profile, setProfile]);

	const selectCompany = (company: CompanyDto) => {
		if (company.inn === activeInn) {
			setBizOpen(false);
			return;
		}
		setProfile({
			...profile,
			business: {
				inn: company.inn,
				name: company.name || company.inn,
				form: company.legalForm || "",
				tax: "",
				city: "",
			},
		});
		dispatch(rtkApi.util.invalidateTags([...COMPANY_TAGS]));
		setBizOpen(false);
	};

	const refreshChats = useCallback(() => {
		setChats(listAssistantHistory());
		setActiveChatId(searchParams.get("c") || getActiveAssistantChatId());
	}, [searchParams]);

	useEffect(() => {
		refreshChats();
		window.addEventListener(ASSISTANT_CHATS_EVENT, refreshChats);
		return () => window.removeEventListener(ASSISTANT_CHATS_EVENT, refreshChats);
	}, [refreshChats]);

	const renderLink = (link: WorkLink) => {
		const { labelKey, path, icon: Icon, group } = link;
		const active = group.includes(currentPath);
		return (
			<button
				key={labelKey}
				type="button"
				className={cn(styles.sidebar__item, active && styles["sidebar__item--active"])}
				onClick={() => navigate(path)}
			>
				<Icon size={18} strokeWidth={1.3} />
				<span className={styles["sidebar__item-label"]}>{t(labelKey)}</span>
			</button>
		);
	};

	return (
		<aside className={styles.sidebar}>
			<div className={styles["sidebar__company-wrap"]}>
				<button
					type="button"
					className={styles.sidebar__company}
					onClick={() => setBizOpen((v) => !v)}
					aria-expanded={bizOpen}
					disabled={!companies.length && !activeInn}
				>
					<span className={styles["sidebar__company-name"]}>
						{activeInn ? t("company.innLabel", { inn: activeInn }) : t("company.innEmpty")}
					</span>
				</button>
				{bizOpen ? (
					<div className={styles["sidebar__biz-list"]}>
						{companies.map((company) => (
							<button
								key={company.inn}
								type="button"
								className={cn(
									styles["sidebar__biz-item"],
									company.inn === activeInn && styles["sidebar__biz-item--active"],
								)}
								onClick={() => selectCompany(company)}
							>
								{t("company.innLabel", { inn: company.inn })}
							</button>
						))}
					</div>
				) : null}
			</div>

			<nav className={styles.sidebar__nav}>
				<button type="button" className={styles["sidebar__section"]} onClick={() => setWorkOpen((v) => !v)}>
					<svg
						width="10"
						height="10"
						viewBox="0 0 12 12"
						className={cn(styles["sidebar__tri"], workOpen && styles["sidebar__tri--open"])}
						aria-hidden
					>
						<path d="M3 1.5l6 4.5-6 4.5z" fill="currentColor" />
					</svg>
					{t("nav.work")}
				</button>
				{workOpen ? WORK_LINKS.map(renderLink) : null}

				<button
					type="button"
					className={cn(styles["sidebar__section"], styles["sidebar__section--gap"])}
					onClick={() => setAssistSection((v) => !v)}
				>
					<svg
						width="10"
						height="10"
						viewBox="0 0 12 12"
						className={cn(styles["sidebar__tri"], assistSectionOpen && styles["sidebar__tri--open"])}
						aria-hidden
					>
						<path d="M3 1.5l6 4.5-6 4.5z" fill="currentColor" />
					</svg>
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
						{chats.map((chat) => (
							<button
								key={chat.id}
								type="button"
								className={cn(
									styles["sidebar__chat"],
									currentPath === getRouteAssistant() &&
										activeChatId === chat.id &&
										styles["sidebar__chat--active"],
								)}
								onClick={() => navigate(getRouteAssistant(), { state: { chatId: chat.id } })}
							>
								{titleOfThread(chat, t("assist.untitledChat"))}
							</button>
						))}
					</>
				) : null}
			</nav>
		</aside>
	);
});
