"""
Check if PhoBERT models are properly installed
"""
from pathlib import Path

base_path = Path("app/data/models")
sentiment_path = base_path / "phobert_sentiment"
emotion_path = base_path / "phobert_emotion"

print("Checking PhoBERT models...\n")

# Check sentiment model
print("📁 Sentiment Model:")
if sentiment_path.exists():
    files = list(sentiment_path.glob("*"))
    if files:
        print(f"  ✓ Found {len(files)} files:")
        for file in files:
            size = file.stat().st_size / (1024 * 1024)  # MB
            print(f"    - {file.name} ({size:.2f} MB)")
        
        # Check for essential files
        has_config = (sentiment_path / "config.json").exists()
        has_model = any("model" in f.name.lower() for f in files)
        has_tokenizer = (sentiment_path / "tokenizer_config.json").exists() or (sentiment_path / "vocab.txt").exists()
        
        if has_config and has_model and has_tokenizer:
            print("  ✅ Sentiment model is complete!")
        else:
            print("  ⚠️  Missing some files:")
            if not has_config: print("    - config.json")
            if not has_model: print("    - model file")
            if not has_tokenizer: print("    - tokenizer files")
    else:
        print("  ❌ Directory exists but is empty")
else:
    print("  ❌ Directory not found")

print("\n📁 Emotion Model:")
if emotion_path.exists():
    files = list(emotion_path.glob("*"))
    if files:
        print(f"  ✓ Found {len(files)} files:")
        for file in files:
            size = file.stat().st_size / (1024 * 1024)  # MB
            print(f"    - {file.name} ({size:.2f} MB)")
        
        # Check for essential files
        has_config = (emotion_path / "config.json").exists()
        has_model = any("model" in f.name.lower() for f in files)
        has_tokenizer = (emotion_path / "tokenizer_config.json").exists() or (emotion_path / "vocab.txt").exists()
        
        if has_config and has_model and has_tokenizer:
            print("  ✅ Emotion model is complete!")
        else:
            print("  ⚠️  Missing some files:")
            if not has_config: print("    - config.json")
            if not has_model: print("    - model file")
            if not has_tokenizer: print("    - tokenizer files")
    else:
        print("  ❌ Directory exists but is empty")
else:
    print("  ❌ Directory not found")

print("\n" + "="*50)
print("Summary:")
if sentiment_path.exists() and emotion_path.exists():
    sentiment_files = list(sentiment_path.glob("*"))
    emotion_files = list(emotion_path.glob("*"))
    if sentiment_files and emotion_files:
        print("✅ Both models are installed!")
        print("\nYou can now use PhoBERT in your AI Module.")
        print("Run: python main.py")
    else:
        print("⚠️  Models may be incomplete. Try running setup again.")
else:
    print("❌ Models not found. Run: python setup_phobert_quick.py")

