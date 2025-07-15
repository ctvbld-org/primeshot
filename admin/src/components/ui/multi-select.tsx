'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@primeshot/common/lib/utils'
import { Button } from '@primeshot/common/web/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@primeshot/common/web/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@primeshot/common/web/ui/popover'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Checkbox } from '@primeshot/common/web/ui/checkbox'

interface Option {
  value: string
  label: string
  image?: string
  color?: string
}

interface MultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  showImages?: boolean
  showColors?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  showImages = false,
  showColors = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const selectedOptions = options.filter((option) => value.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.slice(0, 3).map((option) => (
                <Badge key={option.value} variant="secondary" className="mr-1">
                  {option.label}
                </Badge>
              ))}
              {selectedOptions.length > 3 && (
                <Badge variant="secondary">+{selectedOptions.length - 3} more</Badge>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {showImages && option.image && (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  {showColors && option.color && (
                    <div
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}