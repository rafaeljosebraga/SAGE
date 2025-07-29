import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnConfig {
    key: string;
    label: string;
    type?: 'text' | 'select' | 'date' | 'number';
    options?: { value: string; label: string }[];
    sortable?: boolean;
    searchable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
    getValue?: (row: any) => string;
    getSearchValue?: (row: any) => string;
}

interface FilterableTableProps {
    data: any[];
    columns: ColumnConfig[];
    className?: string;
    emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function FilterableTable({ 
    data, 
    columns, 
    className = '',
    emptyMessage = 'Nenhum item encontrado.'
}: FilterableTableProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Função para obter o valor de uma coluna para um item
    const getColumnValue = (item: any, column: ColumnConfig): string => {
        if (column.getValue) {
            return column.getValue(item);
        }
        
        const keys = column.key.split('.');
        let value = item;
        
        for (const key of keys) {
            value = value?.[key];
        }
        
        return String(value || '');
    };

    // Função para filtrar os dados
    const filteredData = useMemo(() => {
        let filtered = data;

        // Aplicar filtros
        Object.entries(filters).forEach(([columnKey, filterValue]) => {
            if (filterValue.trim()) {
                const column = columns.find(col => col.key === columnKey);
                if (column) {
                    filtered = filtered.filter(item => {
                        // Usar getSearchValue se disponível, senão usar getValue
                        const value = column.getSearchValue 
                            ? column.getSearchValue(item).toLowerCase()
                            : getColumnValue(item, column).toLowerCase();
                        return value.includes(filterValue.toLowerCase());
                    });
                }
            }
        });

        // Aplicar ordenação
        if (sortColumn && sortDirection) {
            const column = columns.find(col => col.key === sortColumn);
            if (column) {
                filtered = [...filtered].sort((a, b) => {
                    const aValue = getColumnValue(a, column);
                    const bValue = getColumnValue(b, column);
                    
                    // Tentar converter para número se possível
                    const aNum = Number(aValue);
                    const bNum = Number(bValue);
                    
                    let comparison = 0;
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        comparison = aNum - bNum;
                    } else {
                        comparison = aValue.localeCompare(bValue, 'pt-BR');
                    }
                    
                    return sortDirection === 'asc' ? comparison : -comparison;
                });
            }
        }

        return filtered;
    }, [data, filters, sortColumn, sortDirection, columns]);

    // Função para atualizar filtro
    const updateFilter = (columnKey: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [columnKey]: value
        }));
    };

    // Função para limpar filtro
    const clearFilter = (columnKey: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[columnKey];
            return newFilters;
        });
    };

    // Função para limpar todos os filtros
    const clearAllFilters = () => {
        setFilters({});
        setSortColumn(null);
        setSortDirection(null);
    };

    // Função para alternar ordenação
    const toggleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Função para obter ícone de ordenação
    const getSortIcon = (columnKey: string) => {
        if (sortColumn !== columnKey) {
            return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        }
        
        if (sortDirection === 'asc') {
            return <ArrowUp className="h-4 w-4 text-blue-600" />;
        } else if (sortDirection === 'desc') {
            return <ArrowDown className="h-4 w-4 text-blue-600" />;
        }
        
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    };

    // Verificar se há filtros ativos
    const hasActiveFilters = Object.values(filters).some(value => value.trim()) || sortColumn;

    return (
        <div className={`${className}`}>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {/* Linha dos cabeçalhos */}
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className="relative text-gray-90 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span>{column.label}</span>
                                        {column.sortable !== false && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => toggleSort(column.key)}
                                            >
                                                {getSortIcon(column.key)}
                                            </Button>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                        
                        {/* Linha dos filtros */}
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                            {columns.map((column, index) => (
                                <TableHead key={`filter-${column.key}`} className="py-2">
                                    {column.searchable !== false ? (
                                        <div className="relative">
                                            {column.type === 'select' && column.options ? (
                                                <select
                                                    value={filters[column.key] || ''}
                                                    onChange={(e) => updateFilter(column.key, e.target.value)}
                                                    className="h-8 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">Todos</option>
                                                    {column.options.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <>
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-3 w-3" />
                                                    <Input
                                                        type={column.type === 'number' ? 'number' : 'text'}
                                                        placeholder="Filtrar..."
                                                        value={filters[column.key] || ''}
                                                        onChange={(e) => updateFilter(column.key, e.target.value)}
                                                        className="h-8 pl-7 pr-7 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                    />
                                                    {filters[column.key] && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            onClick={() => clearFilter(column.key)}
                                                        >
                                                            <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        // Botão "Limpar todos os filtros" na última coluna (Ações)
                                        index === columns.length - 1 && hasActiveFilters && (
                                            <div className="flex justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearAllFilters}
                                                    className="h-8 text-xs text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Limpar
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {column.render 
                                                ? column.render(getColumnValue(item, column), item)
                                                : getColumnValue(item, column)
                                            }
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-gray-500 dark:text-gray-400"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Contagem de registros no final da tabela */}
            <div className="mt-3 px-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredData.length === data.length ? (
                        `Mostrando ${filteredData.length} ${filteredData.length === 1 ? 'registro' : 'registros'}`
                    ) : (
                        `Mostrando ${filteredData.length} de ${data.length} ${data.length === 1 ? 'registro' : 'registros'}`
                    )}
                    {hasActiveFilters && filteredData.length !== data.length && (
                        <span className="text-blue-600 dark:text-blue-400"> (filtrado)</span>
                    )}
                </p>
            </div>
        </div>
    );
}