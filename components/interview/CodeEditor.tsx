'use client'

import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/store/interview-store'
import type { CodeLanguage } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Terminal, ChevronDown, Code2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Monaco Editor 动态导入（避免SSR问题）
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
)

interface CodeEditorProps {
  className?: string
}

const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

export function CodeEditor({ className }: CodeEditorProps) {
  const code = useInterviewStore((s) => s.codeByLanguage[s.selectedLanguage])
  const selectedLanguage = useInterviewStore((s) => s.selectedLanguage)
  const updateCode = useInterviewStore((s) => s.updateCode)
  const setLanguage = useInterviewStore((s) => s.setLanguage)
  const runCode = useInterviewStore((s) => s.runCode)
  const terminalOutput = useInterviewStore((s) => s.terminalOutput)
  const isRunningCode = useInterviewStore((s) => s.isRunningCode)
  const phase = useInterviewStore((s) => s.phase)
  const currentQuestionIndex = useInterviewStore((s) => s.currentQuestionIndex)
  const questions = useInterviewStore((s) => s.questions)

  const currentQuestion = questions[currentQuestionIndex]

  // 只在技术题或需要编程时显示
  if (!currentQuestion?.requiresCoding) {
    return (
      <Card className={cn('border-0 shadow-md', className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-text-secondary">
            <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">本题为非编程题，无需编写代码</p>
            <p className="text-xs mt-1 opacity-60">
              完成口语回答后点击&ldquo;下一题&rdquo;继续
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateCode(selectedLanguage, value)
    }
  }

  return (
    <Card className={cn('border-0 shadow-md flex flex-col', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">代码编辑器</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {/* 语言切换 */}
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary bg-gray-50 rounded-sm border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                {LANGUAGES.find((l) => l.value === selectedLanguage)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* 下拉菜单 */}
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[120px]">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors hover:bg-primary-50',
                      selectedLanguage === lang.value
                        ? 'text-primary bg-primary-50 font-medium'
                        : 'text-text-secondary'
                    )}
                    onClick={() => setLanguage(lang.value)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 运行按钮 */}
            <Button
              size="sm"
              onClick={runCode}
              disabled={isRunningCode || phase !== 'in-progress'}
              className="gap-1.5"
            >
              {isRunningCode ? (
                <>
                  <motion.div
                    className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  运行中
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  运行
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Monaco 编辑器 */}
        <div className="flex-1 min-h-[200px] border-y border-gray-100">
          <MonacoEditor
            height="100%"
            language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
            value={code}
            onChange={handleEditorChange}
            theme="vs"
            options={{
              fontSize: 13,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 12 },
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          />
        </div>

        {/* 终端输出 */}
        <AnimatePresence>
          {terminalOutput && (
            <motion.div
              className="bg-gray-900 text-green-400 p-3 font-mono text-xs overflow-auto max-h-[120px]"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
