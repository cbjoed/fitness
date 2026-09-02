const MUSCLE_IMAGES = {
  Chest: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
  Back: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  Shoulders: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
  Arms: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
  Legs: 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?auto=format&fit=crop&w=900&q=80',
  Core: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
  Cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=80',
}

const SPECIFIC_GUIDES = {
  'Bench Press': ['Chest, triceps, front delts', 'Pin your shoulder blades back, lower the bar to mid-chest, then press up while keeping your wrists stacked over your elbows.'],
  Squat: ['Quads, glutes, hamstrings', 'Brace your core, sit down between your hips, keep your knees tracking over your toes, and drive through the whole foot.'],
  Deadlift: ['Glutes, hamstrings, back', 'Keep the bar close, brace before lifting, push the floor away, and finish tall without leaning backward.'],
  'Overhead Press': ['Shoulders, triceps, upper chest', 'Squeeze your glutes, keep ribs down, press in a straight path, and finish with your biceps beside your ears.'],
  'Lat Pulldown': ['Lats, biceps, upper back', 'Pull your elbows toward your ribs, keep your chest lifted, and control the bar all the way back up.'],
  'Bicep Curl': ['Biceps, forearms', 'Keep elbows near your sides, curl without swinging, squeeze at the top, and lower under control.'],
  'Tricep Pushdown': ['Triceps', 'Keep elbows pinned, push the handle down until your arms are straight, and return slowly without leaning over the stack.'],
  Plank: ['Core, shoulders, glutes', 'Make a straight line from shoulders to heels, brace as if preparing for a punch, and breathe without dropping your hips.'],
}

function muscleFamily(primaryMuscle = '') {
  if (/chest/i.test(primaryMuscle)) return 'Chest'
  if (/back|lat/i.test(primaryMuscle)) return 'Back'
  if (/shoulder|delt/i.test(primaryMuscle)) return 'Shoulders'
  if (/arm|bicep|tricep/i.test(primaryMuscle)) return 'Arms'
  if (/quad|hamstring|glute|calf|leg/i.test(primaryMuscle)) return 'Legs'
  if (/core|ab/i.test(primaryMuscle)) return 'Core'
  return 'Cardio'
}

export function getExerciseGuide(exercise) {
  if (!exercise) return null
  const specific = SPECIFIC_GUIDES[exercise.name]
  const targetMuscles = exercise.target_muscles?.length ? exercise.target_muscles.join(', ') : specific?.[0] ?? exercise.primary_muscle ?? 'Full body'
  const instructions = exercise.instructions?.length ? exercise.instructions[0] : specific?.[1] ?? `Move with control, keep your ${exercise.primary_muscle || 'target'} engaged, and use a range of motion you can own.`

  return {
    imageUrl: exercise.image_url || MUSCLE_IMAGES[muscleFamily(exercise.primary_muscle)],
    targetMuscles,
    instructions,
    sourceUrl: exercise.source_url || 'https://wger.de/en/software/about',
  }
}
