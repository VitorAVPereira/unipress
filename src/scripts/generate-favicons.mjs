import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDirectory = new URL('../../public/', import.meta.url)
const svg = await readFile(new URL('favicon.svg', publicDirectory))
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()))

// ICO directory followed by one PNG image for each browser icon size.
const header = Buffer.alloc(6 + 16 * images.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = header.length
images.forEach((image, index) => {
  const entry = 6 + index * 16
  header[entry] = sizes[index]
  header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
})

await writeFile(new URL('favicon.ico', publicDirectory), Buffer.concat([header, ...images]))
await sharp(svg).resize(180, 180).flatten({ background: '#fff' }).png()
  .toFile(fileURLToPath(new URL('apple-touch-icon.png', publicDirectory)))

console.log('Generated UniPress favicon.ico (16, 32, 48 px) and apple-touch-icon.png (180 px).')
