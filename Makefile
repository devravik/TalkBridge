.PHONY: dev dev-backend dev-frontend db stop build

# Start PostgreSQL + Redis
db:
	docker compose up -d postgres redis
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3

# Run backend in dev mode
dev-backend:
	cd backend && go run ./cmd/server

# Run frontend in dev mode
dev-frontend:
	cd frontend && npm run dev

# Start everything with Docker Compose
dev:
	docker compose up --build

# Stop all containers
stop:
	docker compose down

# Build production images
build:
	docker compose build

# Copy .env.example to .env if not present
.env:
	cp .env.example .env
	@echo "Created .env — add your API keys to .env"

setup: .env db
	@echo "Setup complete. Run 'make dev-backend' and 'make dev-frontend' in separate terminals."
