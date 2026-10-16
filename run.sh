#!/usr/bin/env bash

# Smart Flood Detection System — macOS / Linux Quick Start Script
# ================================================================

MODE="${1:-menu}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

show_header() {
    clear 2>/dev/null || true
    echo -e "${CYAN}==========================================================${NC}"
    echo -e "${YELLOW}       SMART FLOOD DETECTION SYSTEM — IoT DASHBOARD        ${NC}"
    echo -e "${CYAN}==========================================================${NC}"
    echo ""
}

check_prerequisites() {
    echo -e "Checking environment..."

    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        echo -e "  [${GREEN}OK${NC}] Node.js is installed: $(node -v)"
    else
        echo -e "  [${RED}WARN${NC}] Node.js not found! Please install via 'brew install node' or https://nodejs.org"
    fi

    # Check Go
    if command -v go >/dev/null 2>&1; then
        echo -e "  [${GREEN}OK${NC}] Go is installed: $(go version)"
    else
        echo -e "  [${YELLOW}WARN${NC}] Go not found in PATH! Please install via 'brew install go' or https://go.dev/dl/"
    fi

    # Check .env files
    if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        echo -e "  [${CYAN}CREATED${NC}] backend/.env from .env.example"
    fi
    if [ ! -f "$SCRIPT_DIR/frontend/.env.local" ]; then
        cp "$SCRIPT_DIR/frontend/.env.example" "$SCRIPT_DIR/frontend/.env.local"
        echo -e "  [${CYAN}CREATED${NC}] frontend/.env.local from .env.example"
    fi
    echo ""
}

run_backend_demo() {
    show_header
    check_prerequisites
    echo -e "${YELLOW}Starting Backend in DEMO MODE...${NC}"
    echo -e "${CYAN}Backend will run on http://localhost:8080${NC}"
    cd "$SCRIPT_DIR/backend" || exit 1
    DEMO_MODE=true go run ./cmd/server/main.go
}

run_backend_live() {
    show_header
    check_prerequisites
    echo -e "${GREEN}Starting Backend in LIVE MODE (Connecting to MQTT)...${NC}"
    echo -e "${CYAN}Backend will run on http://localhost:8080${NC}"
    cd "$SCRIPT_DIR/backend" || exit 1
    DEMO_MODE=false go run ./cmd/server/main.go
}

run_frontend() {
    show_header
    check_prerequisites
    echo -e "${CYAN}Starting Frontend (Next.js)...${NC}"
    echo -e "${GREEN}Frontend will run on http://localhost:3000${NC}"
    cd "$SCRIPT_DIR/frontend" || exit 1
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules not found. Running npm install...${NC}"
        npm install
    fi
    npm run dev
}

run_tests() {
    show_header
    echo -e "${MAGENTA}Running Backend Water Calculation Unit Tests...${NC}"
    cd "$SCRIPT_DIR/backend" || exit 1
    go test ./internal/calculation/... -v
    echo ""
    read -p "Press Enter to return to menu..."
}

show_menu() {
    show_header
    check_prerequisites
    echo -e "Select an option:"
    echo -e "  ${YELLOW}1. Start Backend (DEMO Mode - Simulated data)${NC}"
    echo -e "  ${GREEN}2. Start Backend (LIVE Mode - Real ESP32 via MQTT)${NC}"
    echo -e "  ${CYAN}3. Start Frontend (Next.js dev server on :3000)${NC}"
    echo -e "  ${MAGENTA}4. Run Unit Tests (Go calculation tests)${NC}"
    echo -e "  ${GRAY}5. Exit${NC}"
    echo ""
    read -p "Enter option (1-5): " choice

    case "$choice" in
        1) run_backend_demo ;;
        2) run_backend_live ;;
        3) run_frontend ;;
        4) run_tests; show_menu ;;
        5) exit 0 ;;
        *) show_menu ;;
    esac
}

case "$MODE" in
    demo) run_backend_demo ;;
    live) run_backend_live ;;
    frontend) run_frontend ;;
    test) run_tests ;;
    *) show_menu ;;
esac
