'use client'

import { ReactNode } from 'react'

type ModalSize = 'md' | 'lg' | 'xl'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** md = 768px, lg = 896px, xl = 1152px (critérios) */
  size?: ModalSize
}

const sizeClasses: Record<ModalSize, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          className={`relative z-10 w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl`}
        >
          <div className="flex-shrink-0 px-4 pt-5 pb-2 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 p-1"
              >
                <span className="sr-only">Fechar</span>
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
            {children}
          </div>
          {footer && (
            <div className="flex-shrink-0 bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}