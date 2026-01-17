"""
Chat API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.chat_service import ChatService
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('chat', __name__)
chat_service = ChatService()

@bp.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint với conversation support
    
    Request:
    {
      "messages": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ],
      "context": {
        "keywords": [...],
        "description": "...",
        "locale": "vi-VN"
      }
    }
    
    Response:
    {
      "reply": "..."
    }
    """
    try:
        data = request.get_json() or {}
        messages = data.get('messages', [])
        context = data.get('context', {})
        
        # Validate messages
        if not isinstance(messages, list) or not messages:
            return jsonify({'error': 'messages must be a non-empty list'}), 400
        
        # Validate message format
        for msg in messages:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                return jsonify({'error': 'Invalid message format. Each message must have "role" and "content" fields'}), 400
            
            role = msg.get('role')
            if role not in ['user', 'assistant', 'system']:
                return jsonify({'error': f'Invalid role: {role}. Must be "user", "assistant", or "system"'}), 400
        
        # Log request info for debugging
        logger.info(f"📨 Chat request received: {len(messages)} messages, context: {bool(context)}")
        
        # Generate reply
        result = chat_service.generate_chat_reply(messages, context)
        
        # Log response
        reply_length = len(result.get('reply', ''))
        logger.info(f"📤 Chat response generated: {reply_length} characters")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Chat API error: {e}", exc_info=True)
        return jsonify({
            'error': str(e),
            'reply': 'Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng kiểm tra logs của AI Module.'
        }), 500

