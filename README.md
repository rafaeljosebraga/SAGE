# SAGE
## Project Setup Guide

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