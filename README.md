# SAGE
## Project Setup Guide

### Contexto do Projeto
O SAGE (Sistema de Agendamento e Gerenciamento de Espaços) é um projeto desenvolvido como parte da disciplina de APS (Análise e Projeto de Sistemas). Este repositório é um fork do projeto original e contém o desenvolvimento contínuo do sistema.

### Prerequisites
- Docker Desktop (v4.25+)
- Git
- Node.js v18+ (for frontend tooling)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/rafaeljosebraga/SAGE.git
cd SAGE

# 2. Copy environment file
cp .env.example .env

# 3. Adicional Bora ver
docker run --rm -v $(pwd):/app composer install --ignore-platform-reqs

# 4. Build containers (first time only)
./vendor/bin/sail build --no-cache

# 5. Start services
./vendor/bin/sail up -d

# 6. Generate app key (run inside container)
./vendor/bin/sail artisan key:generate

# 7. Install dependencies
./vendor/bin/sail composer install
./vendor/bin/sail npm install

# 8. Run migrations & seeds
./vendor/bin/sail artisan migrate 

# 9. Start frontend dev server
./vendor/bin/sail npm run dev

# 10. padronizar os comandos do sail 
echo $SHELL
echo "alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'" >> ~/.bashrc
source ~/.bashrc

# 11. comando para habilitar os toast, para popups
npm install @radix-ui/react-toast
```
# Atualizar Projeto (se já instalado)

```bash
# Executar Migrações
./vendor/bin/sail artisan migrate

# Recriar Usuários com Novos Perfis
./vendor/bin/sail artisan db:seed --class=AdminUserSeeder

# Compilar Frontend
npm run dev

# Limpar Cache
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan view:clear
```

# Exemplos de comandos úteis para desenvolvimento
```bash
# Cria link simbólico
./vendor/bin/sail artisan storage:link

# Criação de Middleware
./vendor/bin/sail artisan make:middleware CanManageUsers

# Criação de Seeder
/vendor/bin/sail artisan make:seeder AdminUserSeeder
```

# Setar cores no banco de dados
```bash
./vendor/bin/sail down

# Atualizar código
git pull origin main

# Iniciar ambiente
./vendor/bin/sail up -d

# Executar migrations (OBRIGATÓRIO)
./vendor/bin/sail artisan migrate

# Atualizar cores dos agendamentos (OBRIGATÓRIO)
# Este comando agora detecta automaticamente o número de cores da paleta
./vendor/bin/sail artisan agendamentos:update-color-index

# Limpar cache
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
```

