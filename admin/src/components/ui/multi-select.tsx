'use client'

import * as React from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@primeshot/common/lib/utils'
import { Button } from '@primeshot/common/web/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@primeshot/common/web/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@primeshot/common/web/ui/popover'
import { Badge } from '@primeshot/common/web/ui/badge'
import { Checkbox } from '@primeshot/common/web/ui/checkbox'
import getOptionsImage from '@/lib/get-options-image'

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
  renderTag?: (option: Option) => React.ReactNode
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  showImages = false,
  showColors = false,
  className,
  renderTag,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [triggerRef.current])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const selectedOptions = options.filter((option) => value.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <div
          ref={triggerRef}
          role="combobox"
          aria-expanded={open}
          className="flex min-h-9 w-full justify-between gap-1 rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="text-muted-foreground"
                >
                  <div className="flex items-center gap-1 pr-1">
                    {showImages && option.image && (
                      <img
                        src={getOptionsImage(option.image)}
                        alt={option.label}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    {showColors && option.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(option.value)
                      }}
                    />
                  </div>
                </Badge>
              ))}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        style={{ width: `${triggerWidth}px` }} 
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-lg border shadow-md">
          <div className="flex justify-between items-center border-b">
            <CommandInput 
              placeholder={placeholder}
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 h-8 !text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const allSelected = options.length === value.length;
                if (allSelected) {
                  onChange([]);
                } else {
                  onChange(options.map(opt => opt.value));
                }
              }}
            >
              {options.length === value.length ? 'Unselect All' : 'Select All'}
            </Button>
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup className="py-2">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer py-2 px-4"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {showImages && option.image && (
                      <img
                        src={getOptionsImage(option.image)}
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
                    <span className="flex-1">{option.label}</span>
                    <Checkbox
                      checked={value.includes(option.value)}
                      onCheckedChange={() => handleSelect(option.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}