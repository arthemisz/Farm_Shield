import json
from datetime import datetime, timezone
import uuid
from . import db

class Farm(db.Model):
    __tablename__ = "farms"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    country_code = db.Column(db.String(4), nullable=False, default="ET")
    country = db.Column(db.String(64), nullable=True)
    admin_level1 = db.Column(db.String(128), nullable=True)
    admin_level2 = db.Column(db.String(128), nullable=True)
    admin_level3 = db.Column(db.String(128), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    size = db.Column(db.Float, nullable=False, default=5.0)  # stored in hectares
    size_unit = db.Column(db.String(16), nullable=False, default="hectares")
    soil_type = db.Column(db.String(64), nullable=True, default="Vertisols (Black clay)")
    water_availability = db.Column(db.String(64), nullable=True, default="Rainfed")
    current_crop = db.Column(db.String(64), nullable=True, default="Teff")
    planting_date = db.Column(db.String(32), nullable=True)
    growing_season = db.Column(db.String(64), nullable=True)
    crop_provenance = db.Column(db.String(32), nullable=False, default="FARMER_REPORTED") # FARMER_REPORTED, FIELD_VERIFIED, SATELLITE_CLASSIFIED, STATISTICAL_ESTIMATE, UNKNOWN
    elevation_meters = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)
    boundary_geojson = db.Column(db.Text, nullable=True)  # JSON string
    owner_id = db.Column(db.String(64), nullable=True, default="demo-user")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to plots
    plots = db.relationship("FarmPlot", backref="farm", lazy=True, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        if "id" not in kwargs or not kwargs["id"]:
            kwargs["id"] = f"farm-{uuid.uuid4().hex[:8]}"
        super().__init__(**kwargs)

    def to_dict(self):
        boundary = None
        if self.boundary_geojson:
            try:
                boundary = json.loads(self.boundary_geojson)
            except Exception:
                boundary = None

        return {
            "id": self.id,
            "name": self.name,
            "countryCode": self.country_code,
            "country": self.country or "Unknown",
            "adminLevel1": self.admin_level1 or "",
            "adminLevel2": self.admin_level2 or "",
            "adminLevel3": self.admin_level3 or "",
            # Legacy compatibility mappings for frontend
            "region": self.admin_level1 or "",
            "zone": self.admin_level2 or "",
            "woreda": self.admin_level3 or "",
            "size": self.size,
            "sizeHectares": self.size,
            "sizeUnit": self.size_unit,
            "latitude": round(self.latitude, 6),
            "longitude": round(self.longitude, 6),
            "currentCrop": self.current_crop or "Unspecified",
            "plantingDate": self.planting_date,
            "growingSeason": self.growing_season,
            "cropProvenance": self.crop_provenance or "FARMER_REPORTED",
            "soilType": self.soil_type or "Vertisols (Black clay)",
            "waterAvailability": self.water_availability or "Rainfed",
            "elevationMeters": self.elevation_meters,
            "description": self.description or "",
            "boundaryGeoJson": boundary,
            "ownerId": self.owner_id or "demo-user",
            "plots": [p.to_dict() for p in self.plots] if self.plots else [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class FarmPlot(db.Model):
    __tablename__ = "farm_plots"

    id = db.Column(db.String(64), primary_key=True)
    farm_id = db.Column(db.String(64), db.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    crop_name = db.Column(db.String(64), nullable=False)
    area_hectares = db.Column(db.Float, nullable=False, default=1.0)
    planting_date = db.Column(db.String(32), nullable=True)
    harvest_target = db.Column(db.String(32), nullable=True)
    crop_provenance = db.Column(db.String(32), nullable=False, default="FARMER_REPORTED")
    boundary_geojson = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        if "id" not in kwargs or not kwargs["id"]:
            kwargs["id"] = f"plot-{uuid.uuid4().hex[:8]}"
        super().__init__(**kwargs)

    def to_dict(self):
        boundary = None
        if self.boundary_geojson:
            try:
                boundary = json.loads(self.boundary_geojson)
            except Exception:
                boundary = None

        return {
            "id": self.id,
            "farmId": self.farm_id,
            "name": self.name,
            "cropName": self.crop_name,
            "areaHectares": self.area_hectares,
            "plantingDate": self.planting_date,
            "harvestTarget": self.harvest_target,
            "cropProvenance": self.crop_provenance,
            "boundaryGeoJson": boundary,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
