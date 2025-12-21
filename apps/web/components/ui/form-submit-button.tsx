"use client"

import { useFormStatus } from 'react-dom'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

interface FormSubmitButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  loadingText?: string
}

/**
 * Botão de submit que usa useFormStatus do React 19
 * Automaticamente mostra estado de loading quando o formulário está sendo submetido
 */
export function FormSubmitButton({
  children,
  loadingText,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || 'Salvando...'}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

