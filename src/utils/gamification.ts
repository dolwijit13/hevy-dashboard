import { WorkoutSession, WorkoutSet, PersonalRecord, BodyMeasurement } from '../types/fitness';

export interface RankInfo {
  tierName: string;
  subTier: 'I' | 'II' | 'III';
  fullName: string;
  title: string;
  badgeEmoji: string;
  badgeColor: string;
  glowColor: string;
  currentXp: number;
  tierStartXp: number;
  tierTargetXp: number;
  progressPercent: number;
  remainingXp: number;
  estWorkoutsToNextRank: number;
  estMonthsToNextRank: string;
  nextRankName: string;
  checklist: {
    label: string;
    current: number | string;
    target: number | string;
    isMet: boolean;
  }[];
}

export interface RoutineMastery {
  id: string;
  name: string;
  code: string;
  emojis: string;
  sessionCount: number;
  totalTonnage: number;
  avgTonnage: number;
  stars: number;
  nextStarThreshold: number;
  progressPercent: number;
  lastTrainedDate?: Date;
}

export interface SeasonQuest {
  seasonName: string;
  daysRemaining: number;
  volumeXp: number;
  volumeTarget: number;
  volumePercent: number;
  sessionsCount: number;
  sessionsTarget: number;
  sessionsPercent: number;
  prCount: number;
  prTarget: number;
  prPercent: number;
  overallPercent: number;
  milestones: {
    label: string;
    reward: string;
    isUnlocked: boolean;
  }[];
}

export interface AchievementItem {
  id: string;
  title: string;
  category: 'strength' | 'discipline' | 'volume' | 'recomp';
  description: string;
  emoji: string;
  isUnlocked: boolean;
  unlockedDateStr?: string;
  progress: number;
  maxProgress: number;
  unit: string;
}

