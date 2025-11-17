"""
Main API routes
"""
from flask import Blueprint, jsonify
from app.models.model_loader import ModelLoader

bp = Blueprint('routes', __name__)
model_loader = ModelLoader()


@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Module',
        'models_loaded': {
            'sentiment': model_loader.is_sentiment_loaded(),
            'emotion': model_loader.is_emotion_loaded(),
            'topic': model_loader.is_topic_loaded()
        }
    })


@bp.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'YouTube AI Analytics - AI Module',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'sentiment': '/api/analyze-sentiment',
            'keywords': '/api/extract-keywords',
            'topics': '/api/classify-topics',
            'content': '/api/generate-content',
            'analytics': '/api/analytics/*'
        }
    })

