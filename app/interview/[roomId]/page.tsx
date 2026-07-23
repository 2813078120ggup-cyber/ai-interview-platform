'use client'

import { InterviewRoom } from '@/components/interview/InterviewRoom'

interface InterviewPageProps {
  params: { roomId: string }
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const { roomId } = params

  return <InterviewRoom roomId={roomId} />
}
