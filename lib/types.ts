/**
 * TypeScript Type Definitions - 面试间模块类型定义
 */

/** 面试阶段 */
export type InterviewPhase = 'waiting' | 'in-progress' | 'feedback' | 'ended'

/** 编程语言 */
export type CodeLanguage = 'python' | 'javascript' | 'java' | 'cpp'

/** 评分维度 */
export type ScoreDimension =
  | 'logicalExpression'
  | 'jobMatch'
  | 'communication'
  | 'adaptability'
  | 'professionalDepth'

/** 维度标签映射 */
export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  logicalExpression: '逻辑表达',
  jobMatch: '岗位匹配',
  communication: '沟通能力',
  adaptability: '应变能力',
  professionalDepth: '专业深度',
}

/** 面试题目 */
export interface Question {
  id: string
  /** 题号 */
  index: number
  /** 题目文本 */
  text: string
  /** 题目类型 */
  type: 'behavioral' | 'technical' | 'case-study' | 'general'
  /** 是否需要编程 (技术岗显示代码编辑器) */
  requiresCoding: boolean
  /** 参考要点（AI面试官评分参考） */
  referencePoints: string[]
  /** 建议回答时长（秒） */
  suggestedDuration: number
}

/** 即时反馈 */
export interface Feedback {
  id: string
  /** 反馈文本 */
  message: string
  /** 反馈类型 */
  type: 'positive' | 'suggestion' | 'warning'
  /** 关联的维度 */
  dimension: ScoreDimension
  /** 时间戳 */
  timestamp: number
}

/** 维度评分 */
export interface DimensionScore {
  dimension: ScoreDimension
  label: string
  /** 0-100 分数 */
  score: number
  /** 满分 */
  maxScore: number
}

/** 面试状态 */
export interface InterviewState {
  /** 面试ID */
  roomId: string
  /** 当前阶段 */
  phase: InterviewPhase
  /** 当前题号索引 */
  currentQuestionIndex: number
  /** 题目列表 */
  questions: Question[]
  /** 每题剩余时间（秒） */
  timeRemaining: number
  /** 总已用时间（秒） */
  totalElapsed: number
  /** 是否静音 */
  isMuted: boolean
  /** 是否关闭摄像头 */
  isCameraOff: boolean
  /** 各语言代码内容 */
  codeByLanguage: Record<CodeLanguage, string>
  /** 当前选中语言 */
  selectedLanguage: CodeLanguage
  /** 代码运行输出 */
  terminalOutput: string
  /** 是否正在运行代码 */
  isRunningCode: boolean
  /** 5维度评分 */
  dimensionScores: Record<ScoreDimension, number>
  /** 反馈列表 */
  feedbacks: Feedback[]
  /** 当前字幕文本 */
  subtitleText: string
  /** AI面试官是否正在说话 */
  isAiSpeaking: boolean
  /** 候选人音量等级 0-100 */
  candidateVolume: number
  /** 是否显示反馈面板 */
  showFeedback: boolean
}

/** 面试Store Actions */
export interface InterviewActions {
  /** 开始面试 */
  startInterview: () => void
  /** 下一题 */
  nextQuestion: () => void
  /** 上一题 */
  prevQuestion: () => void
  /** 切换静音 */
  toggleMute: () => void
  /** 切换摄像头 */
  toggleCamera: () => void
  /** 更新代码 */
  updateCode: (language: CodeLanguage, code: string) => void
  /** 切换语言 */
  setLanguage: (language: CodeLanguage) => void
  /** 运行代码 */
  runCode: () => void
  /** 结束面试 */
  endInterview: () => void
  /** 更新时间倒计时 */
  tick: () => void
  /** 提交答案并显示反馈 */
  submitAnswer: () => void
  /** 重置面试 */
  resetInterview: () => void
  /** 更新音量 */
  setCandidateVolume: (volume: number) => void
  /** 更新字幕 */
  setSubtitle: (text: string) => void
  /** 设置AI说话状态 */
  setAiSpeaking: (speaking: boolean) => void
}

export type InterviewStore = InterviewState & InterviewActions
