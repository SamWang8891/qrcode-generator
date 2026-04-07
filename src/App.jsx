import { useState, useRef, useCallback, useEffect } from 'react'
import StyledQRCode from './StyledQRCode'

const SIZES = [
  { label: 'Small', value: 128 },
  { label: 'Medium', value: 200 },
  { label: 'Large', value: 300 },
  { label: 'X-Large', value: 400 },
]

const ERROR_LEVELS = [
  { label: 'Low (7%)', value: 'L' },
  { label: 'Medium (15%)', value: 'M' },
  { label: 'Quartile (25%)', value: 'Q' },
  { label: 'High (30%)', value: 'H' },
]

const LOGO_SIZES = [
  { label: '10%', value: 0.1 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.2 },
  { label: '25%', value: 0.25 },
  { label: '30%', value: 0.3 },
]

const DOT_STYLES = [
  { label: 'Square', value: 'square' },
  { label: 'Dots', value: 'dots' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Classy', value: 'classy' },
  { label: 'Classy Rounded', value: 'classy-rounded' },
]

const CORNER_STYLES = [
  { label: 'Square', value: 'square' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Extra Rounded', value: 'extra-rounded' },
]

const TABS = ['Basic', 'Style', 'Logo']

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, () => setDark(d => !d)]
}

export default function App() {
  const [dark, toggleTheme] = useTheme()
  const [text, setText] = useState('')
  const [size, setSize] = useState(200)
  const [errorLevel, setErrorLevel] = useState('H')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [dotStyle, setDotStyle] = useState('square')
  const [cornerStyle, setCornerStyle] = useState('square')
  const [logoSize, setLogoSize] = useState(0.2)
  const [logoSrc, setLogoSrc] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [generated, setGenerated] = useState(false)

  const qrRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleGenerate = useCallback(() => {
    if (text.trim()) setGenerated(true)
  }, [text])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleGenerate()
  }, [handleGenerate])

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setLogoSrc(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadAs = (format) => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    if (format === 'png') {
      const link = document.createElement('a')
      link.download = `${text || 'qrcode'}_qrcode.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } else {
      const ctx = canvas.getContext('2d')
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const w = canvas.width
      const h = canvas.height

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
      svg += `<rect width="100%" height="100%" fill="${bgColor}"/>`

      const step = Math.max(1, Math.floor(w / 100))
      svg += `<g fill="${fgColor}">`
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4
          if (imgData.data[i] < 128) {
            svg += `<rect x="${x}" y="${y}" width="${step}" height="${step}"/>`
          }
        }
      }
      svg += '</g></svg>'

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const link = document.createElement('a')
      link.download = `${text || 'qrcode'}_qrcode.svg`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }

  // Kuai kuai easter egg
  useEffect(() => {
    fetch('https://gist.githubusercontent.com/yutin1987/f2c80abc86635e750b72c8d47a20a514/raw/eecb8b6c47e1d9fee8fd63171c95e88085d1fcd5/gistfile1.txt')
      .then(r => r.text())
      .then(d => console.log(d))
      .catch(e => console.log('QAQ', e))
  }, [])

  const showQR = generated && text.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-colors dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-4 flex justify-end">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            QR Code Generator
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Create custom QR codes instantly. Free, no sign-up required.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:shadow-none dark:ring-slate-700">
          {/* Input */}
          <div className="p-4 pb-3 sm:p-6 sm:pb-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter text or URL..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-700 dark:focus:ring-indigo-500/20"
              />
              <button
                onClick={handleGenerate}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-[0.98] sm:w-auto"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-slate-100 px-4 sm:px-6 dark:border-slate-700">
            <div className="flex gap-1 pt-1">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === i
                      ? 'bg-slate-50 text-indigo-600 dark:bg-slate-700/50 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 dark:bg-slate-700/30">
            {activeTab === 0 && (
              <div className="flex flex-wrap gap-6">
                <SelectField label="QR Code Size" value={size} onChange={setSize} options={SIZES} />
                <SelectField label="Error Correction" value={errorLevel} onChange={setErrorLevel} options={ERROR_LEVELS} />
              </div>
            )}

            {activeTab === 1 && (
              <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">
                <SelectField label="Dot Style" value={dotStyle} onChange={setDotStyle} options={DOT_STYLES} />
                <SelectField label="Corner Style" value={cornerStyle} onChange={setCornerStyle} options={CORNER_STYLES} />
                <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
                <ColorField label="Background" value={bgColor} onChange={setBgColor} />
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <SelectField label="Logo Size (% of QR)" value={logoSize} onChange={(v) => setLogoSize(parseFloat(v))} options={LOGO_SIZES} />
                <div>
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Logo
                  </label>
                  <input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                {logoSrc && (
                  <div className="flex items-center gap-3">
                    <img src={logoSrc} alt="Logo preview" className="h-14 w-14 rounded-lg border border-slate-200 object-contain p-1 dark:border-slate-600" />
                    <button
                      onClick={removeLogo}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50 dark:text-red-400 dark:ring-red-800 dark:hover:bg-red-900/30"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QR Code Output */}
          {showQR && (
            <div className="border-t border-slate-100 p-4 sm:p-8 dark:border-slate-700">
              <div ref={qrRef} className="flex justify-center overflow-x-auto">
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:p-4 dark:bg-white dark:ring-slate-200">
                  <StyledQRCode
                    value={text}
                    size={size}
                    level={errorLevel}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    dotStyle={dotStyle}
                    cornerStyle={cornerStyle}
                    logoSrc={logoSrc}
                    logoSize={logoSize}
                  />
                </div>
              </div>

              {/* Download Buttons */}
              <div className="mt-4 flex flex-col items-center gap-2 sm:mt-6 sm:flex-row sm:justify-center sm:gap-3">
                <button
                  onClick={() => downloadAs('png')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] sm:w-auto dark:bg-indigo-600 dark:hover:bg-indigo-700"
                >
                  <DownloadIcon />
                  Download PNG
                </button>
                <button
                  onClick={() => downloadAs('svg')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-[0.98] sm:w-auto dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-600"
                >
                  <DownloadIcon />
                  Download SVG
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Free &middot; No sign-up &middot; Works offline
        </p>
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="min-w-0 flex-1 sm:min-w-[160px] sm:flex-none">
      <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-600"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">{value}</span>
      </div>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}
