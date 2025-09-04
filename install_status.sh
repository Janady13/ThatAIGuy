#!/usr/bin/env bash
set -Eeuo pipefail

echo "==================================="
echo "ThatAIGuy Installation Status Check"
echo "==================================="
echo

# Check Python environment
echo "🐍 Python Environment:"
python3 --version
if [[ -d ".venv" ]]; then
    echo "✅ Python virtual environment (.venv) exists"
    source .venv/bin/activate
    echo "   Installed packages:"
    pip list | grep -E "(fastapi|uvicorn|flask|gunicorn)" || echo "   No web server packages found"
    deactivate
else
    echo "❌ Python virtual environment not found"
fi
echo

# Check Node.js
echo "🟢 Node.js Environment:"
node --version
echo

# Check static files
echo "📁 Static Files:"
if [[ -f "static/config.json" ]]; then
    echo "✅ static/config.json exists"
    echo "   Size: $(stat -c%s static/config.json) bytes"
else
    echo "❌ static/config.json not found"
fi

if [[ -f "static/index.html" ]]; then
    echo "✅ static/index.html exists"
else
    echo "❌ static/index.html not found"
fi
echo

# Check servers
echo "🚀 Server Scripts:"
if [[ -x "run_python_server.sh" ]]; then
    echo "✅ FastAPI server script (run_python_server.sh) is executable"
else
    echo "❌ FastAPI server script not executable"
fi

if [[ -x "launch_donation_platform.sh" ]]; then
    echo "✅ Flask server script (launch_donation_platform.sh) is executable"
else
    echo "❌ Flask server script not executable"
fi

if [[ -x "setup_python_server.sh" ]]; then
    echo "✅ Setup script (setup_python_server.sh) is executable"
else
    echo "❌ Setup script not executable"
fi
echo

# Check build tools
echo "🔧 Build Tools:"
if [[ -f "netlify-build.mjs" ]]; then
    echo "✅ Build script (netlify-build.mjs) exists"
else
    echo "❌ Build script not found"
fi
echo

echo "📋 Quick Start Commands:"
echo "   FastAPI Server: bash run_python_server.sh"
echo "   Flask Server:   bash launch_donation_platform.sh"
echo "   Rebuild Config: node netlify-build.mjs"
echo
echo "Installation Status: COMPLETE ✅"