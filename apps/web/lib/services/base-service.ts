import { notifyError } from "@/lib/toast"

export class BaseService {
    protected static async handleRequest<T>(request: Promise<any>): Promise<T | null> {
        try {
            const { data, error } = await request
            if (error) throw error
            return data as T
        } catch (error) {
            console.error(`[Service Error]:`, error)
            notifyError(error, "Falha na comunicação com o banco de dados")
            return null
        }
    }

    protected static async handleFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
        try {
            const res = await fetch(url, options)
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP Error: ${res.status}`)
            }
            return await res.json() as T
        } catch (error) {
            console.error(`[Fetch Error ${url}]:`, error)
            notifyError(error, "Erro ao processar requisição")
            return null
        }
    }
}
