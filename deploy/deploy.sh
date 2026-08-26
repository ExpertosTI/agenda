#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado - Agenda RENACE (agenda.renace.tech)
# ==============================================================================
set -e

echo "🚀 Iniciando despliegue de Agenda RENACE..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$APP_DIR"

# 1. Verificar si existe la red de Traefik
if ! docker network inspect traefik-net >/dev/null 2>&1; then
    echo "🌐 Creando red externa 'traefik-net'..."
    docker network create traefik-net
fi

# 2. Asegurar carpeta de datos persistente
mkdir -p data

# 3. Construir y levantar contenedor
echo "📦 Construyendo y desplegando contenedor con Traefik..."
docker compose -f deploy/docker-compose.yml up -d --build --remove-orphans

echo ""
echo "✅ Despliegue completado con éxito."
echo "🌐 URL Pública: https://agenda.renace.tech"
echo "🔍 Monitoreo de logs: docker compose -f deploy/docker-compose.yml logs -f"
