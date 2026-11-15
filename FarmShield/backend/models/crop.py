import json
from . import db

class CropModel(db.Model):
    __tablename__ = "crops"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    scientific_name = db.Column(db.String(128), nullable=False)
    family = db.Column(db.String(128), nullable=True)
    category = db.Column(db.String(64), nullable=False)  # 'Cereal', 'Pulse', 'Oilseed', etc.
    description = db.Column(db.Text, nullable=True)
    data_json = db.Column(db.Text, nullable=False)  # Full crop attributes JSON

    def to_dict(self):
        try:
            parsed = json.loads(self.data_json)
            parsed["id"] = self.id
            parsed["name"] = self.name
            parsed["scientificName"] = self.scientific_name
            parsed["family"] = self.family
            parsed["category"] = self.category
            return parsed
        except Exception:
            return {
                "id": self.id,
                "name": self.name,
                "scientificName": self.scientific_name,
                "family": self.family,
                "category": self.category,
                "description": self.description,
            }

