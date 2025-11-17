"""
Sentiment Analysis Service
"""
from app.models.model_loader import ModelLoader
from app.utils.text_processor import TextProcessor

model_loader = ModelLoader()
text_processor = TextProcessor()


class SentimentService:
    """Service for sentiment and emotion analysis"""
    
    def analyze(self, text):
        """
        Analyze sentiment and emotion of a single text
        
        Args:
            text: Input text string
            
        Returns:
            dict: {
                'sentiment': 'positive|negative|neutral',
                'emotion': 'happy|sad|angry|suggestion|love',
                'confidence': float
            }
        """
        # Preprocess text
        processed_text = text_processor.preprocess(text)
        
        # Get models
        sentiment_model = model_loader.get_sentiment_model()
        emotion_model = model_loader.get_emotion_model()
        
        # If models not loaded, return default
        if sentiment_model is None or emotion_model is None:
            return {
                'sentiment': 'neutral',
                'emotion': 'suggestion',
                'confidence': 0.5
            }
        
        # Predict sentiment
        sentiment_pred = sentiment_model.predict([processed_text])[0]
        sentiment_proba = sentiment_model.predict_proba([processed_text])[0]
        sentiment_confidence = max(sentiment_proba)
        
        # Predict emotion
        emotion_pred = emotion_model.predict([processed_text])[0]
        emotion_proba = emotion_model.predict_proba([processed_text])[0]
        emotion_confidence = max(emotion_proba)
        
        # Overall confidence (average)
        confidence = (sentiment_confidence + emotion_confidence) / 2
        
        return {
            'sentiment': sentiment_pred,
            'emotion': emotion_pred,
            'confidence': round(float(confidence), 4)
        }
    
    def analyze_batch(self, texts):
        """
        Analyze sentiment and emotion of multiple texts
        
        Args:
            texts: List of text strings
            
        Returns:
            list: List of analysis results
        """
        results = []
        for text in texts:
            result = self.analyze(text)
            result['text'] = text
            results.append(result)
        
        return results

