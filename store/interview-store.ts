/**
 * Zustand Interview Store - 面试间全局状态管理
 */

import { create } from 'zustand'
import type { CodeLanguage, InterviewStore, ScoreDimension } from '@/lib/types'
import { mockQuestions, initialCode, mockScoreUpdates, mockFeedbacks } from '@/lib/mock-data'
import { QUESTION_TIME } from '@/lib/design-tokens'

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  // ===== 初始状态 =====
  roomId: '',
  phase: 'waiting',
  currentQuestionIndex: 0,
  questions: mockQuestions,
  timeRemaining: QUESTION_TIME,
  totalElapsed: 0,
  isMuted: false,
  isCameraOff: false,
  codeByLanguage: { ...initialCode },
  selectedLanguage: 'python' as CodeLanguage,
  terminalOutput: '',
  isRunningCode: false,
  dimensionScores: {
    logicalExpression: 0,
    jobMatch: 0,
    communication: 0,
    adaptability: 0,
    professionalDepth: 0,
  },
  feedbacks: [],
  subtitleText: '',
  isAiSpeaking: false,
  candidateVolume: 0,
  showFeedback: false,

  // ===== Actions =====

  startInterview: () => {
    set({
      phase: 'in-progress',
      currentQuestionIndex: 0,
      timeRemaining: QUESTION_TIME,
      totalElapsed: 0,
      showFeedback: false,
      feedbacks: [],
      terminalOutput: '',
      codeByLanguage: { ...initialCode },
      dimensionScores: {
        logicalExpression: 0,
        jobMatch: 0,
        communication: 0,
        adaptability: 0,
        professionalDepth: 0,
      },
    })
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get()
    if (currentQuestionIndex < questions.length - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        timeRemaining: QUESTION_TIME,
        showFeedback: false,
        feedbacks: [],
        terminalOutput: '',
      })
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({
        currentQuestionIndex: currentQuestionIndex - 1,
        timeRemaining: QUESTION_TIME,
        showFeedback: false,
        feedbacks: [],
      })
    }
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }))
  },

  toggleCamera: () => {
    set((state) => ({ isCameraOff: !state.isCameraOff }))
  },

  updateCode: (language: CodeLanguage, code: string) => {
    set((state) => ({
      codeByLanguage: { ...state.codeByLanguage, [language]: code },
    }))
  },

  setLanguage: (language: CodeLanguage) => {
    set({ selectedLanguage: language })
  },

  runCode: () => {
    const { selectedLanguage, codeByLanguage } = get()
    const code = codeByLanguage[selectedLanguage]

    set({ isRunningCode: true, terminalOutput: '' })

    // 模拟代码执行
    setTimeout(() => {
      const output = generateMockOutput(selectedLanguage, code)
      set({ isRunningCode: false, terminalOutput: output })
    }, 1500)
  },

  endInterview: () => {
    set({ phase: 'ended', showFeedback: false })
  },

  tick: () => {
    const { timeRemaining, phase } = get()
    if (phase !== 'in-progress') return

    if (timeRemaining > 0) {
      set((state) => ({
        timeRemaining: state.timeRemaining - 1,
        totalElapsed: state.totalElapsed + 1,
      }))
    } else {
      // 倒计时结束，自动提交答案
      get().submitAnswer()
    }
  },

  submitAnswer: () => {
    const { currentQuestionIndex } = get()
    const scores = mockScoreUpdates[currentQuestionIndex + 1]

    if (scores) {
      const scoreMap: Record<ScoreDimension, number> = {} as Record<ScoreDimension, number>
      scores.forEach((s) => {
        scoreMap[s.dimension] = s.score
      })

      set({
        dimensionScores: scoreMap,
        showFeedback: true,
        feedbacks: [...mockFeedbacks],
      })
    }
  },

  resetInterview: () => {
    set({
      phase: 'waiting',
      currentQuestionIndex: 0,
      timeRemaining: QUESTION_TIME,
      totalElapsed: 0,
      isMuted: false,
      isCameraOff: false,
      codeByLanguage: { ...initialCode },
      selectedLanguage: 'python' as CodeLanguage,
      terminalOutput: '',
      isRunningCode: false,
      dimensionScores: {
        logicalExpression: 0,
        jobMatch: 0,
        communication: 0,
        adaptability: 0,
        professionalDepth: 0,
      },
      feedbacks: [],
      subtitleText: '',
      isAiSpeaking: false,
      candidateVolume: 0,
      showFeedback: false,
    })
  },

  setCandidateVolume: (volume: number) => {
    set({ candidateVolume: volume })
  },

  setSubtitle: (text: string) => {
    set({ subtitleText: text })
  },

  setAiSpeaking: (speaking: boolean) => {
    set({ isAiSpeaking: speaking })
  },
}))

/** 模拟代码输出 */
function generateMockOutput(language: CodeLanguage, code: string): string {
  if (!code || code.trim() === '') {
    return '> 代码为空，请编写代码后再运行。'
  }

  const outputs: Record<CodeLanguage, string> = {
    python: `> python3 solution.py
第2大的元素是: 5
>
执行时间: 0.023s | 内存: 15.2MB
`,
    javascript: `> node solution.js
第2大的元素是: 5
>
执行时间: 0.018s | 内存: 12.8MB
`,
    java: `> javac Solution.java && java Solution
第2大的元素是: 5
>
执行时间: 0.045s | 内存: 28.4MB
`,
    cpp: `> g++ solution.cpp -o solution && ./solution
第2大的元素是: 5
>
执行时间: 0.008s | 内存: 8.6MB
`,
  }

  return outputs[language]
}
