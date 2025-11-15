import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Configuração do Redis para rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Rate limiters para diferentes tipos de endpoints
export const ratelimit = {
  // Auth endpoints: 5 requests per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth",
  }),

  // General API endpoints: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/api",
  }),

  // Sensitive operations: 10 requests per minute
  sensitive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/sensitive",
  }),

  // Public endpoints: 50 requests per minute
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/public",
  }),
};

// Tipos de rate limiting
export type RateLimitType = keyof typeof ratelimit;

// Função para aplicar rate limiting
export async function applyRateLimit(
  request: NextRequest,
  type: RateLimitType = "api",
  identifier?: string
): Promise<NextResponse | null> {
  try {
    // Identificar o usuário por IP ou sessão
    const xff = request.headers.get("x-forwarded-for") || "";
    const xri = request.headers.get("x-real-ip") || "";
    const ip = (xff.split(",")[0].trim() || xri || "unknown");
    const sessionId = request.cookies.get("golffox-session")?.value ?? "anonymous";
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    
    // Criar identificador único
    const id = identifier || `${ip}:${sessionId.substring(0, 20)}:${userAgent.substring(0, 20)}`;
    
    // Aplicar rate limit
    const { success, limit, reset, remaining } = await ratelimit[type].limit(id);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: "rate_limit_exceeded",
          message: "Muitas requisições. Por favor, tente novamente mais tarde.",
          limit,
          remaining,
          reset: new Date(reset).toISOString()
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    return null; // Sucesso - não bloquear
  } catch (error) {
    console.error("Erro ao aplicar rate limiting:", error);
    // Em caso de erro no Redis, permitir a requisição (fail-open)
    return null;
  }
}

// Wrapper para handlers de API com rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = "api",
  identifier?: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await applyRateLimit(req, type, identifier);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(req);
  };
}
