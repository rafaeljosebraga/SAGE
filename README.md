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
#cp .env.example .env

# --IGNORAR ESSE PEDAÇO POR ENQUANTO--
# 3. Generate app key (run inside container)
./vendor/bin/sail artisan key:generate
# --IGNORAR ESSE PEDAÇO POR ENQUANTO--


# 4. Build containers (first time only)
./vendor/bin/sail build --no-cache

# 5. Start services
./vendor/bin/sail up -d

# 6. Install dependencies
./vendor/bin/sail composer install
./vendor/bin/sail npm install

# 7. Run migrations & seeds
./vendor/bin/sail artisan migrate --seed

# 8. Start frontend dev server
./vendor/bin/sail npm run dev


#Adicional Boraver
docker run --rm -v $(pwd):/app composer install --ignore-platform-reqs
