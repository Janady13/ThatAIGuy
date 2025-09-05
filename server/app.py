import os
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .agent_manager import manager as Agents

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

# Pydantic models for request validation
class AgentCreateRequest(BaseModel):
    name: Optional[str] = Field(default="agent", description="Agent name")
    task: Optional[str] = Field(default="generic", description="Task type")
    mode: str = Field(default="daemon", pattern="^(daemon|oneshot)$", description="Agent mode")
    params: Dict[str, Any] = Field(default_factory=dict, description="Agent parameters")

class BatchCreateRequest(BaseModel):
    count: int = Field(ge=1, description="Number of agents to create")
    template: Optional[Dict[str, Any]] = Field(default=None, description="Agent template")

class StopSomeRequest(BaseModel):
    count: int = Field(ge=1, description="Number of agents to stop")

app = FastAPI(
    title="Donation Platform",
    description="Modern donation platform with FastAPI backend",
    version="1.0.0"
)

# Serve /static/* directly
app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=False), name="static")

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "ok": True,
        "service": "donation-platform",
        "mode": "python",
        "static_exists": STATIC_DIR.exists()
    }

@app.get("/config.json")
async def config_json():
    """Serve static/config.json if present; otherwise synthesize from env."""
    cfg_path = STATIC_DIR / "config.json"
    if cfg_path.exists():
        return FileResponse(str(cfg_path), media_type="application/json")
    
    # Fallback from env with improved type handling
    def safe_int(value: str, default: int = 0) -> int:
        try:
            return int(value) if value else default
        except (ValueError, TypeError):
            return default
    
    data = {
        "venmoUrl": os.getenv("VENMO_URL", ""),
        "cashAppUrl": os.getenv("CASHAPP_URL", ""),
        "cashAppHandle": os.getenv("CASHAPP_HANDLE", ""),
        "stripeUrl": os.getenv("STRIPE_URL", ""),
        "stripePaymentLink": os.getenv("STRIPE_PAYMENT_LINK", ""),
        "campaignRaised": safe_int(os.getenv("CAMPAIGN_RAISED", "0")),
        "campaignGoal": safe_int(os.getenv("CAMPAIGN_GOAL", "0")),
    }
    return JSONResponse(data)

@app.get("/")
async def root():
    """Serve static index.html if available, else a minimal landing page."""
    idx = STATIC_DIR / "index.html"
    if idx.exists():
        return FileResponse(str(idx), media_type="text/html")
    return PlainTextResponse(
        "Static index.html not found under /static. Build or copy your UI.", 
        status_code=200
    )

# Friendly routes for key pages when running locally (Netlify handles these via _redirects)
async def serve_static_page(filename: str, error_msg: str):
    """Helper function to serve static pages with error handling."""
    p = STATIC_DIR / filename
    if p.exists():
        return FileResponse(str(p), media_type="text/html")
    raise HTTPException(status_code=404, detail=error_msg)

@app.get("/backend")
async def backend_page():
    """Serve backend admin page."""
    return await serve_static_page("backend.html", "backend.html not found")

@app.get("/research") 
async def research_page():
    """Serve research page."""
    return await serve_static_page("research.html", "research.html not found")

@app.get("/donate")
async def donate_page():
    """Serve donation page."""
    return await serve_static_page("donate_page.html", "donate.html not found")

# Serve common asset paths used by the static site
async def serve_asset(filepath: Path, media_type: str = None):
    """Helper function to serve assets with consistent error handling."""
    if filepath.exists():
        return FileResponse(str(filepath), media_type=media_type)
    raise HTTPException(status_code=404, detail="Asset not found")

@app.get("/freeaicharity_custom.css")
async def asset_css_main():
    """Serve main CSS file."""
    return await serve_asset(STATIC_DIR / "freeaicharity_custom.css", "text/css")

@app.get("/freeaicharity_custom.js")
async def asset_js_main():
    """Serve main JavaScript file.""" 
    return await serve_asset(STATIC_DIR / "freeaicharity_custom.js", "application/javascript")

@app.get("/css/{path:path}")
async def asset_css(path: str):
    """Serve CSS assets from /css/ directory."""
    return await serve_asset(STATIC_DIR / "css" / path, "text/css")

@app.get("/assets/{path:path}")
async def asset_assets(path: str):
    """Serve assets from /assets/ directory."""
    return await serve_asset(STATIC_DIR / "assets" / path)

# -------- Agents API --------
@app.get("/api/agents")
async def api_list_agents():
    """List all active agents."""
    return {"agents": Agents.list()}

@app.post("/api/agents")
async def api_start_agent(request: AgentCreateRequest):
    """Start a new agent with specified configuration."""
    try:
        info = Agents.start(
            name=request.name,
            task=request.task,
            mode=request.mode,
            params=request.params
        )
        return {"ok": True, "agent": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/agents/batch")
async def api_start_batch(request: BatchCreateRequest):
    """Start multiple agents from a template."""
    try:
        agents = Agents.start_batch(count=request.count, template=request.template)
        return {"ok": True, "count": len(agents), "agents": agents}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/agents/{agent_id}")
async def api_get_agent(agent_id: str):
    """Get information about a specific agent."""
    data = Agents.get(agent_id)
    if not data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"agent": data}

@app.get("/api/agents/{agent_id}/logs")
async def api_agent_logs(agent_id: str, tail: int = 200):
    """Get logs for a specific agent."""
    lines = Agents.logs(agent_id, tail=tail)
    if not lines:
        raise HTTPException(status_code=404, detail="Agent not found or no logs")
    return PlainTextResponse("\n".join(lines), media_type="text/plain; charset=utf-8")

@app.post("/api/agents/{agent_id}/stop")
async def api_stop_agent(agent_id: str):
    """Stop a specific agent."""
    ok = Agents.stop(agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True}

@app.post("/api/agents/stop_all")
async def api_stop_all():
    """Stop all active agents."""
    n = Agents.stop_all()
    return {"ok": True, "stopped": n}

@app.post("/api/agents/stop_some")
async def api_stop_some(request: StopSomeRequest):
    """Stop a specified number of agents."""
    n = Agents.stop_some(request.count)
    return {"ok": True, "stopped": n}
