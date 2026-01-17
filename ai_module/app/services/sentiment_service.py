"""
Sentiment Analysis Service - Phân tích cảm xúc và sentiment của comments
Hỗ trợ 2 phương pháp: PhoBERT (ưu tiên) và scikit-learn (fallback)
"""
import os
import torch
from typing import List, Dict, Optional
from unidecode import unidecode
from app.utils.text_processor import TextProcessor
from app.data.sentiment_keywords import (
    POSITIVE_KEYWORDS,
    HAPPY_KEYWORDS,
    SUGGESTION_KEYWORDS,
    NEGATIVE_KEYWORDS,
    ATTACK_KEYWORDS
)

text_processor = TextProcessor()

# Import transformers cho PhoBERT (nếu có)
try:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠ Transformers not available, will use scikit-learn fallback")

# Import scikit-learn làm fallback
try:
    from app.models.model_loader import ModelLoader
    model_loader = ModelLoader()
    SKLEARN_AVAILABLE = True
except:
    SKLEARN_AVAILABLE = False


class SentimentService:
    """
    Service phân tích sentiment và emotion của comments
    - Sentiment: positive/negative/neutral
    - Emotion: happy/sad/angry/suggestion/love
    """
    
    def __init__(self):
        # Chọn device (GPU nếu có, không thì CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.use_phobert = False
        self.sentiment_model = None
        self.emotion_model = None
        self.tokenizer = None
        
        # Labels cho sentiment và emotion
        self.sentiment_labels = ["negative", "neutral", "positive"]
        self.emotion_labels = ["sad", "angry", "suggestion", "happy", "love"]
        
        # Keyword sets cho rule-based adjustment
        self.positive_keywords = POSITIVE_KEYWORDS
        self.happy_keywords = HAPPY_KEYWORDS
        self.suggestion_keywords = SUGGESTION_KEYWORDS
        self.negative_keywords = NEGATIVE_KEYWORDS
        self.attack_keywords = ATTACK_KEYWORDS
        
        # Load PhoBERT models nếu có
        self._load_phobert_models()
        
        # Fallback sang scikit-learn nếu PhoBERT không có
        if not self.use_phobert and SKLEARN_AVAILABLE:
            print("Using scikit-learn models as fallback")
    
    def _load_phobert_models(self):
        """
        Load PhoBERT models từ local path
        Nếu không có → fallback sang scikit-learn
        """
        if not TRANSFORMERS_AVAILABLE:
            return
        
        try:
            # Lấy model paths từ env hoặc dùng default
            sentiment_model_path = os.getenv(
                'PHOBERT_SENTIMENT_MODEL_PATH',
                'app/data/models/phobert_sentiment'
            )
            emotion_model_path = os.getenv(
                'PHOBERT_EMOTION_MODEL_PATH',
                'app/data/models/phobert_emotion'
            )
            
            # Kiểm tra models có tồn tại không
            if os.path.exists(sentiment_model_path) and os.path.exists(emotion_model_path):
                print("Loading PhoBERT models...")
                # Load tokenizer và models
                self.tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
                self.sentiment_model = AutoModelForSequenceClassification.from_pretrained(
                    sentiment_model_path
                ).to(self.device)
                self.sentiment_model.eval()  # Set eval mode
                
                self.emotion_model = AutoModelForSequenceClassification.from_pretrained(
                    emotion_model_path
                ).to(self.device)
                self.emotion_model.eval()
                
                self.use_phobert = True
                print("✓ PhoBERT models loaded successfully")
            else:
                print(f"⚠ PhoBERT models not found at {sentiment_model_path} or {emotion_model_path}")
                print("  Using scikit-learn fallback")
        except Exception as e:
            print(f"⚠ Error loading PhoBERT models: {e}")
            print("  Using scikit-learn fallback")
    
    def analyze(self, text: str) -> Dict:
        """
        Phân tích sentiment và emotion của một text
        
        Returns:
            {
                'sentiment': 'positive|negative|neutral',
                'emotion': 'happy|sad|angry|suggestion|love',
                'confidence': float (0-1)
            }
        """
        # Text rỗng → trả về neutral
        if not text or not text.strip():
            return {
                'sentiment': 'neutral',
                'emotion': 'suggestion',
                'confidence': 0.5
            }
        
        # Chọn model: PhoBERT (ưu tiên) → scikit-learn → default
        if self.use_phobert:
            result = self._analyze_phobert(text)
        elif SKLEARN_AVAILABLE:
            result = self._analyze_sklearn(text)
        else:
            # Default fallback
            result = {
                'sentiment': 'neutral',
                'emotion': 'suggestion',
                'confidence': 0.5
            }
        
        # Áp dụng rule-based adjustment để cải thiện kết quả
        return self._apply_rule_based_adjustment(text, result)
    
    def _analyze_phobert(self, text: str) -> Dict:
        """
        Phân tích bằng PhoBERT (transformer model cho tiếng Việt)
        - Tokenize text → Predict sentiment → Predict emotion
        """
        try:
            # Tokenize text thành tokens
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=256
            ).to(self.device)
            
            # Predict sentiment (positive/negative/neutral)
            with torch.no_grad():
                sentiment_output = self.sentiment_model(**inputs)
                sentiment_probs = torch.softmax(sentiment_output.logits, dim=-1)
                sentiment_pred_idx = torch.argmax(sentiment_probs, dim=-1).item()
                sentiment_confidence = sentiment_probs[0][sentiment_pred_idx].item()
            
            # Predict emotion (happy/sad/angry/suggestion/love)
            with torch.no_grad():
                emotion_output = self.emotion_model(**inputs)
                emotion_probs = torch.softmax(emotion_output.logits, dim=-1)
                emotion_pred_idx = torch.argmax(emotion_probs, dim=-1).item()
                emotion_confidence = emotion_probs[0][emotion_pred_idx].item()
            
            # Kết hợp kết quả và áp dụng rule-based adjustment
            return self._apply_rule_based_adjustment(text, {
                'sentiment': self.sentiment_labels[sentiment_pred_idx],
                'emotion': self.emotion_labels[emotion_pred_idx],
                'confidence': round((sentiment_confidence + emotion_confidence) / 2, 4)
            })
        except Exception as e:
            print(f"Error in PhoBERT analysis: {e}")
            # Fallback sang scikit-learn nếu có
            if SKLEARN_AVAILABLE:
                return self._analyze_sklearn(text)
            return {
                'sentiment': 'neutral',
                'emotion': 'suggestion',
                'confidence': 0.5
            }
    
    def _analyze_sklearn(self, text: str) -> Dict:
        """
        Phân tích bằng scikit-learn (fallback khi không có PhoBERT)
        - Preprocess text → Predict sentiment → Predict emotion
        """
        try:
            # Preprocess text (normalize, remove special chars)
            processed_text = text_processor.preprocess(text)
            
            # Lấy models từ ModelLoader
            sentiment_model = model_loader.get_sentiment_model()
            emotion_model = model_loader.get_emotion_model()
            
            # Nếu models chưa load → trả về default
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
            
            # Confidence = trung bình của sentiment và emotion
            confidence = (sentiment_confidence + emotion_confidence) / 2
            
            return self._apply_rule_based_adjustment(text, {
                'sentiment': sentiment_pred,
                'emotion': emotion_pred,
                'confidence': round(float(confidence), 4)
            })
        except Exception as e:
            print(f"Error in scikit-learn analysis: {e}")
            return {
                'sentiment': 'neutral',
                'emotion': 'suggestion',
                'confidence': 0.5
            }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """
        Phân tích batch nhiều texts cùng lúc (tối ưu performance)
        Returns: List[Dict] với mỗi dict có 'text', 'sentiment', 'emotion', 'confidence'
        """
        if self.use_phobert:
            # PhoBERT hỗ trợ batch processing tốt hơn
            return self._analyze_batch_phobert(texts)
        else:
            # scikit-learn: xử lý tuần tự từng text
            results = []
            for text in texts:
                result = self.analyze(text)
                result['text'] = text
                results.append(result)
            return results
    
    def _analyze_batch_phobert(self, texts: List[str]) -> List[Dict]:
        """
        Batch processing với PhoBERT (chia nhỏ thành batches để tránh OOM)
        Batch size = 16 (có thể điều chỉnh theo GPU memory)
        """
        results = []
        batch_size = 16  # Adjust based on GPU memory
        
        # Chia texts thành các batch nhỏ
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_results = self._analyze_batch_internal(batch)
            results.extend(batch_results)
        
        return results
    
    def _analyze_batch_internal(self, texts: List[str]) -> List[Dict]:
        """
        Xử lý batch nội bộ với PhoBERT
        Tokenize batch → Predict sentiment batch → Predict emotion batch
        """
        try:
            # Tokenize batch
            inputs = self.tokenizer(
                texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=256
            ).to(self.device)
            
            # Predict sentiment batch
            with torch.no_grad():
                sentiment_output = self.sentiment_model(**inputs)
                sentiment_probs = torch.softmax(sentiment_output.logits, dim=-1)
                sentiment_preds = torch.argmax(sentiment_probs, dim=-1)
                sentiment_confs = torch.max(sentiment_probs, dim=-1)[0]
            
            # Predict emotion batch
            with torch.no_grad():
                emotion_output = self.emotion_model(**inputs)
                emotion_probs = torch.softmax(emotion_output.logits, dim=-1)
                emotion_preds = torch.argmax(emotion_probs, dim=-1)
                emotion_confs = torch.max(emotion_probs, dim=-1)[0]
            
            # Build results
            batch_results = []
            for i in range(len(texts)):
                adjusted = self._apply_rule_based_adjustment(texts[i], {
                    'text': texts[i],
                    'sentiment': self.sentiment_labels[sentiment_preds[i].item()],
                    'emotion': self.emotion_labels[emotion_preds[i].item()],
                    'confidence': round(
                        (sentiment_confs[i].item() + emotion_confs[i].item()) / 2,
                        4
                    )
                })
                batch_results.append(adjusted)
            
            return batch_results
        except Exception as e:
            print(f"Error in batch PhoBERT analysis: {e}")
            # Fallback to individual analysis
            results = []
            for text in texts:
                result = self._analyze_sklearn(text) if SKLEARN_AVAILABLE else {
                    'sentiment': 'neutral',
                    'emotion': 'suggestion',
                    'confidence': 0.5
                }
                result['text'] = text
                results.append(result)
            return results

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text: lowercase + remove accents (unidecode)
        Ví dụ: "Thích" → "thich"
        """
        if not text:
            return ""
        lowered = text.lower()
        return unidecode(lowered)
    
    def _detect_contrast_patterns(self, text: str) -> Dict[str, any]:
        """
        Phát hiện pattern tương phản: "thích X, chứ Y éo vui"
        → Overall sentiment là negative (phần sau quan trọng hơn)
        """
        import re
        
        # Common contrast markers in Vietnamese
        contrast_markers = [
            r'chu\s+',  # "chứ"
            r'nhung\s+',  # "nhưng"
            r'ma\s+',  # "mà"
            r'con\s+',  # "còn"
            r'khong\s+phai\s+',  # "không phải"
            r'khac\s+',  # "khác"
        ]
        
        # Pattern: positive verb + object, contrast_marker + negative part
        # Example: "thích X, chứ Y éo vui"
        positive_verbs = ['thich', 'yeu', 'me', 'thich hon', 'thich nhat']
        
        for marker in contrast_markers:
            # Split by contrast marker
            parts = re.split(marker, text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                before = parts[0].strip()
                after = parts[1].strip()
                
                # Check if before part has positive verb
                has_positive_before = any(verb in before for verb in positive_verbs)
                
                # Check if after part has negative/attack keywords
                has_negative_after = (
                    any(kw in after for kw in self.negative_keywords) or
                    any(kw in after for kw in self.attack_keywords) or
                    'eo' in after or 'me' in after
                )
                
                if has_positive_before and has_negative_after:
                    return {
                        'has_contrast': True,
                        'positive_part': before,
                        'negative_part': after,
                        'is_negative_overall': True  # Overall sentiment is negative
                    }
        
        return {'has_contrast': False}
    
    def _detect_toxicity(self, text: str) -> Dict[str, any]:
        """
        Phát hiện ngôn ngữ toxic/offensive
        - Direct attack: "ngu", "dai", "oc cho" → toxic
        - Slang trong context tích cực: "eo hay qua" → không toxic (emphasis)
        - Slang trong context tiêu cực: "eo te" → toxic
        """
        normalized = self._normalize_text(text)
        
        # Direct attack keywords (high toxicity)
        direct_attacks = ['ngu', 'dai', 'dien', 'oc cho', 'mat day', 'vo hoc', 'rac roi']
        has_direct_attack = any(attack in normalized for attack in direct_attacks)
        
        # Slang used as intensifier (lower toxicity, context-dependent)
        slang_intensifiers = ['eo', 'me', 'vl', 'vcl']
        has_slang = any(slang in normalized for slang in slang_intensifiers)
        
        # Check if slang is used as emphasis in positive context
        positive_verbs = ['thich', 'yeu', 'hay', 'tuyet']
        is_positive_context = any(verb in normalized for verb in positive_verbs)
        
        if has_direct_attack:
            return {'is_toxic': True, 'toxicity_type': 'direct_attack'}
        elif has_slang and not is_positive_context:
            # Slang in negative context = toxicity
            return {'is_toxic': True, 'toxicity_type': 'offensive_language'}
        elif has_slang and is_positive_context:
            # Slang in positive context = emphasis (not toxic)
            return {'is_toxic': False, 'toxicity_type': 'emphasis'}
        
        return {'is_toxic': False, 'toxicity_type': 'none'}
    
    def _apply_rule_based_adjustment(self, text: str, result: Dict) -> Dict:
        """
        Áp dụng rule-based adjustment để cải thiện kết quả từ AI model
        Logic theo thứ tự ưu tiên:
        1. Contrast patterns (cao nhất)
        2. Suggestions keywords
        3. Toxicity detection
        4. Keyword counting (positive vs negative)
        5. Attack keywords
        6. Negative keywords
        """
        normalized = self._normalize_text(text)
        if not normalized:
            return result
        
        def contains_keywords(keywords):
            return any(kw in normalized for kw in keywords)
        
        confidence = result.get('confidence', 0.5)
        
        # Step 1: Check for contrast patterns first (highest priority)
        contrast_info = self._detect_contrast_patterns(normalized)
        if contrast_info.get('has_contrast'):
            # If contrast detected and negative part exists, overall is negative
            if contrast_info.get('is_negative_overall'):
                result['sentiment'] = 'negative'
                # Check toxicity of negative part
                toxicity = self._detect_toxicity(contrast_info.get('negative_part', ''))
                if toxicity.get('is_toxic'):
                    result['emotion'] = 'angry'
                else:
                    result['emotion'] = 'sad'
                result['confidence'] = max(confidence, 0.9)
                return result
        
        # Step 2: Suggestions should override most things
        if contains_keywords(self.suggestion_keywords):
            result['sentiment'] = 'neutral'
            result['emotion'] = 'suggestion'
            result['confidence'] = max(confidence, 0.8)
            return result
        
        # Step 3: Separate toxicity detection
        toxicity_info = self._detect_toxicity(normalized)
        
        # Step 4: Count positive vs negative keywords (more accurate)
        def count_keywords(keywords):
            count = 0
            for kw in keywords:
                if kw in normalized:
                    count += 1
            return count
        
        positive_count = count_keywords(self.positive_keywords) + count_keywords(self.happy_keywords)
        negative_count = count_keywords(self.negative_keywords)
        attack_count = count_keywords(self.attack_keywords)
        
        has_positive = positive_count > 0
        has_negative = negative_count > 0
        has_attack = attack_count > 0
        
        # Step 5: Context-aware decision with keyword counting
        if has_positive:
            # If positive keywords exist
            # Only override with attack if it's a direct attack AND positive count is low
            if has_attack and toxicity_info.get('toxicity_type') == 'direct_attack' and positive_count < 2:
                # Direct attack overrides positive only if few positive keywords
                result['sentiment'] = 'negative'
                result['emotion'] = 'angry'
                result['confidence'] = max(confidence, 0.85)
            elif positive_count >= 2 or (positive_count > 0 and not has_negative and not has_attack):
                # Strong positive signal: multiple positive keywords OR no negative/attack
                if contains_keywords(self.positive_keywords):
                    result['sentiment'] = 'positive'
                    result['emotion'] = 'love'
                    result['confidence'] = max(confidence, 0.9)  # Higher confidence for strong positive
                elif contains_keywords(self.happy_keywords):
                    result['sentiment'] = 'positive'
                    result['emotion'] = 'happy'
                    result['confidence'] = max(confidence, 0.85)
                return result
            elif positive_count > 0 and positive_count > negative_count:
                # Positive keywords outnumber negative ones
                if contains_keywords(self.positive_keywords):
                    result['sentiment'] = 'positive'
                    result['emotion'] = 'love'
                    result['confidence'] = max(confidence, 0.85)
                elif contains_keywords(self.happy_keywords):
                    result['sentiment'] = 'positive'
                    result['emotion'] = 'happy'
                    result['confidence'] = max(confidence, 0.8)
                return result
        
        # Step 6: Attack keywords (if not overridden by positive context)
        if has_attack:
            result['sentiment'] = 'negative'
            result['emotion'] = 'angry'
            result['confidence'] = max(confidence, 0.85)
            return result
        
        # Step 7: Negative keywords
        if has_negative:
            result['sentiment'] = 'negative'
            if result.get('emotion') in ['happy', 'love']:
                result['emotion'] = 'sad'
            result['confidence'] = max(confidence, 0.7)
        
        return result

