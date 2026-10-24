import { FC, ReactNode, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { getRouteAssistant } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./ScreenHeader.module.scss";

type Props = {
	title: ReactNode;
	subtitle?: ReactNode;
	primary?: ReactNode;
	className?: string;
	showAssist?: boolean;
};

export const ScreenHeader: FC<Props> = memo(
	({ title, subtitle, primary, className, showAssist = false }) => {
		const { t } = useTranslation();
		const navigate = useNavigate();

		return (
			<div className={cn(styles["screen-header"], className)}>
				<div className={styles["screen-header__text"]}>
					<h1 className={styles["screen-header__title"]}>{title}</h1>
					{subtitle ? (
						<p className={styles["screen-header__sub"]}>{subtitle}</p>
					) : null}
				</div>
				<div className={styles["screen-header__actions"]}>
					{showAssist ? (
						<button
							type="button"
							className={styles["screen-header__assist"]}
							onClick={() => navigate(getRouteAssistant())}
						>
							<MessageSquare size={16} strokeWidth={1.5} />
							{t("assist.title")}
						</button>
					) : null}
					{primary}
				</div>
			</div>
		);
	},
);
