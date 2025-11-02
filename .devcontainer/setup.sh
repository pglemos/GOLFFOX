#!/bin/bash

# GOLFFOX - GitHub Codespaces Setup Script
echo "🚌 Configurando ambiente de desenvolvimento GOLFFOX..."

# Atualizar sistema
sudo apt-get update

# Configurar Flutter
echo "📱 Configurando Flutter..."
flutter doctor
flutter config --enable-web
flutter precache

# Instalar dependências Flutter
echo "📦 Instalando dependências Flutter..."
flutter pub get

# Configurar Next.js
echo "🌐 Configurando Next.js..."
cd web-app
npm install
cd ..

# Configurar Git
echo "🔧 Configurando Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Lembre-se de configurar as variáveis de ambiente no arquivo .env"
fi

# Executar análise inicial
echo "🔍 Executando análise inicial..."
flutter analyze --no-fatal-infos
cd web-app && npm run lint --silent && cd ..

# Executar testes
echo "🧪 Executando testes..."
flutter test --no-sound-null-safety
cd web-app && npm test --silent && cd ..

echo "✅ Ambiente configurado com sucesso!"
echo ""
echo "🚀 Para começar o desenvolvimento:"
echo "   • Flutter Web: flutter run -d web-server --web-port 8000"
echo "   • Next.js: cd web-app && npm run dev"
echo ""
echo "📚 Documentação disponível em:"
echo "   • README.md - Visão geral do projeto"
echo "   • CONTRIBUTING.md - Guia de contribuição"
echo "   • docs/ - Documentação técnica"