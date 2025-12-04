import {
  formatCPF,
  formatPhone,
  formatCEP,
  formatCNPJ,
  unformatNumber,
  isValidCPFFormat,
  isValidPhoneFormat,
  isValidCEPFormat,
  isValidCNPJFormat,
} from '@/lib/format-utils'

describe('format-utils', () => {
  describe('formatCPF', () => {
    it('deve formatar CPF completo', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00')
    })

    it('deve formatar CPF parcial', () => {
      expect(formatCPF('123456')).toBe('123.456')
      expect(formatCPF('123')).toBe('123')
    })

    it('deve remover caracteres não numéricos', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00')
      expect(formatCPF('abc123def456')).toBe('123.456')
    })

    it('deve limitar a 11 dígitos', () => {
      expect(formatCPF('12345678900123')).toBe('123.456.789-00')
    })
  })

  describe('formatPhone', () => {
    it('deve formatar telefone completo', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
    })

    it('deve formatar telefone parcial', () => {
      expect(formatPhone('11')).toBe('11')
      expect(formatPhone('1199999')).toBe('(11) 99999')
    })

    it('deve remover caracteres não numéricos', () => {
      expect(formatPhone('(11) 99999-9999')).toBe('(11) 99999-9999')
    })
  })

  describe('formatCEP', () => {
    it('deve formatar CEP completo', () => {
      expect(formatCEP('12345678')).toBe('12345-678')
    })

    it('deve formatar CEP parcial', () => {
      expect(formatCEP('12345')).toBe('12345')
    })

    it('deve limitar a 8 dígitos', () => {
      expect(formatCEP('123456789012')).toBe('12345-678')
    })
  })

  describe('formatCNPJ', () => {
    it('deve formatar CNPJ completo', () => {
      expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90')
    })

    it('deve formatar CNPJ parcial', () => {
      expect(formatCNPJ('12')).toBe('12')
      expect(formatCNPJ('12345')).toBe('12.345')
    })
  })

  describe('unformatNumber', () => {
    it('deve remover formatação', () => {
      expect(unformatNumber('123.456.789-00')).toBe('12345678900')
      expect(unformatNumber('(11) 99999-9999')).toBe('11999999999')
      expect(unformatNumber('12345-678')).toBe('12345678')
    })
  })

  describe('isValidCPFFormat', () => {
    it('deve validar CPF formatado corretamente', () => {
      expect(isValidCPFFormat('123.456.789-00')).toBe(true)
      expect(isValidCPFFormat('12345678900')).toBe(false)
      expect(isValidCPFFormat('123.456.789')).toBe(false)
    })
  })

  describe('isValidPhoneFormat', () => {
    it('deve validar telefone formatado corretamente', () => {
      expect(isValidPhoneFormat('(11) 99999-9999')).toBe(true)
      expect(isValidPhoneFormat('11999999999')).toBe(false)
      expect(isValidPhoneFormat('(11) 9999-9999')).toBe(false)
    })
  })

  describe('isValidCEPFormat', () => {
    it('deve validar CEP formatado corretamente', () => {
      expect(isValidCEPFormat('12345-678')).toBe(true)
      expect(isValidCEPFormat('12345678')).toBe(false)
      expect(isValidCEPFormat('12345-67')).toBe(false)
    })
  })

  describe('isValidCNPJFormat', () => {
    it('deve validar CNPJ formatado corretamente', () => {
      expect(isValidCNPJFormat('12.345.678/0001-90')).toBe(true)
      expect(isValidCNPJFormat('12345678000190')).toBe(false)
    })
  })
})

