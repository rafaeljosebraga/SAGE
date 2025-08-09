<?php

namespace App\Helpers;

class ColorHelper
{
    /**
     * Retorna o número total de cores disponíveis na paleta
     * 
     * Esta função conta as cores baseadas no arquivo TypeScript colorPalette
     * localizado em resources/js/components/ui/agend-colors.tsx
     * 
     * @return int
     */
    public static function getTotalColors(): int
    {
        // Caminho para o arquivo de cores do frontend
        try {
            // Verificar se estamos no contexto Laravel
            if (function_exists('app') && app()->bound('path')) {
                $colorFilePath = resource_path('js/components/ui/agend-colors.tsx');
            } else {
                // Fallback para caminho relativo
                $colorFilePath = __DIR__ . '/../../resources/js/components/ui/agend-colors.tsx';
            }
        } catch (\Exception $e) {
            // Fallback para caminho relativo
            $colorFilePath = __DIR__ . '/../../resources/js/components/ui/agend-colors.tsx';
        }
        
        // Se o arquivo não existir, usar fallback
        if (!file_exists($colorFilePath)) {
            return 67; // Valor padrão baseado no último count conhecido
        }
        
        try {
            $content = file_get_contents($colorFilePath);
            
            // Contar linhas que contêm definições de cores na paleta
            // Padrão: { bg: 'bg-...', text: '...', border: '...' }
            $pattern = '/\{\s*bg:\s*[\'"][^\'"]*/';
            preg_match_all($pattern, $content, $matches);
            
            $totalColors = count($matches[0]);
            
            // Se não encontrou cores ou número muito baixo, usar fallback
            if ($totalColors < 10) {
                return 67;
            }
            
            return $totalColors;
            
        } catch (\Exception $e) {
            // Em caso de erro, usar fallback
            return 67;
        }
    }
    
    /**
     * Gera um índice de cor baseado em uma string seed
     * 
     * @param string $colorSeed
     * @return int
     */
    public static function generateColorIndex(string $colorSeed): int
    {
        $totalColors = self::getTotalColors();
        return abs(crc32($colorSeed)) % $totalColors;
    }
    
    /**
     * Gera um índice de cor único (sem duplicatas no banco)
     * Verifica se o color_index já existe e incrementa até encontrar um livre
     * 
     * @param string $colorSeed
     * @param int|null $excludeId ID do agendamento a excluir da verificação (para edições)
     * @return int
     */
    public static function generateUniqueColorIndex(string $colorSeed, ?int $excludeId = null): int
    {
        $totalColors = self::getTotalColors();
        $baseIndex = abs(crc32($colorSeed)) % $totalColors;
        
        // Verificar se este índice já existe no banco
        $query = \App\Models\Agendamento::where('color_index', $baseIndex);
        
        // Excluir o próprio agendamento se estiver editando
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        // Se não existe, usar o índice base
        if (!$query->exists()) {
            return $baseIndex;
        }
        
        // Se existe, procurar próximo índice disponível
        for ($offset = 1; $offset < $totalColors; $offset++) {
            $testIndex = ($baseIndex + $offset) % $totalColors;
            
            $query = \App\Models\Agendamento::where('color_index', $testIndex);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            
            if (!$query->exists()) {
                return $testIndex;
            }
        }
        
        // Fallback: se todas as cores estão ocupadas, usar uma baseada no timestamp
        return abs(crc32($colorSeed . time())) % $totalColors;
    }
}
