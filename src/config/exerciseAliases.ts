// Normalization map to fix typos and consolidate identical exercise names
export const EXERCISE_ALIASES: Record<string, string> = {
  "Bulgarian splitn squat (Smith)": "Bulgarian split squat (Smith)",
  "Bulgarian split squat (Smith)": "Bulgarian Split Squat (Smith Machine)",
  "Rear kick Stand (Machine)": "Rear Kick (Machine)",
  "Iso lateral D.Y. Row": "Iso-Lateral D.Y. Row",
  "Iso-lateral Front Lat Pulldown": "Iso-Lateral Front Lat Pulldown",
  "reverse wrist curl": "Reverse Wrist Curl",
  "ring row": "Ring Row",
  "Tricep overhead extension": "Triceps Overhead Extension (Cable)",
  "Bench press machine": "Chest Press (Machine)",
  "Chest Dip (Assisted)": "Chest Dip",
  "Pull Up (Assisted)": "Pull Up",
};

export function normalizeExerciseName(rawName: string): string {
  if (!rawName) return "Unknown";
  const trimmed = rawName.trim();
  return EXERCISE_ALIASES[trimmed] || trimmed;
}

