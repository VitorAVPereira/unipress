import Link from 'next/link'
import Image from 'next/image'

export function Logo({ image }: { image?: { url: string; alt: string } }) {
  return (
    <Link className="brand" href="/" aria-label="UniPress — página inicial">
      {image ? (
        <Image className="brand-image" src={image.url} alt={image.alt || 'UniPress'} width={210} height={60} priority />
      ) : (
        <>
          <span className="brand-mark" aria-hidden="true"><span className="brand-needle" /></span>
          <span className="brand-word">Uni<span>Press</span></span>
        </>
      )}
    </Link>
  )
}
