"""
Test script để kiểm tra InferenceClient hoạt động
"""
import os
import sys
import io
from dotenv import load_dotenv

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

try:
    from huggingface_hub import InferenceClient
    
    token = os.getenv('HUGGINGFACE_API_TOKEN')
    if not token:
        print("Token not found!")
        exit(1)
    
    print("Testing InferenceClient...")
    client = InferenceClient(token=token, timeout=30.0)
    
    # Test với một model đơn giản
    test_models = [
        'google/flan-t5-base',
        'microsoft/Phi-3-mini-4k-instruct'
    ]
    
    for model in test_models:
        print(f"\nTesting model: {model}")
        try:
            # Try direct API call through requests (more reliable)
            import requests
            url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "inputs": "Hello, how are you?",
                "parameters": {"max_new_tokens": 30}
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    text = result[0].get('generated_text', '')
                else:
                    text = result.get('generated_text', '')
                print(f"   SUCCESS! Response: {text[:100]}")
                print("\n" + "="*60)
                print("KET QUA: Token hop le, co the su dung REST API")
                print("="*60)
                exit(0)
            elif response.status_code == 410:
                print(f"   Endpoint deprecated")
            else:
                print(f"   Error: {response.text[:200]}")
        except Exception as e:
            print(f"   Error: {type(e).__name__}: {e}")
    
    print("\n" + "="*60)
    print("KET QUA: Khong the ket noi voi bat ky model nao")
    print("="*60)
    
except ImportError:
    print("huggingface_hub not installed!")
    print("Install with: pip install huggingface_hub")
