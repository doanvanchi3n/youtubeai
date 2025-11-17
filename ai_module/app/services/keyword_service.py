"""
Keyword Extraction Service
"""
from app.utils.text_processor import TextProcessor
from collections import Counter

text_processor = TextProcessor()


class KeywordService:
    """Service for keyword extraction"""
    
    def extract_keywords(self, texts, max_keywords=10):
        """
        Extract keywords from texts
        
        Args:
            texts: List of text strings
            max_keywords: Maximum number of keywords to return
            
        Returns:
            list: List of dicts with 'keyword' and 'frequency'
        """
        # Tokenize all texts
        all_tokens = []
        for text in texts:
            tokens = text_processor.tokenize(text)
            all_tokens.extend(tokens)
        
        # Remove stopwords
        tokens_filtered = text_processor.remove_stopwords(all_tokens)
        
        # Count frequencies
        word_freq = Counter(tokens_filtered)
        
        # Get top keywords
        top_keywords = word_freq.most_common(max_keywords)
        
        # Format result
        keywords = [
            {'keyword': keyword, 'frequency': freq}
            for keyword, freq in top_keywords
        ]
        
        return keywords

