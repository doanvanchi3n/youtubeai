"""
Content Suggestion Service - AI-powered using free tools
- HuggingFace Inference API (FLAN-T5) for content generation
- Google Trends (pytrends) for trending topics
- YouTube autocomplete for trend signals
- TF-IDF for keyword extraction
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
import logging
import os
import re
import random
import requests

logger = logging.getLogger(__name__)

# Try importing optional dependencies
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    logger.warning("scikit-learn not available, using simple keyword extraction")

try:
    from pytrends.request import TrendReq
    HAS_PYTRENDS = True
except ImportError:
    HAS_PYTRENDS = False
    logger.warning("pytrends not available, skipping Google Trends")


class ContentService:
    """AI-powered content generation service"""
    
    def __init__(self):
        self.hf_token = os.getenv('HUGGINGFACE_API_TOKEN')
        self.hf_model = os.getenv('HUGGINGFACE_MODEL', 'google/flan-t5-large')
        self.session = requests.Session()
        self.trend_client = None
        
        if HAS_PYTRENDS:
            try:
                self.trend_client = TrendReq(hl='vi-VN', tz=420, retries=2, backoff_factor=0.2)
            except Exception as e:
                logger.warning(f"Could not initialize TrendReq: {e}")
        
        logger.info("✓ ContentService initialized with AI capabilities")
        if self.hf_token:
            logger.info(f"  - HuggingFace model: {self.hf_model}")
        else:
            logger.info("  - HuggingFace: Not configured (using fallback)")
    
    def _call_huggingface(self, prompt: str, max_length: int = 200) -> str:
        """Call HuggingFace Inference API (free tier) with retry"""
        if not self.hf_token:
            logger.debug("No HuggingFace token, skipping AI generation")
            return ""
        
        # Try multiple models if first fails
        models_to_try = [
            self.hf_model,
            'google/flan-t5-base',  # Smaller, faster
            'microsoft/DialoGPT-medium'  # Alternative
        ]
        
        for model in models_to_try:
            try:
                url = f"https://api-inference.huggingface.co/models/{model}"
                headers = {"Authorization": f"Bearer {self.hf_token}"}
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "max_length": max_length,
                        "temperature": 0.8,
                        "do_sample": True,
                        "top_p": 0.9
                    }
                }
                
                response = self.session.post(url, json=payload, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        text = result[0].get('generated_text', '')
                        if text and len(text) > 10:
                            logger.info(f"✓ AI generated using {model}")
                            return text
                    elif isinstance(result, dict):
                        text = result.get('generated_text', '')
                        if text and len(text) > 10:
                            logger.info(f"✓ AI generated using {model}")
                            return text
                elif response.status_code == 503:
                    # Model is loading, wait and retry
                    logger.debug(f"Model {model} is loading, trying next...")
                    continue
                else:
                    logger.debug(f"HuggingFace API returned {response.status_code}")
            except Exception as e:
                logger.debug(f"HuggingFace API error for {model}: {e}")
                continue
        
        logger.warning("All HuggingFace models failed, using fallback")
        return ""
    
    def _fetch_google_trends(self, keywords: List[str]) -> List[str]:
        """Fetch real Google Trends data"""
        if not self.trend_client or not keywords:
            return []
        
        try:
            kw_list = keywords[:5] if keywords else ['youtube', 'video']
            self.trend_client.build_payload(kw_list=kw_list, timeframe='today 3-m', geo='VN')
            related = self.trend_client.related_queries()
            
            trends = []
            if related:
                for data in related.values():
                    if data and isinstance(data, dict):
                        top_df = data.get('top')
                        if top_df is not None:
                            for _, row in top_df.head(10).iterrows():
                                query = str(row.get('query', '')).strip()
                                if query and query not in trends:
                                    trends.append(query)
            return trends[:10]
        except Exception as e:
            logger.debug(f"Google Trends error: {e}")
            return []
    
    def _fetch_youtube_trends(self, keyword: str) -> List[str]:
        """Fetch YouTube autocomplete suggestions (free, no API key needed)"""
        if not keyword:
            return []
        
        try:
            url = "https://suggestqueries.google.com/complete/search"
            params = {
                'client': 'firefox',
                'ds': 'yt',
                'hl': 'vi',
                'q': keyword
            }
            response = self.session.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 1:
                    suggestions = data[1]
                    return [str(s).strip() for s in suggestions[:10] if s]
        except Exception as e:
            logger.debug(f"YouTube autocomplete error: {e}")
        
        return []
    
    def _extract_keywords_tfidf(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords using TF-IDF"""
        if not HAS_SKLEARN or not text:
            # Fallback: simple word extraction
            words = re.findall(r'\b\w+\b', text.lower())
            return list(set(words))[:max_keywords]
        
        try:
            vectorizer = TfidfVectorizer(max_features=max_keywords, ngram_range=(1, 2), stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([text])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Get top keywords
            top_indices = scores.argsort()[-max_keywords:][::-1]
            keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
            return keywords
        except Exception as e:
            logger.debug(f"TF-IDF error: {e}")
            return []
    
    def _generate_ai_titles(self, keyword: str, description: str, trends: List[str]) -> List[str]:
        """Generate titles using AI"""
        context = f"Từ khóa: {keyword}. Mô tả: {description}. Xu hướng: {', '.join(trends[:3])}"
        
        prompt = f"""Bạn là chuyên gia tạo tiêu đề YouTube tại Việt Nam. 
Dựa trên thông tin sau, hãy tạo 10 tiêu đề video hấp dẫn, tối ưu SEO, mỗi tiêu đề 50-80 ký tự.
{context}

Trả về danh sách 10 tiêu đề, mỗi tiêu đề một dòng, không đánh số."""
        
        # Try HuggingFace first
        ai_output = self._call_huggingface(prompt, max_length=500)
        
        if ai_output:
            # Parse AI output
            titles = [line.strip() for line in ai_output.split('\n') if line.strip() and not line.strip().startswith('#')]
            titles = [t for t in titles if len(t) > 20 and len(t) < 100][:10]
            if len(titles) >= 5:
                return titles
        
        # Fallback: Generate smart titles using real trends (not fixed templates)
        titles = []
        
        # Use real trends from YouTube/Google if available
        if trends:
            for trend in trends[:7]:
                if trend and len(trend) > 5:
                    # Create varied titles based on real trends
                    variations = [
                        f"{trend}: {description[:35]}..." if description else trend,
                        f"Khám phá {trend} - {description[:30]}..." if description else f"Tất tần tật về {trend}",
                        f"{trend}: Hướng dẫn chi tiết",
                        f"Review {trend}: Có gì đặc biệt?",
                        f"Top 5 điều thú vị về {trend}"
                    ]
                    titles.extend(variations[:2])  # Take 2 variations per trend
        
        # Fill remaining with keyword-based titles (not fixed template)
        remaining = 10 - len(titles)
        if remaining > 0:
            keyword_variations = [
                f"{keyword}: {description[:40]}..." if description else f"Khám phá {keyword}",
                f"Hướng dẫn {keyword} từ A-Z" if len(keyword) < 30 else f"{keyword}: Hướng dẫn",
                f"Review {keyword}: Trải nghiệm thực tế" if len(keyword) < 25 else f"Review {keyword}",
                f"Bí quyết {keyword} thành công" if len(keyword) < 20 else f"Bí quyết {keyword}",
                f"{keyword}: Câu chuyện đằng sau",
                f"Hành trình khám phá {keyword}",
                f"{keyword}: Những điều bạn cần biết",
                f"Tất tần tật về {keyword}",
                f"{keyword}: Top 10 điều thú vị",
                f"{keyword}: Hướng dẫn cho người mới"
            ]
            titles.extend(keyword_variations[:remaining])
        
        # Remove duplicates and ensure length
        seen = set()
        unique_titles = []
        for title in titles:
            title_lower = title.lower()
            if title_lower not in seen and 20 <= len(title) <= 100:
                seen.add(title_lower)
                unique_titles.append(title)
            if len(unique_titles) >= 10:
                break
        
        return unique_titles[:10] if unique_titles else [f"{keyword}: Video hấp dẫn {i}" for i in range(1, 11)]
    
    def _generate_ai_description(self, keyword: str, description: str, keywords_list: List[str]) -> str:
        """Generate SEO description using AI"""
        prompt = f"""Viết đoạn mô tả video YouTube tiếng Việt dài 300-500 ký tự, tối ưu SEO.
Từ khóa chính: {keyword}
Nội dung: {description}
Từ khóa phụ: {', '.join(keywords_list[:5])}

Mô tả phải có lời kêu gọi hành động, chèn từ khóa tự nhiên."""
        
        ai_output = self._call_huggingface(prompt, max_length=250)
        
        if ai_output and 280 <= len(ai_output) <= 600:
            return ai_output.strip()
        
        # Fallback: Create varied description based on keywords and trends
        base = description or f"Video về {keyword}"
        
        # Build description with variety
        intro_variations = [
            f"{base}. Khám phá những điều thú vị về {keyword}.",
            f"Trong video này, chúng ta sẽ tìm hiểu về {keyword}.",
            f"{base}. Video này sẽ giúp bạn hiểu rõ hơn về {keyword}.",
            f"Hãy cùng khám phá {keyword} qua video này."
        ]
        
        seo_desc = random.choice(intro_variations) + " "
        
        # Add keyword context
        if keywords_list:
            seo_desc += f"Video đề cập đến {', '.join(keywords_list[:3])}. "
        
        # Add CTA variations
        cta_variations = [
            "Đăng ký kênh để xem thêm video mới! Like và share nếu bạn thấy hữu ích.",
            "Nhớ like, share và đăng ký kênh để ủng hộ mình nhé!",
            "Nếu video hữu ích, hãy like và subscribe để xem thêm nội dung tương tự!",
            "Đừng quên like, comment và subscribe để nhận thông báo video mới!"
        ]
        seo_desc += random.choice(cta_variations) + " "
        
        # Add hashtags naturally
        hashtags_str = f"#{keyword.replace(' ', '')} #YouTube #Video"
        if keywords_list:
            hashtags_str += f" #{keywords_list[0].replace(' ', '')}"
        seo_desc += hashtags_str
        
        return seo_desc[:600]
    
    def generate_suggestions(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered suggestions"""
        keywords = payload.get('keywords', [])
        description = payload.get('description', '')
        videos = payload.get('videos', [])
        
        # Extract main keyword
        main_keyword = keywords[0] if keywords else description.split()[0] if description else "video"
        if not keywords and description:
            keywords = self._extract_keywords_tfidf(description, max_keywords=10)
        
        # Fetch real trends
        google_trends = self._fetch_google_trends([main_keyword] + keywords[:4])
        youtube_trends = self._fetch_youtube_trends(main_keyword)
        
        # Generate AI titles
        titles = self._generate_ai_titles(main_keyword, description, google_trends + youtube_trends)
        
        # Generate AI description
        seo_description = self._generate_ai_description(main_keyword, description, keywords)
        
        # Generate hashtags (mix keywords + trends)
        hashtags = []
        for kw in keywords[:8]:
            tag = f"#{kw.replace(' ', '')}" if ' ' not in kw else f"#{kw.replace(' ', '')}"
            hashtags.append(tag)
        
        # Add trend-based hashtags
        for trend in (google_trends + youtube_trends)[:5]:
            tag = f"#{trend.replace(' ', '')}" if len(trend) < 20 else None
            if tag and tag not in hashtags:
                hashtags.append(tag)
        
        # Fill remaining with common tags
        common_tags = ["#YouTube", "#Video", "#Content", "#Trending", "#Vietnam"]
        hashtags.extend([t for t in common_tags if t not in hashtags])
        hashtags = hashtags[:20]
        
        # Generate topics
        topics = keywords[:5] + [t for t in google_trends[:3] if t not in keywords]
        
        logger.info(f"Generated AI suggestions for: {main_keyword}")
        
        return {
            'titles': titles[:10],
            'description': seo_description,
            'hashtags': hashtags[:20],
            'topics': topics[:8],
            'trends': {
                'google': google_trends[:10],
                'youtube': youtube_trends[:10]
            },
            'generatedAt': datetime.utcnow().isoformat() + 'Z'
        }
    
    def generate_content(self, description, content_type='title'):
        """Backward compatible method"""
        result = self.generate_suggestions({'description': description})
        return {
            'content': result.get('description', ''),
            'suggestions': result.get('titles', [])
        }