// 1. Personal Tier Calibration (Calibrated to ~200k-350k kg per sub-tier = 1.5 - 2.5 months)
const SUB_TIERS: {
  tierName: string;
  subTier: 'I' | 'II' | 'III';
  minXp: number;
  maxXp: number;
  title: string;
  badgeEmoji: string;
  badgeColor: string;
  glowColor: string;
}[] = [
  { tierName: 'Bronze', subTier: 'I', minXp: 0, maxXp: 200000, title: 'The Awakened Lifter', badgeEmoji: '🥉', badgeColor: 'text-amber-600', glowColor: 'border-amber-600/30' },
  { tierName: 'Bronze', subTier: 'II', minXp: 200000, maxXp: 400000, title: 'Iron Initiate', badgeEmoji: '🥉', badgeColor: 'text-amber-600', glowColor: 'border-amber-600/30' },
  { tierName: 'Bronze', subTier: 'III', minXp: 400000, maxXp: 650000, title: 'Barbell Apprentice', badgeEmoji: '🥉', badgeColor: 'text-amber-600', glowColor: 'border-amber-600/30' },

  { tierName: 'Silver', subTier: 'I', minXp: 650000, maxXp: 950000, title: 'Forged in Steel', badgeEmoji: '🥈', badgeColor: 'text-slate-300', glowColor: 'border-slate-400/30' },
  { tierName: 'Silver', subTier: 'II', minXp: 950000, maxXp: 1300000, title: 'Steady Grit', badgeEmoji: '🥈', badgeColor: 'text-slate-300', glowColor: 'border-slate-400/30' },
  { tierName: 'Silver', subTier: 'III', minXp: 1300000, maxXp: 1700000, title: 'Iron Discipline', badgeEmoji: '🥈', badgeColor: 'text-slate-300', glowColor: 'border-slate-400/30' },

  { tierName: 'Gold', subTier: 'I', minXp: 1700000, maxXp: 2150000, title: 'Discipline Vanguard', badgeEmoji: '🥇', badgeColor: 'text-amber-400', glowColor: 'border-amber-400/30' },
  { tierName: 'Gold', subTier: 'II', minXp: 2150000, maxXp: 2650000, title: 'Plateau Smasher', badgeEmoji: '🥇', badgeColor: 'text-amber-400', glowColor: 'border-amber-400/30' },
  { tierName: 'Gold', subTier: 'III', minXp: 2650000, maxXp: 3200000, title: 'Golden Standard', badgeEmoji: '🥇', badgeColor: 'text-amber-400', glowColor: 'border-amber-400/30' },

  { tierName: 'Platinum', subTier: 'I', minXp: 3200000, maxXp: 3800000, title: 'Heavy Metal Sentinel', badgeEmoji: '💎', badgeColor: 'text-teal-300', glowColor: 'border-teal-400/30' },
  { tierName: 'Platinum', subTier: 'II', minXp: 3800000, maxXp: 4500000, title: 'Kinetic Resilient', badgeEmoji: '💎', badgeColor: 'text-teal-300', glowColor: 'border-teal-400/30' },
  { tierName: 'Platinum', subTier: 'III', minXp: 4500000, maxXp: 5250000, title: 'Apex Centurion', badgeEmoji: '💎', badgeColor: 'text-teal-300', glowColor: 'border-teal-400/30' },

  { tierName: 'Diamond', subTier: 'I', minXp: 5250000, maxXp: 5650000, title: 'The Unbroken Core', badgeEmoji: '💠', badgeColor: 'text-cyan-400', glowColor: 'border-cyan-400/30' },
  { tierName: 'Diamond', subTier: 'II', minXp: 5650000, maxXp: 6100000, title: 'Relentless Dynamo', badgeEmoji: '💠', badgeColor: 'text-cyan-400', glowColor: 'border-cyan-400/30' },
  { tierName: 'Diamond', subTier: 'III', minXp: 6100000, maxXp: 6600000, title: 'Flawless Form', badgeEmoji: '💠', badgeColor: 'text-cyan-400', glowColor: 'border-cyan-400/30' },

  { tierName: 'Master', subTier: 'I', minXp: 6600000, maxXp: 7150000, title: 'Kinetic Colossus', badgeEmoji: '👑', badgeColor: 'text-purple-400', glowColor: 'border-purple-400/30' },
  { tierName: 'Master', subTier: 'II', minXp: 7150000, maxXp: 7750000, title: 'Dominion of Iron', badgeEmoji: '👑', badgeColor: 'text-purple-400', glowColor: 'border-purple-400/30' },
  { tierName: 'Master', subTier: 'III', minXp: 7750000, maxXp: 8400000, title: 'High Warlord', badgeEmoji: '👑', badgeColor: 'text-purple-400', glowColor: 'border-purple-400/30' },

  { tierName: 'Grandmaster', subTier: 'I', minXp: 8400000, maxXp: 9100000, title: 'Realm of the Titan', badgeEmoji: '🔥', badgeColor: 'text-rose-400', glowColor: 'border-rose-400/30' },
  { tierName: 'Grandmaster', subTier: 'II', minXp: 9100000, maxXp: 9850000, title: 'Living Anvil', badgeEmoji: '🔥', badgeColor: 'text-rose-400', glowColor: 'border-rose-400/30' },
  { tierName: 'Grandmaster', subTier: 'III', minXp: 9850000, maxXp: 10650000, title: 'Mythic Paragon', badgeEmoji: '🔥', badgeColor: 'text-rose-400', glowColor: 'border-rose-400/30' },

  { tierName: 'Ascended Titan', subTier: 'III', minXp: 10650000, maxXp: 99999999, title: 'Living Iron Legend', badgeEmoji: '⚡', badgeColor: 'text-amber-300', glowColor: 'border-amber-300/40' },
];

