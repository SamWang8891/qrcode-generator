import { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'

const DOT_STYLES = {
  square: (ctx, x, y, s) => {
    ctx.fillRect(x, y, s, s)
  },
  dots: (ctx, x, y, s) => {
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s / 2.5, 0, Math.PI * 2)
    ctx.fill()
  },
  rounded: (ctx, x, y, s) => {
    const r = s / 4
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + s - r, y)
    ctx.arcTo(x + s, y, x + s, y + r, r)
    ctx.lineTo(x + s, y + s - r)
    ctx.arcTo(x + s, y + s, x + s - r, y + s, r)
    ctx.lineTo(x + r, y + s)
    ctx.arcTo(x, y + s, x, y + s - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
    ctx.fill()
  },
  classy: (ctx, x, y, s) => {
    ctx.beginPath()
    ctx.moveTo(x + s / 2, y)
    ctx.lineTo(x + s, y + s / 2)
    ctx.lineTo(x + s / 2, y + s)
    ctx.lineTo(x, y + s / 2)
    ctx.closePath()
    ctx.fill()
  },
  'classy-rounded': (ctx, x, y, s) => {
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2)
    ctx.fill()
  },
}

const CORNER_STYLES = {
  square: (ctx, x, y, s) => {
    ctx.fillRect(x, y, s, s)
  },
  rounded: (ctx, x, y, s) => {
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2)
    ctx.fill()
  },
  'extra-rounded': (ctx, x, y, s) => {
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s / 1.5, 0, Math.PI * 2)
    ctx.fill()
  },
}

function isFinderPattern(row, col, moduleCount) {
  // Top-left
  if (row < 7 && col < 7) return true
  // Top-right
  if (row < 7 && col >= moduleCount - 7) return true
  // Bottom-left
  if (row >= moduleCount - 7 && col < 7) return true
  return false
}

export default function StyledQRCode({
  value,
  size = 200,
  level = 'H',
  fgColor = '#000000',
  bgColor = '#ffffff',
  dotStyle = 'square',
  cornerStyle = 'square',
  logoSrc = null,
  logoSize = 0.2,
}) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!value) return

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    QRCodeLib.toDataURL(value, {
      errorCorrectionLevel: level,
      margin: 1,
      width: size,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(() => {
        // Get the raw QR modules
        const qr = QRCodeLib.create(value, { errorCorrectionLevel: level })
        const modules = qr.modules
        const moduleCount = modules.size
        const moduleSize = size / (moduleCount + 2) // +2 for margin
        const offset = moduleSize // 1 module margin

        // Draw background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, size, size)

        // Draw modules
        ctx.fillStyle = fgColor
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (modules.get(row, col)) {
              const x = offset + col * moduleSize
              const y = offset + row * moduleSize
              const isFinder = isFinderPattern(row, col, moduleCount)

              if (isFinder) {
                CORNER_STYLES[cornerStyle](ctx, x, y, moduleSize)
              } else {
                DOT_STYLES[dotStyle](ctx, x, y, moduleSize)
              }
            }
          }
        }

        // Draw logo
        if (logoSrc) {
          const img = new Image()
          img.onload = () => {
            const logoW = size * logoSize
            const logoH = logoW * (img.height / img.width)
            const logoX = (size - logoW) / 2
            const logoY = (size - logoH) / 2

            // White background behind logo
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(logoX - 4, logoY - 4, logoW + 8, logoH + 8)

            ctx.drawImage(img, logoX, logoY, logoW, logoH)
          }
          img.src = logoSrc
        }

        setError(null)
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [value, size, level, fgColor, bgColor, dotStyle, cornerStyle, logoSrc, logoSize])

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  return <canvas ref={canvasRef} width={size} height={size} />
}
