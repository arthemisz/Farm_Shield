from flask import Blueprint, jsonify
from .farms import farms_bp
from .climate import climate_bp
from .soil import soil_bp
from .crops import crops_bp
from .rotation import rotation_bp
from .vegetation import vegetation_bp
from .countries import countries_bp
from .datasets import datasets_bp
from .imports import imports_bp
from .ai_assistant import ai_assistant_bp
from .africa_map import africa_map_bp
from .recommendations import recommendations_bp

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "FarmShield Agricultural Intelligence API",
        "version": "1.0.0",
        "environment": "production-ready MVP"
    })

def register_routes(app):
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(farms_bp, url_prefix="/api/farms")
    app.register_blueprint(climate_bp, url_prefix="/api/climate")
    app.register_blueprint(soil_bp, url_prefix="/api/soil")
    app.register_blueprint(crops_bp, url_prefix="/api/crops")
    app.register_blueprint(rotation_bp, url_prefix="/api/rotation")
    app.register_blueprint(vegetation_bp, url_prefix="/api/vegetation")
    app.register_blueprint(countries_bp, url_prefix="/api/countries")
    app.register_blueprint(datasets_bp, url_prefix="/api/datasets")
    app.register_blueprint(imports_bp, url_prefix="/api/imports")
    app.register_blueprint(ai_assistant_bp, url_prefix="/api/ai-assistant")
    app.register_blueprint(africa_map_bp, url_prefix="/api/map")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")

