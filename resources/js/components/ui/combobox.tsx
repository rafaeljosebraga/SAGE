import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  id?: string
  name?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção",
  searchPlaceholder = "Buscar...",
  className,
  triggerClassName,
  disabled = false,
  id,
  name
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [canScrollDown, setCanScrollDown] = React.useState(false)
  const [canScrollUp, setCanScrollUp] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  // Filtrar opções baseado na busca
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Encontrar a opção selecionada
  const selectedOption = options.find(option => option.value === value)

  // Verificar se há conteúdo para scroll
  const checkScrollability = React.useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current
      setCanScrollUp(scrollTop > 0)
      setCanScrollDown(scrollTop + clientHeight < scrollHeight)
    }
  }, [])

  // Atualizar indicadores de scroll quando as opções mudam
  React.useEffect(() => {
    if (open) {
      setTimeout(checkScrollability, 0)
    }
  }, [open, filteredOptions, checkScrollability])

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchValue("")
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Gerenciar navegação por teclado
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case "Enter":
          event.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            onValueChange?.(filteredOptions[highlightedIndex].value)
            setOpen(false)
            setSearchValue("")
            setHighlightedIndex(-1)
          }
          break
        case "Escape":
          setOpen(false)
          setSearchValue("")
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, highlightedIndex, filteredOptions, onValueChange])

  // Focar no input quando abrir
  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Scroll para o item destacado
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        })
      }
    }
  }, [highlightedIndex])

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
    setSearchValue("")
    setHighlightedIndex(-1)
  }

  const handleToggle = () => {
    if (disabled) return
    setOpen(!open)
    if (!open) {
      setSearchValue("")
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground",
          !selectedOption && "text-muted-foreground",
          triggerClassName
        )}
        onClick={handleToggle}
        disabled={disabled}
        id={id}
        name={name}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                setHighlightedIndex(-1)
              }}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="relative">
            {canScrollUp && (
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-popover to-transparent pointer-events-none z-10" />
            )}
            
            <ul
              ref={listRef}
              className="max-h-[168px] overflow-auto p-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
              role="listbox"
              onScroll={checkScrollability}
            >
            {filteredOptions.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma opção encontrada.
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex && "bg-accent text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </li>
              ))
            )}
            </ul>
            
            {canScrollDown && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-popover to-transparent pointer-events-none z-10" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}