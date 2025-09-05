import os, json
from pathlib import Path
from fastapi import FastAPI, Response, HTTPException
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from .agent_manager import manager as Agents

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Donation Platform (Python)")

# Serve /static/* directly
app.mount("/static", StaticFiles(directory=str(STATIC_DIR), html=False), name="static")

@app.get("/health")
def health():
    return {"ok": True, "service": "donation-platform", "mode": "python", "static_exists": STATIC_DIR.exists()}

@app.get("/config.json")
def config_json():
    """Serve static/config.json if present; otherwise synthesize from env."""
    cfg_path = STATIC_DIR / "config.json"
    if cfg_path.exists():
        return FileResponse(str(cfg_path), media_type="application/json")
    # Fallback from env
    data = {
        "venmoUrl": os.getenv("VENMO_URL", ""),
        "cashAppUrl": os.getenv("CASHAPP_URL", ""),
        "cashAppHandle": os.getenv("CASHAPP_HANDLE", ""),
        "stripeUrl": os.getenv("STRIPE_URL", ""),
        "stripePaymentLink": os.getenv("STRIPE_PAYMENT_LINK", ""),
        "campaignRaised": int(os.getenv("CAMPAIGN_RAISED", "0") or 0),
        "campaignGoal": int(os.getenv("CAMPAIGN_GOAL", "0") or 0),
    }
    return JSONResponse(data)

@app.get("/")
def root():
    """Serve static index.html if available, else a minimal landing page."""
    idx = STATIC_DIR / "index.html"
    if idx.exists():
        return FileResponse(str(idx), media_type="text/html")
    return PlainTextResponse("Static index.html not found under /static. Build or copy your UI.", status_code=200)

# Friendly routes for key pages when running locally (Netlify handles these via _redirects)
@app.get("/backend")
def backend_page():
    p = STATIC_DIR / "backend.html"
    if p.exists():
        return FileResponse(str(p), media_type="text/html")
    raise HTTPException(status_code=404, detail="backend.html not found")

@app.get("/research")
def research_page():
    p = STATIC_DIR / "research.html"
    if p.exists():
        return FileResponse(str(p), media_type="text/html")
    raise HTTPException(status_code=404, detail="research.html not found")

@app.get("/donate")
def donate_page():
    p = STATIC_DIR / "donate.html"
    if p.exists():
        return FileResponse(str(p), media_type="text/html")
    raise HTTPException(status_code=404, detail="donate.html not found")

# Serve common asset paths used by the static site
from fastapi import Request

@app.get("/freeaicharity_custom.css")
def asset_css_main():
    p = STATIC_DIR / "freeaicharity_custom.css"
    if p.exists():
        return FileResponse(str(p), media_type="text/css")
    raise HTTPException(status_code=404, detail="asset not found")

@app.get("/freeaicharity_custom.js")
def asset_js_main():
    p = STATIC_DIR / "freeaicharity_custom.js"
    if p.exists():
        return FileResponse(str(p), media_type="application/javascript")
    raise HTTPException(status_code=404, detail="asset not found")

@app.get("/css/{path:path}")
def asset_css(path: str):
    p = STATIC_DIR / "css" / path
    if p.exists():
        return FileResponse(str(p), media_type="text/css")
    raise HTTPException(status_code=404, detail="asset not found")

@app.get("/assets/{path:path}")
def asset_assets(path: str):
    p = STATIC_DIR / "assets" / path
    if p.exists():
        return FileResponse(str(p))
    raise HTTPException(status_code=404, detail="asset not found")

# -------- Agents API --------
@app.get("/api/agents")
def api_list_agents():
    return {"agents": Agents.list()}

@app.post("/api/agents")
def api_start_agent(payload: dict):
    name = str(payload.get("name") or "agent")
    task = str(payload.get("task") or "generic")
    mode = str(payload.get("mode") or "daemon")
    params = payload.get("params") or {}
    if mode not in ("daemon", "oneshot"):
        raise HTTPException(status_code=400, detail="mode must be 'daemon' or 'oneshot'")
    info = Agents.start(name=name, task=task, mode=mode, params=params)
    return {"ok": True, "agent": info}

@app.post("/api/agents/batch")
def api_start_batch(payload: dict):
    count = int(payload.get("count") or 1)
    if count < 1:
        raise HTTPException(status_code=400, detail="count must be >= 1")
    try:
        agents = Agents.start_batch(count=count, template=payload.get("template"))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "count": len(agents), "agents": agents}

@app.get("/api/agents/{agent_id}")
def api_get_agent(agent_id: str):
    data = Agents.get(agent_id)
    if not data:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"agent": data}

@app.get("/api/agents/{agent_id}/logs")
def api_agent_logs(agent_id: str, tail: int = 200):
    lines = Agents.logs(agent_id, tail=tail)
    if not lines:
        raise HTTPException(status_code=404, detail="agent not found or no logs")
    return PlainTextResponse("\n".join(lines), media_type="text/plain; charset=utf-8")

@app.post("/api/agents/{agent_id}/stop")
def api_stop_agent(agent_id: str):
    ok = Agents.stop(agent_id)
    if not ok:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"ok": True}

@app.post("/api/agents/stop_all")
def api_stop_all():
    n = Agents.stop_all()
    return {"ok": True, "stopped": n}

@app.post("/api/agents/stop_some")
def api_stop_some(payload: dict):
    count = int(payload.get("count") or 0)
    if count < 1:
        raise HTTPException(status_code=400, detail="count must be >= 1")
    n = Agents.stop_some(count)
    return {"ok": True, "stopped": n}
