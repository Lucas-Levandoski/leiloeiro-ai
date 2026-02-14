import * as React from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: number
  onChange: (value: number) => void
}

export function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
  const formatCurrency = (val: number) => {
    if (isNaN(val)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Remove all non-digits
    const digits = rawValue.replace(/\D/g, "")
    
    // Convert to number
    const numberValue = Number(digits) / 100
    
    onChange(numberValue)
  }

  return (
    <Input
      {...props}
      value={formatCurrency(value)}
      onChange={handleChange}
      className={className}
      type="text"
      inputMode="numeric"
    />
  )
}
