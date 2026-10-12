'use client'

import { Download, Eye, FileText, History, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { normalizeReferenceTag } from '@/lib/referenceCertificates'
import type {
  PublicReferenceCertificate,
  PublicReferenceStandard,
} from '@/lib/publicReferenceCertificates'

function CertificateActions({ certificate }: { certificate: PublicReferenceCertificate }) {
  return (
    <div className="reference-certificate-actions">
      <a
        aria-label={`Visualizar ${certificate.label}`}
        className="button button-primary"
        href={certificate.viewHref}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Eye aria-hidden="true" size={17} /> Visualizar
      </a>
      <a
        aria-label={`Baixar ${certificate.label}`}
        className="button button-outline"
        download
        href={certificate.downloadHref}
      >
        <Download aria-hidden="true" size={17} /> Baixar
      </a>
    </div>
  )
}

function ReferenceStandardCard({ standard }: { standard: PublicReferenceStandard }) {
  return (
    <article className="reference-standard-card">
      <header className="reference-standard-heading">
        <span>TAG / identificação</span>
        <h2>{standard.tag}</h2>
      </header>

      <div className="reference-current-certificate">
        <div className="reference-certificate-copy">
          <FileText aria-hidden="true" size={28} />
          <div>
            <span className="reference-current-label">Certificado atual</span>
            <strong>{standard.current.label}</strong>
          </div>
        </div>
        <CertificateActions certificate={standard.current} />
      </div>

      {standard.history.length > 0 && (
        <details className="reference-history">
          <summary>
            <History aria-hidden="true" size={18} />
            <span>Histórico de certificados</span>
            <small>{standard.history.length}</small>
          </summary>
          <div className="reference-history-list">
            {standard.history.map((certificate) => (
              <div className="reference-history-row" key={certificate.id}>
                <strong>{certificate.label}</strong>
                <CertificateActions certificate={certificate} />
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  )
}

export function ReferenceCertificateSearch({ standards }: { standards: PublicReferenceStandard[] }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeReferenceTag(query)
  const filteredStandards = useMemo(
    () => standards.filter((standard) => standard.searchKey.includes(normalizedQuery)),
    [normalizedQuery, standards],
  )

  if (standards.length === 0) {
    return (
      <div className="empty-state reference-empty-state">
        <span>Conteúdo em atualização</span>
        <h2>Nenhum certificado está disponível.</h2>
        <p>Os certificados publicados dos padrões UniPress aparecerão aqui assim que estiverem disponíveis.</p>
      </div>
    )
  }

  return (
    <div className="reference-certificates-browser">
      <div className="reference-certificate-toolbar">
        <label className="search-field">
          <Search aria-hidden="true" size={19} />
          <span className="sr-only">Pesquisar por TAG</span>
          <input
            aria-label="Pesquisar por TAG"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite a TAG do padrão"
            type="search"
            value={query}
          />
        </label>
        <p aria-live="polite" className="reference-result-count">
          <strong>{filteredStandards.length}</strong>{' '}
          {filteredStandards.length === 1 ? 'TAG encontrada' : 'TAGs encontradas'}
        </p>
      </div>

      {filteredStandards.length > 0 ? (
        <div className="reference-standard-list">
          {filteredStandards.map((standard) => (
            <ReferenceStandardCard key={standard.id} standard={standard} />
          ))}
        </div>
      ) : (
        <div className="empty-state reference-search-empty">
          <span>0 resultados</span>
          <h2>Nenhuma TAG encontrada.</h2>
          <p>Confira a identificação informada.</p>
          <span className="sr-only">Nenhuma TAG encontrada. Confira a identificação informada.</span>
        </div>
      )}
    </div>
  )
}
