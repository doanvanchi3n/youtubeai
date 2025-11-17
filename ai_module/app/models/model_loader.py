"""
Model Loader - Load and cache ML models
"""
import os
import joblib
from app.config import Config


class ModelLoader:
    """Singleton class để load và cache ML models"""
    
    _instance = None
    _sentiment_model = None
    _emotion_model = None
    _topic_model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance
    
    def _load_models(self):
        """Load all models into memory"""
        try:
            # Load sentiment model
            if os.path.exists(Config.SENTIMENT_MODEL_PATH):
                self._sentiment_model = joblib.load(Config.SENTIMENT_MODEL_PATH)
                print(f"✓ Loaded sentiment model from {Config.SENTIMENT_MODEL_PATH}")
            else:
                print(f"⚠ Sentiment model not found at {Config.SENTIMENT_MODEL_PATH}")
            
            # Load emotion model
            if os.path.exists(Config.EMOTION_MODEL_PATH):
                self._emotion_model = joblib.load(Config.EMOTION_MODEL_PATH)
                print(f"✓ Loaded emotion model from {Config.EMOTION_MODEL_PATH}")
            else:
                print(f"⚠ Emotion model not found at {Config.EMOTION_MODEL_PATH}")
            
            # Load topic model
            if os.path.exists(Config.TOPIC_MODEL_PATH):
                self._topic_model = joblib.load(Config.TOPIC_MODEL_PATH)
                print(f"✓ Loaded topic model from {Config.TOPIC_MODEL_PATH}")
            else:
                print(f"⚠ Topic model not found at {Config.TOPIC_MODEL_PATH}")
                
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def get_sentiment_model(self):
        """Get sentiment model"""
        return self._sentiment_model
    
    def get_emotion_model(self):
        """Get emotion model"""
        return self._emotion_model
    
    def get_topic_model(self):
        """Get topic model"""
        return self._topic_model
    
    def is_sentiment_loaded(self):
        """Check if sentiment model is loaded"""
        return self._sentiment_model is not None
    
    def is_emotion_loaded(self):
        """Check if emotion model is loaded"""
        return self._emotion_model is not None
    
    def is_topic_loaded(self):
        """Check if topic model is loaded"""
        return self._topic_model is not None

