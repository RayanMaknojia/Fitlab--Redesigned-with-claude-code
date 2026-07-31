// Preset exercise library — a static list of common personal-training
// movements, grouped by muscle group. Exercise templates are stored
// per-client on the backend (name only), so these presets live purely on
// the frontend: picking one creates the client's template on first use via
// the normal POST /clients/:id/exercise-templates route. Nothing is
// pre-written to the database, and the trainer can still type a custom name.
// Owned by: Jiachen Sun (trainer-client management).

export interface PresetGroup {
  category: string
  exercises: string[]
}

export const PRESET_EXERCISES: PresetGroup[] = [
  {
    category: "Chest",
    exercises: [
      "Barbell Bench Press",
      "Incline Dumbbell Press",
      "Dumbbell Fly",
      "Cable Chest Fly",
      "Push-Up",
      "Chest Dip",
    ],
  },
  {
    category: "Back",
    exercises: [
      "Deadlift",
      "Pull-Up",
      "Lat Pulldown",
      "Barbell Row",
      "Seated Cable Row",
      "Face Pull",
    ],
  },
  {
    category: "Legs",
    exercises: [
      "Back Squat",
      "Front Squat",
      "Romanian Deadlift",
      "Leg Press",
      "Walking Lunge",
      "Bulgarian Split Squat",
      "Leg Extension",
      "Lying Leg Curl",
      "Standing Calf Raise",
      "Hip Thrust",
    ],
  },
  {
    category: "Shoulders",
    exercises: [
      "Overhead Press",
      "Seated Dumbbell Press",
      "Lateral Raise",
      "Rear Delt Fly",
      "Upright Row",
      "Arnold Press",
    ],
  },
  {
    category: "Arms",
    exercises: [
      "Barbell Curl",
      "Dumbbell Hammer Curl",
      "Preacher Curl",
      "Tricep Rope Pushdown",
      "Skull Crusher",
      "Close-Grip Bench Press",
    ],
  },
  {
    category: "Core",
    exercises: [
      "Plank",
      "Hanging Leg Raise",
      "Cable Crunch",
      "Russian Twist",
      "Ab Wheel Rollout",
      "Dead Bug",
    ],
  },
  {
    category: "Conditioning",
    exercises: [
      "Treadmill Run",
      "Rowing Machine",
      "Stationary Bike",
      "Kettlebell Swing",
      "Battle Ropes",
      "Farmer's Carry",
      "Burpee",
      "Box Jump",
    ],
  },
]

/** Flat list of every preset name, in category order. */
export const PRESET_EXERCISE_NAMES: string[] = PRESET_EXERCISES.flatMap(
  (g) => g.exercises,
)

const normalize = (name: string) => name.trim().toLowerCase()

/**
 * Presets the client doesn't already have in their library, so the picker
 * never shows the same movement twice. Comparison is case/space-insensitive.
 */
export function presetGroupsNotIn(
  existing: { name: string }[],
): PresetGroup[] {
  const taken = new Set(existing.map((t) => normalize(t.name)))
  return PRESET_EXERCISES.map((g) => ({
    category: g.category,
    exercises: g.exercises.filter((name) => !taken.has(normalize(name))),
  })).filter((g) => g.exercises.length > 0)
}

/** Finds an existing template matching a name, ignoring case/whitespace. */
export function findTemplateByName<T extends { name: string }>(
  templates: T[],
  name: string,
): T | undefined {
  return templates.find((t) => normalize(t.name) === normalize(name))
}
