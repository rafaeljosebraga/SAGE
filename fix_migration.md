# Correção da Migration Duplicada

## Problema
A migration `2025_01_27_000000_create_espaco_fotos_table.php` está tentando criar uma tabela que já existe.

## Solução

1. **Remover a migration duplicada:**
```bash
rm database/migrations/2025_01_27_000000_create_espaco_fotos_table.php
```

2. **Executar a nova migration que atualiza a tabela existente:**
```bash
sail artisan migrate
```

## O que a nova migration faz

A migration `2025_01_27_100000_update_espaco_fotos_table.php` irá:

- Verificar se a tabela `espaco_fotos` existe
- Se não existir, criar com a estrutura completa
- Se existir, adicionar apenas as colunas que estão faltando:
  - `nome_original`
  - `tamanho` 
  - `tipo_mime`
  - `ordem`
  - `descricao`
  - `created_by`
  - `updated_by`
  - Índice para performance

## Comandos para executar

```bash
# 1. Remover migration duplicada
rm database/migrations/2025_01_27_000000_create_espaco_fotos_table.php

# 2. Executar migrations
sail artisan migrate

# 3. Verificar se deu certo
sail artisan migrate:status
```