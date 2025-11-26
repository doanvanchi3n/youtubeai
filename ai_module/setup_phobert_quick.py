"""
Quick setup script for PhoBERT models
This script will download base PhoBERT and create placeholder models
"""
import os
from pathlib import Path

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    print("✓ transformers installed")
except ImportError:
    print("❌ transformers not installed. Run: pip install transformers>=4.40.0")
    exit(1)

try:
    import torch
    print(f"✓ torch installed (version: {torch.__version__})")
except ImportError:
    print("❌ torch not installed. Run: pip install torch>=2.2.0")
    exit(1)

# Create directories
base_path = Path("app/data/models")
sentiment_path = base_path / "phobert_sentiment"
emotion_path = base_path / "phobert_emotion"

sentiment_path.mkdir(parents=True, exist_ok=True)
emotion_path.mkdir(parents=True, exist_ok=True)

print(f"\n📁 Created directories:")
print(f"  - {sentiment_path}")
print(f"  - {emotion_path}")

# Download base PhoBERT
print("\n📥 Downloading base PhoBERT model...")
model_name = "vinai/phobert-base"

try:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    print("✓ Tokenizer downloaded")
    
    # Create sentiment model (3 classes: negative, neutral, positive)
    print("\n🔧 Creating sentiment model (3 classes)...")
    sentiment_model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=3
    )
    sentiment_model.save_pretrained(str(sentiment_path))
    tokenizer.save_pretrained(str(sentiment_path))
    print(f"✓ Sentiment model saved to {sentiment_path}")
    
    # Create emotion model (5 classes: sad, angry, suggestion, happy, love)
    print("\n🔧 Creating emotion model (5 classes)...")
    emotion_model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=5
    )
    emotion_model.save_pretrained(str(emotion_path))
    tokenizer.save_pretrained(str(emotion_path))
    print(f"✓ Emotion model saved to {emotion_path}")
    
    print("\n✅ Setup complete!")
    print("\n⚠️  NOTE: These are base models, not fine-tuned.")
    print("   For better accuracy, you need to fine-tune them with your training data.")
    print("   See PHOBERT_SETUP_GUIDE.md for fine-tuning instructions.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check internet connection (needs to download models)")
    print("2. Make sure you have enough disk space (~500MB)")
    print("3. Try running: pip install --upgrade transformers")

