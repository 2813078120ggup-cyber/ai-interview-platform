export type InterviewerStyleKey = 'gentle' | 'pressure' | 'big-tech' | 'hr' | 'project-deep' | 'campus-basic'

export const interviewerStyles: Array<{
  key: InterviewerStyleKey
  label: string
  description: string
}> = [
  { key: 'gentle', label: '温和型', description: '循序引导，适合建立表达信心' },
  { key: 'pressure', label: '压迫型', description: '高强度追问，训练抗压和边界表达' },
  { key: 'big-tech', label: '大厂技术面', description: '重视原理、场景、取舍和复杂度' },
  { key: 'hr', label: 'HR 综合面', description: '关注动机、稳定性、沟通和职业规划' },
  { key: 'project-deep', label: '项目深挖型', description: '围绕项目职责、难点、结果持续追问' },
  { key: 'campus-basic', label: '校招基础型', description: '覆盖基础概念，适合应届生查漏补缺' },
]

export function interviewerStyleLabel(value?: string) {
  return interviewerStyles.find(item => item.key === value)?.label ?? '大厂技术面'
}

export function interviewerStyleFromRemark(remark?: string) {
  const match = remark?.match(/interviewerStyle=([a-zA-Z0-9-]+)/)
  return (match?.[1] as InterviewerStyleKey | undefined) ?? 'big-tech'
}

export function isPracticeInterview(remark?: string) {
  return remark?.includes('candidate-practice') ?? false
}
