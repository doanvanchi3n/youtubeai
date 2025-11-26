"""
Test PhoBERT API with proper UTF-8 encoding
"""
import requests
import json

API_URL = "http://localhost:5000/api/analyze-sentiment"
BATCH_URL = "http://localhost:5000/api/analyze-sentiment/batch"

def test_single(text, expected_sentiment=None):
    """Test single text analysis"""
    print(f"\n{'='*60}")
    print(f"Test: {text}")
    print(f"Expected: {expected_sentiment}" if expected_sentiment else "")
    
    try:
        response = requests.post(
            API_URL,
            json={"text": text},
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Response:")
        print(f"   Sentiment: {result['sentiment']}")
        print(f"   Emotion: {result['emotion']}")
        print(f"   Confidence: {result['confidence']:.4f}")
        
        if expected_sentiment:
            match = result['sentiment'] == expected_sentiment
            status = "✅" if match else "⚠️"
            print(f"   {status} Match expected: {match}")
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"   Response: {e.response.text}")
        return None

def test_batch(texts):
    """Test batch analysis"""
    print(f"\n{'='*60}")
    print(f"Batch Test: {len(texts)} texts")
    
    try:
        response = requests.post(
            BATCH_URL,
            json={"texts": texts},
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Response:")
        for i, item in enumerate(result['results'], 1):
            print(f"   {i}. {item['text'][:50]}...")
            print(f"      → {item['sentiment']} / {item['emotion']} (conf: {item['confidence']:.4f})")
        
        return result
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"   Response: {e.response.text}")
        return None

if __name__ == "__main__":
    print("🧪 Testing PhoBERT API")
    print("="*60)
    
    # Test cases
    test_cases = [
        ("Video này rất hay!", "positive"),
        ("Video này chán quá", "negative"),
        ("Có thể cải thiện phần âm thanh", "neutral"),
        ("Vui quá anh Hiếu ơi!", "positive"),
        ("Chán quá anh ơi", "negative"),
        ("Mong video sau của anh sẽ hay hơn", "neutral"),
    ]
    
    # Test single
    print("\n📝 Single Text Tests:")
    for text, expected in test_cases:
        test_single(text, expected)
    
    # Test batch
    print("\n\n📦 Batch Test:")
    batch_texts = [text for text, _ in test_cases[:3]]
    test_batch(batch_texts)
    
    print("\n" + "="*60)
    print("✅ Testing complete!")

