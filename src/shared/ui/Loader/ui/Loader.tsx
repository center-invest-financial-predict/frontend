import { FC } from "react";
import styles from "./Loader.module.scss";

export const Loader: FC = () => {
	return (
		<div className={styles.loader}>
			<div className={styles.loader__spinner}>
				{Array.from({ length: 12 }, (_, i) => (
					<div key={i} className={styles.loader__dot} />
				))}
			</div>
		</div>
	);
};
