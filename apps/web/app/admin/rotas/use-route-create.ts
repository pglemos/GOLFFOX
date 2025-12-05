import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { notifyError } from "@/lib/toast"
import { geocodeAddress } from "@/lib/geocoding"
import type { EmployeeLite, OptimizeRouteResponse, RouteFormData } from "@/types/routes"

export function useRouteCreate(isOpen: boolean) {
    const [formData, setFormData] = useState<Partial<RouteFormData>>({
        name: "",
        company_id: "",
        description: "",
        origin_address: "",
        origin_lat: 0,
        origin_lng: 0,
        destination_address: "",
        destination_lat: 0,
        destination_lng: 0,
        scheduled_time: "",
        shift: "manha",
        days_of_week: [],
        exceptions: [],
        is_active: true,
        selected_employees: [],
    })

    const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
    const [loadingCompanies, setLoadingCompanies] = useState(false)
    const [employees, setEmployees] = useState<EmployeeLite[]>([])
    const [loadingEmployees, setLoadingEmployees] = useState(false)
    const [searchEmployee, setSearchEmployee] = useState("")
    const [selectedDriver, setSelectedDriver] = useState<{ id: string; name: string; documents_valid?: boolean } | null>(null)
    const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; plate: string; capacity: number } | null>(null)
    const [optimizationResult, setOptimizationResult] = useState<OptimizeRouteResponse | null>(null)
    const [optimizing, setOptimizing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [warnings, setWarnings] = useState<string[]>([])
    const [newException, setNewException] = useState("")

    useEffect(() => {
        if (isOpen) {
            loadCompanies()
        } else {
            resetForm()
        }
    }, [isOpen])

    useEffect(() => {
        if (formData.company_id) {
            loadEmployees()
            loadCompanyAddress()
        }
    }, [formData.company_id])

    const resetForm = () => {
        setFormData({
            name: "",
            company_id: "",
            description: "",
            origin_address: "",
            origin_lat: 0,
            origin_lng: 0,
            destination_address: "",
            destination_lat: 0,
            destination_lng: 0,
            scheduled_time: "",
            shift: "manha",
            days_of_week: [],
            exceptions: [],
            is_active: true,
            selected_employees: [],
        })
        setSelectedDriver(null)
        setSelectedVehicle(null)
        setOptimizationResult(null)
        setWarnings([])
        setNewException("")
        setSearchEmployee("")
    }

    const loadCompanies = async () => {
        setLoadingCompanies(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const headers: HeadersInit = {}
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }

            const response = await fetch('/api/admin/companies-list', {
                headers,
                credentials: 'include',
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const result = await response.json()

            if (result.success && result.companies && Array.isArray(result.companies)) {
                const companiesData = (result.companies || []).filter((c: any) => c.is_active !== false)
                const formattedCompanies = companiesData.map((c: any) => ({
                    id: c.id,
                    name: c.name || 'Sem nome'
                })).filter((c: any) => c.id && c.name)

                setCompanies(formattedCompanies)
            } else {
                throw new Error(result.error || 'Erro ao carregar empresas')
            }
        } catch (error: any) {
            console.error("Erro ao carregar empresas:", error)
            try {
                const { data, error: supabaseError } = await supabase
                    .from("companies")
                    .select("id, name")
                    .order("name", { ascending: true })

                if (supabaseError) throw supabaseError

                const formatted = (data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name || 'Sem nome'
                })).filter((c: any) => c.id && c.name)

                setCompanies(formatted)
            } catch (fallbackError: any) {
                console.error("Erro no fallback:", fallbackError)
                setCompanies([])
            }
        } finally {
            setLoadingCompanies(false)
        }
    }

    const loadEmployees = async () => {
        if (!formData.company_id) return

        setLoadingEmployees(true)
        try {
            let { data, error } = await (supabase
                .from("v_company_employees_secure")
                .select("*")
                .eq("company_id", formData.company_id) as any)

            if (error && (error.message?.includes("does not exist") || (error as any).code === "PGRST205")) {
                try {
                    const response = await fetch(`/api/admin/employees-list?company_id=${formData.company_id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    })

                    if (response.ok) {
                        const result = await response.json()
                        if (result.success && result.employees) {
                            setEmployees(result.employees as EmployeeLite[])
                            return
                        }
                    }
                } catch (apiError) {
                    console.error("Erro API funcionários:", apiError)
                }

                const { data: empData, error: empError } = await supabase
                    .from("gf_employee_company")
                    .select("id, company_id, name, cpf, address, latitude, longitude")
                    .eq("company_id", formData.company_id)

                if (empError) throw empError

                data = (empData || []).map((emp: any) => ({
                    employee_id: emp.id,
                    company_id: emp.company_id,
                    first_name: emp.name?.split(" ")[0] || "",
                    last_name: emp.name?.split(" ").slice(1).join(" ") || "",
                    cpf: emp.cpf || "",
                    address: emp.address || "",
                    city: "",
                    state: "",
                    zipcode: "",
                    lat: emp.latitude ? parseFloat(emp.latitude.toString()) : null,
                    lng: emp.longitude ? parseFloat(emp.longitude.toString()) : null,
                })) as any

                setEmployees((data || []) as unknown as EmployeeLite[])
                return
            } else if (error) {
                throw error
            }

            setEmployees((data || []) as unknown as EmployeeLite[])
        } catch (error: any) {
            console.error("Erro ao carregar funcionários:", error)
            notifyError(error, "Erro ao carregar funcionários")
        } finally {
            setLoadingEmployees(false)
        }
    }

    const loadCompanyAddress = async () => {
        if (!formData.company_id) return

        try {
            const { data } = await supabase
                .from("companies")
                .select("address")
                .eq("id", formData.company_id)
                .maybeSingle()

            if (data && (data as any).address) {
                const address = (data as any).address
                const geocoded = await geocodeAddress(address)
                if (geocoded) {
                    setFormData((prev) => ({
                        ...prev,
                        destination_address: geocoded.formatted_address,
                        destination_lat: geocoded.lat,
                        destination_lng: geocoded.lng,
                    }))
                } else {
                    setFormData((prev) => ({
                        ...prev,
                        destination_address: address,
                    }))
                }
            }
        } catch (error) {
            console.error("Erro ao carregar endereço da empresa:", error)
        }
    }

    const filteredEmployees = useMemo(() => {
        if (!searchEmployee) return employees

        const query = searchEmployee.toLowerCase().trim()
        const queryNumbers = query.replace(/\D/g, "")

        return employees.filter(
            (e) => {
                const fullName = `${e.first_name} ${e.last_name}`.toLowerCase()
                const cpfNumbers = e.cpf.replace(/\D/g, "")

                return (
                    fullName.includes(query) ||
                    fullName.startsWith(query) ||
                    cpfNumbers.includes(queryNumbers) ||
                    cpfNumbers.startsWith(queryNumbers)
                )
            }
        )
    }, [employees, searchEmployee])

    const addException = () => {
        if (!newException) return

        let dateStr = newException.trim()
        const parts = dateStr.split('/')

        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0')
            const month = parts[1].padStart(2, '0')
            const year = parts[2]
            dateStr = `${year}-${month}-${day}`
        }

        const exceptions = formData.exceptions || []
        if (!exceptions.includes(dateStr)) {
            setFormData((prev) => ({ ...prev, exceptions: [...exceptions, dateStr] }))
            setNewException("")
        }
    }

    const removeException = (date: string) => {
        const exceptions = formData.exceptions || []
        setFormData((prev) => ({ ...prev, exceptions: exceptions.filter(e => e !== date) }))
    }

    const toggleEmployee = (employeeId: string) => {
        setFormData((prev) => {
            const selected = prev.selected_employees || []
            const newSelected = selected.includes(employeeId)
                ? selected.filter((id) => id !== employeeId)
                : [...selected, employeeId]
            return { ...prev, selected_employees: newSelected }
        })
    }

    return {
        formData, setFormData,
        companies, loadingCompanies,
        employees, loadingEmployees, loadEmployees,
        searchEmployee, setSearchEmployee, filteredEmployees,
        selectedDriver, setSelectedDriver,
        selectedVehicle, setSelectedVehicle,
        optimizationResult, setOptimizationResult,
        optimizing, setOptimizing,
        saving, setSaving,
        warnings, setWarnings,
        newException, setNewException,
        addException, removeException, toggleEmployee
    }
}
