#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Параметры копии фронта берутся из .env, который создаёт workflow:
# INSTANCE, HTTP_PORT, BACKEND_HOST, BACKEND_PORT, BACKEND_NETWORK
load_env() {
    log_step "Чтение параметров копии..."

    if [ -f ".env" ]; then
        set -a
        . ./.env
        set +a
    fi

    local var
    for var in INSTANCE HTTP_PORT BACKEND_HOST BACKEND_PORT BACKEND_NETWORK; do
        if [ -z "${!var}" ]; then
            log_error "Не задана переменная $var (проверьте .env)"
            exit 1
        fi
    done

    NETWORK_NAME="${NETWORK_NAME:-$BACKEND_NETWORK}"
    export COMPOSE_PROJECT_NAME="front-${INSTANCE}"

    log_info "Копия: $INSTANCE (проект $COMPOSE_PROJECT_NAME)"
    log_info "Внешний порт: $HTTP_PORT"
    log_info "Бэкенд: $BACKEND_HOST:$BACKEND_PORT в сети $BACKEND_NETWORK"
}

check_docker_daemon() {
    log_step "Проверка Docker демона..."

    if ! docker info &>/dev/null; then
        log_error "Docker демон не запущен"
        exit 1
    fi
    log_info "Docker демон работает"
}

check_dependencies() {
    log_step "Проверка зависимостей..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    log_info "Docker установлен: $(docker --version)"

    if docker compose version &> /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        log_info "Найден docker compose (plugin)"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_warn "Найден только docker-compose (standalone), нужна поддержка поля name в compose-файле"
    else
        log_error "Docker Compose не установлен"
        exit 1
    fi
}

# Compose-файл задаёт workflow через DEPLOY_COMPOSE_FILE
check_files() {
    log_step "Проверка файлов и директорий..."

    COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.yml}"

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose файл не найден: $COMPOSE_FILE"
        exit 1
    fi
    log_info "Compose файл: $COMPOSE_FILE"

    if [ ! -f "nginx.conf.template" ]; then
        log_error "Файл nginx.conf.template не найден"
        exit 1
    fi

    if [ ! -f "frontend/Dockerfile" ]; then
        log_error "frontend/Dockerfile не найден"
        log_info "Текущая директория: $(pwd)"
        log_info "Содержимое: $(ls -la)"
        exit 1
    fi
    log_info "Файлы на месте"
}

# Сеть и контейнер бэкенда этого окружения должны уже работать:
# фронт подключается только к ним и не создаёт чужую сеть
check_backend() {
    log_step "Проверка бэкенда этого окружения..."

    if ! docker network inspect "$BACKEND_NETWORK" >/dev/null 2>&1; then
        log_error "Сеть бэкенда $BACKEND_NETWORK не найдена. Сначала задеплойте бэкенд этого окружения."
        docker network ls
        exit 1
    fi

    local members
    members="$(docker network inspect "$BACKEND_NETWORK" --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}')"

    if ! echo "$members" | grep -Fxq "$BACKEND_HOST"; then
        log_error "Контейнер $BACKEND_HOST не запущен в сети $BACKEND_NETWORK"
        log_info "Сейчас в сети:"
        echo "$members"
        exit 1
    fi

    log_info "Бэкенд $BACKEND_HOST найден в сети $BACKEND_NETWORK"
}

# Останавливаем только контейнеры проекта этой копии, тома не трогаем
cleanup_containers() {
    log_step "Остановка старых контейнеров копии $INSTANCE..."

    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --quiet 2>/dev/null | grep -q .; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || {
            log_warn "Не удалось полностью остановить контейнеры"
            $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" kill 2>/dev/null || true
            $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" rm -f 2>/dev/null || true
        }
        log_info "Контейнеры остановлены и удалены"
    else
        log_info "Нет запущенных контейнеров"
    fi

    if [ "${CLEAN_IMAGES:-false}" = "true" ]; then
        log_info "Очистка неиспользуемых образов..."
        docker image prune -f 2>/dev/null || true
    fi
}

# Контейнеры старой схемы с фиксированными именами мешают запуску новой
cleanup_legacy_containers() {
    log_step "Проверка контейнеров старой схемы..."

    local container
    for container in nginx-proxy nextjs-app; do
        if docker ps -a --format '{{.Names}}' | grep -Fxq "$container"; then
            log_warn "Найден контейнер старой схемы: $container. Удаляем..."
            docker rm -f "$container" >/dev/null 2>&1 || {
                log_error "Не удалось удалить контейнер $container"
                return 1
            }
        fi
    done
}

start_containers() {
    log_step "Запуск контейнеров..."

    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build --force-recreate --remove-orphans; then
        log_info "Контейнеры успешно запущены"
    else
        log_error "Не удалось запустить контейнеры"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50
        return 1
    fi

    local wait_time="${WAIT_TIME:-15}"
    log_info "Ожидание запуска контейнеров (${wait_time} секунд)..."

    local i=0
    while [ $i -lt $wait_time ]; do
        if ! $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --quiet 2>/dev/null | grep -q .; then
            log_error "Контейнеры не запустились или упали сразу после запуска"
            $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50
            return 1
        fi
        printf "."
        sleep 1
        i=$((i + 1))
    done
    echo ""

    return 0
}

check_status() {
    log_step "Проверка статуса контейнеров..."

    echo ""
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""

    local containers
    containers=$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)

    if [ "$containers" -eq 0 ]; then
        log_error "Нет запущенных контейнеров"
        return 1
    fi

    local unhealthy=0
    local running=0
    local container status health

    for container in $($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps -q 2>/dev/null); do
        status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
        health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container" 2>/dev/null)

        if [ "$status" = "running" ]; then
            running=$((running + 1))
            if [ "$health" = "unhealthy" ]; then
                unhealthy=$((unhealthy + 1))
                log_error "Контейнер $container нездоров (unhealthy)"
                docker logs --tail=20 "$container" 2>/dev/null || true
            fi
        else
            log_warn "Контейнер $container не запущен (статус: $status)"
        fi
    done

    if [ "$unhealthy" -gt 0 ]; then
        log_error "Обнаружено $unhealthy нездоровых контейнеров"
        return 1
    fi

    if [ "$running" -eq 0 ]; then
        log_error "Нет запущенных контейнеров"
        return 1
    fi

    log_info "✅ $running контейнеров успешно запущено"
    return 0
}

show_network_info() {
    log_step "Контейнеры в сети бэкенда $BACKEND_NETWORK:"
    docker network inspect "$BACKEND_NETWORK" --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null || log_warn "Не удалось получить список контейнеров сети"
}

main() {
    log_step "=== Начало деплоя фронта ==="
    log_info "Время запуска: $(date)"
    log_info "Текущая директория: $(pwd)"
    log_info "Пользователь: $(whoami)"

    load_env
    check_docker_daemon
    check_dependencies
    check_files
    check_backend

    cleanup_containers
    cleanup_legacy_containers

    if ! start_containers; then
        log_error "❌ Деплой завершился с ошибками при запуске контейнеров"
        exit 1
    fi

    if ! check_status; then
        log_error "❌ Деплой завершился с ошибками при проверке статуса"
        exit 1
    fi

    show_network_info

    log_info "✅ Деплой успешно завершен!"
    log_info "Время завершения: $(date)"
    log_info "Полезные команды:"
    echo "  $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f    # Просмотр логов"
    echo "  $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps         # Статус контейнеров"
    echo "  curl -I http://127.0.0.1:$HTTP_PORT/csh/         # Проверка с сервера"
}

main "$@"