export function computeRankInfo(sessions: WorkoutSession[], sets: WorkoutSet[], prs: PersonalRecord[]): RankInfo {
  // 1. Calculate Lifetime Volume XP (1 kg moved = 1 XP)
  let lifetimeXp = 0;
  for (const s of sets) {
    if (s.setType !== 'warmup') {
      lifetimeXp += s.volumeKg;
    }
  }

  // Find corresponding sub-tier
  let currentTier = SUB_TIERS[0];
  let nextTier = SUB_TIERS[1];

  for (let i = 0; i < SUB_TIERS.length; i++) {
    const tier = SUB_TIERS[i];
    if (lifetimeXp >= tier.minXp && (lifetimeXp < tier.maxXp || i === SUB_TIERS.length - 1)) {
      currentTier = tier;
      nextTier = SUB_TIERS[i + 1] || tier;
      break;
    }
  }

  const range = currentTier.maxXp - currentTier.minXp;
  const progressInTier = Math.max(0, lifetimeXp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((progressInTier / (range || 1)) * 100));
  const remainingXp = Math.max(0, currentTier.maxXp - lifetimeXp);

  // Estimate workouts & time to next rank based on avg session volume (~11,000 kg per session)
  const avgSessionVolume = sessions.length > 0 ? lifetimeXp / sessions.length : 10000;
  const estWorkoutsToNextRank = Math.max(1, Math.ceil(remainingXp / (avgSessionVolume || 10000)));
  const estMonths = (estWorkoutsToNextRank / 14).toFixed(1); // 14 sessions/month average

  // Promotion Exam Checklist
  // 1) Volume XP met
  // 2) Sessions in current sub-tier (~15-20 sessions)
  // 3) At least 1 PR achieved recently
  const recent30d = new Date();
  recent30d.setDate(recent30d.getDate() - 45);
  const recentPrsCount = prs.filter((p) => p.best1RMDate >= recent30d || p.maxWeightDate >= recent30d).length;

  return {
    tierName: currentTier.tierName,
    subTier: currentTier.subTier,
    fullName: `${currentTier.tierName} ${currentTier.subTier}`,
    title: currentTier.title,
    badgeEmoji: currentTier.badgeEmoji,
    badgeColor: currentTier.badgeColor,
    glowColor: currentTier.glowColor,
    currentXp: Math.round(lifetimeXp),
    tierStartXp: currentTier.minXp,
    tierTargetXp: currentTier.maxXp,
    progressPercent,
    remainingXp: Math.round(remainingXp),
    estWorkoutsToNextRank,
    estMonthsToNextRank: estMonths,
    nextRankName: `${nextTier.tierName} ${nextTier.subTier}`,
    checklist: [
      {
        label: 'Volume XP ในขั้นนี้',
        current: `${Math.round(progressInTier).toLocaleString()} kg`,
        target: `${Math.round(range).toLocaleString()} kg`,
        isMet: progressInTier >= range,
      },
      {
        label: 'เป้าหมาย Session (~1.5 เดือน)',
        current: `${Math.min(20, Math.round(progressInTier / avgSessionVolume))} ครั้ง`,
        target: '20 ครั้ง',
        isMet: progressInTier >= range * 0.8,
      },
      {
        label: 'ทำ PR ใหม่ในรอบ 45 วัน',
        current: `${recentPrsCount} ท่า`,
        target: '1 ท่า',
        isMet: recentPrsCount >= 1,
      },
    ],
  };
}

