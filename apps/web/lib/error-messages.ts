/**
 * Error Messages
 * 
 * Mensagens de erro padronizadas e traduzidas para melhor UX
 */

export interface ErrorMessageConfig {
  /** Mensagem amigável para o usuário */
  userMessage: string
  /** Mensagem técnica (para logs) */
  technicalMessage?: string
  /** Sugestão de ação para o usuário */
  actionSuggestion?: string
  /** Se true, indica que o usuário deve tentar novamente */
  retryable?: boolean
}

/**
 * Mapeamento de códigos de status HTTP para mensagens amigáveis
 */
export const HTTP_ERROR_MESSAGES: Record<number, ErrorMessageConfig> = {
  400: {
    userMessage: 'Os dados enviados são inválidos. Por favor, verifique e tente novamente.',
    technicalMessage: 'Bad Request - Dados inválidos na requisição',
    actionSuggestion: 'Verifique os campos do formulário e tente novamente.',
    retryable: false,
  },
  401: {
    userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
    technicalMessage: 'Unauthorized - Sessão expirada ou token inválido',
    actionSuggestion: 'Faça login novamente para continuar.',
    retryable: false,
  },
  403: {
    userMessage: 'Você não tem permissão para realizar esta ação.',
    technicalMessage: 'Forbidden - Acesso negado',
    actionSuggestion: 'Entre em contato com o administrador se acredita que deveria ter acesso.',
    retryable: false,
  },
  404: {
    userMessage: 'O recurso solicitado não foi encontrado.',
    technicalMessage: 'Not Found - Recurso não existe',
    actionSuggestion: 'Verifique se o endereço está correto ou tente novamente mais tarde.',
    retryable: true,
  },
  408: {
    userMessage: 'A requisição demorou muito para responder. Tente novamente.',
    technicalMessage: 'Request Timeout - Requisição excedeu tempo limite',
    actionSuggestion: 'Verifique sua conexão com a internet e tente novamente.',
    retryable: true,
  },
  409: {
    userMessage: 'Já existe um registro com estes dados.',
    technicalMessage: 'Conflict - Recurso já existe',
    actionSuggestion: 'Verifique se os dados não foram duplicados e tente novamente.',
    retryable: false,
  },
  429: {
    userMessage: 'Muitas requisições. Por favor, aguarde um momento e tente novamente.',
    technicalMessage: 'Too Many Requests - Rate limit excedido',
    actionSuggestion: 'Aguarde alguns segundos antes de tentar novamente.',
    retryable: true,
  },
  500: {
    userMessage: 'Erro interno do servidor. Nossa equipe foi notificada.',
    technicalMessage: 'Internal Server Error - Erro no servidor',
    actionSuggestion: 'Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.',
    retryable: true,
  },
  502: {
    userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
    technicalMessage: 'Bad Gateway - Serviço externo indisponível',
    actionSuggestion: 'Aguarde alguns momentos e tente novamente.',
    retryable: true,
  },
  503: {
    userMessage: 'Serviço temporariamente indisponível para manutenção.',
    technicalMessage: 'Service Unavailable - Serviço em manutenção',
    actionSuggestion: 'Tente novamente em alguns minutos.',
    retryable: true,
  },
  504: {
    userMessage: 'O servidor demorou muito para responder. Tente novamente.',
    technicalMessage: 'Gateway Timeout - Timeout no gateway',
    actionSuggestion: 'Verifique sua conexão e tente novamente.',
    retryable: true,
  },
}

/**
 * Mensagens de erro para tipos específicos de operações
 */
