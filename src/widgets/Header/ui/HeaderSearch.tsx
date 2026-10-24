import { KeyboardEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useLazySearchCompanyQuery } from "@/entities/Finance";
import {
	getRouteAdd,
	getRouteAssistant,
	getRouteCalendar,
	getRouteEvents,
	getRouteFaq,
	getRouteForecast,
	getRouteOperations,
	getRouteMain,
	getRoutePlanFact,
	getRouteSettings,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
} from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import styles from "./HeaderSearch.module.scss";

type SearchEntry = {
	id: string;
	titleKey?: string;
	title?: string;
	keywordsKey?: string;
	path: string;
	sectionId?: string;
	pageTitleKey?: string;
	hint?: string;
};

const PAGE_ENTRIES: SearchEntry[] = [
	{ id: "today", titleKey: "today.title", keywordsKey: "header.searchKeywords.today", path: getRouteToday() },
	{
		id: "forecast",
		titleKey: "forecast.title",
		keywordsKey: "header.searchKeywords.forecast",
		path: getRouteForecast(),
	},
	{
		id: "plan-fact",
		titleKey: "planFact.title",
		keywordsKey: "header.searchKeywords.planFact",
		path: getRoutePlanFact(),
	},
	{ id: "events", titleKey: "events.title", keywordsKey: "header.searchKeywords.events", path: getRouteEvents() },
	{
		id: "calendar",
		titleKey: "nav.calendar",
		keywordsKey: "header.searchKeywords.calendar",
		path: getRouteCalendar(),
	},
	{ id: "add", titleKey: "add.titleShort", keywordsKey: "header.searchKeywords.add", path: getRouteAdd() },
	{
		id: "operations",
		titleKey: "operations.title",
		keywordsKey: "header.searchKeywords.operations",
		path: getRouteOperations(),
	},
	{
		id: "sources",
		titleKey: "sources.title",
		keywordsKey: "header.searchKeywords.sources",
		path: getRouteSources(),
	},
	{
		id: "strategies",
		titleKey: "strategies.title",
		keywordsKey: "header.searchKeywords.strategies",
		path: getRouteStrategies(),
	},
	{
		id: "settings",
		titleKey: "settings.title",
		keywordsKey: "header.searchKeywords.settings",
		path: getRouteSettings(),
	},
	{
		id: "assistant",
		titleKey: "assist.title",
		keywordsKey: "header.searchKeywords.assistant",
		path: getRouteAssistant(),
	},
	{ id: "faq", titleKey: "faq.title", keywordsKey: "header.searchKeywords.faq", path: getRouteFaq() },
];

const SECTION_ENTRIES: SearchEntry[] = [
	{
		id: "sec-today-balance",
		titleKey: "today.balance30",
		keywordsKey: "header.searchKeywords.todayBalance",
		path: getRouteToday(),
		sectionId: "today-balance",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-kpi",
		titleKey: "header.searchSectionTitles.kpi",
		keywordsKey: "header.searchKeywords.todayKpi",
		path: getRouteToday(),
		sectionId: "today-kpi",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-risk",
		titleKey: "header.searchSectionTitles.risk",
		keywordsKey: "header.searchKeywords.todayRisk",
		path: getRouteToday(),
		sectionId: "today-risk",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-variants",
		titleKey: "today.variants",
		keywordsKey: "header.searchKeywords.todayVariants",
		path: getRouteToday(),
		sectionId: "today-variants",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-alerts",
		titleKey: "header.searchSectionTitles.alerts",
		keywordsKey: "header.searchKeywords.todayAlerts",
		path: getRouteToday(),
		sectionId: "today-alerts",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-weeks",
		titleKey: "today.moneyWeeks",
		keywordsKey: "header.searchKeywords.todayWeeks",
		path: getRouteToday(),
		sectionId: "today-weeks",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-categories",
		titleKey: "today.whereMoney",
		keywordsKey: "header.searchKeywords.todayCategories",
		path: getRouteToday(),
		sectionId: "today-categories",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-payments",
		titleKey: "today.upcomingTitle",
		keywordsKey: "header.searchKeywords.todayPayments",
		path: getRouteToday(),
		sectionId: "today-payments",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-today-flows",
		titleKey: "today.flows",
		keywordsKey: "header.searchKeywords.todayFlows",
		path: getRouteToday(),
		sectionId: "today-flows",
		pageTitleKey: "today.title",
	},
	{
		id: "sec-forecast-scenarios",
		titleKey: "forecast.scens",
		keywordsKey: "header.searchKeywords.forecastScenarios",
		path: getRouteForecast(),
		sectionId: "forecast-scenarios",
		pageTitleKey: "forecast.title",
	},
	{
		id: "sec-forecast-chart",
		titleKey: "forecast.chartTitle",
		keywordsKey: "header.searchKeywords.forecastChart",
		path: getRouteForecast(),
		sectionId: "forecast-chart",
		pageTitleKey: "forecast.title",
	},
	{
		id: "sec-plan-fact-chart",
		titleKey: "planFact.chartTitle",
		keywordsKey: "header.searchKeywords.planFactChart",
		path: getRoutePlanFact(),
		sectionId: "plan-fact-chart",
		pageTitleKey: "planFact.title",
	},
	{
		id: "sec-strategies-params",
		titleKey: "strategies.params",
		keywordsKey: "header.searchKeywords.strategiesParams",
		path: getRouteStrategies(),
		sectionId: "strategies-params",
		pageTitleKey: "strategies.title",
	},
	{
		id: "sec-strategies-notify",
		titleKey: "strategies.notify",
		keywordsKey: "header.searchKeywords.strategiesNotify",
		path: getRouteStrategies(),
		sectionId: "strategies-notify",
		pageTitleKey: "strategies.title",
	},
	{
		id: "sec-settings-account",
		titleKey: "settings.account",
		keywordsKey: "header.searchKeywords.account",
		path: getRouteSettings(),
		sectionId: "settings-account",
		pageTitleKey: "settings.title",
	},
	{
		id: "sec-settings-business",
		titleKey: "settings.business",
		keywordsKey: "header.searchKeywords.business",
		path: getRouteSettings(),
		sectionId: "settings-business",
		pageTitleKey: "settings.title",
	},
];

