import React, { useEffect, useState } from 'react';
import CustomRuleBuilder from './CustomRuleBuilder';
import { getTournamentRules, updateTournamentRules } from '@/lib/api';

interface SettingsTabProps {
  styles: any;
  selectedTournamentId: string;
  selectedTournament?: any;
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
  handleSaveTournamentConfig: (rules?: any) => void;
  handleDeleteTournament: () => void;
}

export default function SettingsTab({
  styles,
  selectedTournamentId,
  selectedTournament,
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
  handleSaveTournamentConfig,
  handleDeleteTournament
}: SettingsTabProps) {
  const [initialRules, setInitialRules] = useState<any>(null);
  const [loadingRules, setLoadingRules] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      if (selectedTournamentId) {
        setLoadingRules(true);
        // Prioritize persistent rules_config from Supabase
        if (selectedTournament?.rules_config?.matchFormat) {
          setInitialRules(selectedTournament.rules_config);
          setLoadingRules(false);
          // Sync to in-memory NestJS backend in the background so calculations there align
          updateTournamentRules(selectedTournamentId, selectedTournament.rules_config).catch(err => {
            console.error('Lỗi đồng bộ luật lên backend:', err);
          });
        } else {
          const rules = await getTournamentRules(selectedTournamentId);
          setInitialRules(rules);
          setLoadingRules(false);
        }
      }
    }
    fetchRules();
  }, [selectedTournamentId, selectedTournament]);

  const handleSaveCustomRules = async (rules: any) => {
    if (selectedTournamentId) {
      await updateTournamentRules(selectedTournamentId, rules);
      await handleSaveTournamentConfig(rules);
      setInitialRules(rules);
    }
  };

  return (
    <div className={`${styles.content} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className={styles.pageTitle}>Cài đặt giải đấu</h2>
          <p className={styles.pageDesc}>Cấu hình thông tin cơ bản và giới hạn của giải đấu</p>
        </div>
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

        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Cấu Hình Luật Nâng Cao & Sự kiện tùy chỉnh (Custom Rules & Events)</h3>
        {loadingRules ? (
          <div className="text-center p-4" style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>Đang tải cấu hình luật...</div>
        ) : (
          <CustomRuleBuilder initialData={initialRules} onSubmit={handleSaveCustomRules} styles={styles} />
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="submit" form="custom-rules-form" className={styles.addBtn} style={{ padding: '12px 24px', fontSize: '14px', height: 'auto', fontWeight: 'bold' }}>
            Lưu cấu hình giải đấu
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '24px 0' }} />

        <div style={{ marginTop: '24px', padding: '20px', border: '1px solid #fee2e2', borderRadius: '12px', background: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-danger)', margin: 0 }}>Vùng nguy hiểm (Danger Zone)</h4>
            <p style={{ fontSize: '13px', color: '#7f1d1d', marginTop: '4px', margin: 0 }}>Xóa giải đấu này sẽ xóa vĩnh viễn tất cả đội bóng, cầu thủ, lịch thi đấu, và các dữ liệu liên quan.</p>
          </div>
          <button
            onClick={handleDeleteTournament}
            style={{
              background: 'var(--color-danger)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--color-danger)')}
          >
            Xóa giải đấu
          </button>
        </div>
      </div>
    </div>
  );
}
