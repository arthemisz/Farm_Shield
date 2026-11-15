import json
from datetime import datetime, timezone
import uuid
from . import db

class EnvironmentalObservation(db.Model):
    __tablename__ = "environmental_observations"

    id = db.Column(db.String(64), primary_key=True)
    dataset_id = db.Column(db.String(64), db.ForeignKey("datasets.id"), nullable=False, index=True)
    country_code = db.Column(db.String(4), nullable=False, index=True)
    farm_id = db.Column(db.String(64), db.ForeignKey("farms.id"), nullable=True, index=True)
    latitude = db.Column(db.Float, nullable=False, index=True)
    longitude = db.Column(db.Float, nullable=False, index=True)
    observation_date = db.Column(db.String(32), nullable=False, index=True) # YYYY-MM-DD or YYYY-MM
    observation_period = db.Column(db.String(32), nullable=True) # daily, monthly, seasonal, annual, instantaneous
    variable_name = db.Column(db.String(64), nullable=False, index=True) # T2M, PRECTOTCORR, GPM_PRECIP, NDVI, EVI, ECO_ET, phh2o
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(32), nullable=False)
    quality_flag = db.Column(db.String(32), default="VALID") # VALID, SUSPECT, GAP_FILLED, CLOUD_MASKED, UNCERTAIN
    processing_level = db.Column(db.String(32), default="L3") # L2, L3, L3T, L4, REANALYSIS
    provenance = db.Column(db.String(32), default="MODELLED") # LIVE, CACHED, PARTIAL, MODELLED, STATISTICAL, DEMONSTRATION
    metadata_json = db.Column(db.Text, nullable=True) # Additional granule/sensor metadata
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint(
            "dataset_id", "country_code", "latitude", "longitude", "observation_date", "variable_name",
            name="uq_dataset_location_date_var"
        ),
    )

    def __init__(self, **kwargs):
        if "id" not in kwargs or not kwargs["id"]:
            kwargs["id"] = f"obs-{uuid.uuid4().hex[:12]}"
        super().__init__(**kwargs)

    def to_dict(self):
        meta = {}
        if self.metadata_json:
            try:
                meta = json.loads(self.metadata_json)
            except Exception:
                meta = {"raw": self.metadata_json}

        return {
            "id": self.id,
            "datasetId": self.dataset_id,
            "countryCode": self.country_code,
            "farmId": self.farm_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "observationDate": self.observation_date,
            "observationPeriod": self.observation_period,
            "variableName": self.variable_name,
            "value": self.value,
            "unit": self.unit,
            "qualityFlag": self.quality_flag,
            "processingLevel": self.processing_level,
            "provenance": self.provenance,
            "metadata": meta,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class DatasetIngestionLog(db.Model):
    __tablename__ = "dataset_ingestion_logs"

    id = db.Column(db.String(64), primary_key=True)
    dataset_id = db.Column(db.String(64), db.ForeignKey("datasets.id"), nullable=False, index=True)
    ingestion_started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ingestion_completed_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(32), default="RUNNING") # RUNNING, COMPLETED, FAILED, PARTIAL
    records_received = db.Column(db.Integer, default=0)
    records_inserted = db.Column(db.Integer, default=0)
    records_updated = db.Column(db.Integer, default=0)
    records_rejected = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)

    def __init__(self, **kwargs):
        if "id" not in kwargs or not kwargs["id"]:
            kwargs["id"] = f"ingest-{uuid.uuid4().hex[:10]}"
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "datasetId": self.dataset_id,
            "ingestionStartedAt": self.ingestion_started_at.isoformat() if self.ingestion_started_at else None,
            "ingestionCompletedAt": self.ingestion_completed_at.isoformat() if self.ingestion_completed_at else None,
            "status": self.status,
            "recordsReceived": self.records_received,
            "recordsInserted": self.records_inserted,
            "recordsUpdated": self.records_updated,
            "recordsRejected": self.records_rejected,
            "errorMessage": self.error_message
        }
