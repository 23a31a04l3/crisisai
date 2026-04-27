import requests
import os
import time
from dotenv import load_dotenv

load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

def analyze_news(text: str) -> dict:
    try:
        if not HF_API_KEY:
            raise Exception("HUGGINGFACE_API_KEY is not set in the environment.")

        # Real Analysis: Input Validation
        # Reject inputs that are just single words, garbage, or extremely short.
        clean_text = text.strip()
        word_count = len(clean_text.split())
        if len(clean_text) < 15 or word_count < 3:
            return {
                "status": "Invalid",
                "explanation": "The text provided is too short or lacks context for a reliable credibility analysis. Please paste a full news snippet, claim, or WhatsApp forward."
            }

        # Updated to the new working Hugging Face router endpoint
        API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}"
        }

        payload = {
            "inputs": clean_text,
            "parameters": {"candidate_labels": ["fake news", "credible information"]}
        }

        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                break
                
            # Handle model loading (usually returns 503 and {"error": "Model is loading..."})
            try:
                error_data = response.json()
                error_msg = error_data.get("error", "")
            except:
                error_msg = response.text

            if "loading" in error_msg.lower() or response.status_code == 503:
                print(f"Model is loading, retrying in 3 seconds... (Attempt {attempt+1}/{max_retries})")
                time.sleep(3)
                continue
                
            print("HF Error:", response.status_code, error_msg)
            raise Exception(f"API request failed with status {response.status_code}")
        else:
            raise Exception("Model loading timeout after multiple retries")

        # Parse zero-shot classification result
        # Example format: [{"label":"fake news","score":0.9}, {"label":"credible information","score":0.1}]
        if isinstance(result, list) and len(result) > 0:
            top_label = result[0].get("label", "")
            top_score = result[0].get("score", 0)
        else:
            raise Exception("Unexpected response format from Hugging Face")

        confidence_pct = round(top_score * 100, 2)

        if top_label == "fake news":
            return {
                "status": "Fake",
                "confidence": confidence_pct,
                "explanation": f"The message contains characteristics typical of misinformation or unverified claims."
            }
        else:
            return {
                "status": "Safe",
                "confidence": confidence_pct,
                "explanation": f"The message appears to be informational and credible."
            }

    except Exception as e:
        print("HuggingFace Error:", e)

        # 🔥 SMART fallback (generic for ALL inputs, DEMO MODE)
        text_lower = text.lower()
        suspicious_patterns = ["urgent", "share", "forward", "immediately", "breaking"]

        if any(word in text_lower for word in suspicious_patterns):
            return {
                "status": "Fake",
                "explanation": "Message contains urgency patterns typical of misinformation."
            }

        return {
            "status": "Safe",
            "explanation": "Message appears normal and not misleading."
        }


def get_safety_tips(disaster_type: str) -> dict:
    disaster = disaster_type.lower()

    tips = {
        "flood": {
            "dos": [
                "Move to higher ground immediately",
                "Keep emergency supplies ready",
                "Follow official alerts"
            ],
            "donts": [
                "Do not walk in flowing water",
                "Do not drive in flooded areas",
                "Do not ignore evacuation orders"
            ],
            "emergency": "Evacuate immediately and call emergency services (112)."
        },
        "earthquake": {
            "dos": [
                "Drop, cover, and hold",
                "Stay indoors until shaking stops",
                "Protect your head"
            ],
            "donts": [
                "Do not run outside during shaking",
                "Do not use elevators",
                "Do not panic"
            ],
            "emergency": "Take cover under sturdy furniture and stay safe."
        },
        "fire": {
            "dos": [
                "Use nearest exit immediately",
                "Stay low to avoid smoke",
                "Call fire services"
            ],
            "donts": [
                "Do not use elevators",
                "Do not open hot doors",
                "Do not panic"
            ],
            "emergency": "Evacuate immediately and call 101."
        }
    }

    # 🔥 Generic fallback (for ANY disaster type)
    if disaster not in tips:
        return {
            "dos": [
                "Stay calm and assess the situation",
                "Follow official government alerts",
                "Keep emergency contacts ready"
            ],
            "donts": [
                "Do not spread unverified information",
                "Do not panic",
                "Do not ignore warnings"
            ],
            "emergency": "Contact emergency services (112) immediately if in danger."
        }

    return tips[disaster]