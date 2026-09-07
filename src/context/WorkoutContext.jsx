import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createWorkoutSession, cancelWorkoutSession, saveFinishedWorkout } from '../lib/workoutApi'
import { useAuth } from './AuthContext'

const WorkoutContext = createContext(undefined)

const SET_TYPE_CYCLE = ['normal', 'warmup', 'drop', 'failure']
export const DEFAULT_REST_SECONDS = 90

let localIdCounter = 0
function nextLocalId(prefix) {
  localIdCounter += 1
  return `${prefix}-${Date.now()}-${localIdCounter}`
}

function makeSet(previous) {
  return {
    id: nextLocalId('set'),
    setType: 'normal',
    weightKg: '',
    reps: '',
    rpe: '',
    isCompleted: false,
    previous: previous ?? null,
  }
}

function makeExerciseEntry(exercise) {
  return {
    id: nextLocalId('exlog'),
    exerciseId: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primary_muscle,
    imageUrl: exercise.image_url,
    instructions: exercise.instructions,
    targetMuscles: exercise.target_muscles,
    previous: null,
    notes: '',
    restSeconds: DEFAULT_REST_SECONDS,
    sets: [makeSet(null)],
  }
}

export function WorkoutProvider({ children }) {
  const { user } = useAuth()
  const [session, setSession] = useState(null) // { id, title, startTime }
  const [exercises, setExercises] = useState([])
  const [storageReady, setStorageReady] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [restTimer, setRestTimer] = useState({ visible: false, remaining: 0, running: false })
  const restIntervalRef = useRef(null)
  const workoutIntervalRef = useRef(null)
  const storageKey = user ? `fitness-active-workout:${user.id}` : null

  useEffect(() => {
    if (!storageKey) return
    setStorageReady(false)
    setSession(null)
    setExercises([])
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      if (saved?.session?.id) {
        setSession(saved.session)
        setExercises(saved.exercises ?? [])
      }
    } catch {
      localStorage.removeItem(storageKey)
    } finally {
      setStorageReady(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !storageReady) return
    if (session) {
      localStorage.setItem(storageKey, JSON.stringify({ session, exercises }))
    } else {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, storageReady, session, exercises])

  // Live HH:MM:SS timer for the active session.
  useEffect(() => {
    if (!session) {
      setElapsedSeconds(0)
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current)
      return undefined
    }

    workoutIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000))
    }, 1000)

    return () => clearInterval(workoutIntervalRef.current)
  }, [session])

  // Rest timer countdown.
  useEffect(() => {
    if (!restTimer.running) {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
      return undefined
    }

    restIntervalRef.current = setInterval(() => {
      setRestTimer((current) => {
        if (!current.running) return current
        if (current.remaining <= 1) {
          return { ...current, remaining: 0, running: false }
        }
        return { ...current, remaining: current.remaining - 1 }
      })
    }, 1000)

    return () => clearInterval(restIntervalRef.current)
  }, [restTimer.running])

  const startEmptyWorkout = useCallback(async (title = 'Workout') => {
    const row = await createWorkoutSession({ title })
    setSession({ id: row.id, title: row.title, startTime: row.start_time })
    setExercises([])
  }, [])

  const loadRoutineIntoWorkout = useCallback(async (routine) => {
    const row = await createWorkoutSession({ title: routine.title })
    setSession({ id: row.id, title: row.title, startTime: row.start_time })
    const entries = (routine.routine_exercises ?? []).map((re) => makeExerciseEntry(re.exercise))
    setExercises(entries)
  }, [])

  const addExercise = useCallback((exercise) => {
    setExercises((current) => [...current, makeExerciseEntry(exercise)])
  }, [])

  const removeExercise = useCallback((exerciseLogId) => {
    setExercises((current) => current.filter((entry) => entry.id !== exerciseLogId))
  }, [])

  const moveExercise = useCallback((exerciseLogId, direction) => {
    setExercises((current) => {
      const index = current.findIndex((entry) => entry.id === exerciseLogId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const setPreviousPerformance = useCallback((exerciseLogId, previous) => {
    setExercises((current) =>
      current.map((entry) =>
        entry.id === exerciseLogId
          ? { ...entry, previous, sets: entry.sets.map((set) => ({ ...set, previous })) }
          : entry,
      ),
    )
  }, [])

  const updateExerciseField = useCallback((exerciseLogId, field, value) => {
    setExercises((current) =>
      current.map((entry) => (entry.id === exerciseLogId ? { ...entry, [field]: value } : entry)),
    )
  }, [])

  const addSet = useCallback((exerciseLogId) => {
    setExercises((current) =>
      current.map((entry) =>
        entry.id === exerciseLogId ? { ...entry, sets: [...entry.sets, makeSet(entry.previous)] } : entry,
      ),
    )
  }, [])

  const removeSet = useCallback((exerciseLogId, setId) => {
    setExercises((current) =>
      current.map((entry) =>
        entry.id === exerciseLogId
          ? { ...entry, sets: entry.sets.filter((set) => set.id !== setId) }
          : entry,
      ),
    )
  }, [])

  const cycleSetType = useCallback((exerciseLogId, setId) => {
    setExercises((current) =>
      current.map((entry) => {
        if (entry.id !== exerciseLogId) return entry
        return {
          ...entry,
          sets: entry.sets.map((set) => {
            if (set.id !== setId) return set
            const nextIndex = (SET_TYPE_CYCLE.indexOf(set.setType) + 1) % SET_TYPE_CYCLE.length
            return { ...set, setType: SET_TYPE_CYCLE[nextIndex] }
          }),
        }
      }),
    )
  }, [])

  const updateSetField = useCallback((exerciseLogId, setId, field, value) => {
    setExercises((current) =>
      current.map((entry) => {
        if (entry.id !== exerciseLogId) return entry
        return {
          ...entry,
          sets: entry.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
        }
      }),
    )
  }, [])

  const startRestTimer = useCallback((seconds = DEFAULT_REST_SECONDS) => {
    setRestTimer({ visible: true, remaining: seconds, running: true })
  }, [])

  const adjustRestTimer = useCallback((deltaSeconds) => {
    setRestTimer((current) => ({
      ...current,
      remaining: Math.max(0, current.remaining + deltaSeconds),
    }))
  }, [])

  const skipRestTimer = useCallback(() => {
    setRestTimer({ visible: false, remaining: 0, running: false })
  }, [])

  const toggleSetCompleted = useCallback(
    (exerciseLogId, setId) => {
      let didComplete = false

      setExercises((current) =>
        current.map((entry) => {
          if (entry.id !== exerciseLogId) return entry
          return {
            ...entry,
            sets: entry.sets.map((set) => {
              if (set.id !== setId) return set
              const willComplete = !set.isCompleted
              let weightKg = set.weightKg
              let reps = set.reps

              if (willComplete && set.previous) {
                if (weightKg === '' || weightKg == null) weightKg = set.previous.weightKg ?? ''
                if (reps === '' || reps == null) reps = set.previous.reps ?? ''
              }

              if (willComplete) didComplete = true
              return { ...set, weightKg, reps, isCompleted: willComplete }
            }),
          }
        }),
      )

      if (didComplete) {
        const completedExercise = exercises.find((entry) => entry.id === exerciseLogId)
        startRestTimer(completedExercise?.restSeconds ?? DEFAULT_REST_SECONDS)
      }
    },
    [exercises, startRestTimer],
  )

  const finishWorkout = useCallback(async () => {
    if (!session) return
    const payload = exercises.map((entry) => ({ exerciseId: entry.exerciseId, sets: entry.sets }))
    await saveFinishedWorkout(session.id, payload)
    setSession(null)
    setExercises([])
    setRestTimer({ visible: false, remaining: 0, running: false })
  }, [session, exercises])

  const cancelWorkout = useCallback(async () => {
    if (!session) return
    await cancelWorkoutSession(session.id)
    setSession(null)
    setExercises([])
    setRestTimer({ visible: false, remaining: 0, running: false })
  }, [session])

  const value = useMemo(
    () => ({
      session,
      exercises,
      elapsedSeconds,
      restTimer,
      startEmptyWorkout,
      loadRoutineIntoWorkout,
      addExercise,
      removeExercise,
      moveExercise,
      setPreviousPerformance,
      updateExerciseField,
      addSet,
      removeSet,
      cycleSetType,
      updateSetField,
      toggleSetCompleted,
      adjustRestTimer,
      skipRestTimer,
      finishWorkout,
      cancelWorkout,
    }),
    [
      session,
      exercises,
      elapsedSeconds,
      restTimer,
      startEmptyWorkout,
      loadRoutineIntoWorkout,
      addExercise,
      removeExercise,
      moveExercise,
      setPreviousPerformance,
      updateExerciseField,
      addSet,
      removeSet,
      cycleSetType,
      updateSetField,
      toggleSetCompleted,
      adjustRestTimer,
      skipRestTimer,
      finishWorkout,
      cancelWorkout,
    ],
  )

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider')
  return context
}

export function formatElapsed(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
