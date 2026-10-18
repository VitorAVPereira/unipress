'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

type GalleryImage = {
  url: string
  alt: string
}

type ProductGalleryProps = {
  images: GalleryImage[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]
  const hasMultipleImages = images.length > 1

  const selectPrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length)
  }

  const selectNext = () => {
    setActiveIndex((current) => (current + 1) % images.length)
  }

  if (!activeImage) return null

  return (
    <div
      className="detail-gallery"
      role="group"
      aria-label="Galeria do produto"
      tabIndex={hasMultipleImages ? 0 : undefined}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') selectPrevious()
        if (event.key === 'ArrowRight') selectNext()
      }}
    >
      <div className="detail-gallery-stage">
        <Image
          className="detail-product-image"
          src={activeImage.url}
          alt={activeImage.alt}
          aria-label={`${activeImage.alt} — imagem ${activeIndex + 1} de ${images.length}`}
          width={900}
          height={900}
          priority={activeIndex === 0}
        />
        {hasMultipleImages ? (
          <>
            <button
              type="button"
              className="detail-gallery-arrow detail-gallery-arrow-previous"
              aria-label="Imagem anterior"
              onClick={selectPrevious}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="detail-gallery-arrow detail-gallery-arrow-next"
              aria-label="Próxima imagem"
              onClick={selectNext}
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="detail-gallery-counter" aria-hidden="true">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      <p className="sr-only" role="status">
        Imagem {activeIndex + 1} de {images.length}: {activeImage.alt}
      </p>

      {hasMultipleImages ? (
        <div className="detail-thumbnails" aria-label="Miniaturas do produto">
          {images.map((image, index) => (
            <button
              type="button"
              className={index === activeIndex ? 'is-active' : undefined}
              aria-label={`Exibir ${image.alt}`}
              aria-pressed={index === activeIndex}
              key={`${image.url}-${index}`}
              onClick={() => setActiveIndex(index)}
            >
              <Image src={image.url} alt="" width={160} height={160} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
