import React from 'react';

interface SettingsTabProps {
  styles: any;
  tournamentName: string;
  setTournamentName: (val: string) => void;
  tournamentSeason: string;
  setTournamentSeason: (val: string) => void;
  tournamentStartDate: string;
  setTournamentStartDate: (val: string) => void;
  tournamentEndDate: string;
  setTournamentEndDate: (val: string) => void;
  maxTeams: number;
  setMaxTeams: (val: number) => void;
  tournamentMaxPlayers: number;
  setTournamentMaxPlayers: (val: number) => void;
  tournamentType: 'tournament' | 'league';
  setTournamentType: (val: 'tournament' | 'league') => void;
  tournamentVenueType: 'CENTRALIZED' | 'HOME_AWAY';
  setTournamentVenueType: (val: 'CENTRALIZED' | 'HOME_AWAY') => void;
  tournamentGroupLegs: 1 | 2;
  setTournamentGroupLegs: (val: 1 | 2) => void;
  tournamentLeagueRounds: number;
  setTournamentLeagueRounds: (val: number) => void;
  standingsConfig: { phongDo: boolean; thePhat: boolean };
  setStandingsConfig: (val: any) => void;
  customEvents: any[];
  addCustomEvent: () => void;
  updateCustomEvent: (idx: number, field: string, value: any) => void;
  removeCustomEvent: (idx: number) => void;
  handleSaveTournamentConfig: () => void;
}

export default function SettingsTab({
  styles,
  tournamentName,
  setTournamentName,
  tournamentSeason,
  setTournamentSeason,
  tournamentStartDate,
  setTournamentStartDate,
  tournamentEndDate,
  setTournamentEndDate,
  maxTeams,
  setMaxTeams,
  tournamentMaxPlayers,
  setTournamentMaxPlayers,
  tournamentType,
  setTournamentType,
  tournamentVenueType,
  setTournamentVenueType,
  tournamentGroupLegs,
  setTournamentGroupLegs,
  tournamentLeagueRounds,
  setTournamentLeagueRounds,
  standingsConfig,
  setStandingsConfig,
  customEvents,
  addCustomEvent,
  updateCustomEvent,
  removeCustomEvent,
  handleSaveTournamentConfig
}: SettingsTabProps) {
  return (
    <div className={`${styles.content} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className={styles.pageTitle}>Cài đặt giải đấu</h2>
          <p className={styles.pageDesc}>Cấu hình thông tin cơ bản và giới hạn của giải đấu</p>
        </div>
        <button className={styles.addBtn} onClick={handleSaveTournamentConfig}>Lưu cấu hình</button>
      </div>

      <div className={styles.formCard}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Thông tin cơ bản</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên giải đấu</label>
            <input
              type="text"
              className={styles.input}
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mùa giải</label>
            <input
              type="text"
              className={styles.input}
              value={tournamentSeason}
              onChange={(e) => setTournamentSeason(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ngày khai mạc</label>
            <input
              type="date"
              className={styles.input}
              value={tournamentStartDate}
              onChange={(e) => setTournamentStartDate(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ngày bế mạc</label>
            <input
              type="date"
              className={styles.input}
              value={tournamentEndDate}
              onChange={(e) => setTournamentEndDate(e.target.value)}
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Giới hạn đội bóng & Đăng ký</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số đội tối đa</label>
            <input
              type="number"
              className={styles.input}
              value={maxTeams === 0 ? '' : maxTeams}
              onChange={(e) => setMaxTeams(e.target.value === '' ? 0 : Number(e.target.value))}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Nếu thêm vượt quá số này trong Quản lý Đội, hệ thống sẽ chặn lại.</p>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số cầu thủ tối đa / đội</label>
            <input
              type="number"
              className={styles.input}
              value={tournamentMaxPlayers === 0 ? '' : tournamentMaxPlayers}
              onChange={(e) => setTournamentMaxPlayers(e.target.value === '' ? 0 : Number(e.target.value))}
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Thể thức & Sắp lịch thi đấu</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Thể thức thi đấu</label>
            <select
              className={styles.input}
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value as 'tournament' | 'league')}
              style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="tournament">Đấu cúp chia bảng (Tournament)</option>
              <option value="league">Đấu vòng tròn toàn giải (League)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Hình thức tổ chức (Địa điểm)</label>
            <select
              className={styles.input}
              value={tournamentVenueType}
              onChange={(e) => setTournamentVenueType(e.target.value as 'CENTRALIZED' | 'HOME_AWAY')}
              style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="CENTRALIZED">Thi đấu tập trung</option>
              <option value="HOME_AWAY">Sân nhà & Sân khách</option>
            </select>
          </div>

          {tournamentType === 'tournament' ? (
            <div className={styles.formGroup}>
              <label className={styles.label}>Số lượt đá vòng bảng</label>
              <select
                className={styles.input}
                value={tournamentGroupLegs}
                onChange={(e) => setTournamentGroupLegs(Number(e.target.value) as 1 | 2)}
                style={{ width: '100%', height: '42px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value={1}>1 lượt (Đá vòng tròn 1 lượt)</option>
                <option value={2}>2 lượt (Lượt đi - Lượt về)</option>
              </select>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.label}>Số vòng đấu thi đấu</label>
              <input
                type="number"
                className={styles.input}
                value={tournamentLeagueRounds === 0 ? '' : tournamentLeagueRounds}
                onChange={(e) => setTournamentLeagueRounds(e.target.value === '' ? 0 : Number(e.target.value))}
                min={1}
              />
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Cấu hình hiển thị Bảng xếp hạng</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={standingsConfig.phongDo} onChange={(e) => setStandingsConfig({ ...standingsConfig, phongDo: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Hiển thị cột Phong độ (5 trận gần nhất)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={standingsConfig.thePhat} onChange={(e) => setStandingsConfig({ ...standingsConfig, thePhat: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Hiển thị cột Thẻ phạt (Fair-play)</span>
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Sự kiện & Luật Bổ Sung (Custom Events)</h3>
          <button className={styles.editBtnCompact} style={{ padding: '6px 12px' }} onClick={addCustomEvent}>+ Thêm sự kiện</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {customEvents.map((evt, idx) => (
            <div key={evt.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--color-surface-hover)', padding: '12px', borderRadius: '8px' }}>
              <input
                type="text"
                value={evt.icon}
                onChange={(e) => updateCustomEvent(idx, 'icon', e.target.value)}
                style={{ width: '40px', textAlign: 'center', fontSize: '20px', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                placeholder="⚽"
              />
              <input
                type="text"
                value={evt.name}
                onChange={(e) => updateCustomEvent(idx, 'name', e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                placeholder="Tên sự kiện (VD: Siêu Chốt)"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Cộng:</span>
                <input
                  type="number"
                  value={evt.points}
                  onChange={(e) => updateCustomEvent(idx, 'points', Number(e.target.value))}
                  style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Điểm BXH</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '12px' }}>
                <input
                  type="checkbox"
                  checked={evt.isIndividual}
                  onChange={(e) => updateCustomEvent(idx, 'isIndividual', e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '13px' }}>Tính cá nhân</span>
              </label>
              <button
                onClick={() => removeCustomEvent(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', marginLeft: 'auto' }}
                title="Xóa sự kiện"
              >×</button>
            </div>
          ))}
          {customEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic', border: '1px dashed var(--color-border-light)', borderRadius: '8px' }}>
              Giải đấu đang sử dụng các luật mặc định (Bàn thắng, Thẻ phạt).<br />Bấm "+ Thêm sự kiện" để định nghĩa các luật đặc thù.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
