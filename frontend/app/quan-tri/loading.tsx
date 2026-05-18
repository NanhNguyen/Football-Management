import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loaderBox}>
        <div className={styles.spinner}>
          <div className={styles.innerSpinner}></div>
          <img src="/logo-premium-transparent.png" alt="Loading" className={styles.loaderLogo} />
        </div>
        <h2 className={styles.loadingText}>Đang tải trung tâm điều khiển...</h2>
        <p className={styles.loadingSubtext}>Chuẩn bị dữ liệu giải đấu siêu chốt</p>
      </div>
    </div>
  );
}
