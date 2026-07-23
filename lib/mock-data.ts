/**
 * Mock Data - 模拟面试数据（演示用）
 */

import type { Question, Feedback, DimensionScore, CodeLanguage } from './types'

/** 模拟面试题目 */
export const mockQuestions: Question[] = [
  {
    id: 'q1',
    index: 1,
    text: '请做一个简短的自我介绍，包括你的技术背景和项目经验。',
    type: 'behavioral',
    requiresCoding: false,
    referencePoints: ['技术栈掌握', '项目经验', '表达能力'],
    suggestedDuration: 45,
  },
  {
    id: 'q2',
    index: 2,
    text: '请解释一下 React 的虚拟 DOM 工作原理，以及它如何提升性能？',
    type: 'technical',
    requiresCoding: false,
    referencePoints: ['概念理解', '原理解释', '性能分析'],
    suggestedDuration: 45,
  },
  {
    id: 'q3',
    index: 3,
    text: '给定一个包含 n 个整数的数组，请编写一个函数找出其中第 k 大的元素。请实现并解释你的解法。',
    type: 'technical',
    requiresCoding: true,
    referencePoints: ['算法正确性', '时间复杂度', '代码质量'],
    suggestedDuration: 45,
  },
  {
    id: 'q4',
    index: 4,
    text: '假设你正在设计一个高并发的秒杀系统，请描述你的架构设计思路，并编写核心的库存扣减逻辑。',
    type: 'case-study',
    requiresCoding: true,
    referencePoints: ['系统设计', '并发处理', '代码实现'],
    suggestedDuration: 45,
  },
  {
    id: 'q5',
    index: 5,
    text: '请分享一个你在项目中遇到的最具挑战性的技术问题，以及你是如何解决的。',
    type: 'behavioral',
    requiresCoding: false,
    referencePoints: ['问题分析', '解决思路', '总结反思'],
    suggestedDuration: 45,
  },
]

/** 初始代码模板 */
export const initialCode: Record<CodeLanguage, string> = {
  python: `# Python - 找到第K大的元素\ndef find_kth_largest(nums: list[int], k: int) -> int:\n    # 请在这里编写你的代码\n    pass\n\n# 测试用例\nif __name__ == '__main__':\n    nums = [3, 2, 1, 5, 6, 4]\n    k = 2\n    print(f"第{k}大的元素是: {find_kth_largest(nums, k)}")\n`,
  javascript: `// JavaScript - 找到第K大的元素\nfunction findKthLargest(nums, k) {\n  // 请在这里编写你的代码\n  \n}\n\n// 测试用例\nconst nums = [3, 2, 1, 5, 6, 4];\nconst k = 2;\nconsole.log(\`第\${k}大的元素是: \${findKthLargest(nums, k)}\`);\n`,
  java: `// Java - 找到第K大的元素\nclass Solution {\n    public int findKthLargest(int[] nums, int k) {\n        // 请在这里编写你的代码\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        Solution solution = new Solution();\n        int[] nums = {3, 2, 1, 5, 6, 4};\n        int k = 2;\n        System.out.println("第" + k + "大的元素是: " + solution.findKthLargest(nums, k));\n    }\n}\n`,
  cpp: `// C++ - 找到第K大的元素\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint findKthLargest(vector<int>& nums, int k) {\n    // 请在这里编写你的代码\n    return 0;\n}\n\nint main() {\n    vector<int> nums = {3, 2, 1, 5, 6, 4};\n    int k = 2;\n    cout << "第" << k << "大的元素是: " << findKthLargest(nums, k) << endl;\n    return 0;\n}\n`,
}

/** 初始维度评分 */
export const initialScores: DimensionScore[] = [
  { dimension: 'logicalExpression', label: '逻辑表达', score: 0, maxScore: 100 },
  { dimension: 'jobMatch', label: '岗位匹配', score: 0, maxScore: 100 },
  { dimension: 'communication', label: '沟通能力', score: 0, maxScore: 100 },
  { dimension: 'adaptability', label: '应变能力', score: 0, maxScore: 100 },
  { dimension: 'professionalDepth', label: '专业深度', score: 0, maxScore: 100 },
]

