import type { Lesson } from '@/types'
import { useAcademyStore } from '@/store/academyStore'

interface LessonCardProps {
  lesson: Lesson
  onSelect: (lessonId: number) => void
}

export function LessonCard({ lesson, onSelect }: LessonCardProps) {
  const { isLessonUnlocked, getProgress } = useAcademyStore()
  const unlocked = isLessonUnlocked(lesson.id)
  const progress = getProgress(lesson.id)

  const status = !unlocked
    ? 'locked'
    : progress.quizPassed
    ? 'completed'
    : progress.theoryRead
    ? 'in-progress'
    : 'unlocked'

  return (
    <button
      disabled={!unlocked}
      onClick={() => onSelect(lesson.id)}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        status === 'locked'
          ? 'border-terminal-border bg-terminal-bg opacity-50 cursor-not-allowed'
          : status === 'completed'
          ? 'border-terminal-green/40 bg-green-900/10 hover:bg-green-900/20'
          : status === 'in-progress'
          ? 'border-terminal-accent/40 bg-blue-900/10 hover:bg-blue-900/20'
          : 'border-terminal-border bg-terminal-surface hover:border-terminal-accent/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{lesson.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-terminal-text">
              Lección {lesson.id}: {lesson.title}
            </span>
            {status === 'completed' && <span className="text-terminal-green text-xs">✓ Completada</span>}
            {status === 'locked' && <span className="text-terminal-muted text-xs">🔒 Bloqueada</span>}
            {status === 'in-progress' && <span className="text-terminal-accent text-xs">En progreso</span>}
          </div>
          <p className="text-terminal-muted text-xs">{lesson.summary}</p>
        </div>
      </div>
    </button>
  )
}
