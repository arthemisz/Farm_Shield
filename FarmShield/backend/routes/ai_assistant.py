from flask import Blueprint, jsonify, request
from services.ai_assistant_service import ai_assistant_service

ai_assistant_bp = Blueprint("ai_assistant", __name__)

@ai_assistant_bp.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message", "")
    farm_context = payload.get("farmContext")
    country_code = payload.get("countryCode", "ET")
    capability = payload.get("capability", "assistant")

    if not message.strip():
        return jsonify({"success": False, "message": "Message content cannot be empty."}), 400

    result = ai_assistant_service.query_assistant(
        message=message,
        farm_context=farm_context,
        country_code=country_code,
        capability=capability
    )

    return jsonify(result)

@ai_assistant_bp.route("/status", methods=["GET"])
def get_ai_status():
    return jsonify({
        "success": True,
        "provider": ai_assistant_service.provider,
        "isLiveAI": bool(ai_assistant_service.api_key),
        "engine": "FarmShield Agronomic Knowledge Engine (Grounded)",
        "capabilities": [
            "Soil health, edaphic properties & pH explanation",
            "CHIRPS precipitation & WMO SPI drought advisory",
            "Sentinel-2 NDVI remote sensing canopy interpretation",
            "Rule-based crop rotation & biological nitrogen synergy advisory",
            "AI Crop Advisor: crop suitability & risk evaluation",
            "Verified national extension calendars"
        ]
    })
