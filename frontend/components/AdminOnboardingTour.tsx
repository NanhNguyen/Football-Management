'use client';

import React, { useState, useEffect } from 'react';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';

interface AdminOnboardingTourProps {
  run: boolean;
  setRun: (run: boolean) => void;
}

export default function AdminOnboardingTour({ run, setRun }: AdminOnboardingTourProps) {
  const [steps] = useState<Step[]>([
    {
      target: '#tour-tournament-switcher',
      content: 'Chuyển đổi giữa các giải đấu mà bạn đang quản lý hoặc tạo một giải đấu mới ngay tại đây.',
      title: '🏆 Chọn Giải Đấu',
      skipBeacon: true,
      placement: 'bottom',
    },
    {
      target: '#tour-sidebar-lich',
      content: 'Cập nhật tỷ số, thẻ phạt, sự kiện của các trận đấu Real-time hoặc lên lịch các vòng đấu sắp tới.',
      title: 'Quản Lý Lịch Đấu',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-doi',
      content: 'Quản lý thông tin đội bóng, danh sách cầu thủ, huấn luyện viên tham gia giải.',
      title: ' Quản Lý Đội',
      placement: 'right',
    },
    {
      target: '#tour-sidebar-cai-dat',
      content: 'Cấu hình chi tiết luật chơi, vòng đấu, và hiển thị của giải đấu.',
      title: 'Cài Đặt Giải',
      placement: 'right',
    },
    {
      target: '#tour-topbar-guide-btn',
      content: 'Nếu bạn quên cách thao tác, hãy nhấn vào đây để xem lại hướng dẫn này bất cứ lúc nào.',
      title: 'Hỗ Trợ',
      placement: 'bottom',
    }
  ]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenAdminTour', 'true');
    }
  };

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      options={{
        zIndex: 10000,
        primaryColor: '#D71920', // var(--color-primary)
        backgroundColor: '#ffffff',
        textColor: '#1F2937',
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
      styles={{
        buttonClose: {
          display: 'none',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonPrimary: {
          backgroundColor: '#D71920',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '8px 16px',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#64748b',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: '14px',
        },
      }}
      locale={{
        back: 'Quay lại',
        close: 'Đóng',
        last: 'Hoàn thành',
        next: 'Tiếp tục',
        skip: 'Bỏ qua',
      }}
    />
  );
}
