#!/usr/bin/env python3
"""
API Connection Test Script
Used to verify if Flask server is running properly and responding
"""

import requests
import json
import time

def test_api_connection():
    """Test API connection"""
    print("🚀 Starting detailed API tests")
    
    # Wait for server startup
    print("⏳ Waiting for server startup...")
    time.sleep(2)
    
    base_url = "http://localhost:5000"
    
    try:
        print("🔍 Testing API connection...")
        print("   Step 1: Testing basic connection...")
        
        # Test basic connection
        response = requests.get(f"{base_url}/api/tasks", timeout=5)
        
        print("   Step 2: Testing tasks API...")
        print(f"   Tasks API response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server connection successful!")
            print(f"   Found {len(data)} tasks")
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return False
        
        # Test submission API
        print("\n🔍 Testing submit endpoint...")
        submit_data = {
            'answers': {'1': 'A', '2': 'B'},
            'student_id': '1234567',
            'started_at': '2023-01-01T00:00:00Z'
        }
        
        try:
            submit_response = requests.post(
                f"{base_url}/api/tasks/1/submit", 
                json=submit_data, 
                timeout=10
            )
            print(f"   Submit endpoint response: {submit_response.status_code}")
            
            if submit_response.status_code == 500:
                print("   ⚠️  Server internal error details:")
                try:
                    error_data = submit_response.json()
                    print(f"   Error message: {error_data}")
                except:
                    error_text = submit_response.text
                    print(f"   Error text: {error_text[:200]}...")
            elif submit_response.status_code == 200:
                print("   ✅ Submit API working properly")
            else:
                print(f"   ❌ Submit API error: {submit_response.status_code}")
                print(f"   Response content: {submit_response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Submit API connection failed: {str(e)}")
        
        # Test achievements API
        print("\n🔍 Testing achievements endpoint...")
        try:
            achievements_response = requests.get(
                f"{base_url}/api/students/1234567/achievements", 
                timeout=10
            )
            print(f"   Achievements endpoint response: {achievements_response.status_code}")
            
            if achievements_response.status_code == 500:
                print("   ⚠️  Achievements API server internal error details:")
                try:
                    error_data = achievements_response.json()
                    print(f"   Error message: {error_data}")
                except:
                    error_text = achievements_response.text
                    print(f"   Error text: {error_text[:200]}...")
            elif achievements_response.status_code == 200:
                data = achievements_response.json()
                print("   ✅ Achievements API working properly")
                print(f"   Found {len(data.get('achievements', []))} achievements")
            elif achievements_response.status_code == 404:
                print("   ⚠️  Student not found (test user doesn't exist)")
            else:
                print(f"   ❌ Achievements API error: {achievements_response.status_code}")
                print(f"   Response content: {achievements_response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Achievements API connection failed: {str(e)}")
        
        # Test student profile API
        print("\n🔍 Testing student profile endpoint...")
        try:
            profile_response = requests.get(
                f"{base_url}/api/students/1234567/profile", 
                timeout=10
            )
            print(f"   Profile endpoint response: {profile_response.status_code}")
            
            if profile_response.status_code == 500:
                print("   ⚠️  Profile API server internal error details:")
                try:
                    error_data = profile_response.json()
                    print(f"   Error message: {error_data}")
                except:
                    error_text = profile_response.text
                    print(f"   Error text: {error_text[:200]}...")
            elif profile_response.status_code == 200:
                print("   ✅ Profile API working properly")
            elif profile_response.status_code == 404:
                print("   ⚠️  Student not found (test user doesn't exist)")
            else:
                print(f"   ❌ Profile API error: {profile_response.status_code}")
                print(f"   Response content: {profile_response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Profile API connection failed: {str(e)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to server: {str(e)}")
        print("   Suggestions to check:")
        print("   • Backend server running on localhost:5000")
        print("   • Network connection is normal")
        print("   • Firewall settings")
        return False

if __name__ == "__main__":
    success = test_api_connection()
    print("\n" + "="*50)
    if success:
        print("🏁 Testing completed")
    else:
        print("🏁 Testing failed - Please check server status") 