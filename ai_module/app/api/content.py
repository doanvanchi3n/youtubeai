"""
Content Generation API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.content_service import ContentService

bp = Blueprint('content', __name__)
content_service = ContentService()


@bp.route('/generate-content', methods=['POST'])
def generate_content():
    """
    Generate content from description
    
    Request body:
    {
        "description": "string",
        "type": "title|description|tags|script"
    }
    
    Response:
    {
        "content": "string",
        "suggestions": ["suggestion1", "suggestion2", ...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({'error': 'Missing "description" field'}), 400
        
        description = data['description']
        content_type = data.get('type', 'title')
        
        # Generate content
        result = content_service.generate_content(description, content_type)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

