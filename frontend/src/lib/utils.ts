import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind classes with automatic conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as BRL currency (e.g. R$ 1.234,56) */
export function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Format a number using Brazilian locale (e.g. 1.234) */
export function fmtN(v: number): string {
  return v.toLocaleString('pt-BR')
}

/** Generate a WhatsApp link from a phone number */
export function whatsappLink(tel: string): string {
  if (!tel) return ''
  const nums = tel.replace(/\D/g, '')
  if (nums.length < 10) return ''
  return 'https://wa.me/55' + nums
}

/** Format a client's full address */
export function enderecoCompleto(logradouro: string, numero: string, complemento: string, bairro: string, cep: string): string {
  const parts = [logradouro, numero, complemento].filter(Boolean).join(', ')
  return parts + (parts ? ' - ' : '') + bairro + (bairro ? ', ' : '') + 'CEP: ' + cep
}
