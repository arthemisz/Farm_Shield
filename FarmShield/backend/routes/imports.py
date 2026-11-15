from flask import Blueprint, jsonify, request
from services.user_data_import_service import user_data_import_service

imports_bp = Blueprint("imports", __name__)

@imports_bp.route("", methods=["GET"])
def list_imports():
    country = request.args.get("country")
    status = request.args.get("status")
    results = user_data_import_service.list_imports(country_code=country, status=status)
    return jsonify({
        "success": True,
        "count": len(results),
        "data": results
    })

@imports_bp.route("/upload", methods=["POST"])
def upload_dataset():
    data = request.get_json(silent=True) or {}
    file_content = data.get("fileContent")
    filename = data.get("filename", "upload.csv")
    dataset_type = data.get("datasetType", "crop_calendar")
    country_code = data.get("countryCode", "ET")
    title = data.get("title", f"Imported {dataset_type} Dataset")
    source_name = data.get("sourceName", "User Submission")
    source_url = data.get("sourceUrl")
    license_type = data.get("license", "Open Access / Government Extension")

    if not file_content:
        return jsonify({"success": False, "message": "Missing 'fileContent' field."}), 400

    result = user_data_import_service.validate_and_stage_dataset(
        file_content=file_content,
        filename=filename,
        dataset_type=dataset_type,
        country_code=country_code,
        title=title,
        source_name=source_name,
        source_url=source_url,
        license_type=license_type
    )

    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code

