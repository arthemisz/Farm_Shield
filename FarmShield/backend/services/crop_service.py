import json
import os
from typing import List, Optional, Dict, Any

class CropService:
    def __init__(self, data_path: Optional[str] = None):
        if not data_path:
            base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            data_path = os.path.join(base_dir, "data", "crop_profiles", "crops.json")
        self.data_path = data_path
        self._crops: List[Dict[str, Any]] = []
        self._load_crops()

    def _load_crops(self):
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, "r", encoding="utf-8") as f:
                    self._crops = json.load(f)
            except Exception as e:
                print(f"Error loading crop profiles: {e}")
                self._crops = []
        else:
            self._crops = []

    def get_all_crops(self, country_code: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        self._load_crops()
        crops = self._crops
        if region:
            r_norm = region.lower().strip()
            crops = [
                c for c in crops
                if any(r_norm in ar.lower() for ar in c.get("africanRegions", []))
            ]
        if not country_code or country_code.upper() == "ALL":
            return crops
        cc = country_code.upper()
        return [
            c for c in crops
            if cc in c.get("countryApplicability", []) or "GLOBAL" in c.get("countryApplicability", [])
        ]

    def get_crop_by_id(self, crop_id: str) -> Optional[Dict[str, Any]]:
        self._load_crops()
        cid = crop_id.lower().strip()
        for c in self._crops:
            if c.get("id", "").lower() == cid:
                return c
        # Match normalized underscored/hyphenated
        cid_norm = cid.replace(" ", "_").replace("-", "_")
        for c in self._crops:
            c_id = c.get("id", "").lower()
            if c_id == cid_norm:
                return c
        # Match by name or normalized name
        for c in self._crops:
            c_name = c.get("name", "").lower()
            if c_name == cid or cid in c_name or c_name in cid:
                return c
        # Match aliases (e.g. bread_wheat -> wheat, corn -> maize)
        alias_map = {
            "bread_wheat": "wheat",
            "bread wheat": "wheat",
            "corn": "maize",
            "field_pea": "faba_bean",
            "haricot_bean": "common_bean"
        }
        if cid_norm in alias_map:
            alias_id = alias_map[cid_norm]
            for c in self._crops:
                if c.get("id", "").lower() == alias_id:
                    return c
        return None

    def search_crops(self, query: str, country_code: Optional[str] = None, region: Optional[str] = None) -> List[Dict[str, Any]]:
        crops = self.get_all_crops(country_code, region)
        q = query.lower().strip()
        if not q:
            return crops
        results = []
        for c in crops:
            name = c.get("name", "").lower()
            sci = c.get("scientificName", "").lower()
            cat = c.get("category", "").lower()
            desc = c.get("description", "").lower()
            local_names = " ".join(c.get("localNames", {}).values()).lower()
            if q in name or q in sci or q in cat or q in desc or q in local_names:
                results.append(c)
        return results

crop_service = CropService()

