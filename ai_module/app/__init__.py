"""
Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()


def create_app(config_name='development'):
    """
    Application factory pattern
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(f'app.config.{config_name.capitalize()}Config')
    
    # Enable CORS
    CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:8080').split(','))
    
    # Register blueprints
    from app.api.routes import bp as routes_bp
    from app.api.sentiment import bp as sentiment_bp
    from app.api.keywords import bp as keywords_bp
    from app.api.topics import bp as topics_bp
    from app.api.content import bp as content_bp
    from app.api.analytics import bp as analytics_bp
    
    app.register_blueprint(routes_bp)
    app.register_blueprint(sentiment_bp, url_prefix='/api')
    app.register_blueprint(keywords_bp, url_prefix='/api')
    app.register_blueprint(topics_bp, url_prefix='/api')
    app.register_blueprint(content_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    
    return app

