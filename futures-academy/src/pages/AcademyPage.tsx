import { useState } from 'react'
import { LESSONS } from '@/constants/academy'
import { useAcademyStore } from '@/store/academyStore'
import { LessonCard } from '@/components/academy/LessonCard'
import { LessonView } from '@/components/academy/LessonView'

interface AcademyPageProps {
  onNavigate: (route: string) => void
}

export function AcademyPage({ onNavigate }: AcademyPageProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const { progress } = useAcademyStore()

  const completedCount = progress.filter((p) => p.quizPassed).length
  const totalCount = LESSONS.length

  if (selectedLessonId !== null) {
    return (
      <div className="p-4 lg:p-6">
        <LessonView
          lessonId={selectedLessonId}
          onBack={() => setSelectedLessonId(null)}
          onNavigate={onNavigate}
        />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-lg font-semibold text-terminal-text">Academia</h2>
        <span className="text-terminal-muted text-sm">{completedCount}/{totalCount} completadas</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-terminal-border rounded-full h-1.5 mb-6">
        <div
          className="bg-terminal-accent h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {LESSONS.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onSelect={setSelectedLessonId}
          />
        ))}
      </div>
    </div>
  )
}
