import { FC } from "react";
import styles from "./PageLoader.module.scss";

export const PageLoader: FC = () => {
	return (
		<div className={styles["page-loader"]} aria-busy="true" aria-label="Loading">
			<div className={styles["page-loader__title"]} />
			<div className={styles["page-loader__subtitle"]} />
			<div className={styles["page-loader__cards"]}>
				{Array.from({ length: 4 }, (_, index) => (
					<div key={index} className={styles["page-loader__card"]} />
				))}
			</div>
			<div className={styles["page-loader__content"]}>
				<div className={styles["page-loader__content-head"]} />
				<div className={styles["page-loader__content-body"]} />
			</div>
		</div>
	);
};
