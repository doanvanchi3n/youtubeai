"""
Analytics API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.analytics_service import AnalyticsService

bp = Blueprint('analytics', __name__)
analytics_service = AnalyticsService()


@bp.route('/analytics/optimal-posting-time', methods=['POST'])
def optimal_posting_time():
    """
    Analyze optimal posting time
    
    Request body:
    {
        "view_data": [...],
        "like_data": [...],
        "comment_data": [...]
    }
    
    Response:
    {
        "optimal_hours": [14, 15, 16],
        "optimal_days": ["Monday", "Tuesday"],
        "recommendations": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing request body'}), 400
        
        view_data = data.get('view_data', [])
        like_data = data.get('like_data', [])
        comment_data = data.get('comment_data', [])
        
        # Analyze optimal posting time
        result = analytics_service.analyze_optimal_posting_time(
            view_data, like_data, comment_data
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

