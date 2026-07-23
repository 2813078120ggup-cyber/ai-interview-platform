'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到默认的演示面试间
    router.replace('/interview/demo')
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-2xl font-bold">AI</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-2">
          AI模拟面试平台
        </h1>
        <p className="text-sm text-text-secondary">
          正在跳转到面试间...
        </p>
      </div>
    </div>
  )
}
