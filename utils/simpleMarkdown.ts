function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeHref(href: string) {
  const url = href.trim()
  if (/^(https?:\/\/|\/|mailto:)/i.test(url)) return url
  return '#'
}

function inline(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) =>
      `<a href="${safeHref(String(href))}" class="underline decoration-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** Escape + a small markdown subset for admin-edited legal pages. */
export function renderSimpleMarkdown(source: string) {
  const blocks = escapeHtml(source.replace(/\r\n/g, '\n').trim()).split(/\n{2,}/)
  return blocks.map((block) => {
    const lines = block.split('\n')
    if (lines.every(l => /^[-*]\s+/.test(l))) {
      const items = lines.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')
      return `<ul>${items}</ul>`
    }
    const first = lines[0] || ''
    if (first.startsWith('### ')) {
      const rest = lines.slice(1).filter(Boolean)
      return `<h3>${inline(first.slice(4))}</h3>${rest.length ? `<p>${inline(rest.join('<br>'))}</p>` : ''}`
    }
    if (first.startsWith('## ')) {
      const rest = lines.slice(1).filter(Boolean)
      return `<h2>${inline(first.slice(3))}</h2>${rest.length ? `<p>${inline(rest.join('<br>'))}</p>` : ''}`
    }
    if (first.startsWith('# ')) {
      const rest = lines.slice(1).filter(Boolean)
      return `<h1>${inline(first.slice(2))}</h1>${rest.length ? `<p>${inline(rest.join('<br>'))}</p>` : ''}`
    }
    return `<p>${inline(lines.join('<br>'))}</p>`
  }).join('\n')
}
