import { MuscleGroup, MovementType } from '../types/fitness';

export interface MuscleIconMeta {
  emoji: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const MUSCLE_ICON_MAP: Record<MuscleGroup, MuscleIconMeta> = {
  Biceps: {
    emoji: '💪',
    label: 'Biceps',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
  },
  Triceps: {
    emoji: '🦾',
    label: 'Triceps',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/20',
  },
  Chest: {
    emoji: '🍼',
    label: 'Chest',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/20',
  },
  Back: {
    emoji: '🦅',
    label: 'Back',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/20',
  },
  Shoulders: {
    emoji: '🪖',
    label: 'Shoulders',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/20',
  },
  Quads: {
    emoji: '🦵',
    label: 'Quads',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/20',
  },
  Hamstrings: {
    emoji: '🏃',
    label: 'Hamstrings',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/20',
  },
  Glutes: {
    emoji: '🍑',
    label: 'Glutes',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/20',
  },
  Calves: {
    emoji: '🦿',
    label: 'Calves',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/20',
  },
  Forearms: {
    emoji: '✊',
    label: 'Forearms',
    badgeBg: 'bg-lime-500/10',
    badgeText: 'text-lime-400',
    badgeBorder: 'border-lime-500/20',
  },
  Core: {
    emoji: '🧱',
    label: 'Core / Abs',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/20',
  },
  Cardio: {
    emoji: '🫀',
    label: 'Cardio',
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-400',
    badgeBorder: 'border-pink-500/20',
  },
  Other: {
    emoji: '⚡',
    label: 'Other',
    badgeBg: 'bg-zinc-500/10',
    badgeText: 'text-zinc-400',
    badgeBorder: 'border-zinc-500/20',
  },
};

export const MOVEMENT_ICON_MAP: Record<MovementType, { emoji: string; color: string }> = {
  Push: { emoji: '⚡', color: 'text-cyan-400' },
  Pull: { emoji: '🧲', color: 'text-emerald-400' },
  Legs: { emoji: '🏋️', color: 'text-amber-400' },
  Arms: { emoji: '💪', color: 'text-purple-400' },
  Core: { emoji: '🧱', color: 'text-rose-400' },
  Cardio: { emoji: '🫀', color: 'text-pink-400' },
};

export const BODY_PART_ICONS: Record<string, string> = {
  Biceps: '💪',
  Forearms: '✊',
  Thighs: '🦵',
  Calves: '🦿',
  Chest: '🍼',
  Waist: '⏳',
  Shoulders: '🪖',
  Hips: '🍑',
  Neck: '👔',
  Abdomen: '🧱',
};

