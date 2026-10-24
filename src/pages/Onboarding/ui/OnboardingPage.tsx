import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useSetMyInnsMutation, useUserActions } from "@/entities/User";
import { AuthLayout } from "@/widgets/AuthLayout";
import { parseApiError } from "@/shared/api/parseApiError";
import { getRouteLogin, getRouteMain } from "@/shared/consts/router";
import { useAppSelector } from "@/shared/lib/hooks";
import { cn } from "@/shared/lib/classNames/classNames";
import { filterBusinesses } from "../model/demoBusinesses";
import { OnboardingDraft, OnboardingStep, readDraft, STEP_ORDER, stepIndex, writeDraft } from "../model/draft";
import styles from "./OnboardingPage.module.scss";

const PROGRESS_LABELS = ["account", "business", "money", "assumptions", "forecast"] as const;

const BUILD_KEYS = ["parse", "regular", "forecast"] as const;

const OnboardingPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const auth = useAppSelector((state) => state.user.authData);
	const onboardingDone = useAppSelector((state) => state.user.onboardingDone);
	const { logout, setOnboardingDone, setProfile } = useUserActions();
	const [setMyInns, setInnsState] = useSetMyInnsMutation();

	const [draft, setDraft] = useState<OnboardingDraft>(() => readDraft());
	const [buildPhase, setBuildPhase] = useState(0);
	const [buildReady, setBuildReady] = useState(false);
	const [linkError, setLinkError] = useState<string | null>(null);

	useEffect(() => {
		writeDraft(draft);
	}, [draft]);

	useEffect(() => {
		if (draft.step !== "building") {
			setBuildPhase(0);
			setBuildReady(false);
			return;
		}
		setBuildPhase(0);
		setBuildReady(false);
		const t1 = window.setTimeout(() => setBuildPhase(1), 900);
		const t2 = window.setTimeout(() => setBuildPhase(2), 1800);
		const t3 = window.setTimeout(() => {
			setBuildPhase(3);
			setBuildReady(true);
		}, 2700);
		return () => {
			window.clearTimeout(t1);
			window.clearTimeout(t2);
			window.clearTimeout(t3);
		};
	}, [draft.step]);

	const matches = useMemo(() => filterBusinesses(draft.inn), [draft.inn]);

	if (!auth) {
		return <Navigate to={getRouteLogin()} replace />;
	}
	if (onboardingDone) {
		return <Navigate to={getRouteMain()} replace />;
	}

	const update = (patch: Partial<OnboardingDraft>) => {
		setDraft((prev) => ({ ...prev, ...patch }));
	};

	const goStep = (step: OnboardingStep) => update({ step });

	const onBack = () => {
		const i = stepIndex(draft.step);
		if (i <= 0) {
			const snapshot: OnboardingDraft = {
				...draft,
				step: "business",
				assumptions: { ...draft.assumptions },
			};
			logout();
			writeDraft(snapshot);
			navigate({ pathname: getRouteLogin(), search: "?tab=up" });
			return;
		}
		goStep(STEP_ORDER[i - 1]);
	};

	const onNext = async () => {
		setLinkError(null);
		if (draft.step === "business") {
			if (!draft.business) return;
			goStep("sources");
			return;
		}
		if (draft.step === "sources") {
			goStep("assumptions");
			return;
		}
		if (draft.step === "assumptions") {
			goStep("building");
			return;
		}
		if (draft.step === "building" && buildReady) {
			if (!draft.business?.inn || setInnsState.isLoading) return;
			try {
				await setMyInns({ inns: [draft.business.inn] }).unwrap();
				setProfile({
					business: draft.business,
					source: draft.source,
					assumptions: draft.assumptions,
				});
				setOnboardingDone(true);
				navigate(getRouteMain());
			} catch (err) {
				setLinkError(parseApiError(err, t("onboarding.innLinkFailed")));
			}
		}
	};

	const canContinue =
		draft.step === "business"
			? !!draft.business
			: draft.step === "building"
				? buildReady && !setInnsState.isLoading
				: true;

	const progressIndex = stepIndex(draft.step) + 1;

	return (
		<AuthLayout>
			<div className={styles.onboarding}>
				<div className={styles.onboarding__steps} aria-label={t("onboarding.progress")}>
					{PROGRESS_LABELS.map((key, i) => {
						const done = i < progressIndex;
						const current = i === progressIndex;
						return (
							<div
								key={key}
								className={cn(
									styles.onboarding__step,
									done && styles["onboarding__step--done"],
									current && styles["onboarding__step--current"],
								)}
								title={t(`onboarding.steps.${key}`)}
							>
								<span className={styles["onboarding__step-dot"]}>{done ? "✓" : i + 1}</span>
							</div>
						);
					})}
				</div>

				<div key={draft.step} className={styles.onboarding__panel}>
					{draft.step === "business" ? (
						<>
							<div className={styles.onboarding__head}>
								<h1 className={styles.onboarding__title}>{t("onboarding.bizTitle")}</h1>
								<p className={styles.onboarding__sub}>{t("onboarding.bizSub")}</p>
							</div>
							<input
								className={styles.onboarding__input}
								value={draft.inn}
								onChange={(e) => update({ inn: e.target.value, business: null })}
								placeholder={t("onboarding.inn")}
								inputMode="numeric"
							/>
							{draft.inn.trim() ? (
								<div className={styles.onboarding__list}>
									{matches.map((biz) => {
										const active = draft.business?.inn === biz.inn;
										return (
											<button
												key={biz.inn}
												type="button"
												className={cn(styles.onboarding__option, active && styles["onboarding__option--active"])}
												onClick={() => update({ business: biz, inn: biz.inn })}
											>
												<span>
													<span className={styles["onboarding__option-title"]}>{biz.name}</span>
													<span className={styles["onboarding__option-meta"]}>
														{biz.inn} · {biz.form} · {biz.tax}
													</span>
												</span>
												{active ? <Check className={styles.onboarding__check} size={20} strokeWidth={2} /> : null}
											</button>
										);
									})}
								</div>
							) : null}
						</>
					) : null}

					{draft.step === "sources" ? (
						<>
							<h1 className={styles.onboarding__title}>{t("onboarding.srcTitle")}</h1>
							<div className={styles.onboarding__list}>
								<button
									type="button"
									className={cn(
										styles.onboarding__option,
										draft.source === "bank" && styles["onboarding__option--active"],
									)}
									onClick={() => update({ source: "bank", lowData: false })}
								>
									<span>
										<span className={styles["onboarding__option-title"]}>{t("onboarding.srcBank")}</span>
										<span className={styles["onboarding__option-meta"]}>{t("onboarding.srcBankDesc")}</span>
									</span>
								</button>
								<button
									type="button"
									className={cn(
										styles.onboarding__option,
										draft.source === "file" && styles["onboarding__option--active"],
									)}
									onClick={() => update({ source: "file", lowData: true })}
								>
									<span>
										<span className={styles["onboarding__option-title"]}>{t("onboarding.srcFile")}</span>
										<span className={styles["onboarding__option-meta"]}>{t("onboarding.srcFileDesc")}</span>
									</span>
								</button>
							</div>
							<div className={styles.onboarding__note}>
								{draft.source === "file" ? t("onboarding.srcNoteFile") : t("onboarding.srcNoteBank")}
							</div>
						</>
					) : null}

					{draft.step === "assumptions" ? (
						<>
							<div className={styles.onboarding__head}>
								<h1 className={styles.onboarding__title}>{t("onboarding.assTitle")}</h1>
								<p className={styles.onboarding__sub}>{t("onboarding.assSub")}</p>
							</div>
							<label className={styles.onboarding__field}>
								{t("onboarding.minBalance")}
								<input
									className={styles.onboarding__input}
									value={draft.assumptions.minBalance}
									onChange={(e) =>
										update({
											assumptions: {
												...draft.assumptions,
												minBalance: e.target.value,
											},
										})
									}
									inputMode="numeric"
								/>
							</label>
							<div className={styles.onboarding__field}>
								{t("onboarding.payDay")}
								<div className={styles.onboarding__chips}>
									{[5, 10, 15].map((day) => (
										<button
											key={day}
											type="button"
											className={cn(
												styles.onboarding__chip,
												draft.assumptions.payDay === day && styles["onboarding__chip--active"],
											)}
											onClick={() =>
												update({
													assumptions: {
														...draft.assumptions,
														payDay: day,
													},
												})
											}
										>
											{t("onboarding.payDayChip", { day })}
										</button>
									))}
								</div>
							</div>
							<div className={styles.onboarding__field}>
								{t("onboarding.notify")}
								<div className={styles.onboarding__chips}>
									<button
										type="button"
										className={cn(
											styles.onboarding__chip,
											draft.assumptions.notifyApp && styles["onboarding__chip--active"],
										)}
										onClick={() =>
											update({
												assumptions: {
													...draft.assumptions,
													notifyApp: !draft.assumptions.notifyApp,
												},
											})
										}
									>
										{t("onboarding.notifyApp")}
									</button>
									<button
										type="button"
										className={cn(
											styles.onboarding__chip,
											draft.assumptions.notifyMail && styles["onboarding__chip--active"],
										)}
										onClick={() =>
											update({
												assumptions: {
													...draft.assumptions,
													notifyMail: !draft.assumptions.notifyMail,
												},
											})
										}
									>
										{t("onboarding.notifyMail")}
									</button>
								</div>
							</div>
						</>
					) : null}

					{draft.step === "building" ? (
						<>
							<h1 className={styles.onboarding__title}>{t("onboarding.buildTitle")}</h1>
							<div className={styles["onboarding__build-list"]}>
								{BUILD_KEYS.map((key, i) => (
									<div
										key={key}
										className={cn(
											styles["onboarding__build-item"],
											i < buildPhase && styles["onboarding__build-item--done"],
											i === buildPhase && !buildReady && styles["onboarding__build-item--active"],
											buildReady && styles["onboarding__build-item--done"],
										)}
									>
										<span className={styles["onboarding__build-dot"]} />
										{t(`onboarding.build.${key}`)}
									</div>
								))}
							</div>
							<div className={styles.onboarding__progress}>
								<div
									className={cn(
										styles["onboarding__progress-fill"],
										buildPhase >= 1 && styles["onboarding__progress-fill--p1"],
										buildPhase >= 2 && styles["onboarding__progress-fill--p2"],
										buildReady && styles["onboarding__progress-fill--done"],
									)}
								/>
							</div>
							{draft.lowData ? <div className={styles.onboarding__warn}>{t("onboarding.lowData")}</div> : null}
						</>
					) : null}
				</div>

				{linkError ? <div className={styles.onboarding__error}>{linkError}</div> : null}

				<button type="button" className={styles.onboarding__primary} disabled={!canContinue} onClick={onNext}>
					{setInnsState.isLoading
						? t("onboarding.linking")
						: draft.step === "building"
							? t("onboarding.openToday")
							: t("onboarding.continue")}
				</button>

				<div className={styles.onboarding__nav}>
					<button type="button" className={styles.onboarding__back} onClick={onBack}>
						← {t("onboarding.back")}
					</button>
					{draft.step === "sources" || draft.step === "assumptions" ? (
						<button
							type="button"
							className={styles.onboarding__skip}
							onClick={() => goStep(draft.step === "sources" ? "assumptions" : "building")}
						>
							{t("onboarding.skip")}
						</button>
					) : (
						<span />
					)}
				</div>
			</div>
		</AuthLayout>
	);
};

export default OnboardingPage;
