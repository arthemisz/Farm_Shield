import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    
    # SQLite Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(BASE_DIR, 'farmshield.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # External APIs
    PLANETARY_COMPUTER_STAC_URL = os.environ.get(
        "PLANETARY_COMPUTER_STAC_URL", 
        "https://planetarycomputer.microsoft.com/api/stac/v1"
    )
    NASA_POWER_API_URL = os.environ.get(
        "NASA_POWER_API_URL", 
        "https://power.larc.nasa.gov/api/temporal/monthly/point"
    )
    SOILGRIDS_API_URL = os.environ.get(
        "SOILGRIDS_API_URL", 
        "https://rest.isric.org/soilgrids/v2.0/properties/query"
    )
    
    # OpenET Configuration
    OPENET_API_KEY = os.environ.get("OPENET_API_KEY", "").strip()
    OPENET_API_URL = os.environ.get("OPENET_API_URL", "https://openet-api.org").rstrip("/")
    
    # Request & Cache Config
    REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", 12))
    CACHE_EXPIRATION_HOURS = int(os.environ.get("CACHE_EXPIRATION_HOURS", 24))
    
    # CORS
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

