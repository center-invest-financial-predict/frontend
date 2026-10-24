import { KeyboardEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import {
	getRouteAdd,
	getRouteAssistant,
	getRouteCalendar,
	getRouteEvents,
	getRouteForecast,
	getRouteOperations,
	getRoutePlanFact,
	getRouteSettings,
	getRouteSources,
	getRouteStrategies,
	getRouteToday,
} from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./HeaderSearch.module.scss";

type SearchEntry = {
	id: string;
	titleKey: string;
	keywordsKey: string;
	path: string;
	sectionId?: string;
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
];

const SECTION_ENTRIES: SearchEntry[] = [
	{
		id: "settings-account",
		titleKey: "settings.account",
		keywordsKey: "header.searchKeywords.account",
		path: getRouteSettings(),
		sectionId: "settings-account",
	},
	{
		id: "settings-business",
		titleKey: "settings.business",
		keywordsKey: "header.searchKeywords.business",
		path: getRouteSettings(),
		sectionId: "settings-business",
	},
	{
		id: "settings-accounts",
		titleKey: "settings.accounts",
		keywordsKey: "header.searchKeywords.accounts",
		path: getRouteSettings(),
		sectionId: "settings-accounts",
	},
	{
		id: "settings-users",
		titleKey: "settings.users",
		keywordsKey: "header.searchKeywords.users",
		path: getRouteSettings(),
		sectionId: "settings-users",
	},
	{
		id: "settings-security",
		titleKey: "settings.security",
		keywordsKey: "header.searchKeywords.security",
		path: getRouteSettings(),
		sectionId: "settings-security",
	},
];

const normalize = (value: string) => value.toLocaleLowerCase().replace(/ё/g, "е").trim();

export const HeaderSearch = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const rootRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const listId = "header-search-list";

	const groups = useMemo(() => {
		const words: string[] = normalize(query).split(/\s+/).filter(Boolean);
		const filterEntries = (entries: SearchEntry[]) =>
			entries.filter((entry) => {
				const value = normalize(`${t(entry.titleKey)} ${t(entry.keywordsKey)}`);
				return words.every((word) => value.includes(word));
			});

		return [
			{ id: "pages", label: t("header.searchPages"), entries: filterEntries(PAGE_ENTRIES) },
			{ id: "sections", label: t("header.searchSections"), entries: filterEntries(SECTION_ENTRIES) },
		].filter((group) => group.entries.length > 0);
	}, [query, t]);

	const results = groups.flatMap((group) => group.entries);

	const closeSearch = () => {
		setIsOpen(false);
		setQuery("");
		setActiveIndex(0);
	};

	const openSearch = () => {
		setIsOpen(true);
		setActiveIndex(0);
		inputRef.current?.focus();
	};

	useEffect(() => {
		const onShortcut = (event: globalThis.KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
				event.preventDefault();
				setIsOpen(true);
				setActiveIndex(0);
				inputRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onShortcut);
		return () => document.removeEventListener("keydown", onShortcut);
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		const onDoc = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) closeSearch();
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [isOpen]);

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
			inputRef.current?.blur();
			return;
		}
		if (!results.length) return;
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setIsOpen(true);
			setActiveIndex((index) => (index + 1) % results.length);
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setIsOpen(true);
			setActiveIndex((index) => (index - 1 + results.length) % results.length);
		}
		if (event.key === "Enter" && isOpen) {
			event.preventDefault();
			selectEntry(results[activeIndex] ?? results[0]);
		}
	};

	return (
		<div
			ref={rootRef}
			className={styles["header-search"]}
			role="search"
			onKeyDown={onKeyDown}
		>
			<div className={styles["header-search__field"]}>
				<Search size={18} strokeWidth={1.3} aria-hidden />
				<input
					ref={inputRef}
					type="search"
					value={query}
					placeholder={t("header.search")}
					aria-label={t("header.search")}
					aria-expanded={isOpen}
					aria-controls={listId}
					aria-autocomplete="list"
					autoComplete="off"
					onFocus={openSearch}
					onChange={(event) => {
						setQuery(event.target.value);
						setActiveIndex(0);
						setIsOpen(true);
					}}
				/>
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
										return (
											<button
												key={entry.id}
												type="button"
												role="option"
												aria-selected={index === activeIndex}
												className={cn(
													styles["header-search__result"],
													index === activeIndex && styles["header-search__result--active"],
												)}
												onMouseEnter={() => setActiveIndex(index)}
												onClick={() => selectEntry(entry)}
											>
												<span>{t(entry.titleKey)}</span>
												{entry.sectionId ? <small>{t("header.searchInSettings")}</small> : null}
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
	);
});
