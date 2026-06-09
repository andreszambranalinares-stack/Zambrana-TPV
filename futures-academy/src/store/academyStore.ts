import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LessonProgress } from '@/types'
import { LESSONS } from '@/constants/academy'

interface AcademyState {
  progress: LessonProgress[]
  isLessonUnlocked: (lessonId: number) => boolean
  markTheoryRead: (lessonId: number) => void
  submitQuiz: (lessonId: number, allCorrect: boolean) => void
  markExerciseAttempted: (lessonId: number) => void
  getProgress: (lessonId: number) => LessonProgress
}

function defaultProgress(): LessonProgress[] {
  return LESSONS.map((l) => ({
    lessonId: l.id,
    theoryRead: false,
    quizPassed: false,
    exerciseAttempted: false,
  }))
}

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      progress: defaultProgress(),

      isLessonUnlocked: (lessonId: number) => {
        if (lessonId === 1) return true
        const prev = get().progress.find((p) => p.lessonId === lessonId - 1)
        return prev?.quizPassed ?? false
      },

      getProgress: (lessonId: number) => {
        return (
          get().progress.find((p) => p.lessonId === lessonId) ?? {
            lessonId,
            theoryRead: false,
            quizPassed: false,
            exerciseAttempted: false,
          }
        )
      },

      markTheoryRead: (lessonId) => {
        set((state) => ({
          progress: state.progress.map((p) =>
            p.lessonId === lessonId ? { ...p, theoryRead: true } : p,
          ),
        }))
      },

      submitQuiz: (lessonId, allCorrect) => {
        set((state) => ({
          progress: state.progress.map((p) =>
            p.lessonId === lessonId
              ? {
                  ...p,
                  quizPassed: allCorrect ? true : p.quizPassed,
                  completedAt: allCorrect ? Date.now() : p.completedAt,
                }
              : p,
          ),
        }))
      },

      markExerciseAttempted: (lessonId) => {
        set((state) => ({
          progress: state.progress.map((p) =>
            p.lessonId === lessonId ? { ...p, exerciseAttempted: true } : p,
          ),
        }))
      },
    }),
    {
      name: 'fa_academy',
    },
  ),
)
