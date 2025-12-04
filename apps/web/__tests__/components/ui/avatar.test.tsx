/**
 * Testes para Avatar Component
 */

import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// Mock Radix UI Avatar
jest.mock('@radix-ui/react-avatar', () => ({
  Root: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="avatar-root" className={className} {...props}>
      {children}
    </div>
  )),
  Image: React.forwardRef(({ src, alt, className, ...props }: any, ref: any) => (
    <img
      ref={ref}
      data-testid="avatar-image"
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  )),
  Fallback: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="avatar-fallback" className={className} {...props}>
      {children}
    </div>
  )),
}))

const React = require('react')

describe('Avatar', () => {
  it('deve renderizar avatar', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )

    expect(screen.getByTestId('avatar-root')).toBeInTheDocument()
  })

  it('deve renderizar imagem quando src fornecido', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )

    const image = screen.getByTestId('avatar-image')
    expect(image).toHaveAttribute('src', '/avatar.jpg')
    expect(image).toHaveAttribute('alt', 'User')
  })

  it('deve renderizar fallback quando imagem não carrega', () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )

    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('deve aplicar className customizada', () => {
    render(
      <Avatar className="custom-avatar">
        <AvatarImage src="/avatar.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )

    expect(screen.getByTestId('avatar-root')).toHaveClass('custom-avatar')
  })

  it('deve aceitar ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <Avatar ref={ref}>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

