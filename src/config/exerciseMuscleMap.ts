import { MuscleGroup, MovementType } from '../types/fitness';

export interface ExerciseMeta {
  muscleGroup: MuscleGroup;
  secondaryMuscleGroup?: MuscleGroup;
  movementType: MovementType;
}

export const EXERCISE_METADATA: Record<string, ExerciseMeta> = {
  // Chest (Push)
  "Bench Press (Barbell)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Bench Press (Dumbbell)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Bench Press (Smith Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Chest Press (Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Incline Bench Press (Barbell)": { muscleGroup: "Chest", secondaryMuscleGroup: "Shoulders", movementType: "Push" },
  "Incline Bench Press (Dumbbell)": { muscleGroup: "Chest", secondaryMuscleGroup: "Shoulders", movementType: "Push" },
  "Incline Bench Press (Smith Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Shoulders", movementType: "Push" },
  "Incline Chest Press (Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Shoulders", movementType: "Push" },
  "Decline Bench Press (Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Iso-Lateral Chest Press (Machine)": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Chest Fly (Dumbbell)": { muscleGroup: "Chest", movementType: "Push" },
  "Chest Fly (Machine)": { muscleGroup: "Chest", movementType: "Push" },
  "Butterfly (Pec Deck)": { muscleGroup: "Chest", movementType: "Push" },
  "Cable Fly Crossovers": { muscleGroup: "Chest", movementType: "Push" },
  "Low Cable Fly Crossovers": { muscleGroup: "Chest", movementType: "Push" },
  "Chest Dip": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Decline Push Up": { muscleGroup: "Chest", secondaryMuscleGroup: "Triceps", movementType: "Push" },

  // Back (Pull)
  "Deadlift (Barbell)": { muscleGroup: "Back", secondaryMuscleGroup: "Hamstrings", movementType: "Pull" },
  "Deadlift (Smith Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Hamstrings", movementType: "Pull" },
  "Kettlebell Deadlift": { muscleGroup: "Back", secondaryMuscleGroup: "Hamstrings", movementType: "Pull" },
  "Rack Pull": { muscleGroup: "Back", movementType: "Pull" },
  "Pull Up": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Chin Up": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Lat Pulldown (Cable)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Lat Pulldown (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Iso-Lateral Front Lat Pulldown": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Bent Over Row (Barbell)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Bent Over Row (Dumbbell)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Dumbbell Row": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "T Bar Row": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Seated Row (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Seated Cable Row - Bar Grip": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Seated Cable Row - V Grip (Cable)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Iso-Lateral Row (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Iso-Lateral High Row (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Iso-Lateral D.Y. Row": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Chest Supported Incline Row (Dumbbell)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "High pull": { muscleGroup: "Back", secondaryMuscleGroup: "Shoulders", movementType: "Pull" },
  "Pullover (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Chest", movementType: "Pull" },
  "Vertical Traction (Machine)": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Back Extension (Weighted Hyperextension)": { muscleGroup: "Back", secondaryMuscleGroup: "Glutes", movementType: "Pull" },
  "Shrug (Machine)": { muscleGroup: "Back", movementType: "Pull" },
  "Ring Row": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Drop down trainer": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },
  "Rowing Backrest Trainer": { muscleGroup: "Back", secondaryMuscleGroup: "Biceps", movementType: "Pull" },

  // Shoulders (Push / Arms)
  "Overhead Press (Barbell)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Overhead Press (Dumbbell)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Overhead Press (Smith Machine)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Shoulder Press (Dumbbell)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Shoulder Press (Machine Plates)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Seated Shoulder Press (Machine)": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Triceps", movementType: "Push" },
  "Lateral Raise (Dumbbell)": { muscleGroup: "Shoulders", movementType: "Push" },
  "Lateral Raise (Cable)": { muscleGroup: "Shoulders", movementType: "Push" },
  "Lateral Raise (Machine)": { muscleGroup: "Shoulders", movementType: "Push" },
  "Front Raise (Dumbbell)": { muscleGroup: "Shoulders", movementType: "Push" },
  "Rear Delt Reverse Fly (Machine)": { muscleGroup: "Shoulders", movementType: "Pull" },
  "Face Pull": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Back", movementType: "Pull" },
  "Plate halo": { muscleGroup: "Shoulders", secondaryMuscleGroup: "Core", movementType: "Push" },

  // Legs - Quads, Hamstrings, Glutes, Calves
  "Squat (Barbell)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Squat (Dumbbell)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Squat (Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Squat (Smith Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Hack Squat (Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Leg Press (Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Leg Press Horizontal (Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Seated Legs press": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Leg Extension (Machine)": { muscleGroup: "Quads", movementType: "Legs" },
  "Bulgarian Split Squat": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Bulgarian Split Squat (Dumbbell)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Bulgarian Split Squat (Smith Machine)": { muscleGroup: "Quads", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  
  "Romanian Deadlift (Dumbbell)": { muscleGroup: "Hamstrings", secondaryMuscleGroup: "Glutes", movementType: "Legs" },
  "Lying Leg Curl (Machine)": { muscleGroup: "Hamstrings", movementType: "Legs" },
  "Seated Leg Curl (Machine)": { muscleGroup: "Hamstrings", movementType: "Legs" },
  "Hip Thrust (Barbell)": { muscleGroup: "Glutes", secondaryMuscleGroup: "Hamstrings", movementType: "Legs" },
  "Hip Thrust (Machine)": { muscleGroup: "Glutes", secondaryMuscleGroup: "Hamstrings", movementType: "Legs" },
  "Hip Thrust (Smith Machine)": { muscleGroup: "Glutes", secondaryMuscleGroup: "Hamstrings", movementType: "Legs" },
  "Hip Abduction (Machine)": { muscleGroup: "Glutes", movementType: "Legs" },
  "Hip Adduction (Machine)": { muscleGroup: "Glutes", movementType: "Legs" },
  "Rear Kick (Machine)": { muscleGroup: "Glutes", movementType: "Legs" },
  
  "Calf Press (Machine)": { muscleGroup: "Calves", movementType: "Legs" },
  "Standing Calf Raise (Machine)": { muscleGroup: "Calves", movementType: "Legs" },
  "Standing Calf Raise (Smith)": { muscleGroup: "Calves", movementType: "Legs" },

  // Biceps (Arms / Pull)
  "Bicep Curl (Barbell)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Bicep Curl (Cable)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Bicep Curl (Dumbbell)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Bicep Curl (Machine)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Hammer Curl (Dumbbell)": { muscleGroup: "Biceps", secondaryMuscleGroup: "Forearms", movementType: "Arms" },
  "Hammer Curl (Cable)": { muscleGroup: "Biceps", secondaryMuscleGroup: "Forearms", movementType: "Arms" },
  "Preacher Curl (Barbell)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Preacher Curl (Dumbbell)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Preacher curl EZ bar": { muscleGroup: "Biceps", movementType: "Arms" },
  "Seated Incline Curl (Dumbbell)": { muscleGroup: "Biceps", movementType: "Arms" },
  "Concentration Curl": { muscleGroup: "Biceps", movementType: "Arms" },
  "EZ Bar Biceps Curl": { muscleGroup: "Biceps", movementType: "Arms" },

  // Triceps (Arms / Push)
  "Triceps Extension (Cable)": { muscleGroup: "Triceps", movementType: "Arms" },
  "Triceps Extension (Dumbbell)": { muscleGroup: "Triceps", movementType: "Arms" },
  "Triceps Rope Pushdown": { muscleGroup: "Triceps", movementType: "Arms" },
  "Triceps Kickback (Dumbbell)": { muscleGroup: "Triceps", movementType: "Arms" },
  "Triceps Overhead Extension (Cable)": { muscleGroup: "Triceps", movementType: "Arms" },
  "Skullcrusher (Dumbbell)": { muscleGroup: "Triceps", movementType: "Arms" },
  "Single Arm Tricep Extension (Dumbbell)": { muscleGroup: "Triceps", movementType: "Arms" },

  // Forearms
  "Seated Palms Up Wrist Curl": { muscleGroup: "Forearms", movementType: "Arms" },
  "Reverse Wrist Curl": { muscleGroup: "Forearms", movementType: "Arms" },
  "Farmers Walk": { muscleGroup: "Forearms", secondaryMuscleGroup: "Core", movementType: "Pull" },

  // Core (Abs)
  "Crunch (Machine)": { muscleGroup: "Core", movementType: "Core" },
  "Decline Crunch": { muscleGroup: "Core", movementType: "Core" },
  "Decline Crunch (Weighted)": { muscleGroup: "Core", movementType: "Core" },
  "Ab Wheel": { muscleGroup: "Core", movementType: "Core" },
  "Leg Raise Parallel Bars": { muscleGroup: "Core", movementType: "Core" },
  "Russian Twist (Bodyweight)": { muscleGroup: "Core", movementType: "Core" },
  "Russian Twist (Weighted)": { muscleGroup: "Core", movementType: "Core" },
  "Cable Twist (Up to down)": { muscleGroup: "Core", movementType: "Core" },
  "Cable Twist (Down to up)": { muscleGroup: "Core", movementType: "Core" },
  "V Up": { muscleGroup: "Core", movementType: "Core" },
  "Side Bend": { muscleGroup: "Core", movementType: "Core" },
  "Torso Rotation": { muscleGroup: "Core", movementType: "Core" },
  "Elbow to Knee": { muscleGroup: "Core", movementType: "Core" },

  // Cardio
  "Running": { muscleGroup: "Cardio", movementType: "Cardio" },
  "Treadmill": { muscleGroup: "Cardio", movementType: "Cardio" },
  "Swimming": { muscleGroup: "Cardio", movementType: "Cardio" },
  "Air Bike": { muscleGroup: "Cardio", movementType: "Cardio" },
  "Elliptical Trainer": { muscleGroup: "Cardio", movementType: "Cardio" },
  "Box Jump": { muscleGroup: "Cardio", secondaryMuscleGroup: "Quads", movementType: "Legs" },
};

