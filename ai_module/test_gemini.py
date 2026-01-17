"""
Test script để kiểm tra Google Gemini API hoạt động
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
    import google.generativeai as genai
    
    api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GOOGLE_GEMINI_API_KEY khong duoc tim thay trong .env file!")
        print("\nHuong dan:")
        print("1. Mo file ai_module/.env")
        print("2. Them dong: GOOGLE_GEMINI_API_KEY=AIzaSyCW3km8BxBfEKFsI-7wcT2l3Mi06w5a544")
        print("3. Chay lai script nay")
        exit(1)
    
    print("SUCCESS: API Key found!")
    print(f"   Key: {api_key[:10]}...{api_key[-4:]}")
    
    print("\nTesting Gemini API connection...")
    genai.configure(api_key=api_key)
    # Use gemini-2.5-flash-lite (confirmed available in free tier)
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    print("Using model: gemini-2.5-flash-lite (Free tier: 10 RPM, 20 RPD)")
    
    # Test simple chat
    print("\nTesting chat...")
    chat = model.start_chat(history=[])
    response = chat.send_message("Xin chao! Ban co the gioi thieu ve minh khong?")
    
    if response and response.text:
        print("SUCCESS! Gemini API hoat dong!")
        print(f"\nResponse:")
        print(response.text[:200])
        print("\n" + "="*60)
        print("KET QUA: Gemini API da san sang su dung!")
        print("="*60)
    else:
        print("ERROR: Khong nhan duoc response tu Gemini")
        
except ImportError:
    print("ERROR: google-generativeai chua duoc cai dat!")
    print("Cai dat voi: pip install google-generativeai")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    print("\n💡 Kiểm tra:")
    print("1. API key có đúng không?")
    print("2. Kết nối internet có ổn không?")
    print("3. API key có quyền truy cập Gemini không?")

