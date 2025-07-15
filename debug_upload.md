# 🔍 Debug do Upload de Fotos

## 1. Verificar Logs do Laravel
```bash
# Ver logs em tempo real
sail logs -f

# Ou verificar arquivo de log
tail -f storage/logs/laravel.log
```

## 2. Verificar Console do Navegador
- Abra F12 (DevTools)
- Vá na aba "Console"
- Tente fazer upload
- Veja se há erros JavaScript

## 3. Verificar Aba Network
- F12 → Network
- Tente fazer upload
- Veja a requisição POST para `/fotos`
- Verifique o status code e resposta

## 4. Possíveis Problemas

### A. Erro de CSRF
- Status: 419
- Solução: Token CSRF já foi adicionado

### B. Erro de Validação
- Status: 422
- Possível: Tamanho do arquivo, tipo não permitido

### C. Erro de Permissão
- Status: 500
- Possível: Pasta storage sem permissão

### D. Erro de Rota
- Status: 404
- Possível: Middleware bloqueando

## 5. Testes Rápidos

### Verificar se rota está acessível:
```bash
curl -X GET http://localhost/fotos
```

### Verificar permissões:
```bash
ls -la storage/app/public/
```

### Verificar se pasta espacos existe:
```bash
mkdir -p storage/app/public/espacos
chmod 775 storage/app/public/espacos
```