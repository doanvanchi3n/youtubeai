"""
Script để kiểm tra kết nối HuggingFace API
Chạy script này để debug vấn đề kết nối
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Try to import InferenceClient
try:
    from huggingface_hub import InferenceClient
    HAS_HF_CLIENT = True
except ImportError:
    HAS_HF_CLIENT = False
    print("⚠ huggingface_hub not installed. Install with: pip install huggingface_hub")

def check_huggingface_connection():
    """Kiểm tra kết nối HuggingFace API"""
    import sys
    import io
    # Fix encoding for Windows console
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("=" * 60)
    print("KIEM TRA KET NOI HUGGINGFACE API")
    print("=" * 60)
    
    # 1. Check token
    token = os.getenv('HUGGINGFACE_API_TOKEN')
    if not token:
        print("LOI: HUGGINGFACE_API_TOKEN khong duoc tim thay!")
        print("\nHuong dan:")
        print("1. Tao file .env trong thu muc ai_module/")
        print("2. Them dong: HUGGINGFACE_API_TOKEN=your_token_here")
        print("3. Lay token tai: https://huggingface.co/settings/tokens")
        return False
    
    print(f"Token found: {token[:10]}...{token[-4:]}")
    
    # 2. Test với InferenceClient (recommended)
    if HAS_HF_CLIENT:
        print("\n🔍 Testing with HuggingFace InferenceClient (recommended)...")
        try:
            client = InferenceClient(token=token)
            test_models = [
                'google/flan-t5-base',
                'microsoft/Phi-3-mini-4k-instruct',
                'mistralai/Mistral-7B-Instruct-v0.2'
            ]
            
            for model in test_models:
                try:
                    print(f"   Testing model: {model}")
                    response = client.text_generation(
                        prompt="Hello, how are you?",
                        model=model,
                        max_new_tokens=50,
                        temperature=0.7
                    )
                    if response:
                        print(f"   SUCCESS! Response: {response[:100]}...")
                        return True
                except Exception as e:
                    print(f"   Error with {model}: {type(e).__name__}: {str(e)[:100]}")
                    continue
        except Exception as e:
            print(f"   InferenceClient initialization error: {e}")
    
    # 3. Fallback: Test với REST API
    print("\n🔍 Testing with REST API (fallback)...")
    test_models = [
        'google/flan-t5-base',
        'microsoft/Phi-3-mini-4k-instruct',
        'meta-llama/Llama-3.1-8B-Instruct'
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for model in test_models:
        print(f"\n🔍 Testing model: {model}")
        try:
            # Use Inference API endpoint
            url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "inputs": "Hello, how are you?",
                "parameters": {
                    "max_new_tokens": 50,
                    "temperature": 0.7
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            # If 410, endpoint deprecated
            if response.status_code == 410:
                print(f"   Endpoint deprecated, trying next model...")
                continue
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   SUCCESS! Response: {str(result)[:100]}...")
                return True
            elif response.status_code == 503:
                error_info = response.json() if response.content else {}
                wait_time = error_info.get('estimated_time', 0)
                print(f"   Model dang load (uoc tinh: {wait_time}s)")
                print(f"   Ban co the doi va thu lai sau")
            elif response.status_code == 401:
                print(f"   Authentication failed - Token khong hop le!")
                print(f"   Kiem tra lai token tai: https://huggingface.co/settings/tokens")
            elif response.status_code == 429:
                print(f"   Rate limit exceeded - Qua nhieu requests")
                print(f"   Doi vai phut roi thu lai")
            else:
                print(f"   Error: {response.text[:200]}")
                
        except requests.exceptions.Timeout:
            print(f"   Timeout - Model qua cham hoac khong phan hoi")
        except requests.exceptions.ConnectionError:
            print(f"   Connection Error - Khong the ket noi den HuggingFace")
        except Exception as e:
            print(f"   Error: {type(e).__name__}: {e}")
    
    print("\n" + "=" * 60)
    print("KET QUA: Khong the ket noi voi bat ky model nao")
    print("=" * 60)
    return False

if __name__ == "__main__":
    check_huggingface_connection()

