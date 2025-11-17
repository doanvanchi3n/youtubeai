"""
Topic Classification API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.topic_service import TopicService

bp = Blueprint('topics', __name__)
topic_service = TopicService()


@bp.route('/classify-topics', methods=['POST'])
def classify_topics():
    """
    Classify topics from video title, description, and comments
    
    Request body:
    {
        "title": "string",
        "description": "string",
        "comments": ["string1", "string2", ...]
    }
    
    Response:
    {
        "topics": ["topic1", "topic2", ...],
        "confidence": 0.90
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing request body'}), 400
        
        title = data.get('title', '')
        description = data.get('description', '')
        comments = data.get('comments', [])
        
        # Classify topics
        result = topic_service.classify_topics(title, description, comments)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

