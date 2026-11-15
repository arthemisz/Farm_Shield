import json
from datetime import datetime, timezone
from . import db

class DatasetRecord(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.String(64), primary_key=True)
    provider = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    collection_id = db.Column(db.String(128), nullable=True)
    endpoint = db.Column(db.String(256), nullable=True)
    doi = db.Column(db.String(128), nullable=True)
    source_url = db.Column(db.String(256), nullable=True)
    variables = db.Column(db.Text, nullable=True)  # JSON list
    geographic_coverage = db.Column(db.String(128), default="Global")
    temporal_coverage = db.Column(db.String(128), nullable=True)
    spatial_resolution = db.Column(db.String(64), nullable=True)
    temporal_resolution = db.Column(db.String(64), nullable=True)
    data_format = db.Column(db.String(32), default="GeoTIFF/HDF5/JSON")
    units = db.Column(db.String(128), nullable=True)
    license = db.Column(db.String(128), nullable=True)
    integration_status = db.Column(db.String(32), default="VERIFIED") # VERIFIED, PARTIAL, CACHED, MODELLED, UNAVAILABLE, RESTRICTED_GEO
    status = db.Column(db.String(32), default="LIVE")  # LIVE, CACHED, DEMONSTRATION, UNAVAILABLE, PARTIAL
    last_verified = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_successful_sync = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        var_list = []
        if self.variables:
            try:
                var_list = json.loads(self.variables)
            except Exception:
                var_list = [self.variables]

        return {
            "id": self.id,
            "provider": self.provider,
            "name": self.name,
            "collectionId": self.collection_id,
            "doi": self.doi,
            "sourceUrl": self.source_url or self.endpoint,
            "endpoint": self.endpoint,
            "variables": var_list,
            "geographicCoverage": self.geographic_coverage,
            "temporalCoverage": self.temporal_coverage,
            "spatialResolution": self.spatial_resolution,
            "temporalResolution": self.temporal_resolution,
            "dataFormat": self.data_format,
            "units": self.units,
            "license": self.license,
            "integrationStatus": self.integration_status,
            "status": self.status,
            "lastVerified": self.last_verified.isoformat() if self.last_verified else None,
            "lastSuccessfulSync": self.last_successful_sync.isoformat() if self.last_successful_sync else None,
            "notes": self.notes,
        }