export function getExerciseMetadata(exerciseName: string): ExerciseMeta {
  if (EXERCISE_METADATA[exerciseName]) {
    return EXERCISE_METADATA[exerciseName];
  }

  // Fallback heuristics based on keyword matching
  const lower = exerciseName.toLowerCase();
  if (lower.includes('curl') || lower.includes('bicep')) {
    return { muscleGroup: 'Biceps', movementType: 'Arms' };
  }
  if (lower.includes('tricep') || lower.includes('pushdown') || lower.includes('skullcrusher')) {
    return { muscleGroup: 'Triceps', movementType: 'Arms' };
  }
  if (lower.includes('press') && (lower.includes('bench') || lower.includes('chest') || lower.includes('fly') || lower.includes('pec'))) {
    return { muscleGroup: 'Chest', movementType: 'Push' };
  }
  if (lower.includes('shoulder') || lower.includes('overhead') || lower.includes('lateral raise') || lower.includes('delt')) {
    return { muscleGroup: 'Shoulders', movementType: 'Push' };
  }
  if (lower.includes('row') || lower.includes('pulldown') || lower.includes('pull up') || lower.includes('chin up') || lower.includes('deadlift') || lower.includes('back')) {
    return { muscleGroup: 'Back', movementType: 'Pull' };
  }
  if (lower.includes('squat') || lower.includes('leg press') || lower.includes('lunge') || lower.includes('leg extension')) {
    return { muscleGroup: 'Quads', movementType: 'Legs' };
  }
  if (lower.includes('leg curl') || lower.includes('rdl') || lower.includes('romanian')) {
    return { muscleGroup: 'Hamstrings', movementType: 'Legs' };
  }
  if (lower.includes('hip thrust') || lower.includes('glute') || lower.includes('kick')) {
    return { muscleGroup: 'Glutes', movementType: 'Legs' };
  }
  if (lower.includes('calf') || lower.includes('calves')) {
    return { muscleGroup: 'Calves', movementType: 'Legs' };
  }
  if (lower.includes('crunch') || lower.includes('ab ') || lower.includes('twist') || lower.includes('plank')) {
    return { muscleGroup: 'Core', movementType: 'Core' };
  }
  if (lower.includes('run') || lower.includes('bike') || lower.includes('treadmill') || lower.includes('cardio') || lower.includes('swim')) {
    return { muscleGroup: 'Cardio', movementType: 'Cardio' };
  }

  return { muscleGroup: 'Other', movementType: 'Other' as MovementType };
}

