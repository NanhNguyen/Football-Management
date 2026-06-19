'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const MatchFormatSchema = z.object({
  playersPerTeam: z.number().min(5).max(11),
  minutesPerHalf: z.number().min(10).max(90),
  penaltyIfDraw: z.boolean(),
});

const StopwatchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const PointsSystemSchema = z.object({
  win: z.number(),
  draw: z.number(),
  loss: z.number(),
  winByPenalty: z.number(),
  lossByPenalty: z.number(),
});

const CustomEventSchema = z.object({
  code: z.string().min(1, 'Mã không được để trống'),
  name: z.string().min(1, 'Tên không được để trống'),
  icon: z.string().min(1, 'Icon không được để trống'),
  color: z.string(),
  target_scope: z.enum(['none', '1_player', '2_players', 'team']),
  role_1: z.string().optional(),
  role_2: z.string().optional(),
  score_impact: z.object({
    enabled: z.boolean(),
    value: z.number(),
    side: z.enum(['own', 'opponent'])
  }),
  league_impact: z.object({
    enabled: z.boolean(),
    action: z.enum(['add', 'subtract']),
    value: z.number()
  })
});

const TournamentRulesSchema = z.object({
  matchFormat: MatchFormatSchema,
  pointsSystem: PointsSystemSchema,
  tieBreakerPriority: z.array(z.string()),
  custom_events: z.array(CustomEventSchema),
});

type TournamentRulesForm = z.infer<typeof TournamentRulesSchema>;

const TIE_BREAKER_OPTIONS: Record<string, string> = {
  headToHead: 'Thành tích đối đầu',
  goalDifference: 'Hiệu số bàn thắng bại',
  goalsScored: 'Tổng số bàn thắng',
};

const TAILWIND_COLORS = [
  { name: 'Đỏ', hex: '#ef4444' },
  { name: 'Vàng', hex: '#fbbf24' },
  { name: 'Xanh lá', hex: '#10b981' },
  { name: 'Xanh dương', hex: '#3b82f6' },
  { name: 'Tím', hex: '#a855f7' },
  { name: 'Cam', hex: '#f97316' }
];

const POPULAR_ICONS = ['⚽', '🟨', '🟥', '🔄', '🏠', '🏆', '📺', '🌟', '🏥', '📢'];

const TrashIcon = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

interface Props {
  initialData?: TournamentRulesForm;
  onSubmit: (data: TournamentRulesForm) => void;
  styles: any;
}

