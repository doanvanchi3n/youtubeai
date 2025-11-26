@echo off
echo Installing PhoBERT dependencies...
pip install transformers>=4.40.0
pip install torch>=2.2.0
echo.
echo Done! Now you need to setup PhoBERT models.
echo See PHOBERT_SETUP_GUIDE.md for details.
