import { useState } from 'react'
import type { QuizQuestion as QuizQuestionType } from '@/types'

interface QuizQuestionProps {
  question: QuizQuestionType
  questionNumber: number
  onAnswer: (questionId: string, selectedIndex: number, isCorrect: boolean) => void
  disabled?: boolean
}

export function QuizQuestion({ question, questionNumber, onAnswer, disabled }: QuizQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  function handleSelect(idx: number) {
    if (answered || disabled) return
    setSelected(idx)
    setAnswered(true)
    onAnswer(question.id, idx, idx === question.correctIndex)
  }

  return (
    <div className="mb-6">
      <p className="text-terminal-text text-sm font-medium mb-3">
        {questionNumber}. {question.question}
      </p>
      <div className="space-y-2">
        {question.options.map((option, idx) => {
          let style = 'border-terminal-border text-terminal-muted hover:border-terminal-accent/50 hover:text-terminal-text'
          if (answered) {
            if (idx === question.correctIndex) {
              style = 'border-terminal-green bg-green-900/20 text-terminal-green'
            } else if (idx === selected && idx !== question.correctIndex) {
              style = 'border-terminal-red bg-red-900/20 text-terminal-red'
            } else {
              style = 'border-terminal-border text-terminal-muted opacity-60'
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered || disabled}
              className={`w-full text-left px-3 py-2 rounded border text-sm transition-all ${style} ${
                !answered && !disabled ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className="font-mono text-xs mr-2 opacity-70">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mt-2 p-2 rounded text-xs ${
          selected === question.correctIndex
            ? 'bg-green-900/20 text-green-300 border border-green-800/40'
            : 'bg-red-900/20 text-red-300 border border-red-800/40'
        }`}>
          {selected === question.correctIndex ? '✓ Correcto. ' : '✗ Incorrecto. '}
          {question.explanation}
        </div>
      )}
    </div>
  )
}
