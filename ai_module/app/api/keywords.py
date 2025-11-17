"""
Keyword Extraction API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.keyword_service import KeywordService
from app.utils.validators import validate_texts_array

bp = Blueprint('keywords', __name__)
keyword_service = KeywordService()


@bp.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    """
    Extract keywords from texts
    
    Request body:
    {
        "texts": ["string1", "string2", ...],
        "max_keywords": 10
    }
    
    Response:
    {
        "keywords": [
            {"keyword": "string", "frequency": 10},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing "texts" field'}), 400
        
        texts = data['texts']
        max_keywords = data.get('max_keywords', 10)
        
        if not validate_texts_array(texts):
            return jsonify({'error': 'Invalid texts array'}), 400
        
        # Extract keywords
        keywords = keyword_service.extract_keywords(texts, max_keywords)
        
        return jsonify({'keywords': keywords}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

