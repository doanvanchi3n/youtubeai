"""
Input Validation Utilities
"""
import re


def validate_text_input(text):
    """
    Validate text input
    
    Args:
        text: Input text string
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not text or not isinstance(text, str):
        return False
    
    # Check minimum length
    if len(text.strip()) < 1:
        return False
    
    # Check maximum length (prevent extremely long inputs)
    if len(text) > 10000:
        return False
    
    return True


def validate_texts_array(texts):
    """
    Validate array of texts
    
    Args:
        texts: List of text strings
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(texts, list):
        return False
    
    if len(texts) == 0:
        return False
    
    # Check maximum batch size
    if len(texts) > 1000:
        return False
    
    # Validate each text
    for text in texts:
        if not validate_text_input(text):
            return False
    
    return True

