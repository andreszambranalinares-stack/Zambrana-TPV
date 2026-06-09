import { useState } from 'react'
import type { Lesson } from '@/types'
import { useAcademyStore } from '@/store/academyStore'
import { QuizQuestion } from './QuizQuestion'
import { LESSONS } from '@/constants/academy'

interface LessonViewProps {
  lessonId: number
  onBack: () => void
  onNavigate: (route: string) => void
}

type Phase = 'theory' | 'quiz' | 'complete'

export function LessonView({ lessonId, onBack, onNavigate }: LessonViewProps) {
  const lesson = LESSONS.find((l) => l.id === lessonId) as Lesson | undefined
  const { getProgress, markTheoryRead, submitQuiz, markExerciseAttempted } = useAcademyStore()
  const progress = getProgress(lessonId)

  const [phase, setPhase] = useState<Phase>(
    progress.quizPassed ? 'complete' : progress.theoryRead ? 'quiz' : 'theory',
  )
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  if (!lesson) return null

  const allAnswered = lesson.quiz.every((q) => q.id in answers)
  const allCorrect = allAnswered && lesson.quiz.every((q) => answers[q.id])

  function handleAnswer(questionId: string, _selectedIndex: number, isCorrect: boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: isCorrect }))
  }

  function handleTheoryDone() {
    markTheoryRead(lessonId)
    setPhase('quiz')
  }

  function handleQuizSubmit() {
    if (!allAnswered) return
    setQuizSubmitted(true)
    submitQuiz(lessonId, allCorrect)
    if (allCorrect) {
      setTimeout(() => setPhase('complete'), 800)
    }
  }

  function handleRetryQuiz() {
    setAnswers({})
    setQuizSubmitted(false)
    setRetryCount((c) => c + 1)
  }

  function handleExerciseCTA() {
    markExerciseAttempted(lessonId)
    onNavigate(lesson!.exercise.ctaRoute)
  }

  const phaseLabels: Record<Phase, string> = {
    theory: 'Teoría',
    quiz: 'Quiz',
    complete: 'Completada',
  }

  const phases: Phase[] = ['theory', 'quiz', 'complete']

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="text-terminal-muted hover:text-terminal-text text-sm mb-4 flex items-center gap-1 transition-colors"
      >
        ← Volver a lecciones
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{lesson.icon}</span>
        <div>
          <div className="text-terminal-muted text-xs">Lección {lesson.id} de {LESSONS.length}</div>
          <h2 className="text-lg font-semibold text-terminal-text">{lesson.title}</h2>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        {phases.map((p, i) => {
          const isDone =
            (p === 'theory' && (phase === 'quiz' || phase === 'complete')) ||
            (p === 'quiz' && phase === 'complete')
          const isActive = phase === p

          return (
            <div key={p} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                  isActive
                    ? 'bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/40'
                    : isDone
                    ? 'text-terminal-green'
                    : 'text-terminal-muted'
                }`}
              >
                {isDone ? '✓ ' : `${i + 1}. `}
                {phaseLabels[p]}
              </div>
              {i < 2 && <span className="text-terminal-border">›</span>}
            </div>
          )
        })}
      </div>

      {/* THEORY PHASE */}
      {phase === 'theory' && (
        <div>
          <div className="space-y-4 mb-6">
            {lesson.theoryBlocks.map((block, i) => (
              <div key={i} className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
                {block.heading && (
                  <h3 className="text-terminal-accent text-sm font-semibold mb-2">{block.heading}</h3>
                )}
                <p className="text-terminal-text text-sm leading-relaxed whitespace-pre-line">{block.body}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleTheoryDone}
            className="w-full py-2.5 bg-terminal-accent hover:bg-blue-400 rounded font-semibold text-sm text-white transition-colors"
          >
            He leído la teoría → Ir al Quiz
          </button>
        </div>
      )}

      {/* QUIZ PHASE */}
      {phase === 'quiz' && (
        <div>
          <p className="text-terminal-muted text-sm mb-4">
            Responde todas las preguntas correctamente para pasar a la siguiente lección.
          </p>
          {lesson.quiz.map((q, i) => (
            <QuizQuestion
              key={`${q.id}-${retryCount}`}
              question={q}
              questionNumber={i + 1}
              onAnswer={handleAnswer}
              disabled={quizSubmitted && allCorrect}
            />
          ))}

          {!quizSubmitted ? (
            <button
              onClick={handleQuizSubmit}
              disabled={!allAnswered}
              className={`w-full py-2.5 rounded font-semibold text-sm transition-colors ${
                allAnswered
                  ? 'bg-terminal-accent hover:bg-blue-400 text-white'
                  : 'bg-terminal-border text-terminal-muted cursor-not-allowed'
              }`}
            >
              Enviar respuestas
            </button>
          ) : !allCorrect ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-900/20 border border-red-800/40 rounded text-red-300 text-sm">
                Algunas respuestas son incorrectas. Revisa las explicaciones e inténtalo de nuevo.
              </div>
              <button
                onClick={handleRetryQuiz}
                className="w-full py-2.5 bg-terminal-surface border border-terminal-border hover:border-terminal-accent rounded font-semibold text-sm text-terminal-text transition-colors"
              >
                Reintentar quiz
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* COMPLETE PHASE */}
      {phase === 'complete' && (
        <div>
          <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-6 mb-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-terminal-green font-semibold mb-2">¡Lección completada!</h3>
            <p className="text-terminal-muted text-sm">
              Has pasado el quiz de la lección {lesson.id}.
              {lessonId < LESSONS.length && ' La siguiente lección está ahora desbloqueada.'}
            </p>
          </div>

          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 mb-4">
            <h3 className="text-terminal-text text-sm font-semibold mb-2">🎯 Ejercicio práctico</h3>
            <p className="text-terminal-muted text-sm mb-3">{lesson.exercise.instruction}</p>
            <button
              onClick={handleExerciseCTA}
              className="w-full py-2.5 bg-terminal-accent hover:bg-blue-400 rounded font-semibold text-sm text-white transition-colors"
            >
              {lesson.exercise.ctaLabel}
            </button>
          </div>

          {lessonId < LESSONS.length && (
            <button
              onClick={onBack}
              className="w-full py-2.5 bg-terminal-surface border border-terminal-border hover:border-terminal-accent rounded font-semibold text-sm text-terminal-text transition-colors"
            >
              Ver todas las lecciones →
            </button>
          )}
          {lessonId === LESSONS.length && (
            <div className="text-center p-4 bg-terminal-surface border border-terminal-green/40 rounded-lg">
              <p className="text-terminal-green font-semibold">🏆 ¡Has completado toda la Academia!</p>
              <p className="text-terminal-muted text-xs mt-1">Ahora practica en el simulador aplicando lo aprendido.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
