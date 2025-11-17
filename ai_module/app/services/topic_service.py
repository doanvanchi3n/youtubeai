"""
Topic Classification Service
"""
from app.models.model_loader import ModelLoader
from app.utils.text_processor import TextProcessor

model_loader = ModelLoader()
text_processor = TextProcessor()


class TopicService:
    """Service for topic classification"""
    
    def classify_topics(self, title, description, comments):
        """
        Classify topics from video metadata
        
        Args:
            title: Video title
            description: Video description
            comments: List of comment texts
            
        Returns:
            dict: {
                'topics': ['topic1', 'topic2', ...],
                'confidence': float
            }
        """
        # Get topic model
        topic_model = model_loader.get_topic_model()
        
        # If model not loaded, return default
        if topic_model is None:
            return {
                'topics': ['general'],
                'confidence': 0.5
            }
        
        # Combine all text
        combined_text = f"{title} {description} {' '.join(comments[:10])}"
        processed_text = text_processor.preprocess(combined_text)
        
        # Predict topics
        topics_pred = topic_model.predict([processed_text])[0]
        topics_proba = topic_model.predict_proba([processed_text])[0]
        confidence = max(topics_proba)
        
        # Format result (assuming model returns single topic or list)
        if isinstance(topics_pred, list):
            topics = topics_pred
        else:
            topics = [topics_pred]
        
        return {
            'topics': topics,
            'confidence': round(float(confidence), 4)
        }

