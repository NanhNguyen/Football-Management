'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTeamSearch, TeamSearchResult } from '@/hooks/useTeamSearch';
import { useFollowedTeams } from '@/hooks/useFollowedTeams';
import styles from './TeamSearchBar.module.css';

interface TeamSearchBarProps {
  /** Mobile mode: show results as full-screen list (not dropdown) */
  mobileListMode?: boolean;
  /** Extra class for the wrapper */
  className?: string;
  autoFocus?: boolean;
}

export default function TeamSearchBar({ mobileListMode = false, className, autoFocus = false }: TeamSearchBarProps) {
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading } = useTeamSearch(query);
  const { isFollowed, toggleFollow } = useFollowedTeams();

  const showDropdown = !mobileListMode && dropdownOpen;
  const showListMode = mobileListMode;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown on click outside
  useEffect(() => {
    if (mobileListMode) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileListMode]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    // dropdown remains open for popular teams
    inputRef.current?.focus();
  }, []);

  const handleFollowClick = useCallback(
    async (e: React.MouseEvent, teamId: string) => {
      e.stopPropagation();
      await toggleFollow(teamId);
    },
    [toggleFollow]
  );

  const renderSkeletons = () => (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonLogo} />
          <div className={styles.skeletonTextWrap}>
            <div className={styles.skeletonName} />
            <div className={styles.skeletonSub} />
          </div>
        </div>
      ))}
    </>
  );

  const renderTeamItem = (team: TeamSearchResult) => {
    const followed = isFollowed(team.id);
    return (
      <div
        key={team.id}
        className={`${styles.resultItem} ${mobileListMode ? styles.resultItemMobile : ''}`}
      >
        <div className={styles.teamInfo}>
          {team.logo && (team.logo.startsWith('http') || team.logo.startsWith('/')) ? (
            <img src={team.logo} alt={team.ten} className={styles.teamLogo} />
          ) : (
            <div className={styles.teamLogoPlaceholder}>⚽</div>
          )}
          <div className={styles.teamNames}>
            <span className={styles.teamName}>{team.ten}</span>
            <span className={styles.teamSub}>{team.giaiDauTen || team.vietTat || ''}</span>
          </div>
        </div>
        <button
          className={`${styles.followBtn} ${followed ? styles.followBtnActive : ''}`}
          onClick={(e) => handleFollowClick(e, team.id)}
          title={followed ? 'Bỏ theo dõi' : 'Theo dõi'}
          aria-label={followed ? 'Bỏ theo dõi' : 'Theo dõi'}
        >
          ★
        </button>
      </div>
    );
  };

  const renderResults = () => {
    if (isLoading) return renderSkeletons();
    
    // State B - Not found
    if (results.length === 0 && query.trim().length > 0) {
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptySearchIcon}>🔍</span>
          <div className={styles.emptySearchText}>Không tìm thấy đội bóng nào</div>
          <div className={styles.emptySearchSub}>Thử tìm với từ khóa khác</div>
        </div>
      );
    }

    const isStateA = query.trim().length === 0;

    let content: React.ReactNode[] = [];
    if (isStateA) {
      let currentGroup = '';
      results.forEach(team => {
        const groupName = team.giaiDauTen || 'Khác';
        if (groupName !== currentGroup) {
          currentGroup = groupName;
          content.push(
            <div key={`group-${currentGroup}`} className={`${styles.groupHeader} ${mobileListMode ? styles.groupHeaderMobile : ''}`}>
              {currentGroup}
            </div>
          );
        }
        content.push(renderTeamItem(team));
      });
    } else {
      content = results.map(team => renderTeamItem(team));
    }

    return (
      <>
        {isStateA && (
          <div className={`${styles.popularHeader} ${mobileListMode ? styles.popularHeaderMobile : ''}`}>
            Đội bóng phổ biến
          </div>
        )}
        {content}
      </>
    );
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${mobileListMode ? styles.wrapperMobile : ''} ${className || ''}`}
    >
      <div className={`${styles.inputWrapper} ${mobileListMode ? styles.inputWrapperMobile : ''}`}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          placeholder="Tìm đội bóng..."
          className={`${styles.input} ${mobileListMode ? styles.inputMobile : ''}`}
          onFocus={() => setDropdownOpen(true)}
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Xóa tìm kiếm"
          >
            ×
          </button>
        )}
      </div>

      {/* Sidebar dropdown mode */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {renderResults()}
        </div>
      )}

      {/* Mobile full-list mode */}
      {showListMode && (
        <div className={styles.mobileResultsList}>
          {renderResults()}
        </div>
      )}
    </div>
  );
}
