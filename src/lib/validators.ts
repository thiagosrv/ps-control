import { z } from 'zod'

export const visitFormSchema = z.object({
  visitor_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  documento: z.string().optional(),
  visitor_company: z.string().optional(),
  company_user_id: z.string().min(1, 'Selecione quem será visitado'),
  purpose: z.string().min(3, 'Informe o motivo da visita'),
  vehicle_plate: z.string().optional(),
})

export type VisitFormValues = z.infer<typeof visitFormSchema>

export const departmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>

export const companyUserSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  department_id: z.string().optional(),
  ramal: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  active: z.boolean(),
})

export type CompanyUserFormValues = z.infer<typeof companyUserSchema>

export const vehicleSchema = z.object({
  plate: z.string().min(7, 'Placa deve ter 7 caracteres').max(7, 'Placa deve ter 7 caracteres'),
  owner_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  company: z.string().optional(),
  notes: z.string().optional(),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const reportFilterSchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  plate: z.string().optional(),
  visitor_type: z.enum(['employee', 'supplier', 'contractor', 'other', 'all', '']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

export type ReportFilterValues = z.infer<typeof reportFilterSchema>

export const settingsSchema = z.object({
  company_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
