'use client';

import { useState, useEffect } from 'react';

export function useAdminUIState(selectedMatchId: string | null) {
  const [activeTab, setActiveTab] = useState('lich');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [runRefereeTour, setRunRefereeTour] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Init from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) setActiveTab(savedTab);

    const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenTour) setRunTour(true);

    setIsMounted(true);
  }, []);

  // Persist activeTab
  useEffect(() => {
    if (isMounted && activeTab) {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab, isMounted]);

  // Persist selectedMatchId
  useEffect(() => {
    if (isMounted) {
      if (selectedMatchId) {
        localStorage.setItem('adminSelectedMatchId', selectedMatchId);
      } else {
        localStorage.removeItem('adminSelectedMatchId');
      }
    }
  }, [selectedMatchId, isMounted]);

  // Referee tour trigger
  useEffect(() => {
    if (selectedMatchId) {
      const hasSeenRefereeTour = localStorage.getItem('hasSeenRefereeTour');
      if (!hasSeenRefereeTour) setRunRefereeTour(true);
    } else {
      setRunRefereeTour(false);
    }
  }, [selectedMatchId]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      }
    });
  };

  return {
    activeTab, setActiveTab,
    mobileMenuOpen, setMobileMenuOpen,
    runTour, setRunTour,
    runRefereeTour, setRunRefereeTour,
    isMounted,
    isSwitcherOpen, setIsSwitcherOpen,
    toast, setToast,
    confirmDialog,
    showToast,
    showConfirm,
  };
}
