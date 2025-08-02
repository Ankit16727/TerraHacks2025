# database.py

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["lifelens"]
collection = db["records"]

def save_analysis(result, user_id="default"):
    """Save result to MongoDB with optional user ID."""
    data = result.copy()
    data["user_id"] = user_id
    collection.insert_one(data)

def get_user_history(user_id="default"):
    """Retrieve all results from MongoDB for a user."""
    return list(collection.find({"user_id": user_id}))
