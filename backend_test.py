#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Idunn Wellness API
Tests all user stories and API endpoints as specified in the review request.
"""

import requests
import json
import os
import tempfile
from typing import Dict, Any

# Configuration
BASE_URL = "https://vitality-app-19.preview.emergentagent.com/api"
TEST_EMAIL = "freemium_test@example.com"
TEST_PASSWORD = "test123456"

class IdunnAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, 
                    files: Dict[str, Any] = None, use_auth: bool = False) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if use_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop("Content-Type", None)
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers)
            elif method.upper() == "POST":
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            raise
    
    def test_1_user_registration(self):
        """Test 1: New User Registration (Free Tier)"""
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "first_name": "Freemium",
            "last_name": "User"
        }
        
        response = self.make_request("POST", "/auth/register", data)
        
        if response.status_code == 201 or response.status_code == 200:
            result = response.json()
            if "access_token" in result and result["user"]["tier"] == "free":
                self.token = result["access_token"]
                self.user_id = result["user"]["id"]
                self.log_test("User Registration (Free Tier)", True, 
                            f"User created with tier: {result['user']['tier']}")
            else:
                self.log_test("User Registration (Free Tier)", False, 
                            f"Missing token or incorrect tier: {result}")
        else:
            # User might already exist, try to continue with login
            if response.status_code == 400 and "already registered" in response.text:
                self.log_test("User Registration (Free Tier)", True, 
                            "User already exists, will use login")
            else:
                self.log_test("User Registration (Free Tier)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
    
    def test_2_user_login(self):
        """Test 2: Login"""
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/login", data)
        
        if response.status_code == 200:
            result = response.json()
            if "access_token" in result:
                self.token = result["access_token"]
                self.user_id = result["user"]["id"]
                self.log_test("User Login", True, "JWT token received")
            else:
                self.log_test("User Login", False, f"No token in response: {result}")
        else:
            self.log_test("User Login", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_3_manual_tracking(self):
        """Test 3: Manual Tracking (Free User)"""
        if not self.token:
            self.log_test("Manual Tracking", False, "No authentication token")
            return
        
        # Test water intake
        water_data = {
            "data_source": "manual",
            "metric_type": "water_ml",
            "value": 250.0
        }
        
        response = self.make_request("POST", "/v1/log", water_data, use_auth=True)
        water_success = response.status_code == 200 or response.status_code == 201
        
        # Test sleep hours
        sleep_data = {
            "data_source": "manual",
            "metric_type": "sleep_hours",
            "value": 7.5
        }
        
        response = self.make_request("POST", "/v1/log", sleep_data, use_auth=True)
        sleep_success = response.status_code == 200 or response.status_code == 201
        
        # Test stress level
        stress_data = {
            "data_source": "manual",
            "metric_type": "stress_level",
            "value": 5.0
        }
        
        response = self.make_request("POST", "/v1/log", stress_data, use_auth=True)
        stress_success = response.status_code == 200 or response.status_code == 201
        
        if water_success and sleep_success and stress_success:
            self.log_test("Manual Tracking", True, "All metrics logged successfully")
        else:
            self.log_test("Manual Tracking", False, 
                        f"Water: {water_success}, Sleep: {sleep_success}, Stress: {stress_success}")
    
    def test_4_wearable_first_device(self):
        """Test 4: Wearable Connection - First Device (Should Work for Free Tier)"""
        if not self.token:
            self.log_test("First Wearable Connection", False, "No authentication token")
            return
        
        data = {
            "wearable_type": "apple_health"
        }
        
        response = self.make_request("POST", "/v1/wearable/connect", data, use_auth=True)
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            if result.get("wearable_type") == "apple_health":
                self.log_test("First Wearable Connection", True, "Apple Health connected successfully")
            else:
                self.log_test("First Wearable Connection", False, f"Unexpected response: {result}")
        else:
            self.log_test("First Wearable Connection", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_5_wearable_second_device(self):
        """Test 5: Wearable Connection - Second Device (Should Be Blocked for Free Tier)"""
        if not self.token:
            self.log_test("Second Wearable Connection (Should Fail)", False, "No authentication token")
            return
        
        data = {
            "wearable_type": "oura"
        }
        
        response = self.make_request("POST", "/v1/wearable/connect", data, use_auth=True)
        
        if response.status_code == 403:
            response_text = response.text.lower()
            if "free tier" in response_text and "upgrade" in response_text:
                self.log_test("Second Wearable Connection (Should Fail)", True, 
                            "Correctly blocked with upgrade message")
            else:
                self.log_test("Second Wearable Connection (Should Fail)", False, 
                            f"403 but wrong message: {response.text}")
        else:
            self.log_test("Second Wearable Connection (Should Fail)", False, 
                        f"Expected 403, got {response.status_code}: {response.text}")
    
    def test_6_ai_chat_safety(self):
        """Test 6: AI Chat - Safety Protocol Test"""
        if not self.token:
            self.log_test("AI Chat Safety Protocol", False, "No authentication token")
            return
        
        # Test medical trigger words
        trigger_messages = [
            "What medicine should I take for diabetes?",
            "I have cancer, what should I do?",
            "What doctor should I see?",
            "What treatment do you recommend?",
            "What prescription drugs help?"
        ]
        
        safety_responses = 0
        total_tests = len(trigger_messages)
        
        for message in trigger_messages:
            data = {"message": message}
            response = self.make_request("POST", "/v1/chat", data, use_auth=True)
            
            if response.status_code == 200:
                result = response.json()
                # Check if AI response contains safety message
                if isinstance(result, list) and len(result) >= 2:
                    ai_response = result[1].get("message_text", "").lower()
                    if "wellness assistant" in ai_response and "medical professional" in ai_response:
                        safety_responses += 1
        
        if safety_responses == total_tests:
            self.log_test("AI Chat Safety Protocol", True, 
                        f"All {total_tests} trigger words properly handled")
        else:
            self.log_test("AI Chat Safety Protocol", False, 
                        f"Only {safety_responses}/{total_tests} triggers handled correctly")
    
    def test_7_ai_chat_normal(self):
        """Test 7: AI Chat - Normal Wellness Question"""
        if not self.token:
            self.log_test("AI Chat Normal Question", False, "No authentication token")
            return
        
        data = {"message": "How can I sleep better?"}
        response = self.make_request("POST", "/v1/chat", data, use_auth=True)
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) >= 2:
                ai_response = result[1].get("message_text", "").lower()
                # Should NOT be safety response
                if "wellness assistant" not in ai_response or "medical professional" not in ai_response:
                    self.log_test("AI Chat Normal Question", True, "Wellness advice provided")
                else:
                    self.log_test("AI Chat Normal Question", False, 
                                "Safety response triggered for normal question")
            else:
                self.log_test("AI Chat Normal Question", False, f"Unexpected response format: {result}")
        else:
            self.log_test("AI Chat Normal Question", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_8_dashboard(self):
        """Test 8: Dashboard"""
        if not self.token:
            self.log_test("Dashboard", False, "No authentication token")
            return
        
        response = self.make_request("GET", "/v1/dashboard", use_auth=True)
        
        if response.status_code == 200:
            result = response.json()
            required_fields = ["user", "recent_logs", "connected_wearables", "insights"]
            
            if all(field in result for field in required_fields):
                self.log_test("Dashboard", True, "All required fields present")
            else:
                missing = [f for f in required_fields if f not in result]
                self.log_test("Dashboard", False, f"Missing fields: {missing}")
        else:
            self.log_test("Dashboard", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_9_file_upload_blocked(self):
        """Test 9: File Upload (Should Be Blocked for Free Tier)"""
        if not self.token:
            self.log_test("File Upload (Should Fail)", False, "No authentication token")
            return
        
        # Create a dummy PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            tmp_file.write(b'%PDF-1.4\n%Dummy PDF content for testing')
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'file': ('test.pdf', f, 'application/pdf')}
                response = self.make_request("POST", "/v1/upload/pdf", files=files, use_auth=True)
            
            if response.status_code == 403:
                response_text = response.text.lower()
                if "connect" in response_text and "baseline" in response_text:
                    self.log_test("File Upload (Should Fail)", True, 
                                "Correctly blocked with tier upgrade message")
                else:
                    self.log_test("File Upload (Should Fail)", False, 
                                f"403 but wrong message: {response.text}")
            else:
                self.log_test("File Upload (Should Fail)", False, 
                            f"Expected 403, got {response.status_code}: {response.text}")
        finally:
            os.unlink(tmp_file_path)
    
    def test_10_upgrade_tier(self):
        """Test 10: Upgrade to Connect Tier"""
        if not self.token:
            self.log_test("Tier Upgrade", False, "No authentication token")
            return
        
        data = {"new_tier": "connect"}
        response = self.make_request("POST", "/tier/upgrade", data, use_auth=True)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("tier") == "connect":
                self.log_test("Tier Upgrade", True, "Successfully upgraded to connect tier")
            else:
                self.log_test("Tier Upgrade", False, f"Unexpected response: {result}")
        else:
            self.log_test("Tier Upgrade", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_11_multiple_wearables(self):
        """Test 11: Connect Multiple Wearables (After Upgrade)"""
        if not self.token:
            self.log_test("Multiple Wearables", False, "No authentication token")
            return
        
        # Try connecting Oura (should work now)
        oura_data = {"wearable_type": "oura"}
        oura_response = self.make_request("POST", "/v1/wearable/connect", oura_data, use_auth=True)
        oura_success = oura_response.status_code in [200, 201]
        
        # Try connecting Garmin
        garmin_data = {"wearable_type": "garmin"}
        garmin_response = self.make_request("POST", "/v1/wearable/connect", garmin_data, use_auth=True)
        garmin_success = garmin_response.status_code in [200, 201]
        
        if oura_success and garmin_success:
            self.log_test("Multiple Wearables", True, "Both Oura and Garmin connected")
        else:
            self.log_test("Multiple Wearables", False, 
                        f"Oura: {oura_success} ({oura_response.status_code}), "
                        f"Garmin: {garmin_success} ({garmin_response.status_code})")
    
    def test_12_file_upload_after_upgrade(self):
        """Test 12: Upload PDF (After Upgrade)"""
        if not self.token:
            self.log_test("File Upload (After Upgrade)", False, "No authentication token")
            return
        
        # Create a dummy PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            tmp_file.write(b'%PDF-1.4\n%Dummy PDF content for testing after upgrade')
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'file': ('test_after_upgrade.pdf', f, 'application/pdf')}
                response = self.make_request("POST", "/v1/upload/pdf", files=files, use_auth=True)
            
            if response.status_code == 200:
                result = response.json()
                if "file_id" in result and "filename" in result:
                    self.log_test("File Upload (After Upgrade)", True, 
                                f"File uploaded successfully: {result['filename']}")
                else:
                    self.log_test("File Upload (After Upgrade)", False, 
                                f"Missing fields in response: {result}")
            else:
                self.log_test("File Upload (After Upgrade)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
        finally:
            os.unlink(tmp_file_path)
    
    def test_13_get_health_logs(self):
        """Test 13: Get Health Logs"""
        if not self.token:
            self.log_test("Get Health Logs", False, "No authentication token")
            return
        
        # Test getting all logs
        response = self.make_request("GET", "/v1/logs", use_auth=True)
        all_logs_success = response.status_code == 200
        
        # Test filtering by metric type
        response_filtered = self.make_request("GET", "/v1/logs?metric_type=water_ml", use_auth=True)
        filtered_success = response_filtered.status_code == 200
        
        if all_logs_success and filtered_success:
            all_logs = response.json()
            filtered_logs = response_filtered.json()
            self.log_test("Get Health Logs", True, 
                        f"Retrieved {len(all_logs)} total logs, {len(filtered_logs)} water logs")
        else:
            self.log_test("Get Health Logs", False, 
                        f"All logs: {all_logs_success}, Filtered: {filtered_success}")
    
    def test_14_get_wearable_connections(self):
        """Test 14: Get Wearable Connections"""
        if not self.token:
            self.log_test("Get Wearable Connections", False, "No authentication token")
            return
        
        response = self.make_request("GET", "/v1/wearable/connections", use_auth=True)
        
        if response.status_code == 200:
            connections = response.json()
            if isinstance(connections, list):
                wearable_types = [conn.get("wearable_type") for conn in connections]
                self.log_test("Get Wearable Connections", True, 
                            f"Found {len(connections)} connections: {wearable_types}")
            else:
                self.log_test("Get Wearable Connections", False, 
                            f"Expected list, got: {type(connections)}")
        else:
            self.log_test("Get Wearable Connections", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def test_15_sync_wearable_data(self):
        """Test 15: Sync Wearable Data"""
        if not self.token:
            self.log_test("Sync Wearable Data", False, "No authentication token")
            return
        
        response = self.make_request("POST", "/v1/wearable/sync/apple_health", use_auth=True)
        
        if response.status_code == 200:
            result = response.json()
            if "synced_data" in result and isinstance(result["synced_data"], list):
                self.log_test("Sync Wearable Data", True, 
                            f"Synced {len(result['synced_data'])} data points")
            else:
                self.log_test("Sync Wearable Data", False, 
                            f"Missing or invalid synced_data: {result}")
        else:
            self.log_test("Sync Wearable Data", False, 
                        f"Status: {response.status_code}, Response: {response.text}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Idunn Wellness API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_1_user_registration()
        self.test_2_user_login()
        self.test_3_manual_tracking()
        self.test_4_wearable_first_device()
        self.test_5_wearable_second_device()
        self.test_6_ai_chat_safety()
        self.test_7_ai_chat_normal()
        self.test_8_dashboard()
        self.test_9_file_upload_blocked()
        self.test_10_upgrade_tier()
        self.test_11_multiple_wearables()
        self.test_12_file_upload_after_upgrade()
        self.test_13_get_health_logs()
        self.test_14_get_wearable_connections()
        self.test_15_sync_wearable_data()
        
        # Summary
        print("=" * 60)
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed < total:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = IdunnAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)