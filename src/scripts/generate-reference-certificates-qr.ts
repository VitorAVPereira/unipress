import { PDFDocument, rgb } from 'pdf-lib'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import QRCode from 'qrcode'
import sharp from 'sharp'

export const REFERENCE_CERTIFICATES_URL = 'https://www.unipress.com.br/certificados-padroes'

const ERROR_CORRECTION_LEVEL = 'M' as const
const QUIET_ZONE_MODULES = 4
const PNG_SIZE = 2400
const PDF_SIZE = 600

type QRMatrix = ReturnType<typeof QRCode.create>['modules']

function matrixRectangles(matrix: QRMatrix) {
  const rectangles: Array<{ column: number; row: number }> = []
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (matrix.get(row, column)) rectangles.push({ column, row })
    }
  }
  return rectangles
}

function createSVG(matrix: QRMatrix, rectangles: ReturnType<typeof matrixRectangles>) {
  const totalModules = matrix.size + QUIET_ZONE_MODULES * 2
  const modules = rectangles
    .map(
      ({ column, row }) =>
        `<rect x="${column + QUIET_ZONE_MODULES}" y="${row + QUIET_ZONE_MODULES}" width="1" height="1"/>`,
    )
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PNG_SIZE}" height="${PNG_SIZE}" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">`,
    `<title>QR Code - Certificados dos padrões UniPress</title>`,
    `<rect width="${totalModules}" height="${totalModules}" fill="#fff"/>`,
    `<g fill="#000">${modules}</g>`,
    '</svg>',
  ].join('')
}

async function createPDF(matrix: QRMatrix, rectangles: ReturnType<typeof matrixRectangles>) {
  const document = await PDFDocument.create()
  document.setTitle('QR Code - Certificados dos padrões UniPress')
  document.setSubject(REFERENCE_CERTIFICATES_URL)
  document.setCreator('UniPress')
  document.setProducer('UniPress')
  document.setCreationDate(new Date(0))
  document.setModificationDate(new Date(0))

  const page = document.addPage([PDF_SIZE, PDF_SIZE])
  page.drawRectangle({ x: 0, y: 0, width: PDF_SIZE, height: PDF_SIZE, color: rgb(1, 1, 1) })

  const totalModules = matrix.size + QUIET_ZONE_MODULES * 2
  const moduleSize = PDF_SIZE / totalModules
  for (const { column, row } of rectangles) {
    page.drawRectangle({
      x: (column + QUIET_ZONE_MODULES) * moduleSize,
      y: PDF_SIZE - (row + QUIET_ZONE_MODULES + 1) * moduleSize,
      width: moduleSize,
      height: moduleSize,
      color: rgb(0, 0, 0),
      borderWidth: 0,
    })
  }

  return document.save({ useObjectStreams: false })
}

export async function generateReferenceCertificatesQR(outputDirectory: string): Promise<void> {
  const matrix = QRCode.create(REFERENCE_CERTIFICATES_URL, { errorCorrectionLevel: ERROR_CORRECTION_LEVEL }).modules
  const rectangles = matrixRectangles(matrix)
  const svg = createSVG(matrix, rectangles)
  const pdf = await createPDF(matrix, rectangles)

  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    sharp(Buffer.from(svg))
      .resize(PNG_SIZE, PNG_SIZE, { fit: 'fill', kernel: 'nearest' })
      .threshold(128)
      .png({ compressionLevel: 9, palette: true })
      .toFile(path.join(outputDirectory, 'certificados-padroes.png')),
    writeFile(path.join(outputDirectory, 'certificados-padroes.svg'), `${svg}\n`, 'utf8'),
    writeFile(path.join(outputDirectory, 'certificados-padroes.pdf'), pdf),
  ])
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : ''
if (import.meta.url === invokedPath) {
  await generateReferenceCertificatesQR(path.resolve(process.cwd(), 'docs/qr-code'))
}
