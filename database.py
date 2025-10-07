"""
Database module for Cloudant integration
Handles user data storage and retrieval
"""

import os
from datetime import datetime
from cloudant import Cloudant
from cloudant.error import CloudantException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        """Initialize Cloudant database connection"""
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connect to Cloudant database"""
        try:
            # Get Cloudant credentials from environment
            api_key = os.getenv('CLOUDANT_APIKEY')
            host = os.getenv('CLOUDANT_HOST')
            username = os.getenv('CLOUDANT_USERNAME')
            
            if not all([api_key, host, username]):
                logger.warning("Cloudant credentials not found. Database operations will be disabled.")
                return False
            
            # Connect to Cloudant
            self.client = Cloudant.iam(username, api_key, url=f"https://{host}")
            self.client.connect()
            
            # Get or create database
            db_name = "mental_health_users"
            if db_name in self.client.all_dbs():
                self.db = self.client[db_name]
            else:
                self.db = self.client.create_database(db_name)
                logger.info(f"Created database: {db_name}")
            
            logger.info("Successfully connected to Cloudant database")
            return True
            
        except CloudantException as e:
            logger.error(f"Cloudant connection failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return False
    
    def save_user(self, user_data):
        """Save user data to database"""
        if not self.db:
            logger.info("Database not connected. User data will be stored in session only.")
            return None
        
        try:
            # Create user document
            user_doc = {
                "_id": user_data.get('sub', user_data.get('email', '')),
                "type": "user",
                "email": user_data.get('email'),
                "name": user_data.get('name'),
                "username": user_data.get('preferred_username'),
                "provider": user_data.get('provider', 'unknown'),
                "email_verified": user_data.get('email_verified', False),
                "picture": user_data.get('picture'),
                "created_at": datetime.utcnow().isoformat(),
                "last_login": datetime.utcnow().isoformat(),
                "login_count": 1,
                "login_history": [{
                    "timestamp": datetime.utcnow().isoformat(),
                    "provider": user_data.get('provider', 'unknown'),
                    "ip_address": user_data.get('ip_address', ''),
                    "user_agent": user_data.get('user_agent', '')
                }]
            }
            
            # Check if user already exists
            existing_user = self.get_user(user_doc["_id"])
            if existing_user:
                # Update existing user
                user_doc["_rev"] = existing_user["_rev"]
                user_doc["created_at"] = existing_user["created_at"]
                user_doc["login_count"] = existing_user.get("login_count", 0) + 1
                user_doc["login_history"] = existing_user.get("login_history", []) + user_doc["login_history"]
            
            # Save to database
            doc = self.db.create_document(user_doc)
            logger.info(f"User saved successfully: {user_doc['_id']}")
            return doc
            
        except CloudantException as e:
            logger.error(f"Failed to save user: {e}")
            return None
        except Exception as e:
            logger.error(f"Error saving user: {e}")
            return None
    
    def get_user(self, user_id):
        """Get user data by ID"""
        if not self.db:
            logger.info("Database not connected. Cannot retrieve user.")
            return None
        
        try:
            doc = self.db[user_id]
            return doc
        except KeyError:
            logger.info(f"User not found: {user_id}")
            return None
        except CloudantException as e:
            logger.error(f"Failed to get user: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting user: {e}")
            return None
    
    def update_user_login(self, user_id, login_data):
        """Update user's last login information"""
        if not self.db:
            logger.warning("Database not connected. Cannot update user.")
            return None
        
        try:
            user = self.get_user(user_id)
            if not user:
                return None
            
            # Update login information
            user["last_login"] = datetime.utcnow().isoformat()
            user["login_count"] = user.get("login_count", 0) + 1
            
            # Add to login history
            if "login_history" not in user:
                user["login_history"] = []
            
            user["login_history"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "provider": login_data.get('provider', 'unknown'),
                "ip_address": login_data.get('ip_address', ''),
                "user_agent": login_data.get('user_agent', '')
            })
            
            # Keep only last 50 login records
            if len(user["login_history"]) > 50:
                user["login_history"] = user["login_history"][-50:]
            
            # Save updated user
            user.save()
            logger.info(f"User login updated: {user_id}")
            return user
            
        except CloudantException as e:
            logger.error(f"Failed to update user login: {e}")
            return None
        except Exception as e:
            logger.error(f"Error updating user login: {e}")
            return None
    
    def get_user_by_email(self, email):
        """Get user by email address"""
        if not self.db:
            logger.info("Database not connected. Cannot search user.")
            return None
        
        try:
            # Create index if it doesn't exist
            if 'email_index' not in [idx['name'] for idx in self.db.indexes()]:
                self.db.create_index({
                    'index': {'fields': ['email']},
                    'name': 'email_index',
                    'type': 'json'
                })
            
            # Query by email
            selector = {'email': email}
            result = self.db.get_query_result(selector, fields=['_id', 'email', 'name', 'provider'])
            
            for row in result:
                return self.get_user(row['_id'])
            
            return None
            
        except CloudantException as e:
            logger.error(f"Failed to search user by email: {e}")
            return None
        except Exception as e:
            logger.error(f"Error searching user by email: {e}")
            return None
    
    def get_all_users(self, limit=100):
        """Get all users (for admin purposes)"""
        if not self.db:
            logger.warning("Database not connected. Cannot retrieve users.")
            return []
        
        try:
            selector = {'type': 'user'}
            result = self.db.get_query_result(selector, limit=limit)
            return [row for row in result]
            
        except CloudantException as e:
            logger.error(f"Failed to get all users: {e}")
            return []
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []
    
    def delete_user(self, user_id):
        """Delete user from database"""
        if not self.db:
            logger.warning("Database not connected. Cannot delete user.")
            return False
        
        try:
            user = self.get_user(user_id)
            if user:
                user.delete()
                logger.info(f"User deleted: {user_id}")
                return True
            return False
            
        except CloudantException as e:
            logger.error(f"Failed to delete user: {e}")
            return False
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    def get_user_stats(self):
        """Get user statistics"""
        if not self.db:
            logger.warning("Database not connected. Cannot get stats.")
            return {}
        
        try:
            users = self.get_all_users()
            stats = {
                'total_users': len(users),
                'providers': {},
                'verified_emails': 0,
                'recent_logins': 0
            }
            
            current_time = datetime.utcnow()
            recent_threshold = 7  # days
            
            for user in users:
                # Count by provider
                provider = user.get('provider', 'unknown')
                stats['providers'][provider] = stats['providers'].get(provider, 0) + 1
                
                # Count verified emails
                if user.get('email_verified', False):
                    stats['verified_emails'] += 1
                
                # Count recent logins
                last_login = user.get('last_login')
                if last_login:
                    try:
                        last_login_date = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                        days_diff = (current_time - last_login_date).days
                        if days_diff <= recent_threshold:
                            stats['recent_logins'] += 1
                    except:
                        pass
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return {}
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.disconnect()
            logger.info("Database connection closed")

# Global database instance
db_manager = DatabaseManager()
