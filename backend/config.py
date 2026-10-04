import os


class Config:
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "school-management-secret-key"
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "school-management-jwt-secret-key"
    )

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///school.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
