import os
from flask import Flask
from flask_cors import CORS
from config import Config
from models import db, Farm
from routes import register_routes

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config.get("CORS_ORIGINS", "*"))

    # Register all API endpoints
    register_routes(app)

    # Seed baseline demo farms if database is empty
    with app.app_context():
        db.create_all()
        seed_initial_data()

    return app

def seed_initial_data():
    if Farm.query.count() == 0:
        demo_farms = [
            Farm(
                id="farm-1",
                name="Bishoftu Demonstration Farm",
                country_code="ET",
                country="Ethiopia",
                admin_level1="Oromia",
                admin_level2="East Shewa",
                admin_level3="Ada'a",
                latitude=8.7523,
                longitude=38.9841,
                size=12.5,
                size_unit="hectares",
                soil_type="Vertisols (Black clay)",
                water_availability="Rainfed",
                current_crop="Teff",
                elevation_meters=1920,
                description="Highland clay loam research farm specializing in teff and legume rotation trials."
            ),
            Farm(
                id="farm-2",
                name="Arsi Highland Wheat Plot",
                country_code="ET",
                country="Ethiopia",
                admin_level1="Oromia",
                admin_level2="Arsi",
                admin_level3="Tiyo",
                latitude=7.8732,
                longitude=39.1412,
                size=8.0,
                size_unit="hectares",
                soil_type="Nitisols (Red basaltic)",
                water_availability="Rainfed",
                current_crop="Bread Wheat",
                elevation_meters=2400,
                description="Cool highland wheat field with rolling topography; assessing faba bean rotation benefits."
            ),
            Farm(
                id="farm-3",
                name="Rift Valley Maize Pilot",
                country_code="ET",
                country="Ethiopia",
                admin_level1="Oromia",
                admin_level2="East Shewa",
                admin_level3="Adama",
                latitude=8.5411,
                longitude=39.2689,
                size=15.0,
                size_unit="hectares",
                soil_type="Cambisols (Brown loamy)",
                water_availability="Irrigated",
                current_crop="Maize",
                elevation_meters=1650,
                description="Semi-arid valley farm with furrow irrigation setup; evaluating soil nitrogen replenishment cycles."
            )
        ]
        db.session.bulk_save_objects(demo_farms)
        db.session.commit()
        print("Initialized database with baseline demonstration farms.")

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