// 2. Routine Split Mastery (A, B, C, D, E and key routines)
export function computeRoutineMastery(sessions: WorkoutSession[]): RoutineMastery[] {
  const definitions = [
    {
      id: 'routine_a',
      name: 'Chest, Arms & Abs',
      code: 'Routine A',
      emojis: '🍼💪🧱',
      matcher: (title: string) => title.startsWith('A') || title.includes('ChestArmsAbs'),
    },
    {
      id: 'routine_b',
      name: 'Back & Legs / Pull',
      code: 'Routine B',
      emojis: '🦅🍗',
      matcher: (title: string) => title.startsWith('B') || title.includes('BackLegs') || title === 'Pull B',
    },
    {
      id: 'routine_c',
      name: 'Chest & Shoulders',
      code: 'Routine C',
      emojis: '🍼🪖',
      matcher: (title: string) => title.startsWith('C') || title.includes('ChestShould'),
    },
    {
      id: 'routine_d',
      name: 'Legs & Arms',
      code: 'Routine D',
      emojis: '🍗💪',
      matcher: (title: string) => title.startsWith('D') || title.includes('LegsArms'),
    },
    {
      id: 'routine_e',
      name: 'Shoulders & Back',
      code: 'Routine E',
      emojis: '🪖🦅',
      matcher: (title: string) => title.startsWith('E') || title.includes('ShouldBack'),
    },
    {
      id: 'routine_night',
      name: 'Late Night Sessions',
      code: 'Night Owl',
      emojis: '🌙⚡',
      matcher: (title: string) => title.includes('Late night') || title.includes('Evening'),
    },
  ];

  return definitions.map((def) => {
    const matchingSessions = sessions.filter((s) => def.matcher(s.title));
    const sessionCount = matchingSessions.length;
    let totalTonnage = 0;
    let lastTrainedDate: Date | undefined;

    matchingSessions.forEach((s) => {
      totalTonnage += s.totalVolumeKg;
      if (!lastTrainedDate || s.startTime > lastTrainedDate) {
        lastTrainedDate = s.startTime;
      }
    });

    const avgTonnage = sessionCount > 0 ? Math.round(totalTonnage / sessionCount) : 0;

    // Star Calculation (Roughly 1 star every 12-15 sessions = ~1-1.5 months)
    let stars = 1;
    let nextThreshold = 15;
    if (sessionCount >= 60) {
      stars = 5;
      nextThreshold = 60;
    } else if (sessionCount >= 45) {
      stars = 4;
      nextThreshold = 60;
    } else if (sessionCount >= 30) {
      stars = 3;
      nextThreshold = 45;
    } else if (sessionCount >= 15) {
      stars = 2;
      nextThreshold = 30;
    }

    const prevThreshold = stars === 1 ? 0 : stars === 2 ? 15 : stars === 3 ? 30 : 45;
    const progressPercent = Math.min(
      100,
      Math.round(((sessionCount - prevThreshold) / (nextThreshold - prevThreshold || 1)) * 100)
    );

    return {
      id: def.id,
      name: def.name,
      code: def.code,
      emojis: def.emojis,
      sessionCount,
      totalTonnage: Math.round(totalTonnage),
      avgTonnage,
      stars,
      nextStarThreshold: nextThreshold,
      progressPercent,
      lastTrainedDate,
    };
  });
}

