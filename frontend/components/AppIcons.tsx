import React from 'react';
import { 
  Settings as LucideSettings, 
  Trophy as LucideTrophy,
  Shield as LucideShield,
  Star as LucideStar,
  Timer as LucideTimer,
  Play as LucidePlay,
  Pause as LucidePause,
  RefreshCw as LucideRefreshCw,
  Award as LucideAward,
  Home as LucideHome,
  Plane as LucidePlane,
  Trash2 as LucideTrash,
  Pencil as LucidePencil,
  X as LucideX,
  ClipboardList as LucideClipboard,
  Download as LucideDownload,
  CheckCircle2 as LucideCheckCircle,
  Eraser as LucideEraser,
  Hourglass as LucideHourglass,
  Flame as LucideFlame,
  Zap as LucideZap,
  Lightbulb as LucideLightbulb,
  Plus as LucidePlus,
  Users as LucideUsers,
  Calendar as LucideCalendar,
  HelpCircle as LucideHelpCircle,
  ChevronUp as LucideChevronUp,
  ChevronDown as LucideChevronDown,
  ChevronRight as LucideChevronRight,
  ChevronLeft as LucideChevronLeft,
  Target as LucideTarget,
  LogOut as LucideLogOut,
  Lock as LucideLock,
  Compass as LucideStadium,
  ArrowLeft as LucideArrowLeft,
  ArrowRight as LucideArrowRight
} from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  color?: string;
}

// Reusable wrapper to inject primary color by default
const wrapIcon = (Component: React.ComponentType<any>) => {
  return function WrappedIcon({ size = 18, className = '', color = 'var(--color-primary)', ...props }: IconProps) {
    return (
      <Component 
        size={size} 
        className={className} 
        color={color}
        style={{ flexShrink: 0, display: 'inline-block', ...props.style }}
        {...props} 
      />
    );
  };
};

export const SettingsIcon = wrapIcon(LucideSettings);
export const TrophyIcon = wrapIcon(LucideTrophy);
export const ShieldIcon = wrapIcon(LucideShield);
export const TimerIcon = wrapIcon(LucideTimer);
export const PlayIcon = wrapIcon(LucidePlay);
export const PauseIcon = wrapIcon(LucidePause);
export const SyncIcon = wrapIcon(LucideRefreshCw);
export const AwardIcon = wrapIcon(LucideAward);
export const HomeIcon = wrapIcon(LucideHome);
export const AwayIcon = wrapIcon(LucidePlane);
export const TrashIcon = wrapIcon(LucideTrash);
export const EditIcon = wrapIcon(LucidePencil);
export const CloseIcon = wrapIcon(LucideX);
export const ClipboardIcon = wrapIcon(LucideClipboard);
export const ImportIcon = wrapIcon(LucideDownload);
export const CheckIcon = wrapIcon(LucideCheckCircle);
export const ClearIcon = wrapIcon(LucideEraser);
export const HourglassIcon = wrapIcon(LucideHourglass);
export const FlameIcon = wrapIcon(LucideFlame);
export const ZapIcon = wrapIcon(LucideZap);
export const LightbulbIcon = wrapIcon(LucideLightbulb);
export const PlusIcon = wrapIcon(LucidePlus);
export const UsersIcon = wrapIcon(LucideUsers);
export const CalendarIcon = wrapIcon(LucideCalendar);
export const HelpIcon = wrapIcon(LucideHelpCircle);
export const ChevronUpIcon = wrapIcon(LucideChevronUp);
export const ChevronDownIcon = wrapIcon(LucideChevronDown);
export const ChevronRightIcon = wrapIcon(LucideChevronRight);
export const ChevronLeftIcon = wrapIcon(LucideChevronLeft);
export const TargetIcon = wrapIcon(LucideTarget);
export const LockIcon = wrapIcon(LucideLock);
export const LogoutIcon = wrapIcon(LucideLogOut);
export const ArrowLeftIcon = wrapIcon(LucideArrowLeft);
export const ArrowRightIcon = wrapIcon(LucideArrowRight);
export const StadiumIcon = wrapIcon(LucideStadium);

// Custom Emojis to Premium SVGs

export function SoccerBallIcon({ size = 18, className = '', color = 'var(--color-primary)', ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', ...props.style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m12 2-2 4h4Z" />
      <path d="m10 6-3.5 1.5M14 6l3.5 1.5" />
      <path d="M6.5 7.5 4.5 11M17.5 7.5l2 3.5" />
      <path d="M4.5 11h3.5l1.5 3.5M19.5 11h-3.5L14.5 14.5" />
      <path d="m9.5 14.5 2.5 3.5 2.5-3.5" />
      <path d="M12 18v4" />
      <path d="M8 11.5 5.5 16M16 11.5l2.5 4.5" />
    </svg>
  );
}

export function YellowCardIcon({ size = 16, className = '', ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 1.3}
      viewBox="0 0 14 18"
      fill="none"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...props.style }}
      {...props}
    >
      <rect x="0.5" y="0.5" width="13" height="17" rx="2" fill="var(--color-warning, #F59E0B)" stroke="var(--color-warning, #F59E0B)" strokeWidth="1" />
    </svg>
  );
}

export function RedCardIcon({ size = 16, className = '', ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 1.3}
      viewBox="0 0 14 18"
      fill="none"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...props.style }}
      {...props}
    >
      <rect x="0.5" y="0.5" width="13" height="17" rx="2" fill="var(--color-danger, #EF4444)" stroke="var(--color-danger, #EF4444)" strokeWidth="1" />
    </svg>
  );
}

export function GloveIcon({ size = 18, className = '', color = 'var(--color-primary)', ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', ...props.style }}
      {...props}
    >
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
      <path d="M10 10V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9" />
      <path d="M6 14v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-3" />
      <path d="M6 19h12" />
    </svg>
  );
}

export function RunnerIcon({ size = 18, className = '', color = 'var(--color-primary)', ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', ...props.style }}
      {...props}
    >
      <circle cx="12" cy="5" r="2" />
      <path d="M18 8h-4a1 1 0 0 0-1 1v3l-2 3-2-2a2 2 0 0 1-1-2V8a2 2 0 0 1 2-2h3" />
      <path d="M9 13v7" />
      <path d="M13 15v5" />
    </svg>
  );
}

export function LiveDotIcon({ size = 10, className = '', ...props }: { size?: number; className?: string; [key: string]: any }) {
  return (
    <span 
      className={`animate-pulse-live ${className}`} 
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'var(--color-live, #EF4444)',
        borderRadius: '50%',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...props.style
      }} 
      {...props}
    />
  );
}

export function BlueDotIcon({ size = 10, className = '', ...props }: { size?: number; className?: string; [key: string]: any }) {
  return (
    <span 
      className={className} 
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#3b82f6',
        borderRadius: '50%',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...props.style
      }} 
      {...props}
    />
  );
}

export function StarIcon({ size = 18, className = '', filled = false, color = 'var(--color-primary)', ...props }: IconProps & { filled?: boolean }) {
  return (
    <LucideStar 
      size={size} 
      className={className} 
      fill={filled ? color : 'none'} 
      color={color}
      style={{ flexShrink: 0, display: 'inline-block', ...props.style }}
      {...props}
    />
  );
}