/** 模拟评分更新 */
export const mockScoreUpdates: { [key: number]: DimensionScore[] } = {
  1: [
    { dimension: 'logicalExpression', label: '逻辑表达', score: 72, maxScore: 100 },
    { dimension: 'jobMatch', label: '岗位匹配', score: 65, maxScore: 100 },
    { dimension: 'communication', label: '沟通能力', score: 78, maxScore: 100 },
    { dimension: 'adaptability', label: '应变能力', score: 60, maxScore: 100 },
    { dimension: 'professionalDepth', label: '专业深度', score: 70, maxScore: 100 },
  ],
  2: [
    { dimension: 'logicalExpression', label: '逻辑表达', score: 75, maxScore: 100 },
    { dimension: 'jobMatch', label: '岗位匹配', score: 68, maxScore: 100 },
    { dimension: 'communication', label: '沟通能力', score: 80, maxScore: 100 },
    { dimension: 'adaptability', label: '应变能力', score: 63, maxScore: 100 },
    { dimension: 'professionalDepth', label: '专业深度', score: 82, maxScore: 100 },
  ],
  3: [
    { dimension: 'logicalExpression', label: '逻辑表达', score: 80, maxScore: 100 },
    { dimension: 'jobMatch', label: '岗位匹配', score: 72, maxScore: 100 },
    { dimension: 'communication', label: '沟通能力', score: 82, maxScore: 100 },
    { dimension: 'adaptability', label: '应变能力', score: 70, maxScore: 100 },
    { dimension: 'professionalDepth', label: '专业深度', score: 85, maxScore: 100 },
  ],
  4: [
    { dimension: 'logicalExpression', label: '逻辑表达', score: 82, maxScore: 100 },
    { dimension: 'jobMatch', label: '岗位匹配', score: 75, maxScore: 100 },
    { dimension: 'communication', label: '沟通能力', score: 84, maxScore: 100 },
    { dimension: 'adaptability', label: '应变能力', score: 75, maxScore: 100 },
    { dimension: 'professionalDepth', label: '专业深度', score: 88, maxScore: 100 },
  ],
  5: [
    { dimension: 'logicalExpression', label: '逻辑表达', score: 85, maxScore: 100 },
    { dimension: 'jobMatch', label: '岗位匹配', score: 78, maxScore: 100 },
    { dimension: 'communication', label: '沟通能力', score: 86, maxScore: 100 },
    { dimension: 'adaptability', label: '应变能力', score: 80, maxScore: 100 },
    { dimension: 'professionalDepth', label: '专业深度', score: 90, maxScore: 100 },
  ],
}

/** 模拟反馈 */
export const mockFeedbacks: Feedback[] = [
  {
    id: 'fb1',
    message: '回答结构清晰，技术栈描述准确 ✓',
    type: 'positive',
    dimension: 'logicalExpression',
    timestamp: Date.now() + 3000,
  },
  {
    id: 'fb2',
    message: '建议补充更多量化成果数据来增强说服力',
    type: 'suggestion',
    dimension: 'jobMatch',
    timestamp: Date.now() + 6000,
  },
  {
    id: 'fb3',
    message: '语速适中，表达流畅自然',
    type: 'positive',
    dimension: 'communication',
    timestamp: Date.now() + 8000,
  },
  {
    id: 'fb4',
    message: '遇到追问时可以稍作停顿再回答',
    type: 'suggestion',
    dimension: 'adaptability',
    timestamp: Date.now() + 11000,
  },
  {
    id: 'fb5',
    message: '对底层原理的理解可以进一步深入',
    type: 'suggestion',
    dimension: 'professionalDepth',
    timestamp: Date.now() + 14000,
  },
]
