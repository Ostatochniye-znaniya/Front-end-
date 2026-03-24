#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Проверка наличия необходимых утилит
check_dependencies() {
    log_step "Проверка зависимостей..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    log_info "Docker установлен: $(docker --version)"
    
    # Определяем команду docker-compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
        log_info "Найден docker-compose (standalone)"
    elif docker compose version &> /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        log_info "Найден docker compose (plugin)"
    else
        log_error "Docker Compose не установлен"
        exit 1
    fi
}

# Проверка файлов и директорий
check_files() {
    log_step "Проверка файлов и директорий..."
    
    # Проверяем наличие compose файла
    if [ -f "docker-compose.dev.yml" ]; then
        COMPOSE_FILE="docker-compose.dev.yml"
        log_info "Найден compose файл: $COMPOSE_FILE"
    elif [ -f "docker-compose.yml" ]; then
        COMPOSE_FILE="docker-compose.yml"
        log_warn "docker-compose.dev.yml не найден, используем docker-compose.yml"
    else
        log_error "Файл docker-compose.yml или docker-compose.dev.yml не найден"
        exit 1
    fi
    
    # Проверяем наличие папки frontend
    if [ ! -d "frontend" ]; then
        log_error "Папка frontend не найдена"
        log_info "Текущая директория: $(pwd)"
        log_info "Содержимое: $(ls -la)"
        exit 1
    fi
    log_info "Папка frontend найдена"
    
    # Проверяем наличие Dockerfile
    if [ ! -f "frontend/Dockerfile" ]; then
        log_error "Dockerfile не найден в папке frontend"
        log_info "Содержимое frontend:"
        ls -la frontend/
        exit 1
    fi
    log_info "Dockerfile в frontend найден"
}

# Создание Docker сети
create_network() {
    local network_name="$1"
    
    log_step "Проверка Docker сети: $network_name"
    
    # Проверяем существование сети
    if docker network inspect "$network_name" >/dev/null 2>&1; then
        log_info "Сеть $network_name уже существует"
        docker network ls --filter "name=^${network_name}$" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
    else
        log_info "Создание сети $network_name..."
        if docker network create "$network_name" --driver bridge 2>/dev/null; then
            log_info "✅ Сеть $network_name успешно создана"
        else
            log_error "❌ Не удалось создать сеть $network_name"
            docker network ls
            exit 1
        fi
    fi
    
    # Дополнительная проверка
    if docker network inspect "$network_name" >/dev/null 2>&1; then
        log_info "✅ Сеть $network_name готова к использованию"
        return 0
    else
        log_error "❌ Сеть $network_name недоступна"
        return 1
    fi
}

# Остановка и очистка
cleanup_containers() {
    log_step "Очистка старых контейнеров..."
    
    # Останавливаем контейнеры
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null; then
        log_info "Контейнеры остановлены"
    else
        log_warn "Не удалось остановить контейнеры (возможно их нет)"
    fi
    
    # Очистка неиспользуемых образов (опционально)
    if [ "${CLEAN_IMAGES:-false}" = "true" ]; then
        log_info "Очистка неиспользуемых образов..."
        docker image prune -f 2>/dev/null || true
    fi
}

# Запуск контейнеров
start_containers() {
    log_step "Запуск контейнеров..."
    
    # Сборка и запуск
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build --force-recreate; then
        log_info "Контейнеры запущены"
    else
        log_error "Не удалось запустить контейнеры"
        return 1
    fi
    
    # Ожидание запуска
    local wait_time="${WAIT_TIME:-15}"
    log_info "Ожидание запуска контейнеров (${wait_time} секунд)..."
    
    local i=0
    while [ $i -lt $wait_time ]; do
        printf "."
        sleep 1
        i=$((i + 1))
    done
    echo ""
    
    return 0
}

# Проверка статуса контейнеров
check_status() {
    log_step "Проверка статуса контейнеров..."
    
    # Вывод статуса
    echo ""
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    
    # Подсчет запущенных контейнеров
    local running_count=0
    local total_count=0
    
    # Получаем список контейнеров (разные форматы для разных версий docker-compose)
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -q "State"; then
        # Docker Compose v2 формат
        running_count=$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format json | grep -c '"State":"running"' || echo "0")
        total_count=$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format json | grep -c '"Name"' || echo "0")
    else
        # Fallback для старых версий
        running_count=$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format "table" | grep -c "Up" || echo "0")
        total_count=$($DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format "table" | grep -c "^[a-zA-Z]" | awk '{print $1-1}' || echo "0")
        [ "$total_count" -lt 0 ] && total_count=0
    fi
    
    if [ "$total_count" -gt 0 ] && [ "$running_count" -lt "$total_count" ]; then
        log_warn "Не все контейнеры запущены: $running_count из $total_count"
        log_info "Последние логи:"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50
        return 1
    fi
    
    # Проверка на unhealthy контейнеры
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
        log_error "Обнаружены нездоровые контейнеры!"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50
        return 1
    fi
    
    log_info "✅ Все контейнеры работают ($running_count из $total_count)"
    return 0
}

# Вывод информации о сети
show_network_info() {
    local network_name="$1"
    
    log_step "Информация о сети $network_name:"
    
    if docker network inspect "$network_name" 2>/dev/null | grep -A 10 "Containers" | grep -v "\[\]" | head -20; then
        log_info "Контейнеры в сети:"
        docker network inspect "$network_name" | grep -E "Name|IPv4Address" | grep -v "\[\]" | sed 's/^[[:space:]]*//'
    else
        log_warn "Нет контейнеров в сети $network_name"
    fi
}

# Основная функция
main() {
    log_step "=== Начало деплоя ==="
    log_info "Время запуска: $(date)"
    log_info "Текущая директория: $(pwd)"
    
    # Проверка зависимостей
    check_dependencies
    
    # Проверка файлов
    check_files
    
    # Получаем имя сети из переменной или используем по умолчанию
    NETWORK_NAME="${NETWORK_NAME:-app-network}"
    log_info "Имя сети: $NETWORK_NAME"
    
    # Создание сети
    if ! create_network "$NETWORK_NAME"; then
        exit 1
    fi
    
    # Очистка старых контейнеров
    cleanup_containers
    
    # Запуск контейнеров
    if ! start_containers; then
        exit 1
    fi
    
    # Проверка статуса
    if ! check_status; then
        log_error "❌ Деплой завершился с ошибками"
        exit 1
    fi
    
    # Вывод информации о сети
    show_network_info "$NETWORK_NAME"
    
    log_info "✅ Деплой успешно завершен!"
    log_info "Время завершения: $(date)"
}

# Запуск основной функции
main "$@"