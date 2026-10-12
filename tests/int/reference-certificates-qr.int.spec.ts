// @vitest-environment node

import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import jsQR from 'jsqr'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  REFERENCE_CERTIFICATES_URL,
  generateReferenceCertificatesQR,
} from '@/scripts/generate-reference-certificates-qr'

Object.assign(globalThis, { DOMMatrix, ImageData, Path2D })

const artifactDirectory = path.resolve(process.cwd(), 'docs/qr-code')

async function decodeRaster(input: Buffer) {
  const { data, info } = await sharp(input)
    .flatten({ background: '#fff' })
    .threshold(128)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)
  return {
    decoded: jsQR(pixels, info.width, info.height),
    height: info.height,
    pixels,
    width: info.width,
  }
}

function expectQuietZone(pixels: Uint8ClampedArray, width: number, height: number) {
  let left = width
  let right = -1
  let top = height
  let bottom = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (pixels[offset] > 32 || pixels[offset + 1] > 32 || pixels[offset + 2] > 32) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }

  const modules = QRCode.create(REFERENCE_CERTIFICATES_URL, { errorCorrectionLevel: 'M' }).modules.size
  const minimumQuietZone = Math.floor((4 * width) / (modules + 8)) - 2
  expect(Math.min(left, top, width - right - 1, height - bottom - 1)).toBeGreaterThanOrEqual(minimumQuietZone)
}

describe('QR permanente dos certificados dos padrões', () => {
  it('mantém uma única URL pública canônica', () => {
    expect(REFERENCE_CERTIFICATES_URL).toBe('https://www.unipress.com.br/certificados-padroes')
    expect(generateReferenceCertificatesQR).toBeTypeOf('function')
  })

  it('entrega PNG quadrado, preto e branco, decodificável e com margem segura', async () => {
    const png = await readFile(path.join(artifactDirectory, 'certificados-padroes.png'))
    const image = await decodeRaster(png)

    expect([image.width, image.height]).toEqual([2400, 2400])
    expect(image.decoded?.data).toBe(REFERENCE_CERTIFICATES_URL)
    expectQuietZone(image.pixels, image.width, image.height)
  })

  it('entrega SVG vetorial decodificável com o mesmo conteúdo', async () => {
    const svg = await readFile(path.join(artifactDirectory, 'certificados-padroes.svg'))
    const image = await decodeRaster(svg)

    expect(image.decoded?.data).toBe(REFERENCE_CERTIFICATES_URL)
    expectQuietZone(image.pixels, image.width, image.height)
  })

  it('entrega PDF vetorial de uma página que renderiza e decodifica', async () => {
    const pdf = await readFile(path.join(artifactDirectory, 'certificados-padroes.pdf'))
    const document = await getDocument({ data: new Uint8Array(pdf) }).promise
    expect(document.numPages).toBe(1)

    const page = await document.getPage(1)
    const viewport = page.getViewport({ scale: 4 })
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height))
    const context = canvas.getContext('2d')
    await page.render({ canvas: canvas as never, canvasContext: context as never, viewport }).promise

    const rendered = await decodeRaster(canvas.toBuffer('image/png'))
    expect(rendered.decoded?.data).toBe(REFERENCE_CERTIFICATES_URL)
    expectQuietZone(rendered.pixels, rendered.width, rendered.height)

  })
})
