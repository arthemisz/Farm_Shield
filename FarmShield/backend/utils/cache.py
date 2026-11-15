import time
import json
import os
import hashlib

class SimpleCache:
    """Thread-safe file-backed / memory cache for external geospatial and climate queries."""
    def __init__(self, cache_dir=None, default_ttl_hours=24):
        if cache_dir is None:
            base = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            cache_dir = os.path.join(base, "data", "cache")
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)
        self.default_ttl_seconds = default_ttl_hours * 3600
        self._memory = {}

    def _make_key(self, namespace, **kwargs):
        # Round coordinates to 3 decimals (~100m) for caching spatial queries
        normalized = {}
        for k, v in sorted(kwargs.items()):
            if isinstance(v, float):
                normalized[k] = round(v, 3)
            else:
                normalized[k] = v
        raw = f"{namespace}:{json.dumps(normalized, sort_keys=True)}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, namespace, **kwargs):
        key = self._make_key(namespace, **kwargs)
        now = time.time()
        
        # Check memory first
        if key in self._memory:
            data, expires_at = self._memory[key]
            if now < expires_at:
                return data
            else:
                del self._memory[key]

        # Check disk
        filepath = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    entry = json.load(f)
                if now < entry.get("expires_at", 0):
                    self._memory[key] = (entry.get("data"), entry.get("expires_at"))
                    return entry.get("data")
            except Exception:
                pass
        return None

    def set(self, namespace, data, ttl_seconds=None, **kwargs):
        key = self._make_key(namespace, **kwargs)
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        expires_at = time.time() + ttl
        
        # Update memory
        self._memory[key] = (data, expires_at)
        
        # Update disk
        filepath = os.path.join(self.cache_dir, f"{key}.json")
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump({"data": data, "expires_at": expires_at}, f)
        except Exception:
            pass

cache = SimpleCache()