// 3. 90-Day Seasonal Quest (Season 4: Q4 2026 / Rolling Quarterly Pass)
export function computeSeasonQuest(sessions: WorkoutSession[], sets: WorkoutSet[], prs: PersonalRecord[]): SeasonQuest {
  // Current Quarter: Q4 2026 (Oct 1 to Dec 31)
  const qStart = new Date(2026, 9, 1); // Oct 1, 2026
  const qEnd = new Date(2026, 11, 31, 23, 59, 59);
  const now = new Date();

  const daysRemaining = Math.max(0, Math.ceil((qEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const seasonSets = sets.filter((s) => s.startTime >= qStart && s.setType !== 'warmup');
  let volumeXp = 0;
  seasonSets.forEach((s) => {
    volumeXp += s.volumeKg;
  });

  const seasonSessions = sessions.filter((s) => s.startTime >= qStart);
  const seasonPrs = prs.filter((p) => p.best1RMDate >= qStart || p.maxWeightDate >= qStart);

  const volumeTarget = 450000; // ~150k kg/month for 3 months
  const sessionsTarget = 42; // ~14 sessions/month for 3 months
  const prTarget = 4;

  const volumePercent = Math.min(100, Math.round((volumeXp / volumeTarget) * 100));
  const sessionsPercent = Math.min(100, Math.round((seasonSessions.length / sessionsTarget) * 100));
  const prPercent = Math.min(100, Math.round((seasonPrs.length / prTarget) * 100));
  const overallPercent = Math.round((volumePercent + sessionsPercent + prPercent) / 3);

  return {
    seasonName: 'Season 4 (Q4 2026): The Year-End Overload',
    daysRemaining,
    volumeXp: Math.round(volumeXp),
    volumeTarget,
    volumePercent,
    sessionsCount: seasonSessions.length,
    sessionsTarget,
    sessionsPercent,
    prCount: seasonPrs.length,
    prTarget,
    prPercent,
    overallPercent,
    milestones: [
      {
        label: 'Milestone 1: 150,000 kg Volume',
        reward: '🎖️ Bronze Autumn Badge',
        isUnlocked: volumeXp >= 150000,
      },
      {
        label: 'Milestone 2: 300,000 kg + 25 Sessions',
        reward: '🥈 Silver Frost Insignia',
        isUnlocked: volumeXp >= 300000 && seasonSessions.length >= 25,
      },
      {
        label: 'Milestone 3: 450,000 kg + 4 PRs',
        reward: '🏆 Year-End Champion 2026 Trophy',
        isUnlocked: volumeXp >= 450000 && seasonPrs.length >= 4,
      },
    ],
  };
}

// 4. Achievement Showcase (Calculated from 801 workouts & 13,230 sets)
export function computeAchievements(
  sessions: WorkoutSession[],
  sets: WorkoutSet[],
  prs: PersonalRecord[],
  measurements: BodyMeasurement[]
): AchievementItem[] {
  let totalTonnage = 0;
  let failureSetsCount = 0;
  let maxWeightLifted = 0;
  let nightWorkouts = 0;

  sets.forEach((s) => {
    if (s.setType !== 'warmup') {
      totalTonnage += s.volumeKg;
    }
    if (s.setType === 'failure') {
      failureSetsCount += 1;
    }
    if (s.weightKg > maxWeightLifted) {
      maxWeightLifted = s.weightKg;
    }
  });

  sessions.forEach((sess) => {
    const hour = sess.startTime.getHours();
    if (hour >= 20 || hour <= 4) {
      nightWorkouts += 1;
    }
  });

  const totalPrCount = prs.length;
  const max1RM = prs.reduce((max, pr) => Math.max(max, pr.best1RM), 0);

  const bestBodyWeight = measurements.length > 0 ? measurements[measurements.length - 1].weightKg || 55 : 55;
  const max2xWeight = bestBodyWeight * 2;
  const hasDoubleBwLift = maxWeightLifted >= max2xWeight;

  const bestVTaper = measurements.reduce((max, m) => Math.max(max, m.vTaperShoulderWaist || 0), 0);

  return [
    // Strength
    {
      id: 'century_club',
      title: 'Century Club (100 kg+)',
      category: 'strength',
      description: 'ยกน้ำหนักในท่าใดก็ได้แตะระดับ 100 kg ขึ้นไป',
      emoji: '👑',
      isUnlocked: maxWeightLifted >= 100,
      progress: Math.min(100, maxWeightLifted),
      maxProgress: 100,
      unit: 'kg',
    },
    {
      id: 'double_bodyweight',
      title: 'Double Bodyweight (2.0x BW)',
      category: 'strength',
      description: `ยกน้ำหนักเกิน 2 เท่าของน้ำหนักตัว (${Math.round(max2xWeight)} kg)`,
      emoji: '🚀',
      isUnlocked: hasDoubleBwLift,
      progress: Math.min(max2xWeight, maxWeightLifted),
      maxProgress: Math.round(max2xWeight),
      unit: 'kg',
    },
    {
      id: 'pr_hunter',
      title: 'PR Hunter (30+ Exercises)',
      category: 'strength',
      description: 'ทำสถิติส่วนบุคคล (PR) ครอบคลุมมากกว่า 30 ท่าฝึก',
      emoji: '🎯',
      isUnlocked: totalPrCount >= 30,
      progress: Math.min(30, totalPrCount),
      maxProgress: 30,
      unit: 'ท่า',
    },
    {
      id: 'heavy_artillery',
      title: 'Heavy Artillery (1RM 150kg+)',
      category: 'strength',
      description: 'มี Estimated 1RM แตะ 150 kg ขึ้นไปในท่าใดท่าหนึ่ง',
      emoji: '⚔️',
      isUnlocked: max1RM >= 150,
      progress: Math.min(150, Math.round(max1RM)),
      maxProgress: 150,
      unit: 'kg',
    },
    {
      id: 'failure_warrior',
      title: 'Beyond Failure',
      category: 'strength',
      description: 'ดันน้ำหนักจนถึงเซ็ตหมดแรง (Failure Set) ครบ 50 ครั้ง',
      emoji: '💥',
      isUnlocked: failureSetsCount >= 50,
      progress: Math.min(50, failureSetsCount),
      maxProgress: 50,
      unit: 'เซ็ต',
    },

    // Discipline
    {
      id: 'century_sessions',
      title: '100 Sessions Club',
      category: 'discipline',
      description: 'เข้ายิมบันทึกการฝึกครบ 100 เซสชัน',
      emoji: '🛡️',
      isUnlocked: sessions.length >= 100,
      progress: Math.min(100, sessions.length),
      maxProgress: 100,
      unit: 'ครั้ง',
    },
    {
      id: 'half_thousand',
      title: 'The 500 Legacy',
      category: 'discipline',
      description: 'ยืนหยัดฝึกซ้อมครบ 500 เซสชัน',
      emoji: '🏛️',
      isUnlocked: sessions.length >= 500,
      progress: Math.min(500, sessions.length),
      maxProgress: 500,
      unit: 'ครั้ง',
    },
    {
      id: 'night_owl',
      title: 'Night Owl Lifter 🌙',
      category: 'discipline',
      description: 'ฝึกซ้อมช่วงค่ำหลัง 20:00 น. ครบ 30 ครั้ง',
      emoji: '🦉',
      isUnlocked: nightWorkouts >= 30,
      progress: Math.min(30, nightWorkouts),
      maxProgress: 30,
      unit: 'ครั้ง',
    },

    // Volume Milestones
    {
      id: 'vol_one_million',
      title: 'The Millionaire (1,000 Ton)',
      category: 'volume',
      description: 'ยกน้ำหนักสะสมทะลุ 1,000,000 kg (1,000 ตัน)',
      emoji: '🚛',
      isUnlocked: totalTonnage >= 1000000,
      progress: Math.min(1000000, Math.round(totalTonnage)),
      maxProgress: 1000000,
      unit: 'kg',
    },
    {
      id: 'vol_five_million',
      title: 'Jumbo Fleet (5,000 Ton)',
      category: 'volume',
      description: 'ยกน้ำหนักสะสมทะลุ 5,000,000 kg (เทียบเท่าฝูงบิน Boeing)',
      emoji: '✈️',
      isUnlocked: totalTonnage >= 5000000,
      progress: Math.min(5000000, Math.round(totalTonnage)),
      maxProgress: 5000000,
      unit: 'kg',
    },
    {
      id: 'vol_ten_million',
      title: 'Mount Everest (10,000 Ton)',
      category: 'volume',
      description: 'ยกน้ำหนักสะสมทะลุ 10,000,000 kg',
      emoji: '🏔️',
      isUnlocked: totalTonnage >= 10000000,
      progress: Math.min(10000000, Math.round(totalTonnage)),
      maxProgress: 10000000,
      unit: 'kg',
    },

    // Recomposition & Symmetry
    {
      id: 'golden_v_taper',
      title: 'Golden V-Taper (1.45+ Ratio)',
      category: 'recomp',
      description: 'อัตราส่วนไหล่ต่อเอว (Shoulder / Waist) แตะระดับ 1.45 ขึ้นไป',
      emoji: '📐',
      isUnlocked: bestVTaper >= 1.45,
      progress: Number(bestVTaper.toFixed(2)),
      maxProgress: 1.45,
      unit: 'ratio',
    },
  ];
}
