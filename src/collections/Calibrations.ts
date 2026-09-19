import type { CollectionConfig } from 'payload'

import { adminOnly, calibrationsReadAccess } from '@/access/portal'
import { hasCertificateYearMismatch, validateCertificateNumber } from '@/lib/clientPortal'
import {
  auditCalibrationChange,
  auditCalibrationDelete,
  hidePrivateUploadMetadata,
  validateCalibrationUpload,
} from '@/hooks/calibrationLifecycle'

export const Calibrations: CollectionConfig = {
  slug: 'calibrations',
  labels: { singular: 'Calibração', plural: 'Calibrações' },
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: calibrationsReadAccess,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['calibrationDate', 'certificateNumber', 'tag', 'client'],
    group: 'Área do cliente',
    useAsTitle: 'certificateNumber',
  },
  hooks: {
    afterChange: [auditCalibrationChange],
    afterDelete: [auditCalibrationDelete],
    afterRead: [hidePrivateUploadMetadata],
    beforeValidate: [validateCalibrationUpload],
  },
  fields: [
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Cliente',
      index: true,
      required: true,
    },
    {
      name: 'calibrationDate',
      type: 'date',
      label: 'Data da calibração',
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
      index: true,
      required: true,
    },
    {
      name: 'certificateNumber',
      type: 'text',
      label: 'Número do certificado',
      index: true,
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
      },
      validate: (value: unknown) =>
        typeof value === 'string' && validateCertificateNumber(value)
          ? true
          : 'Use o formato 00000/AAAA.',
    },
    {
      name: 'tag',
      type: 'text',
      label: 'Tag do instrumento',
      index: true,
      required: true,
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
      },
    },
    {
      name: 'yearMismatchConfirmed',
      type: 'checkbox',
      label: 'Confirmo que o ano divergente está correto',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) =>
          hasCertificateYearMismatch(siblingData?.certificateNumber || '', siblingData?.calibrationDate || ''),
        description: 'O ano do certificado diverge do ano da calibração. Confirme para salvar a exceção.',
      },
      validate: (value, { siblingData }) => {
        const calibration = (siblingData || {}) as { calibrationDate?: string; certificateNumber?: string }
        return !hasCertificateYearMismatch(calibration.certificateNumber || '', calibration.calibrationDate || '') || value
          ? true
          : 'Confirme a divergência de ano antes de salvar.'
      },
    },
  ],
  upload: {
    bulkUpload: false,
    displayPreview: false,
    filesRequiredOnCreate: true,
    mimeTypes: ['application/pdf'],
    pasteURL: false,
    staticDir: 'public/calibrations',
  },
  timestamps: true,
}
