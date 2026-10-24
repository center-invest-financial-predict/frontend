import { FC, ReactNode, memo } from "react";
import { useTranslation } from "react-i18next";
import { Business } from "@/entities/User";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./AuthLayout.module.scss";

export type AuthPreviewKind = "kpi" | "biz" | "src" | "set";

type Props = {
	preview: AuthPreviewKind;
	business?: Business | null;
	minBalance?: string;
	payDay?: number;
	children: ReactNode;
};

export const AuthLayout: FC<Props> = memo(
	({ preview, business, minBalance = "200 000", payDay = 5, children }) => {
		const { t } = useTranslation();

		return (
			<div className={styles["auth-layout"]}>
				<aside className={styles["auth-layout__preview"]}>
					<div className={styles["auth-layout__preview-panel"]}>
						<div className={styles["auth-layout__preview-inner"]}>
							{preview === "kpi" ? (
								<>
									<span className={styles["auth-layout__chip"]}>
										{t("auth.preview.chip")}
									</span>
									<div className={styles["auth-layout__card"]}>
										<div className={styles["auth-layout__card-row"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.balance30")}
											</span>
											<span className={styles["auth-layout__value"]}>
												{t("auth.preview.balanceValue")}
											</span>
										</div>
										<div className={styles["auth-layout__chart"]} aria-hidden />
									</div>
									<div className={styles["auth-layout__kpi-grid"]}>
										<div className={styles["auth-layout__kpi-card"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.min30")}
											</span>
											<span
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{t("auth.preview.minValue")}
											</span>
											<span className={styles["auth-layout__sub"]}>
												{t("auth.preview.minDate")}
											</span>
										</div>
										<div
											className={cn(
												styles["auth-layout__kpi-card"],
												styles["auth-layout__kpi-card--offset"],
											)}
										>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.nextPay")}
											</span>
											<span
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{t("auth.preview.nextPayValue")}
											</span>
											<span className={styles["auth-layout__sub"]}>
												{t("auth.preview.nextPayName")}
											</span>
										</div>
									</div>
								</>
							) : null}

							{preview === "biz" ? (
								<>
									<div className={styles["auth-layout__card"]}>
										<span className={styles["auth-layout__label"]}>
											{t("auth.preview.yourBiz")}
										</span>
										<span className={styles["auth-layout__value"]}>
											{business?.name || t("auth.preview.bizPlaceholder")}
										</span>
										<span className={styles["auth-layout__sub"]}>
											{business
												? t("auth.preview.inn", { inn: business.inn })
												: t("auth.preview.innEmpty")}
										</span>
									</div>
									<div className={styles["auth-layout__kpi-grid"]}>
										<div className={styles["auth-layout__kpi-card"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.form")}
											</span>
											<span
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{business?.form || "—"}
											</span>
										</div>
										<div className={styles["auth-layout__kpi-card"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.city")}
											</span>
											<span
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{business?.city || "—"}
											</span>
										</div>
									</div>
									<div className={styles["auth-layout__card"]}>
										<span className={styles["auth-layout__label"]}>
											{t("auth.preview.tax")}
										</span>
										<span
											className={cn(
												styles["auth-layout__value"],
												styles["auth-layout__value--md"],
											)}
										>
											{business?.tax || "—"}
										</span>
									</div>
								</>
							) : null}

							{preview === "src" ? (
								<>
									<div className={styles["auth-layout__src-row"]}>
										<div>
											<div
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{t("auth.preview.srcBank")}
											</div>
											<div className={styles["auth-layout__sub"]}>
												{t("auth.preview.srcBankSub")}
											</div>
										</div>
										<span className={styles["auth-layout__src-dot"]} />
									</div>
									<div className={styles["auth-layout__src-row"]}>
										<div>
											<div
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{t("auth.preview.src1c")}
											</div>
											<div className={styles["auth-layout__sub"]}>
												{t("auth.preview.srcOff")}
											</div>
										</div>
										<span
											className={cn(
												styles["auth-layout__src-dot"],
												styles["auth-layout__src-dot--muted"],
											)}
										/>
									</div>
									<div className={styles["auth-layout__src-row"]}>
										<div>
											<div
												className={cn(
													styles["auth-layout__value"],
													styles["auth-layout__value--md"],
												)}
											>
												{t("auth.preview.srcFile")}
											</div>
											<div className={styles["auth-layout__sub"]}>
												{t("auth.preview.srcFileSub")}
											</div>
										</div>
										<span
											className={cn(
												styles["auth-layout__src-dot"],
												styles["auth-layout__src-dot--muted"],
											)}
										/>
									</div>
								</>
							) : null}

							{preview === "set" ? (
								<>
									<div className={styles["auth-layout__kpi-grid"]}>
										<div className={styles["auth-layout__kpi-card"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.minBalance")}
											</span>
											<span className={styles["auth-layout__value"]}>
												{minBalance} ₽
											</span>
										</div>
										<div className={styles["auth-layout__kpi-card"]}>
											<span className={styles["auth-layout__label"]}>
												{t("auth.preview.salary")}
											</span>
											<span className={styles["auth-layout__value"]}>
												{t("auth.preview.salaryDay", { day: payDay })}
											</span>
										</div>
									</div>
									<div className={styles["auth-layout__card"]}>
										<span className={styles["auth-layout__sub"]}>
											{t("auth.preview.warnHint")}
										</span>
										<div className={styles["auth-layout__bar"]}>
											<div className={styles["auth-layout__bar-fill"]} />
										</div>
									</div>
								</>
							) : null}
						</div>
					</div>
				</aside>
				<div className={styles["auth-layout__form"]}>
					<div className={styles["auth-layout__form-inner"]}>{children}</div>
				</div>
			</div>
		);
	},
);
