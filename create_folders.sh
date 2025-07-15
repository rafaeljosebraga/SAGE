#!/bin/bash

# Criar pastas necessárias
mkdir -p storage/app/public/espacos
chmod -R 775 storage/app/public/espacos

# Verificar se existem
echo "Verificando pastas:"
ls -la storage/app/public/

echo "Verificando permissões:"
ls -la storage/app/public/espacos

echo "Pastas criadas com sucesso!"