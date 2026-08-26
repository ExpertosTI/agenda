#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado - Agenda RENACE (Docker Swarm & Traefik)
# ==============================================================================
set -e

echo "🚀 Iniciando despliegue de Agenda RENACE..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$APP_DIR"

# 1. Asegurar carpeta de datos persistente
mkdir -p data /opt/agenda/data 2>/dev/null || true

# 2. Construir la imagen de la app
echo "📦 Construyendo imagen de Agenda RENACE (agenda_app:latest)..."
docker compose -f deploy/docker-compose.yml build

# 3. Detectar si el servidor corre en Docker Swarm
SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo "inactive")

if [ "$SWARM_STATE" = "active" ]; then
    echo "🌐 Docker Swarm detectado. Desplegando stack 'agenda' en RenaceNet..."
    docker stack deploy -c deploy/docker-compose.yml agenda
else
    echo "🌐 Modo Docker Compose estándar detectado..."
    docker compose -f deploy/docker-compose.yml up -d --remove-orphans
fi

echo ""
echo "✅ Despliegue completado con éxito."
echo "🌐 URL Pública: https://agenda.renace.tech"
