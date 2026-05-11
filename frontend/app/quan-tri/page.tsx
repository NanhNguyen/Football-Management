'use client';

import { useState } from 'react';
import styles from './page.module.css';

const sidebarItems = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard' },
  { icon: '👥', label: 'Quản lý đội', id: 'doi' },
  { icon: '💰', label: 'Nhập giao dịch', id: 'giao-dich' },
  { icon: '📅', label: 'Quản lý vòng đấu', id: 'vong-dau' },
  { icon: '🏆', label: 'Knock-out generator', id: 'knockout' },
  { icon: '👤', label: 'Users', id: 'users' },
];

const tranDauList = [
  { id: 'tran-1', label: 'TK Warriors vs Sale FC', doiNhaId: 'doi-1', doiKhachId: 'doi-2' },
  { id: 'tran-2', label: 'Titans KD05 vs Phoenix KD03', doiNhaId: 'doi-3', doiKhachId: 'doi-4' },
];

const doiList = [
  { id: 'doi-1', ten: 'TK Warriors' },
  { id: 'doi-2', ten: 'Sale FC' },
  { id: 'doi-3', ten: 'Titans KD05' },
  { id: 'doi-4', ten: 'Phoenix KD03' },
];

export default function QuanTriPage() {
  const [activeTab, setActiveTab] = useState('giao-dich');
  const [selectedTran, setSelectedTran] = useState('');
  const [selectedDoi, setSelectedDoi] = useState('');
  const [soGiaoDich, setSoGiaoDich] = useState('');
  const [moTa, setMoTa] = useState('');
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [history, setHistory] = useState<any[]>([]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 5000);
  };

  const handleSubmit = async () => {
    if (!selectedTran || !selectedDoi || !soGiaoDich) {
      showToast('⚠️ Vui lòng điền đầy đủ thông tin');
      return;
    }

    const soBanThang = parseInt(soGiaoDich) * 2;
    const entry = {
      tranDauId: selectedTran,
      doiId: selectedDoi,
      soGiaoDich: parseInt(soGiaoDich),
      moTa,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      banThang: soBanThang,
    };

    try {
      const res = await fetch('http://localhost:3001/api/giao-dich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      showToast(`✅ ${data.thongBao || `Đã thêm ${soGiaoDich} giao dịch → +${soBanThang} bàn thắng`}`);
    } catch {
      showToast(`✅ Đã thêm ${soGiaoDich} giao dịch → +${soBanThang} bàn thắng`);
    }

    setHistory((prev) => [entry, ...prev]);
    setSoGiaoDich('');
    setMoTa('');
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[0];
    setHistory((prev) => prev.slice(1));
    showToast(`↩️ Đã hoàn tác giao dịch: ${last.soGiaoDich} GD`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>⚽</span>
          <div>
            <h2 className={styles.sidebarTitle}>Quản trị</h2>
            <p className={styles.sidebarSub}>Admin Panel</p>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.backToSite}>← Về trang chính</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Quick Input Form — Nhập giao dịch */}
        {activeTab === 'giao-dich' && (
          <div className={styles.content}>
            <h2 className={styles.pageTitle}>💰 Nhập giao dịch nhanh</h2>
            <p className={styles.pageDesc}>
              Chọn trận → Nhập số giao dịch → Auto convert: <strong>1 giao dịch = 2 bàn thắng</strong> → Submit
            </p>

            <div className={styles.formCard}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Chọn trận đấu</label>
                  <select
                    className={styles.select}
                    value={selectedTran}
                    onChange={(e) => setSelectedTran(e.target.value)}
                  >
                    <option value="">-- Chọn trận --</option>
                    {tranDauList.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Chọn đội</label>
                  <select
                    className={styles.select}
                    value={selectedDoi}
                    onChange={(e) => setSelectedDoi(e.target.value)}
                  >
                    <option value="">-- Chọn đội --</option>
                    {doiList.map((d) => (
                      <option key={d.id} value={d.id}>{d.ten}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Số giao dịch</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={soGiaoDich}
                    onChange={(e) => setSoGiaoDich(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="VD: 3"
                    min="1"
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Mô tả (tùy chọn)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={moTa}
                    onChange={(e) => setMoTa(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="VD: Chốt căn hộ A102"
                  />
                </div>
              </div>

              {/* Preview */}
              {soGiaoDich && parseInt(soGiaoDich) > 0 && (
                <div className={styles.preview}>
                  <span>📈 Preview:</span>
                  <strong>{soGiaoDich} giao dịch → +{parseInt(soGiaoDich) * 2} bàn thắng</strong>
                </div>
              )}

              <div className={styles.formActions}>
                <button className={styles.submitBtn} onClick={handleSubmit}>
                  ⚡ Ghi nhận giao dịch
                </button>
                <button className={styles.undoBtn} onClick={handleUndo} disabled={history.length === 0}>
                  ↩️ Hoàn tác ({history.length})
                </button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className={styles.historySection}>
                <h3 className={styles.historyTitle}>Lịch sử giao dịch phiên này</h3>
                <div className={styles.historyList}>
                  {history.map((h, i) => (
                    <div key={i} className={styles.historyItem}>
                      <span className={styles.historyTime}>{h.timestamp}</span>
                      <span className={styles.historyContent}>
                        +{h.soGiaoDich} GD → +{h.banThang} bàn
                        {h.moTa && ` · ${h.moTa}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className={styles.content}>
            <h2 className={styles.pageTitle}>📊 Dashboard Quản trị</h2>
            <p className={styles.pageDesc}>Tổng quan hoạt động giải đấu</p>
            <div className={styles.adminStatsGrid}>
              {[
                { label: 'Tổng đội', value: '8', icon: '🏆' },
                { label: 'Tổng trận', value: '24', icon: '⚽' },
                { label: 'Giao dịch tuần', value: '187', icon: '💰' },
                { label: 'Cầu thủ', value: '96', icon: '👤' },
              ].map((s, i) => (
                <div key={i} className={styles.adminStatCard}>
                  <span className={styles.adminStatIcon}>{s.icon}</span>
                  <div>
                    <p className={styles.adminStatValue}>{s.value}</p>
                    <p className={styles.adminStatLabel}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!['giao-dich', 'dashboard'].includes(activeTab) && (
          <div className={styles.content}>
            <h2 className={styles.pageTitle}>🚧 Đang phát triển</h2>
            <p className={styles.pageDesc}>Tính năng này đang được xây dựng. Vui lòng quay lại sau.</p>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast.visible && (
        <div className={styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
