// Built-in exercise and workout presets for the client side.
//
// Like presetExercises.ts (trainer side), these live only in the frontend:
// nothing is pre-written to the database. When a client picks a preset, the
// matching exercise templates are created through the normal
// POST /clients/:id/exercise-templates route (skipping names they already
// have), and — inside a session — the exercises are logged with the preset's
// default sets and reps.
//
// The data model stores sets × reps only, so timed or distance work is logged
// as sets of 1 rep; `note` explains the intended effort in the preview.

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Dumbbell,
  Flame,
  Flower2,
  Footprints,
  Hand,
  Move,
  PersonStanding,
  RotateCcw,
  Shield,
  Target,
  Waves,
  Weight,
  Zap,
} from "lucide-react"

/** The 10 most common exercises, offered as one-tap picks. */
export const POPULAR_EXERCISES: string[] = [
  "Back Squat",
  "Barbell Bench Press",
  "Deadlift",
  "Overhead Press",
  "Pull-Up",
  "Barbell Row",
  "Push-Up",
  "Walking Lunge",
  "Romanian Deadlift",
  "Plank",
]

export interface PresetExercise {
  name: string
  sets: number
  reps: number
  note?: string
}

export interface WorkoutPreset {
  id: string
  name: string
  group: "split" | "activity"
  /** Suggested weekday for the 5-day split. */
  day?: string
  summary: string
  icon: LucideIcon
  exercises: PresetExercise[]
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  // --- 5-day split (Mon–Fri) ---
  {
    id: "chest",
    name: "Chest Day",
    group: "split",
    day: "Mon",
    summary: "Presses and flyes for a full chest session.",
    icon: Dumbbell,
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 8 },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10 },
      { name: "Cable Chest Fly", sets: 3, reps: 12 },
      { name: "Chest Dip", sets: 3, reps: 10 },
      { name: "Push-Up", sets: 2, reps: 15 },
    ],
  },
  {
    id: "back",
    name: "Back Day",
    group: "split",
    day: "Tue",
    summary: "Pulls and rows for width and thickness.",
    icon: Shield,
    exercises: [
      { name: "Deadlift", sets: 3, reps: 5 },
      { name: "Pull-Up", sets: 4, reps: 8 },
      { name: "Barbell Row", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 },
      { name: "Face Pull", sets: 3, reps: 15 },
    ],
  },
  {
    id: "legs",
    name: "Leg Day",
    group: "split",
    day: "Wed",
    summary: "Squat-led session for quads, hamstrings and calves.",
    icon: Footprints,
    exercises: [
      { name: "Back Squat", sets: 4, reps: 8 },
      { name: "Romanian Deadlift", sets: 3, reps: 10 },
      { name: "Leg Press", sets: 3, reps: 12 },
      { name: "Walking Lunge", sets: 3, reps: 12 },
      { name: "Standing Calf Raise", sets: 4, reps: 15 },
    ],
  },
  {
    id: "shoulders",
    name: "Shoulder Day",
    group: "split",
    day: "Thu",
    summary: "Overhead pressing plus all three delt heads.",
    icon: Weight,
    exercises: [
      { name: "Overhead Press", sets: 4, reps: 8 },
      { name: "Lateral Raise", sets: 4, reps: 12 },
      { name: "Arnold Press", sets: 3, reps: 10 },
      { name: "Rear Delt Fly", sets: 3, reps: 15 },
      { name: "Upright Row", sets: 3, reps: 12 },
    ],
  },
  {
    id: "abs",
    name: "Abs Day",
    group: "split",
    day: "Fri",
    summary: "Core strength, anti-rotation and holds.",
    icon: Target,
    exercises: [
      { name: "Plank", sets: 3, reps: 1, note: "Hold 45–60 s" },
      { name: "Hanging Leg Raise", sets: 3, reps: 12 },
      { name: "Cable Crunch", sets: 3, reps: 15 },
      { name: "Russian Twist", sets: 3, reps: 20 },
      { name: "Bicycle Crunch", sets: 3, reps: 20 },
    ],
  },

  // --- Other activities ---
  {
    id: "yoga",
    name: "Yoga Flow",
    group: "activity",
    summary: "A gentle flow for balance and mobility.",
    icon: Flower2,
    exercises: [
      { name: "Sun Salutation A", sets: 5, reps: 1, note: "One full round each" },
      { name: "Warrior II", sets: 2, reps: 1, note: "Hold 30 s per side" },
      { name: "Downward Dog", sets: 3, reps: 1, note: "Hold 5 breaths" },
      { name: "Tree Pose", sets: 2, reps: 1, note: "Hold 30 s per side" },
      { name: "Bridge Pose", sets: 3, reps: 1, note: "Hold 30 s" },
    ],
  },
  {
    id: "pilates",
    name: "Pilates Core",
    group: "activity",
    summary: "Mat Pilates focused on control and the deep core.",
    icon: Activity,
    exercises: [
      { name: "The Hundred", sets: 1, reps: 100, note: "Count arm pulses" },
      { name: "Roll-Up", sets: 2, reps: 8 },
      { name: "Single Leg Stretch", sets: 2, reps: 10 },
      { name: "Pilates Swimming", sets: 2, reps: 20 },
      { name: "Side-Lying Leg Lift", sets: 2, reps: 15, note: "Per side" },
    ],
  },
  {
    id: "hiit",
    name: "HIIT Circuit",
    group: "activity",
    summary: "Four fast rounds to get the heart rate up.",
    icon: Zap,
    exercises: [
      { name: "Burpee", sets: 4, reps: 10 },
      { name: "Jump Squat", sets: 4, reps: 15 },
      { name: "Mountain Climber", sets: 4, reps: 20 },
      { name: "High Knees", sets: 4, reps: 30 },
      { name: "Plank Jack", sets: 4, reps: 20 },
    ],
  },
  {
    id: "running",
    name: "Running Intervals",
    group: "activity",
    summary: "Warm up, run hard repeats, cool down.",
    icon: Footprints,
    exercises: [
      { name: "Warm-up Jog", sets: 1, reps: 1, note: "10 min easy" },
      { name: "400 m Interval", sets: 6, reps: 1, note: "90 s rest between" },
      { name: "Cool-down Jog", sets: 1, reps: 1, note: "10 min easy" },
    ],
  },
  {
    id: "swimming",
    name: "Swim Session",
    group: "activity",
    summary: "Freestyle sets with backstroke and kick drills.",
    icon: Waves,
    exercises: [
      { name: "Freestyle 100 m", sets: 8, reps: 1, note: "20 s rest" },
      { name: "Backstroke 50 m", sets: 4, reps: 1 },
      { name: "Kickboard 50 m", sets: 4, reps: 1 },
    ],
  },
  {
    id: "boxing",
    name: "Boxing Conditioning",
    group: "activity",
    summary: "Rounds on the bag with rope work.",
    icon: Hand,
    exercises: [
      { name: "Skipping Rope", sets: 3, reps: 100 },
      { name: "Shadow Boxing Round", sets: 3, reps: 1, note: "3 min rounds" },
      { name: "Heavy Bag Round", sets: 5, reps: 1, note: "3 min rounds" },
      { name: "Jab-Cross Combo", sets: 3, reps: 20 },
    ],
  },
  {
    id: "calisthenics",
    name: "Calisthenics",
    group: "activity",
    summary: "Bodyweight strength, no equipment beyond a bar.",
    icon: PersonStanding,
    exercises: [
      { name: "Pull-Up", sets: 4, reps: 6 },
      { name: "Push-Up", sets: 4, reps: 15 },
      { name: "Chest Dip", sets: 3, reps: 10 },
      { name: "Pistol Squat", sets: 3, reps: 5, note: "Per leg" },
      { name: "Hanging Leg Raise", sets: 3, reps: 10 },
    ],
  },
  {
    id: "kettlebell",
    name: "Kettlebell Strength",
    group: "activity",
    summary: "Full-body power with a single kettlebell.",
    icon: Flame,
    exercises: [
      { name: "Kettlebell Swing", sets: 5, reps: 15 },
      { name: "Goblet Squat", sets: 4, reps: 10 },
      { name: "Kettlebell Clean and Press", sets: 3, reps: 8, note: "Per arm" },
      { name: "Turkish Get-Up", sets: 3, reps: 2, note: "Per side" },
    ],
  },
  {
    id: "mobility",
    name: "Mobility & Stretching",
    group: "activity",
    summary: "Recovery day for hips, spine and hamstrings.",
    icon: Move,
    exercises: [
      { name: "Cat-Cow", sets: 2, reps: 10 },
      { name: "World's Greatest Stretch", sets: 2, reps: 5, note: "Per side" },
      { name: "Hip Flexor Stretch", sets: 2, reps: 1, note: "Hold 45 s per side" },
      { name: "Thoracic Rotation", sets: 2, reps: 10 },
      { name: "Hamstring Stretch", sets: 2, reps: 1, note: "Hold 45 s" },
    ],
  },
  {
    id: "acrobatics",
    name: "Acrobatics Basics",
    group: "activity",
    summary: "Ground skills for body control and balance.",
    icon: RotateCcw,
    exercises: [
      { name: "Forward Roll", sets: 3, reps: 5 },
      { name: "Cartwheel", sets: 3, reps: 5, note: "Both sides" },
      { name: "Handstand Hold", sets: 4, reps: 1, note: "Hold against a wall, 20–30 s" },
      { name: "Bridge Kickover", sets: 3, reps: 3 },
    ],
  },
]

export const normalizeName = (name: string) => name.trim().toLowerCase()
