'use client'

import { useState } from 'react'
import Button from './Button'
import Modal from './Modal'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface CRUDTableProps {
  title: string
  columns: Column[]
  data: any[]
  onCreate: (data: any) => Promise<void>
  onUpdate: (id: string, data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  formFields: (data?: any, onChange?: (field: string, value: any) => void) => React.ReactNode
  loading?: boolean
  /** Modal mais largo: md 768px, lg 896px, xl 1152px (ex.: critérios) */
  modalSize?: 'md' | 'lg' | 'xl'
}

export default function CRUDTable({
  title,
  columns,
  data,
  onCreate,
  onUpdate,
  onDelete,
  formFields,
  loading = false,
  modalSize = 'md',
}: CRUDTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({})
    setError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingItem(item)
    setFormData(item)
    setError(null)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({})
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, formData)
      } else {
        await onCreate(formData)
      }
      // Só fecha o modal se não houve erro (onCreate/onUpdate devem lançar erro se falharem)
      handleClose()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      const errorMessage = error?.message || error?.error || 'Erro ao salvar. Verifique os dados e tente novamente.'
      setError(errorMessage)
      // Não fecha o modal se houver erro, para o usuário poder corrigir
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await onDelete(id)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <Button onClick={handleOpenCreate}>Criar Novo</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center">
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  Nenhum item encontrado
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] || '')}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingItem ? `Editar ${title}` : `Criar ${title}`}
        size={modalSize}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">Erro ao salvar</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
          {formFields(formData, (field, value) => {
            setFormData((prev: any) => ({ ...prev, [field]: value }))
          })}
        </div>
      </Modal>
    </div>
  )
}