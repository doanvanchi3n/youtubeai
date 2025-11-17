"""
Text Preprocessing Utilities
"""
import re
import string


class TextProcessor:
    """Text preprocessing utilities"""
    
    def preprocess(self, text):
        """
        Preprocess text for ML models
        
        Args:
            text: Raw text string
            
        Returns:
            str: Preprocessed text
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text
    
    def tokenize(self, text):
        """
        Tokenize text into words
        
        Args:
            text: Input text
            
        Returns:
            list: List of tokens
        """
        # Simple tokenization (can be enhanced with Vietnamese NLP)
        text = self.preprocess(text)
        tokens = text.split()
        return tokens
    
    def remove_stopwords(self, tokens, stopwords=None):
        """
        Remove stopwords from tokens
        
        Args:
            tokens: List of tokens
            stopwords: Set of stopwords (optional)
            
        Returns:
            list: Tokens without stopwords
        """
        if stopwords is None:
            # Default stopwords (can load from file)
            stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        
        return [token for token in tokens if token not in stopwords]