const normalize = (value: string) => value.toLocaleLowerCase().replace(/ё/g, "е").trim();
const MOBILE_MQ = "(max-width: 860px)";

const isCurrentPage = (entry: SearchEntry, pathname: string): boolean => {
	if (entry.path === getRouteToday()) {
		return pathname === getRouteToday() || pathname === getRouteMain();
	}
	return pathname === entry.path;
};

export const HeaderSearch = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const rootRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isMobile, setIsMobile] = useState(() =>
		typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false,
	);
	const [searchCompany, { data: companySearch }] = useLazySearchCompanyQuery();
	const listId = "header-search-list";

	useEffect(() => {
		const mq = window.matchMedia(MOBILE_MQ);
		const sync = () => setIsMobile(mq.matches);
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	useEffect(() => {
		const q = query.trim();
		if (q.length < 2) return;
		const timer = window.setTimeout(() => {
			void searchCompany({ q });
		}, 250);
		return () => window.clearTimeout(timer);
	}, [query, searchCompany]);

	useEffect(() => {
		if (!isOpen || !isMobile) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen, isMobile]);

	const groups = useMemo(() => {
		const words: string[] = normalize(query).split(/\s+/).filter(Boolean);
		const filterEntries = (entries: SearchEntry[]) =>
			entries.filter((entry) => {
				const title = entry.title ?? (entry.titleKey ? t(entry.titleKey) : "");
				const keywords = entry.keywordsKey ? t(entry.keywordsKey) : "";
				const value = normalize(`${title} ${keywords}`);
				return words.every((word) => value.includes(word));
			});

		const dataEntries: SearchEntry[] =
			query.trim().length >= 2
				? (companySearch?.items ?? []).slice(0, 8).map((item) => ({
						id: item.id,
						title: item.name || item.date,
						hint: `${item.date}${item.amount ? ` · ${formatMoney(item.amount, locale)}` : ""}`,
						path: item.kind === "event" ? getRouteEvents() : getRouteOperations(),
					}))
				: [];

		return [
			{ id: "pages", label: t("header.searchPages"), entries: filterEntries(PAGE_ENTRIES) },
			{ id: "sections", label: t("header.searchSections"), entries: filterEntries(SECTION_ENTRIES) },
			{ id: "data", label: t("header.searchData"), entries: dataEntries },
		].filter((group) => group.entries.length > 0);
	}, [companySearch?.items, locale, query, t]);

	const results = groups.flatMap((group) => group.entries);

	const closeSearch = () => {
		setIsOpen(false);
		setQuery("");
		setActiveIndex(-1);
		inputRef.current?.blur();
	};

	const openSearch = () => {
		setIsOpen(true);
		setActiveIndex(-1);
		window.requestAnimationFrame(() => inputRef.current?.focus());
	};

	useEffect(() => {
		const onShortcut = (event: globalThis.KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
				event.preventDefault();
				openSearch();
			}
		};
		document.addEventListener("keydown", onShortcut);
		return () => document.removeEventListener("keydown", onShortcut);
	}, []);

	useEffect(() => {
		if (!isOpen || isMobile) return;
		const onDoc = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) closeSearch();
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [isOpen, isMobile]);

	const selectEntry = (entry: SearchEntry) => {
		closeSearch();
		navigate({
			pathname: entry.path,
			hash: entry.sectionId ? `#${entry.sectionId}` : "",
		});

		window.setTimeout(() => {
			const target = entry.sectionId ? document.getElementById(entry.sectionId) : document.querySelector("main");
			if (!(target instanceof HTMLElement)) return;

			target.scrollIntoView({
				behavior: reduceMotion ? "auto" : "smooth",
				block: entry.sectionId ? "center" : "start",
			});

			if (entry.sectionId && !reduceMotion) {
				target.dataset.searchActive = "true";
				window.setTimeout(() => delete target.dataset.searchActive, 850);
			}
		}, 50);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			closeSearch();
			return;
		}
		if (!results.length) return;
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setIsOpen(true);
			setActiveIndex((index) => (index < 0 ? 0 : (index + 1) % results.length));
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setIsOpen(true);
			setActiveIndex((index) =>
				index < 0 ? results.length - 1 : (index - 1 + results.length) % results.length,
			);
		}
		if (event.key === "Enter" && isOpen && activeIndex >= 0) {
			event.preventDefault();
			selectEntry(results[activeIndex]);
		}
	};

	return (
		<div
			ref={rootRef}
			className={cn(styles["header-search"], isOpen && styles["header-search--open"])}
			role="search"
			onKeyDown={onKeyDown}
		>
			<button
				type="button"
				className={styles["header-search__trigger"]}
				aria-label={t("header.search")}
				aria-expanded={isOpen}
				aria-controls={listId}
				onClick={openSearch}
			>
				<Search size={18} strokeWidth={1.3} aria-hidden />
			</button>

			{isOpen && isMobile ? (
				<button
					type="button"
					className={styles["header-search__backdrop"]}
					aria-label={t("header.searchClose")}
					onClick={closeSearch}
				/>
			) : null}

			<div className={styles["header-search__panel"]}>
				<div className={styles["header-search__field"]}>
					<Search size={18} strokeWidth={1.3} aria-hidden />
					<input
						ref={inputRef}
						type="search"
						value={query}
						placeholder={t("header.searchPlaceholder")}
						aria-label={t("header.search")}
						aria-expanded={isOpen}
						aria-controls={listId}
						aria-autocomplete="list"
						autoComplete="off"
						onFocus={openSearch}
						onChange={(event) => {
							setQuery(event.target.value);
							setActiveIndex(-1);
							setIsOpen(true);
						}}
					/>
					<button
						type="button"
						className={styles["header-search__close"]}
						aria-label={t("header.searchClose")}
						onClick={closeSearch}
					>
						<X size={18} strokeWidth={1.3} aria-hidden />
					</button>
				</div>

				{isOpen ? (
					<div id={listId} className={styles["header-search__dropdown"]} role="listbox">
						<div className={styles["header-search__results"]}>
							{groups.length ? (
								groups.map((group) => (
									<section key={group.id} className={styles["header-search__group"]}>
										<h2>{group.label}</h2>
										{group.entries.map((entry) => {
											const index = results.indexOf(entry);
											const keyboardActive = activeIndex >= 0 && index === activeIndex;
											const current = isCurrentPage(entry, pathname);
											return (
												<button
													key={entry.id}
													type="button"
													role="option"
													aria-selected={keyboardActive}
													aria-current={current ? "page" : undefined}
													className={cn(
														styles["header-search__result"],
														keyboardActive && styles["header-search__result--active"],
														!keyboardActive &&
															current &&
															styles["header-search__result--current"],
													)}
													onMouseEnter={() => setActiveIndex(index)}
													onClick={() => selectEntry(entry)}
												>
													<span className={styles["header-search__result-title"]}>
														{entry.title ?? (entry.titleKey ? t(entry.titleKey) : "")}
													</span>
													{entry.hint ? (
														<small className={styles["header-search__result-hint"]}>{entry.hint}</small>
													) : null}
													{entry.sectionId && entry.pageTitleKey ? (
														<small className={styles["header-search__result-hint"]}>
															{t("header.searchInPage", { page: t(entry.pageTitleKey) })}
														</small>
													) : null}
												</button>
											);
										})}
									</section>
								))
							) : (
								<div className={styles["header-search__empty"]} role="status">
									{t("header.searchEmpty")}
								</div>
							)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
});
