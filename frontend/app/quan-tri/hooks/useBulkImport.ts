'use client';

import { useState, useRef } from 'react';
import { processBulkImport, generateBulkImportTemplate, ImportProgress } from '@/lib/bulk_import';

export function useBulkImport(
  selectedTournament: any,
  fetchData: (id?: string) => Promise<void>,
  showToast: (msg: string) => void
) {
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState<ImportProgress | null>(null);
  const [selectedBulkFile, setSelectedBulkFile] = useState<File | null>(null);
  const [isBulkDragActive, setIsBulkDragActive] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBulkTemplate = () => {
    try {
      generateBulkImportTemplate();
      showToast('📥 Đã tải file mẫu: Template_Nhap_Du_Lieu_Tong_Hop.xlsx!');
    } catch (err: any) {
      showToast(`❌ Lỗi tải template: ${err.message}`);
    }
  };

  const handleClearBulkImport = () => {
    setSelectedBulkFile(null);
    setBulkImportProgress(null);
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const processBulkFile = async (file: File) => {
    if (!selectedTournament?.id) {
      showToast('⚠️ Vui lòng chọn một giải đấu trước khi import.');
      return;
    }
    setSelectedBulkFile(file);
    try {
      await processBulkImport(file, selectedTournament.id, (progress) => {
        setBulkImportProgress(progress);
      });
      await fetchData(selectedTournament.id);
      setTimeout(() => {
        setIsBulkImportOpen(false);
        handleClearBulkImport();
        showToast('✅ Import dữ liệu tổng hợp thành công!');
      }, 1500);
    } catch (error: any) {
      showToast(`❌ Lỗi Import: ${error.message}`);
    }
  };

  const handleImportBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processBulkFile(file);
  };

  return {
    isBulkImportOpen, setIsBulkImportOpen,
    bulkImportProgress, setBulkImportProgress,
    selectedBulkFile, setSelectedBulkFile,
    isBulkDragActive, setIsBulkDragActive,
    bulkFileInputRef,
    handleDownloadBulkTemplate,
    handleClearBulkImport,
    processBulkFile,
    handleImportBulkFile,
  };
}
