import os
import time
from typing import Dict, Any, List, Optional

from .tools.social import SocialTools
from .tools.fundraising import FundraisingTools


class AutonomousRunner:
    """Lightweight, safe think-plan-act-reflect loop with strict limits.

    This runner is intentionally conservative: no self-replication, no spam.
    It only uses approved stubs that log intended actions unless valid API keys
    are present in the environment.
    """

    def __init__(self, params: Dict[str, Any]):
        self.params = params or {}
        self.directive: str = str(self.params.get("directive") or os.getenv("AGENT_DIRECTIVE", "Promote the charity ethically, respect platform rules, add value."))
        self.objective: str = str(self.params.get("objective") or "Increase awareness and donations through compliant content.")
        self.allowed_domains: List[str] = list(self.params.get("domains") or [
            os.getenv("CHARITY_DOMAIN", "thataiguy.org"),
            os.getenv("CHARITY_DOMAIN_ALT", "freeaicharity.org"),
        ])
        self.max_steps: int = int(self.params.get("max_steps") or 50)
        self.cooldown: float = float(self.params.get("cooldown") or 2.0)
        self.step_count: int = 0
        self.memory: List[str] = []

        # Tool stubs
        self.social = SocialTools()
        self.funds = FundraisingTools()

    def log_context(self) -> str:
        return f"directive={self.directive[:60]!r} objective={self.objective[:60]!r} domains={self.allowed_domains}"

    def think(self) -> str:
        # Extremely simple heuristic “thinking” to choose next action
        if self.step_count % 5 == 0:
            return "research_trends"
        if self.step_count % 5 in (1, 2):
            return "draft_post"
        if self.step_count % 5 == 3:
            return "schedule_post"
        return "update_metrics"

    def act(self, action: str) -> str:
        """Call a stubbed tool; return a short result string."""
        if action == "research_trends":
            data = self.social.research_trends()
            return f"researched {len(data)} trends"
        elif action == "draft_post":
            post = self.social.draft_post(self.directive, self.objective, domains=self.allowed_domains)
            self.memory.append(post)
            self.memory[:] = self.memory[-10:]
            return "drafted post"
        elif action == "schedule_post":
            post = self.memory[-1] if self.memory else self.social.draft_post(self.directive, self.objective, domains=self.allowed_domains)
            ok, msg = self.social.schedule_post(post)
            return f"schedule_post: {msg}"
        elif action == "update_metrics":
            m = self.funds.collect_metrics()
            return f"metrics: views={m.get('views',0)} donations={m.get('donations',0)}"
        else:
            return "noop"

    def step(self) -> str:
        if self.step_count >= self.max_steps > 0:
            return "done"
        self.step_count += 1
        action = self.think()
        result = self.act(action)
        # reflect (keep it simple)
        self.memory.append(f"step {self.step_count}: {action} -> {result}")
        self.memory[:] = self.memory[-20:]
        time.sleep(self.cooldown)
        return result

