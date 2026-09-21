import styles from "./ComingSoon.module.css";

type ComingSoonProps = {
  title: string;
  description: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>
        {description}
      </p>
    </div>
  );
}