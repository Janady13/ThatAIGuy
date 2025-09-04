#!/usr/bin/env bash
set -Eeuo pipefail

echo "======================================="
echo "ThatAIGuy.org Master Installation Script"
echo "======================================="
echo

log() { echo "🔧 [install] $*"; }
warn() { echo "⚠️  [install] $*" >&2; }
error() { echo "❌ [install] ERROR: $*" >&2; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

log "Starting installation in: $PROJECT_DIR"
echo

# Check prerequisites
log "Checking prerequisites..."
python3 --version || error "Python 3 is required"
node --version || error "Node.js is required"
echo

# Step 1: Python Environment Setup
log "Setting up Python environment and dependencies..."
if [[ ! -f "setup_python_server.sh" ]]; then
    error "setup_python_server.sh not found"
fi

# Run the existing setup script but without starting the server
export PROJECT_DIR
if timeout 60 bash setup_python_server.sh >/dev/null 2>&1; then
    # Kill server if it started
    pkill -f uvicorn || true
    sleep 1
    log "Python setup completed successfully"
else
    warn "Python setup encountered issues (likely network timeouts)"
    log "Creating basic virtual environment..."
    python3 -m venv .venv || error "Failed to create virtual environment"
    log "Basic Python environment created. Manual dependency installation may be needed."
fi

# Step 2: Install Flask dependencies for legacy server
log "Installing additional dependencies (if possible)..."
if [[ -d ".venv" ]]; then
    source .venv/bin/activate
    if timeout 30 pip install flask gunicorn >/dev/null 2>&1; then
        log "Flask dependencies installed successfully"
    else
        warn "Could not install Flask dependencies (likely network issues)"
    fi
    deactivate
    
    # Create venv symlink for legacy script compatibility
    ln -sf .venv venv 2>/dev/null || true
else
    warn "Python virtual environment was not created properly"
fi

# Step 3: Build static assets and configuration
log "Building static assets and configuration..."
if [[ -f "netlify-build.mjs" ]]; then
    node netlify-build.mjs >/dev/null || warn "Build script had warnings"
else
    warn "netlify-build.mjs not found, skipping build"
fi

# Step 4: Netlify plugins (optional, may fail due to network)
log "Attempting to install Netlify plugins (optional)..."
if [[ -f ".netlify/plugins/package.json" ]]; then
    cd .netlify/plugins
    npm install >/dev/null 2>&1 || warn "Netlify plugins installation failed (optional)"
    cd "$PROJECT_DIR"
fi

# Step 5: Verify installation
log "Verifying installation..."
echo

# Run our status check
if [[ -f "install_status.sh" ]]; then
    bash install_status.sh
else
    log "Installation verification script not found, manual verification:"
    [[ -d ".venv" ]] && echo "✅ Python virtual environment exists" || echo "❌ Python virtual environment missing"
    [[ -f "static/config.json" ]] && echo "✅ Static config exists" || echo "❌ Static config missing"
    [[ -x "run_python_server.sh" ]] && echo "✅ FastAPI server script ready" || echo "❌ FastAPI server script not ready"
    [[ -x "launch_donation_platform.sh" ]] && echo "✅ Flask server script ready" || echo "❌ Flask server script not ready"
fi

echo
log "Installation complete! 🎉"
echo
echo "Quick Start:"
echo "  • FastAPI Server: bash run_python_server.sh"
echo "  • Flask Server:   bash launch_donation_platform.sh"
echo "  • Check Status:   bash install_status.sh"
echo "  • Rebuild Config: node netlify-build.mjs"
echo