export default function CustomRuleBuilder({ initialData, onSubmit, styles }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<TournamentRulesForm>({
    resolver: zodResolver(TournamentRulesSchema),
    defaultValues: {
      matchFormat: {
        playersPerTeam: initialData?.matchFormat?.playersPerTeam ?? 7,
        minutesPerHalf: initialData?.matchFormat?.minutesPerHalf ?? 45,
        penaltyIfDraw: initialData?.matchFormat?.penaltyIfDraw ?? false,
      },
      pointsSystem: {
        win: initialData?.pointsSystem?.win ?? 3,
        draw: initialData?.pointsSystem?.draw ?? 1,
        loss: initialData?.pointsSystem?.loss ?? 0,
        winByPenalty: initialData?.pointsSystem?.winByPenalty ?? 2,
        lossByPenalty: initialData?.pointsSystem?.lossByPenalty ?? 1,
      },
      tieBreakerPriority: initialData?.tieBreakerPriority || ['headToHead', 'goalDifference', 'goalsScored'],
      custom_events: initialData?.custom_events || [],
    },
  });

  const [priorities, setPriorities] = useState<string[]>(
    initialData?.tieBreakerPriority || ['headToHead', 'goalDifference', 'goalsScored']
  );

  const [isMounted, setIsMounted] = useState(false);
  const [editingEventIdx, setEditingEventIdx] = useState<number | null>(null);
  const [eventSnapshot, setEventSnapshot] = useState<any>(null);
  const [hoveredDeleteIdx, setHoveredDeleteIdx] = useState<number | null>(null);
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const [isAddHovered, setIsAddHovered] = useState(false);

  const watchedEvents = watch('custom_events');

  const startEditing = (index: number) => {
    const currentValues = control._formValues.custom_events?.[index];
    if (currentValues) {
      setEventSnapshot(JSON.parse(JSON.stringify(currentValues)));
    } else {
      setEventSnapshot(null);
    }
    setEditingEventIdx(index);
  };

  const cancelEditing = () => {
    if (editingEventIdx !== null) {
      if (eventSnapshot) {
        setValue(`custom_events.${editingEventIdx}`, eventSnapshot);
      } else {
        removeCustomEvent(editingEventIdx);
      }
    }
    setEditingEventIdx(null);
    setEventSnapshot(null);
  };

  const confirmEditing = async () => {
    if (editingEventIdx === null) return;
    const isValid = await trigger(`custom_events.${editingEventIdx}`);
    if (isValid) {
      setEditingEventIdx(null);
      setEventSnapshot(null);
    }
  };

  const { fields: customEventsFields, append: appendCustomEvent, remove: removeCustomEvent } = useFieldArray({
    control,
    name: "custom_events"
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('CustomRuleBuilder validation errors:', errors);
    }
  }, [errors]);

  useEffect(() => {
    if (initialData) {
      reset({
        matchFormat: {
          playersPerTeam: initialData.matchFormat?.playersPerTeam ?? 7,
          minutesPerHalf: initialData.matchFormat?.minutesPerHalf ?? 45,
          penaltyIfDraw: initialData.matchFormat?.penaltyIfDraw ?? false,
        },
        pointsSystem: {
          win: initialData.pointsSystem?.win ?? 3,
          draw: initialData.pointsSystem?.draw ?? 1,
          loss: initialData.pointsSystem?.loss ?? 0,
          winByPenalty: initialData.pointsSystem?.winByPenalty ?? 2,
          lossByPenalty: initialData.pointsSystem?.lossByPenalty ?? 1,
        },
        tieBreakerPriority: initialData.tieBreakerPriority || ['headToHead', 'goalDifference', 'goalsScored'],
        custom_events: initialData.custom_events || [],
      });
    }
  }, [initialData, reset]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(priorities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPriorities(items);
    setValue('tieBreakerPriority', items);
  };

  const submitForm = (data: TournamentRulesForm) => {
    onSubmit({ ...data, tieBreakerPriority: priorities });
  };

  if (!isMounted) return null;

  return (
    <form id="custom-rules-form" onSubmit={handleSubmit(submitForm)} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
      
      {/* Thể thức trận đấu */}
      <div style={{ background: 'var(--color-surface, #141C2A)', borderRadius: '12px', border: '1px solid var(--color-border, #1e293b)', padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StopwatchIcon /> Thể thức trận đấu
        </h4>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số người mỗi đội</label>
            <input
              type="number"
              {...register('matchFormat.playersPerTeam', { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.matchFormat?.playersPerTeam && (
              <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>{errors.matchFormat.playersPerTeam.message}</p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số phút mỗi hiệp</label>
            <input
              type="number"
              {...register('matchFormat.minutesPerHalf', { valueAsNumber: true })}
              className={styles.input}
            />
            {errors.matchFormat?.minutesPerHalf && (
              <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>{errors.matchFormat.minutesPerHalf.message}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'none', alignItems: 'center', gap: '10px', marginTop: '12px', cursor: 'pointer' }}>
          <Controller
            name="matchFormat.penaltyIfDraw"
            control={control}
            render={({ field }) => (
              <input
                id="penaltyIfDrawCheckbox"
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            )}
          />
          <label htmlFor="penaltyIfDrawCheckbox" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            Sút luân lưu phân định thắng bại nếu hòa
          </label>
        </div>
      </div>

      {/* Hệ thống điểm số */}
      <div style={{ background: 'var(--color-surface, #141C2A)', borderRadius: '12px', border: '1px solid var(--color-border, #1e293b)', padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChartIcon /> Hệ thống điểm số xếp hạng
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '8px' }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Điểm Thắng</label>
            <input
              type="number"
              {...register('pointsSystem.win', { valueAsNumber: true })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Điểm Hòa</label>
            <input
              type="number"
              {...register('pointsSystem.draw', { valueAsNumber: true })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Điểm Thua</label>
            <input
              type="number"
              {...register('pointsSystem.loss', { valueAsNumber: true })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup} style={{ display: 'none' }}>
            <label className={styles.label}>Thắng Luân Lưu</label>
            <input
              type="number"
              {...register('pointsSystem.winByPenalty', { valueAsNumber: true })}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup} style={{ display: 'none' }}>
            <label className={styles.label}>Thua Luân Lưu</label>
            <input
              type="number"
              {...register('pointsSystem.lossByPenalty', { valueAsNumber: true })}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Tiêu chí xếp hạng */}
      <div style={{ background: 'var(--color-surface, #141C2A)', borderRadius: '12px', border: '1px solid var(--color-border, #1e293b)', padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListIcon /> Thứ tự ưu tiên tiêu chí xếp hạng
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Kéo thả để thay đổi mức độ ưu tiên xếp hạng khi các đội bằng điểm.</p>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tie-breaker-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {priorities.map((key, index) => (
                  <Draggable key={key} draggableId={key} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: snapshot.isDragging ? '1px solid var(--color-primary)' : '1px solid var(--color-border, #1e293b)',
                          background: snapshot.isDragging ? 'var(--color-primary-light)' : 'var(--color-surface-hover, #141C2A)',
                          boxShadow: snapshot.isDragging ? 'var(--shadow-md)' : 'none',
                          transition: 'all 0.15s ease',
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ marginRight: '12px', color: snapshot.isDragging ? 'var(--color-primary)' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                        </div>
                        <span style={{ fontWeight: 600, color: snapshot.isDragging ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {index + 1}. {TIE_BREAKER_OPTIONS[key] || key}
                        </span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Cấu hình Sự kiện tùy chỉnh */}
      <div style={{ background: 'var(--color-surface, #141C2A)', borderRadius: '16px', border: '1px solid var(--color-border, #1e293b)', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', maxWidth: '56rem', marginTop: '24px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <SparklesIcon /> Sự kiện tùy chỉnh (Custom Events)
          </h4>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Định nghĩa các sự kiện đặc thù cho giải đấu (VD: Siêu chốt BĐS, Uống bia...). Bấm vào thẻ để cấu hình chi tiết.</p>
        
        {/* Grid of cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {customEventsFields.map((field, index) => {
            const eventData = watchedEvents?.[index] || field;
            const currentColor = eventData.color || '#3b82f6';
            const currentIcon = eventData.icon || '⚽';
            
            return (
              <div 
                key={field.id}
                onClick={() => startEditing(index)}
                onMouseEnter={() => setHoveredCardIdx(index)}
                onMouseLeave={() => setHoveredCardIdx(null)}
                style={{
                  background: 'var(--color-surface-hover, #141C2A)',
                  borderRadius: '12px',
                  border: hoveredCardIdx === index ? '1px solid var(--color-primary)' : '1px solid var(--color-border, #1e293b)',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: hoveredCardIdx === index ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)' : '0 1px 3px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}
              >
                {/* Left Side: Colored Circle + Icon */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: `${currentColor}15`, // 15 is 10% opacity in hex
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0
                }}>
                  {currentIcon}
                </div>
                
                {/* Middle: Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text-heading)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={eventData.name}>
                      {eventData.name || 'Sự kiện chưa đặt tên'}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: 'var(--color-surface, #0E1421)',
                      color: 'var(--color-text-secondary, #A0B4C8)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      border: '1px solid var(--color-border-light)'
                    }}>
                      {eventData.code || 'CHƯA_CÓ_MÃ'}
                    </span>
                  </div>
                  
                  {/* Rules Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👤 Gán: {
                        eventData.target_scope === 'none' ? 'Không gán cầu thủ' :
                        eventData.target_scope === '1_player' ? '1 Cầu thủ' :
                        eventData.target_scope === '2_players' ? `2 Cầu thủ (${eventData.role_1 || 'Vai trò 1'} ↔ ${eventData.role_2 || 'Vai trò 2'})` :
                        'Toàn đội'
                      }
                    </span>
                    {eventData.score_impact?.enabled && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 500 }}>
                        ⚽ Tỷ số: +{eventData.score_impact.value} bàn ({eventData.score_impact.side === 'own' ? 'Đội thực hiện' : 'Đội đối phương'})
                      </span>
                    )}
                    {eventData.league_impact?.enabled && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 500 }}>
                        🏆 BXH: {eventData.league_impact.action === 'add' ? 'Cộng' : 'Trừ'} {eventData.league_impact.value} điểm
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Right: Delete Button */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => removeCustomEvent(index)}
                    onMouseEnter={() => setHoveredDeleteIdx(index)}
                    onMouseLeave={() => setHoveredDeleteIdx(null)}
                    style={{
                      color: hoveredDeleteIdx === index ? '#be123c' : '#f43f5e',
                      backgroundColor: hoveredDeleteIdx === index ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      transition: 'all 0.2s'
                    }}
                    title="Xóa sự kiện"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {customEventsFields.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13.5px', fontStyle: 'italic', border: '2px dashed var(--color-border, rgba(0, 212, 184, 0.15))', borderRadius: '12px', backgroundColor: 'var(--color-surface-hover, #141C2A)', marginTop: '16px' }}>
            Chưa có sự kiện tùy chỉnh nào. Bấm "+ Thêm sự kiện tùy chỉnh mới" để tạo mới.
          </div>
        )}

        {/* Append button */}
        <button
          type="button"
          onClick={() => {
            appendCustomEvent({ 
              code: '', name: '', icon: '⚽', color: '#3b82f6', 
              target_scope: '1_player', role_1: 'Người thực hiện', role_2: 'Người liên quan',
              score_impact: { enabled: false, value: 1, side: 'own' },
              league_impact: { enabled: false, action: 'add', value: 1 }
            });
            const newIndex = customEventsFields.length;
            setEventSnapshot(null);
            setEditingEventIdx(newIndex);
          }}
          onMouseEnter={() => setIsAddHovered(true)}
          onMouseLeave={() => setIsAddHovered(false)}
          style={{
            width: '100%',
            padding: '12px 0',
            border: '2px dashed var(--color-border, rgba(0, 212, 184, 0.15))',
            borderColor: isAddHovered ? 'var(--color-primary)' : 'var(--color-border)',
            color: isAddHovered ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            transition: 'all 0.2s ease',
            marginTop: '16px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Thêm sự kiện tùy chỉnh mới
        </button>
      </div>

      {/* Editing Modal */}
      {editingEventIdx !== null && (() => {
        const currentEvent = watchedEvents?.[editingEventIdx];
        if (!currentEvent) return null;
        const rowColor = currentEvent.color || '#3b82f6';
        const rowIcon = currentEvent.icon || '⚽';
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              background: 'var(--color-surface, #0E1421)',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--color-border, rgba(0, 212, 184, 0.2))',
              padding: '24px',
              boxSizing: 'border-box',
              gap: '20px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                  ⚙️ Cấu hình sự kiện tùy chỉnh
                </h3>
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ×
                </button>
              </div>

              {/* Form Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Event Name & Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Tên sự kiện</label>
                    <input
                      type="text"
                      {...register(`custom_events.${editingEventIdx}.name` as const)}
                      style={{ 
                        width: '100%', 
                        borderRadius: '8px', 
                        border: errors.custom_events?.[editingEventIdx]?.name ? '1px solid var(--color-danger)' : '1px solid var(--color-border)', 
                        background: 'var(--color-surface-hover, #141C2A)',
                        color: 'var(--color-text, #C8D8E8)',
                        padding: '8px 12px', 
                        fontSize: '14px', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Ví dụ: Siêu Chốt BĐS"
                    />
                    {errors.custom_events?.[editingEventIdx]?.name && (
                      <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                        {errors.custom_events[editingEventIdx]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Mã sự kiện (Unique Code)</label>
                    <input
                      type="text"
                      {...register(`custom_events.${editingEventIdx}.code` as const)}
                      style={{ 
                        width: '100%', 
                        borderRadius: '8px', 
                        border: errors.custom_events?.[editingEventIdx]?.code ? '1px solid var(--color-danger)' : '1px solid var(--color-border)', 
                        background: 'var(--color-surface-hover, #141C2A)',
                        color: 'var(--color-text, #C8D8E8)',
                        padding: '8px 12px', 
                        fontSize: '14px', 
                        outline: 'none',
                        textTransform: 'uppercase',
                        boxSizing: 'border-box'
                      }}
                      placeholder="SIEU_CHOT"
                      onChange={(e) => {
                        setValue(`custom_events.${editingEventIdx}.code`, e.target.value.toUpperCase());
                      }}
                    />
                    {errors.custom_events?.[editingEventIdx]?.code && (
                      <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                        {errors.custom_events[editingEventIdx]?.code?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Icon & Color Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Chọn Icon Emoji</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', background: 'var(--color-surface-hover, #141C2A)' }}>
                      {POPULAR_ICONS.map((emoji) => (
                        <div
                          key={emoji}
                          onClick={() => setValue(`custom_events.${editingEventIdx}.icon`, emoji)}
                          style={{
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            backgroundColor: rowIcon === emoji ? 'var(--color-primary-light)' : 'transparent',
                            border: rowIcon === emoji ? '1px solid var(--color-primary)' : '1px solid transparent',
                            transition: 'all 0.1s'
                          }}
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Chọn màu chủ đạo</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', background: 'var(--color-surface-hover, #141C2A)', height: '100%', boxSizing: 'border-box' }}>
                      {TAILWIND_COLORS.map((colorObj) => (
                        <div
                          key={colorObj.hex}
                          onClick={() => setValue(`custom_events.${editingEventIdx}.color`, colorObj.hex)}
                          title={colorObj.name}
                          style={{
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: colorObj.hex,
                            cursor: 'pointer',
                            border: rowColor === colorObj.hex ? '2px solid #fff' : '2px solid transparent',
                            boxShadow: rowColor === colorObj.hex ? '0 0 0 2px var(--color-primary)' : 'none',
                            transition: 'all 0.1s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Target Scope */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Đối tượng áp dụng</label>
                  <select
                    {...register(`custom_events.${editingEventIdx}.target_scope` as const)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                  >
                    <option value="none">Không gán cầu thủ (Sự kiện chung)</option>
                    <option value="1_player">1 Cầu thủ</option>
                    <option value="2_players">2 Cầu thủ (Cầu thủ 1 tương tác với Cầu thủ 2)</option>
                    <option value="team">Toàn đội</option>
                  </select>

                  {currentEvent.target_scope === '2_players' && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Vai trò cầu thủ 1</label>
                        <input
                          type="text"
                          {...register(`custom_events.${editingEventIdx}.role_1` as const)}
                          placeholder="VD: Người chốt"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Vai trò cầu thủ 2</label>
                        <input
                          type="text"
                          {...register(`custom_events.${editingEventIdx}.role_2` as const)}
                          placeholder="VD: Người giới thiệu"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />

                {/* Score Impact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentEvent.score_impact?.enabled || false}
                      onChange={(e) => setValue(`custom_events.${editingEventIdx}.score_impact.enabled`, e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Cộng bàn thắng vào tỷ số trận đấu
                  </label>
                  
                  {currentEvent.score_impact?.enabled && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '24px', animation: 'fadeIn 0.2s' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Cộng</span>
                      <input
                        type="number"
                        {...register(`custom_events.${editingEventIdx}.score_impact.value` as const, { valueAsNumber: true })}
                        style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>bàn thắng cho</span>
                      <select
                        {...register(`custom_events.${editingEventIdx}.score_impact.side` as const)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                      >
                        <option value="own">Đội thực hiện</option>
                        <option value="opponent">Đội đối phương (Phản lưới)</option>
                      </select>
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />

                {/* League Impact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentEvent.league_impact?.enabled || false}
                      onChange={(e) => setValue(`custom_events.${editingEventIdx}.league_impact.enabled`, e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Thưởng/Phạt điểm trực tiếp trên BXH giải đấu
                  </label>
                  
                  {currentEvent.league_impact?.enabled && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '24px', animation: 'fadeIn 0.2s' }}>
                      <select
                        {...register(`custom_events.${editingEventIdx}.league_impact.action` as const)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                      >
                        <option value="add">Cộng (+)</option>
                        <option value="subtract">Trừ (-)</option>
                      </select>
                      <input
                        type="number"
                        {...register(`custom_events.${editingEventIdx}.league_impact.value` as const, { valueAsNumber: true })}
                        style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-hover, #141C2A)', color: 'var(--color-text, #C8D8E8)', outline: 'none' }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>điểm trên bảng xếp hạng</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={cancelEditing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-hover, #141C2A)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmEditing}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#080C10',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {Object.keys(errors).length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '13.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Có lỗi nhập liệu cấu hình hoặc sự kiện tùy chỉnh chưa hợp lệ (ví dụ: thiếu Tên hoặc Mã sự kiện). Vui lòng kiểm tra lại.
        </div>
      )}
    </form>
  );
}
