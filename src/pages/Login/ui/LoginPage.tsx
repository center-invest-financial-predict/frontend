import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useUserActions } from "@/entities/User";
import { AuthLayout } from "@/widgets/AuthLayout";
import {
	ONBOARDING_DONE,
	ONBOARDING_DRAFT,
	USER_ACCESS_TOKEN,
	USER_EMAIL,
	USER_NAME,
	USER_PROFILE,
} from "@/shared/consts/localStorage";
import { getRouteMain, getRouteOnboarding } from "@/shared/consts/router";
import { useAppSelector } from "@/shared/lib/hooks";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./LoginPage.module.scss";

type AuthTab = "in" | "up";

const STUB_EMAIL = "test@mail.ru";
const STUB_PASSWORD = "test";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const stubCredentialsOk = (email: string, password: string) =>
	email.trim().toLowerCase() === STUB_EMAIL && password === STUB_PASSWORD;

const LoginPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { setAuthData, setOnboardingDone } = useUserActions();
	const auth = useAppSelector((state) => state.user.authData);
	const onboardingDone = useAppSelector((state) => state.user.onboardingDone);

	const initialTab: AuthTab = params.get("tab") === "up" ? "up" : "in";
	const [tab, setTab] = useState<AuthTab>(initialTab);
	const [fio, setFio] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [password2, setPassword2] = useState("");
	const [touched, setTouched] = useState(false);
	const [authError, setAuthError] = useState(false);

	const pwBad = tab === "up" && !!password2 && password !== password2;

	const canSubmit = useMemo(() => {
		if (!emailOk(email) || !password) return false;
		if (tab === "up") {
			return !!fio.trim() && password === password2 && password.length >= 4;
		}
		return true;
	}, [email, fio, password, password2, tab]);

	if (auth) {
		return (
			<Navigate to={onboardingDone ? getRouteMain() : getRouteOnboarding()} replace />
		);
	}

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		setTouched(true);
		setAuthError(false);
		if (!canSubmit || pwBad) return;

		const normalizedEmail = email.trim().toLowerCase();
		if (!stubCredentialsOk(normalizedEmail, password)) {
			setAuthError(true);
			return;
		}
		localStorage.setItem(USER_ACCESS_TOKEN, "stub-token");
		localStorage.setItem(USER_EMAIL, normalizedEmail);
		if (tab === "up" && fio.trim()) {
			localStorage.setItem(USER_NAME, fio.trim());
		}

		setAuthData({
			id: "stub",
			username: normalizedEmail,
			name: tab === "up" ? fio.trim() : localStorage.getItem(USER_NAME) || undefined,
		});

		if (tab === "up") {
			localStorage.removeItem(ONBOARDING_DRAFT);
			localStorage.removeItem(USER_PROFILE);
			setOnboardingDone(false);
			navigate(getRouteOnboarding());
			return;
		}

		const done = localStorage.getItem(ONBOARDING_DONE) === "1";
		setOnboardingDone(done);
		navigate(done ? getRouteMain() : getRouteOnboarding());
	};

	return (
		<AuthLayout preview="kpi">
			<form className={styles["login-page"]} onSubmit={onSubmit}>
				<div className={styles["login-page__seg"]} role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={tab === "in"}
						className={cn(
							styles["login-page__seg-btn"],
							tab === "in" && styles["login-page__seg-btn--active"],
						)}
						onClick={() => {
							setTab("in");
							setAuthError(false);
						}}
					>
						{t("auth.tabIn")}
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === "up"}
						className={cn(
							styles["login-page__seg-btn"],
							tab === "up" && styles["login-page__seg-btn--active"],
						)}
						onClick={() => {
							setTab("up");
							setAuthError(false);
						}}
					>
						{t("auth.tabUp")}
					</button>
				</div>

				{tab === "up" ? (
					<input
						className={styles["login-page__input"]}
						value={fio}
						onChange={(e) => {
							setFio(e.target.value);
							setAuthError(false);
						}}
						placeholder={t("auth.fio")}
						autoComplete="name"
					/>
				) : null}

				<input
					className={styles["login-page__input"]}
					type="email"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						setAuthError(false);
					}}
					placeholder={t("auth.email")}
					autoComplete="email"
				/>
				<input
					className={styles["login-page__input"]}
					type="password"
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						setAuthError(false);
					}}
					placeholder={t("auth.password")}
					autoComplete={tab === "up" ? "new-password" : "current-password"}
				/>
				{tab === "up" ? (
					<input
						className={styles["login-page__input"]}
						type="password"
						value={password2}
						onChange={(e) => {
							setPassword2(e.target.value);
							setAuthError(false);
						}}
						placeholder={t("auth.passwordRepeat")}
						autoComplete="new-password"
					/>
				) : null}

				{pwBad || authError || (touched && !canSubmit) ? (
					<div className={styles["login-page__error"]}>
						{pwBad ? t("auth.passwordMismatch") : t("auth.formInvalid")}
					</div>
				) : null}

				<button
					type="submit"
					className={styles["login-page__submit"]}
					disabled={touched && !canSubmit}
				>
					{tab === "up" ? t("auth.createAccount") : t("auth.submit")}
				</button>

				{tab === "up" ? (
					<div className={styles["login-page__terms"]}>{t("auth.terms")}</div>
				) : null}
			</form>
		</AuthLayout>
	);
};

export default LoginPage;
