import { FC, ReactNode, memo } from "react";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
import styles from "./AuthLayout.module.scss";

type Props = {
	children: ReactNode;
};

export const AuthLayout: FC<Props> = memo(({ children }) => {
	return (
		<div className={styles["auth-layout"]}>
			<div className={styles["auth-layout__lang"]}>
				<LanguageSwitcher />
			</div>
			<div className={styles["auth-layout__form"]}>
				<div className={styles["auth-layout__form-inner"]}>{children}</div>
			</div>
		</div>
	);
});
