import React from 'react';
import TeamLogo from '@/components/TeamLogo';
import { TrashIcon, ImportIcon } from '@/components/AppIcons';

interface TeamsTabProps {
  styles: any;
  setIsBulkImportOpen: (val: boolean) => void;
  handleAddTeam: () => void;
  teams: any[];
  setViewingTeam: (val: any) => void;
  handleEditTeam: (val: any) => void;
  handleDeleteTeam: (id: string) => void;
  handleDeleteAllTeams: () => void;
  isSyncingLogos?: boolean;
  handleBulkSyncLogos?: () => void;
}

export default function TeamsTab({
  styles,
  setIsBulkImportOpen,
  handleAddTeam,
  teams,
  setViewingTeam,
  handleEditTeam,
  handleDeleteTeam,
  handleDeleteAllTeams,
  isSyncingLogos = false,
  handleBulkSyncLogos
}: TeamsTabProps) {
  return (
    <div className={`${styles.content} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={styles.pageTitle}>Quản lý đội bóng</h2>
          <p className={styles.pageDesc}>Danh sách các đội tham gia giải đấu</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {teams.length > 0 && (
            <button
              className={styles.editBtnCompact}
              style={{ padding: '8px 14px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', borderColor: '#dc2626' }}
              onClick={handleDeleteAllTeams}
            >
              {/* <TrashIcon size={14} color="#white" /> */}
              <span>Xóa tất cả đội</span>
            </button>
          )}
          <button
            className={styles.editBtnCompact}
            style={{ 
              padding: '8px 14px', 
              height: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#f59e0b', 
              color: 'white', 
              borderColor: '#d97706',
              cursor: isSyncingLogos ? 'not-allowed' : 'pointer',
              opacity: isSyncingLogos ? 0.7 : 1
            }}
            onClick={handleBulkSyncLogos}
            disabled={isSyncingLogos}
          >
            {isSyncingLogos ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '4px' }} />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <span>⚡ Tự động đồng bộ Logo</span>
            )}
          </button>
          <button
            className={styles.editBtnCompact}
            style={{ padding: '8px 14px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary-dark)' }}
            onClick={() => setIsBulkImportOpen(true)}
          >
            {/* <ImportIcon size={14} color="#white" /> */}
            <span>Nhập dữ liệu tổng hợp (Excel)</span>
          </button>
          <button className={styles.addBtn} onClick={handleAddTeam}>+ Thêm đội mới</button>
        </div>
      </div>

      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Đội bóng</th>
            <th>Bảng</th>
            <th>Số cầu thủ</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(doi => (
            <tr key={doi.id} onClick={() => setViewingTeam(doi)} className="cursor-pointer">
              <td>
                <div className={styles.teamRow} style={{ pointerEvents: 'none' }}>
                  <div className={styles.teamLogoMini}><TeamLogo logo={doi.logo} /></div>
                  <span style={{ fontWeight: 600 }}>{doi.ten}</span>
                </div>
              </td>
              <td><span className={`${styles.statusBadge} ${styles.badgeNeutral}`}>Bảng {doi.bang}</span></td>
              <td>{doi.cauThu?.length || 0} cầu thủ</td>
              <td><span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>Đã đăng ký</span></td>
              <td>
                <div className={styles.actionBtnGroup}>
                  <button className={styles.editBtnCompact} onClick={(e) => { e.stopPropagation(); handleEditTeam(doi); }}>Sửa</button>
                  <button className={styles.deleteBtnCompact} onClick={(e) => { e.stopPropagation(); handleDeleteTeam(doi.id); }}>Xóa</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
