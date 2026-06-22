import React, { useState } from 'react';
import styles from '../quan-tri.module.css';

interface RescheduleDashboardProps {
  onClose: () => void;
  onRescheduleRolling: (fromDate: string, days: number) => void;
  onMoveToPool: (matchIds: string[]) => void;
  postponeTargetDate: string;
  filteredAndSortedScheduleMatches: any[];
}

export default function RescheduleDashboard({
  onClose,
  onRescheduleRolling,
  onMoveToPool,
  postponeTargetDate,
  filteredAndSortedScheduleMatches
}: RescheduleDashboardProps) {

  const postponedMatches = filteredAndSortedScheduleMatches.filter(
    (m) => m.date === postponeTargetDate && m.trangThai === 'POSTPONED'
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '600px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>🔄 Tái cấu trúc lịch thi đấu</h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}
          >
            ×
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
            Ngày bị hoãn: <strong>{postponeTargetDate}</strong>
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
            Tổng số trận đấu bị ảnh hưởng: <strong>{postponedMatches.length}</strong> trận
          </p>
        </div>

        <h4 style={{ fontSize: '15px', color: '#334155', marginBottom: '16px' }}>Vui lòng chọn chiến lược xếp lịch lại:</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>Tịnh tiến cuốn chiếu</h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Tự động đẩy toàn bộ lịch của giải lùi lại 7 ngày kể từ ngày hoãn.</p>
            </div>
            <button 
              className={styles.saveBtn}
              onClick={() => onRescheduleRolling(postponeTargetDate, 7)}
              style={{ minWidth: '150px' }}
            >
              +7 Ngày
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>Đưa vào Kho chờ</h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Hủy ngày/giờ các trận bị hoãn. Admin sẽ xếp tay lại bằng cách kéo thả vào các ngày khác.</p>
            </div>
            <button 
              className={styles.cancelBtn}
              onClick={() => onMoveToPool(postponedMatches.map(m => m.id))}
              style={{ background: '#f1f5f9', color: '#475569', minWidth: '150px', border: '1px solid #cbd5e1' }}
              disabled={postponedMatches.length === 0}
            >
              Chuyển Kho Chờ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
