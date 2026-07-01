'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTeamSearch } from '@/hooks/useTeamSearch';
import { useFollowedTeams } from '@/hooks/useFollowedTeams';
import styles from './TeamSearchBar.module.css';

interface TeamSearchBarProps {
  /** Mobile mode: show results as full-screen list (not dropdown) */
  mobileListMode?: boolean;
  /** Extra class for the wrapper */
  className?: string;
}

export default function TeamSearchBar({ mobileListMode = false, className }: TeamSearchBarProps) {
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading } = useTeamSearch(query);
  const { isFollowed, toggleFollow } = useFollowedTeams();

  const showResults = query.trim().length >= 2;
  const showDropdown = !mobileListMode && dropdownOpen && showResults;
  const showListMode = mobileListMode && showResults;

  // Open dropdown when typing
  useEffect(() => {
    if (query.trim().length >= 2) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  }, [query]);

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
    setDropdownOpen(false);
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

  const renderResults = () => {
    if (isLoading) return renderSkeletons();
    if (results.length === 0) {
      return (
        <div className={styles.emptyState}>
          Không tìm thấy đội bóng nào
        </div>
      );
    }
    return results.map((team) => {
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
              {team.vietTat && (
                <span className={styles.teamSub}>{team.vietTat}</span>
              )}
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
    });
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm đội bóng..."
          className={`${styles.input} ${mobileListMode ? styles.inputMobile : ''}`}
          onFocus={() => query.trim().length >= 2 && setDropdownOpen(true)}
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
