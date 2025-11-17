"""
Sentiment Analysis API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.sentiment_service import SentimentService
from app.utils.validators import validate_text_input

bp = Blueprint('sentiment', __name__)
sentiment_service = SentimentService()


@bp.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Analyze sentiment and emotion of a single text
    
    Request body:
    {
        "text": "string"
    }
    
    Response:
    {
        "sentiment": "positive|negative|neutral",
        "emotion": "happy|sad|angry|suggestion|love",
        "confidence": 0.95
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field'}), 400
        
        text = data['text']
        
        # Validate input
        if not validate_text_input(text):
            return jsonify({'error': 'Invalid text input'}), 400
        
        # Analyze sentiment
        result = sentiment_service.analyze(text)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/analyze-sentiment/batch', methods=['POST'])
def analyze_sentiment_batch():
    """
    Analyze sentiment and emotion of multiple texts
    
    Request body:
    {
        "texts": ["string1", "string2", ...]
    }
    
    Response:
    {
        "results": [
            {
                "text": "string1",
                "sentiment": "positive",
                "emotion": "happy",
                "confidence": 0.95
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing "texts" field'}), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({'error': 'Invalid texts array'}), 400
        
        # Analyze batch
        results = sentiment_service.analyze_batch(texts)
        
        return jsonify({'results': results}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

