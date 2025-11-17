"""
Configuration classes for different environments
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Model paths
    SENTIMENT_MODEL_PATH = os.getenv(
        'SENTIMENT_MODEL_PATH', 
        'app/data/models/sentiment_model.pkl'
    )
    EMOTION_MODEL_PATH = os.getenv(
        'EMOTION_MODEL_PATH',
        'app/data/models/emotion_model.pkl'
    )
    TOPIC_MODEL_PATH = os.getenv(
        'TOPIC_MODEL_PATH',
        'app/data/models/topic_model.pkl'
    )
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8080').split(',')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True

