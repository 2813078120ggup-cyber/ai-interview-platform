import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI模拟面试平台',
  description: '多模态智能模拟面试评测平台 - 基于大语言模型的AI面试官系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
