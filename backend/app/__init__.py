from flask import Flask, jsonify
from dotenv import load_dotenv

from config import Config
from .extensions import db, jwt, cors


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173"
                ]
            }
        }
    )

    # Load all database models
    from . import models

    @app.route("/")
    def home():
        return jsonify({
            "success": True,
            "message": "School Management System API is running"
        })

    @app.route("/api/health")
    def health():
        return jsonify({
            "success": True,
            "message": "Backend is connected and healthy"
        })

    return app
