import os
import sys

# Make the project root importable so the backend's absolute
# `backend.*` imports resolve inside the serverless function.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app
