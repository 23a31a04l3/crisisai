import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

db = None

def init_firebase():
    global db
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-adminsdk.json")
    
    # Initialize only if credentials file exists
    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            # Check if already initialized
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("Firebase initialized successfully.")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
    else:
        print(f"Firebase credentials not found at {cred_path}. Firestore features will be disabled.")

def log_query(collection_name: str, data: dict):
    """
    Logs data to the specified Firestore collection.
    """
    if db:
        try:
            db.collection(collection_name).add(data)
            return True
        except Exception as e:
            print(f"Failed to log to Firestore: {e}")
            return False
    return False
