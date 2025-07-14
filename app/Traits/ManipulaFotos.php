<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;

trait ManipulaFotos
{
    /**
     * Método reutilizável para upload de fotos
     * 
     * @param array|null $fotos Array de arquivos de foto
     * @param string $pasta Pasta onde salvar as fotos (padrão: 'fotos')
     * @return array Array com URLs das fotos salvas
     */
    public function uploadFotos($fotos, $pasta = 'fotos')
    {
        $fotosUrls = [];
        
        if ($fotos && is_array($fotos)) {
            foreach ($fotos as $foto) {
                // Gera nome único para o arquivo
                $nomeArquivo = time() . '_' . uniqid() . '.' . $foto->getClientOriginalExtension();
                
                // Salva na pasta especificada no storage público
                $caminhoFoto = $foto->storeAs($pasta, $nomeArquivo, 'public');
                
                // Adiciona a URL completa ao array
                $url = Storage::url($caminhoFoto);
                
                // Para o Sail/Docker, garantir que a URL seja absoluta
                if (!str_starts_with($url, 'http')) {
                    // Tenta obter a URL base da requisição atual
                    if (request()) {
                        $baseUrl = request()->getSchemeAndHttpHost();
                    } else {
                        // Fallback para config se não há requisição
                        $baseUrl = config('app.url');
                    }
                    $url = $baseUrl . $url;
                }
                
                $fotosUrls[] = $url;
            }
        }
        
        return $fotosUrls;
    }

    /**
     * Remove fotos do storage
     * 
     * @param array|null $fotosUrls Array com URLs das fotos a serem removidas
     * @return void
     */
    public function removerFotos($fotosUrls)
    {
        if ($fotosUrls && is_array($fotosUrls)) {
            foreach ($fotosUrls as $fotoUrl) {
                // Remove o domínio se for URL absoluta
                if (str_starts_with($fotoUrl, 'http')) {
                    $fotoUrl = parse_url($fotoUrl, PHP_URL_PATH);
                }
                
                // Remove o prefixo /storage/ para obter o caminho real no storage
                $caminhoArquivo = str_replace('/storage/', '', $fotoUrl);
                
                // Remove o arquivo do storage público
                if (Storage::disk('public')->exists($caminhoArquivo)) {
                    Storage::disk('public')->delete($caminhoArquivo);
                }
            }
        }
    }

    /**
     * Valida se os arquivos são imagens válidas
     * 
     * @param array $fotos Array de arquivos
     * @param int $maxSize Tamanho máximo em MB (padrão: 5MB)
     * @param array $tiposPermitidos Tipos MIME permitidos
     * @return array Array com erros de validação (vazio se tudo estiver ok)
     */
    public function validarFotos($fotos, $maxSize = 5, $tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    {
        $erros = [];
        
        if ($fotos) {
            foreach ($fotos as $index => $foto) {
                // Verifica se é um arquivo válido
                if (!$foto->isValid()) {
                    $erros[] = "Arquivo {$index} é inválido.";
                    continue;
                }
                
                // Verifica o tipo MIME
                if (!in_array($foto->getMimeType(), $tiposPermitidos)) {
                    $erros[] = "Arquivo {$foto->getClientOriginalName()} tem tipo não suportado. Use: " . implode(', ', $tiposPermitidos);
                }
                
                // Verifica o tamanho
                if ($foto->getSize() > ($maxSize * 1024 * 1024)) {
                    $erros[] = "Arquivo {$foto->getClientOriginalName()} é muito grande. Máximo: {$maxSize}MB";
                }
            }
        }
        
        return $erros;
    }

    /**
     * Redimensiona uma imagem (opcional - requer intervenção/image)
     * 
     * @param string $caminhoOriginal Caminho da imagem original
     * @param int $larguraMax Largura máxima
     * @param int $alturaMax Altura máxima
     * @return string Caminho da imagem redimensionada
     */
    public function redimensionarImagem($caminhoOriginal, $larguraMax = 1200, $alturaMax = 800)
    {
        // Este método pode ser implementado se você instalar o pacote intervention/image
        // composer require intervention/image
        
        // Por enquanto, retorna o caminho original
        return $caminhoOriginal;
    }
}