export const OPERATION_ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  NETWORK_ERROR: {
    userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
    technicalMessage: 'Network Error - Falha na conexão de rede',
    actionSuggestion: 'Verifique sua conexão com a internet e tente novamente.',
    retryable: true,
  },
  TIMEOUT_ERROR: {
    userMessage: 'A operação demorou muito para concluir. Tente novamente.',
    technicalMessage: 'Timeout Error - Operação excedeu tempo limite',
    actionSuggestion: 'Tente novamente. Se o problema persistir, pode ser um problema temporário do servidor.',
    retryable: true,
  },
  VALIDATION_ERROR: {
    userMessage: 'Os dados fornecidos são inválidos. Por favor, verifique e corrija os erros.',
    technicalMessage: 'Validation Error - Dados não passaram na validação',
    actionSuggestion: 'Verifique os campos destacados e corrija os erros antes de tentar novamente.',
    retryable: false,
  },
  AUTHENTICATION_ERROR: {
    userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
    technicalMessage: 'Authentication Error - Sessão inválida ou expirada',
    actionSuggestion: 'Faça login novamente para continuar usando o sistema.',
    retryable: false,
  },
  PERMISSION_ERROR: {
    userMessage: 'Você não tem permissão para realizar esta ação.',
    technicalMessage: 'Permission Error - Acesso negado',
    actionSuggestion: 'Entre em contato com o administrador se acredita que deveria ter acesso.',
    retryable: false,
  },
  NOT_FOUND_ERROR: {
    userMessage: 'O recurso solicitado não foi encontrado.',
    technicalMessage: 'Not Found Error - Recurso não existe',
    actionSuggestion: 'Verifique se o endereço está correto ou tente novamente mais tarde.',
    retryable: true,
  },
  SERVER_ERROR: {
    userMessage: 'Erro interno do servidor. Nossa equipe foi notificada.',
    technicalMessage: 'Server Error - Erro no servidor',
    actionSuggestion: 'Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.',
    retryable: true,
  },
  UNKNOWN_ERROR: {
    userMessage: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    technicalMessage: 'Unknown Error - Erro desconhecido',
    actionSuggestion: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
    retryable: true,
  },
}

/**
 * Obtém mensagem de erro baseada no código de status HTTP
 */
export function getHttpErrorMessage(status: number): ErrorMessageConfig {
  return HTTP_ERROR_MESSAGES[status] || {
    userMessage: 'Ocorreu um erro ao processar sua requisição. Por favor, tente novamente.',
    technicalMessage: `HTTP ${status} - Status code não mapeado`,
    actionSuggestion: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
    retryable: status >= 500 || status === 429,
  }
}

/**
 * Obtém mensagem de erro baseada no tipo de operação
 */
export function getOperationErrorMessage(type: string): ErrorMessageConfig {
  return OPERATION_ERROR_MESSAGES[type] || OPERATION_ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Obtém mensagem de erro baseada em uma exceção
 */
export function getErrorMessageFromError(error: unknown): ErrorMessageConfig {
  if (error instanceof Error) {
    const errorName = error.name
    const errorMessage = error.message.toLowerCase()

    // Verificar se é um erro de rede
    if (errorName === 'TypeError' && errorMessage.includes('fetch')) {
      return OPERATION_ERROR_MESSAGES.NETWORK_ERROR
    }

    // Verificar se é timeout
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return OPERATION_ERROR_MESSAGES.TIMEOUT_ERROR
    }

    // Verificar se é erro de autenticação
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return OPERATION_ERROR_MESSAGES.AUTHENTICATION_ERROR
    }

    // Verificar se é erro de permissão
    if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      return OPERATION_ERROR_MESSAGES.PERMISSION_ERROR
    }

    // Verificar se é erro de validação
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return OPERATION_ERROR_MESSAGES.VALIDATION_ERROR
    }

    // Verificar se é erro de não encontrado
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return OPERATION_ERROR_MESSAGES.NOT_FOUND_ERROR
    }
  }

  return OPERATION_ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Formata mensagem de erro completa para exibição ao usuário
 */
export function formatUserErrorMessage(
  error: unknown,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage
  }

  const errorConfig = getErrorMessageFromError(error)
  return errorConfig.userMessage
}

/**
 * Obtém sugestão de ação baseada no erro
 */
export function getErrorActionSuggestion(error: unknown): string | undefined {
  const errorConfig = getErrorMessageFromError(error)
  return errorConfig.actionSuggestion
}

/**
 * Verifica se um erro é retryable (pode ser tentado novamente)
 */
export function isRetryableError(error: unknown): boolean {
  const errorConfig = getErrorMessageFromError(error)
  return errorConfig.retryable ?? true
}

