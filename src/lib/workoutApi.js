// Supabase query helpers for the Strong-style workout tracker feature
// (routines, active sessions, exercise library, previous-performance lookups).
import { supabase } from '../supabaseClient'

export async function fetchExercises({ search = '', muscle = '' } = {}) {
  let query = supabase.from('exercises').select('*').order('name', { ascending: true })

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }
  if (muscle.trim()) {
    query = query.eq('primary_muscle', muscle.trim())
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchPreviousPerformance(exerciseId) {
  if (!exerciseId) return null

  // Find the most recent exercise_log for this exercise (across the user's own
  // sessions, enforced by RLS), then read its first completed set.
  const { data: logs, error: logsError } = await supabase
    .from('exercise_logs')
    .select('id, session:workout_sessions!inner(start_time)')
    .eq('exercise_id', exerciseId)
    .order('start_time', { foreignTable: 'session', ascending: false })
    .limit(1)
  if (logsError) throw logsError

  const [lastLog] = logs ?? []
  if (!lastLog) return null

  const { data: sets, error: setsError } = await supabase
    .from('set_logs')
    .select('weight_kg, reps, set_number')
    .eq('exercise_log_id', lastLog.id)
    .eq('is_completed', true)
    .order('set_number', { ascending: true })
    .limit(1)
  if (setsError) throw setsError

  const [row] = sets ?? []
  if (!row) return null
  return { weightKg: row.weight_kg, reps: row.reps }
}

export async function fetchRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_exercises(id, sort_order, exercise:exercises(*))')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((routine) => ({
    ...routine,
    routine_exercises: (routine.routine_exercises ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }))
}

export async function createRoutine({ title, notes = '', exerciseIds = [] }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .insert({ title, notes, user_id: user.id })
    .select()
    .single()
  if (routineError) throw routineError

  if (exerciseIds.length) {
    const rows = exerciseIds.map((exerciseId, index) => ({
      routine_id: routine.id,
      exercise_id: exerciseId,
      sort_order: index,
    }))
    const { error: linkError } = await supabase.from('routine_exercises').insert(rows)
    if (linkError) throw linkError
  }

  return routine
}

export async function createWorkoutSession({ title = 'Workout' } = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ title, user_id: user.id, start_time: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function saveFinishedWorkout(sessionId, exercises) {
  const { error: sessionError } = await supabase
    .from('workout_sessions')
    .update({ end_time: new Date().toISOString() })
    .eq('id', sessionId)
  if (sessionError) throw sessionError

  for (const [exerciseIndex, exercise] of exercises.entries()) {
    const { data: exerciseLog, error: exerciseLogError } = await supabase
      .from('exercise_logs')
      .insert({ session_id: sessionId, exercise_id: exercise.exerciseId, sort_order: exerciseIndex })
      .select()
      .single()
    if (exerciseLogError) throw exerciseLogError

    if (exercise.sets.length) {
      const setRows = exercise.sets.map((set, index) => ({
        exercise_log_id: exerciseLog.id,
        set_number: index + 1,
        set_type: set.setType,
        weight_kg: set.weightKg === '' ? null : set.weightKg,
        reps: set.reps === '' ? null : set.reps,
        rpe: set.rpe === '' || set.rpe == null ? null : set.rpe,
        is_completed: set.isCompleted,
      }))
      const { error: setError } = await supabase.from('set_logs').insert(setRows)
      if (setError) throw setError
    }
  }
}

export async function cancelWorkoutSession(sessionId) {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
  if (error) throw error
}
