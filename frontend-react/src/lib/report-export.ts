function safeFileTitle(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function exportReportPdf(title: string) {
  const html = document.documentElement
  const previousTitle = document.title
  const nextTitle = safeFileTitle(title) || 'InterviewOS-评测报告'

  function cleanup() {
    html.classList.remove('print-report-mode')
    document.title = previousTitle
    window.removeEventListener('afterprint', cleanup)
  }

  document.title = nextTitle
  html.classList.add('print-report-mode')
  window.addEventListener('afterprint', cleanup)
  window.setTimeout(() => {
    window.print()
    window.setTimeout(cleanup, 1200)
  }, 80)
}
