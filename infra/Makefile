# GolfFox Makefile
# Cross-platform development commands

.PHONY: help setup clean build test dev docker-up docker-down

# Default target
help:
	@echo "GolfFox Development Commands"
	@echo "============================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup          - Setup development environment"
	@echo "  clean          - Clean build artifacts and dependencies"
	@echo ""
	@echo "Development Commands:"
	@echo "  dev-flutter    - Start Flutter development server"
	@echo "  dev-nextjs     - Start Next.js development server"
	@echo "  dev-all        - Start both Flutter and Next.js servers"
	@echo ""
	@echo "Build Commands:"
	@echo "  build          - Build all platforms"
	@echo "  build-flutter  - Build Flutter applications"
	@echo "  build-nextjs   - Build Next.js application"
	@echo "  build-web      - Build Flutter web only"
	@echo "  build-android  - Build Android APK and Bundle"
	@echo ""
	@echo "Test Commands:"
	@echo "  test           - Run all tests"
	@echo "  test-flutter   - Run Flutter tests"
	@echo "  test-nextjs    - Run Next.js tests"
	@echo "  coverage       - Generate test coverage reports"
	@echo ""
	@echo "Docker Commands:"
	@echo "  docker-up      - Start Docker development environment"
	@echo "  docker-down    - Stop Docker development environment"
	@echo "  docker-logs    - View Docker logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  format         - Format code (Flutter and Next.js)"
	@echo "  lint           - Run linters"
	@echo "  analyze        - Run static analysis"
	@echo ""

# Setup development environment
setup:
	@echo "Setting up development environment..."
	@if command -v pwsh >/dev/null 2>&1; then \
		pwsh -ExecutionPolicy Bypass -File scripts/setup/setup_env.ps1; \
	elif command -v powershell >/dev/null 2>&1; then \
		powershell -ExecutionPolicy Bypass -File scripts/setup/setup_env.ps1; \
	else \
		echo "PowerShell not found. Please run setup manually."; \
		echo "1. Install Flutter dependencies: flutter pub get"; \
		echo "2. Install Next.js dependencies: cd web-app && npm install"; \
	fi

# Clean build artifacts and dependencies
clean:
	@echo "Cleaning build artifacts..."
	flutter clean
	@if [ -d "web-app/node_modules" ]; then \
		cd web-app && rm -rf node_modules .next; \
	fi
	@if [ -d "build" ]; then rm -rf build; fi
	@if [ -d "coverage" ]; then rm -rf coverage; fi

# Development servers
dev-flutter:
	@echo "Starting Flutter development server..."
	flutter run -d web-server --web-port 8000

dev-nextjs:
	@echo "Starting Next.js development server..."
	cd web-app && npm run dev

dev-all:
	@echo "Starting both development servers..."
	@echo "Flutter will start on http://localhost:8000"
	@echo "Next.js will start on http://localhost:3000"
	@echo "Press Ctrl+C to stop both servers"
	@(flutter run -d web-server --web-port 8000 &) && \
	(cd web-app && npm run dev)

# Build commands
build:
	@echo "Building all platforms..."
	@if command -v pwsh >/dev/null 2>&1; then \
		pwsh -ExecutionPolicy Bypass -File scripts/build/build_all.ps1; \
	elif command -v powershell >/dev/null 2>&1; then \
		powershell -ExecutionPolicy Bypass -File scripts/build/build_all.ps1; \
	else \
		make build-flutter && make build-nextjs; \
	fi

build-flutter:
	@echo "Building Flutter applications..."
	flutter pub get
	flutter build web --release
	flutter build apk --release --split-per-abi
	flutter build appbundle --release

build-nextjs:
	@echo "Building Next.js application..."
	cd web-app && npm ci && npm run build

build-web:
	@echo "Building Flutter web..."
	flutter build web --release --web-renderer html

build-android:
	@echo "Building Android applications..."
	flutter build apk --release --split-per-abi
	flutter build appbundle --release

# Test commands
test:
	@echo "Running all tests..."
	make test-flutter
	make test-nextjs

test-flutter:
	@echo "Running Flutter tests..."
	flutter test

test-nextjs:
	@echo "Running Next.js tests..."
	cd web-app && npm test -- --passWithNoTests

coverage:
	@echo "Generating test coverage..."
	flutter test --coverage
	@if command -v genhtml >/dev/null 2>&1; then \
		genhtml coverage/lcov.info -o coverage/html; \
		echo "Flutter coverage report: coverage/html/index.html"; \
	fi
	cd web-app && npm run test:coverage

# Docker commands
docker-up:
	@echo "Starting Docker development environment..."
	docker-compose up -d
	@echo "Services started:"
	@echo "  - Supabase Studio: http://localhost:3001"
	@echo "  - Supabase API: http://localhost:8000"
	@echo "  - Next.js: http://localhost:3000"
	@echo "  - Inbucket (Email): http://localhost:9000"

docker-down:
	@echo "Stopping Docker development environment..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f

# Code quality commands
format:
	@echo "Formatting code..."
	dart format lib/ test/
	cd web-app && npm run format

lint:
	@echo "Running linters..."
	flutter analyze
	cd web-app && npm run lint

analyze:
	@echo "Running static analysis..."
	flutter analyze --no-fatal-infos
	cd web-app && npm run type-check

# Install dependencies
deps:
	@echo "Installing dependencies..."
	flutter pub get
	cd web-app && npm install

# Update dependencies
deps-update:
	@echo "Updating dependencies..."
	flutter pub upgrade
	cd web-app && npm update

# Generate code (if using code generation)
generate:
	@echo "Generating code..."
	flutter packages pub run build_runner build --delete-conflicting-outputs

# Database commands (if using local Supabase)
db-reset:
	@echo "Resetting database..."
	docker-compose down supabase-db
	docker volume rm golffox_supabase_db_data
	docker-compose up -d supabase-db

db-migrate:
	@echo "Running database migrations..."
	@echo "Please run migrations manually using Supabase CLI or SQL scripts"

# Release commands
release-android:
	@echo "Building Android release..."
	flutter build appbundle --release
	@echo "Release bundle: build/app/outputs/bundle/release/app-release.aab"

release-web:
	@echo "Building web release..."
	flutter build web --release
	cd web-app && npm run build
	@echo "Flutter web build: build/web/"
	@echo "Next.js build: web-app/.next/"

# Health check
health:
	@echo "Checking system health..."
	@echo "Flutter:"
	@flutter doctor || echo "Flutter not available"
	@echo ""
	@echo "Node.js:"
	@node --version || echo "Node.js not available"
	@echo ""
	@echo "npm:"
	@npm --version || echo "npm not available"
	@echo ""
	@echo "Docker:"
	@docker --version || echo "Docker not available"