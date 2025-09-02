import threading
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
from .autonomy import AutonomousRunner


@dataclass
class Agent:
    id: str
    name: str
    task: str
    mode: str = "daemon"  # "daemon" or "oneshot"
    params: Dict[str, Any] = field(default_factory=dict)
    status: str = "pending"  # pending|running|stopped|done|error
    started_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    logs: List[str] = field(default_factory=list)

    stop_event: threading.Event = field(default_factory=threading.Event, repr=False)
    thread: Optional[threading.Thread] = field(default=None, repr=False)

    def log(self, message: str) -> None:
        ts = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        line = f"[{ts}] {message}"
        self.logs.append(line)
        # keep last 300 lines
        if len(self.logs) > 300:
            self.logs = self.logs[-300:]
        self.updated_at = time.time()


class AgentManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._agents: Dict[str, Agent] = {}
        self.max_agents: int = 50  # hard cap to avoid runaway spawning

    def list(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [self._public(a) for a in self._agents.values()]

    def get(self, agent_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            a = self._agents.get(agent_id)
            return self._public(a) if a else None

    def logs(self, agent_id: str, tail: int = 200) -> List[str]:
        with self._lock:
            a = self._agents.get(agent_id)
            if not a:
                return []
            return a.logs[-tail:]

    def start(self, name: str, task: str, mode: str = "daemon", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        agent_id = uuid.uuid4().hex[:12]
        agent = Agent(id=agent_id, name=name, task=task, mode=mode, params=params or {})
        with self._lock:
            if len(self._agents) >= self.max_agents:
                raise RuntimeError(f"agent limit reached ({self.max_agents})")
            self._agents[agent_id] = agent

        def run():
            try:
                agent.status = "running"
                agent.log(f"Agent '{agent.name}' started (task={agent.task}, mode={agent.mode})")
                if agent.task == "autonomous":
                    runner = AutonomousRunner(agent.params)
                    agent.log("autonomy: " + runner.log_context())
                    while not agent.stop_event.is_set():
                        res = runner.step()
                        agent.log(f"autonomy step: {res}")
                        if runner.step_count >= runner.max_steps > 0:
                            agent.status = "done"
                            return
                else:
                    # Simple demo workload: heartbeat loop; if oneshot, exit after N iterations
                    steps = int(agent.params.get("steps", 30 if mode == "oneshot" else 0))
                    count = 0
                    ttl = float(agent.params.get("ttl", 0))
                    while not agent.stop_event.is_set():
                        count += 1
                        agent.log(f"heartbeat {count}: executing task '{agent.task}' …")
                        time.sleep(float(agent.params.get("interval", 1.0)))
                        if ttl and (time.time() - agent.started_at) >= ttl:
                            agent.log("ttl reached; exiting")
                            agent.status = "stopped"
                            return
                        if mode == "oneshot" and steps and count >= steps:
                            agent.log("oneshot complete")
                            agent.status = "done"
                            return
                agent.status = "stopped"
                agent.log("received stop signal; exiting")
            except Exception as e:  # pragma: no cover
                agent.status = "error"
                agent.log(f"error: {e}")

        t = threading.Thread(target=run, name=f"agent-{agent_id}", daemon=True)
        agent.thread = t
        t.start()
        return self._public(agent)

    def start_batch(self, count: int, template: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        template = template or {}
        name = str(template.get("name") or "agent")
        task = str(template.get("task") or "generic")
        mode = str(template.get("mode") or "daemon")
        params = template.get("params") or {}
        out: List[Dict[str, Any]] = []
        with self._lock:
            remaining = max(0, self.max_agents - len(self._agents))
        for i in range(min(count, remaining)):
            out.append(self.start(name=f"{name}-{i+1}", task=task, mode=mode, params=params))
        return out

    def stop_all(self) -> int:
        with self._lock:
            ids = list(self._agents.keys())
        stopped = 0
        for aid in ids:
            stopped += 1 if self.stop(aid) else 0
        return stopped

    def stop_some(self, count: int) -> int:
        if count <= 0:
            return 0
        with self._lock:
            # Stop oldest running agents first
            running = [a for a in self._agents.values() if a.status == "running"]
            running.sort(key=lambda a: a.started_at)
            targets = [a.id for a in running[:count]]
        stopped = 0
        for aid in targets:
            stopped += 1 if self.stop(aid) else 0
        return stopped

    def stop(self, agent_id: str) -> bool:
        with self._lock:
            a = self._agents.get(agent_id)
            if not a:
                return False
            a.stop_event.set()
            return True

    def _public(self, a: Agent) -> Dict[str, Any]:
        # Construct a serializable view explicitly
        return {
            "id": a.id,
            "name": a.name,
            "task": a.task,
            "mode": a.mode,
            "params": a.params,
            "status": a.status,
            "started_at": a.started_at,
            "updated_at": a.updated_at,
            "logs": a.logs[-5:],  # include a small preview
        }


# Singleton instance for import
manager = AgentManager()
