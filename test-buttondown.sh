#!/bin/bash

# Test Buttondown API Key
# This script tests if your Buttondown API key is working

echo "🧪 Testing Buttondown API Key..."
echo "================================="

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
    echo "❌ .dev.vars file not found"
    echo "   Please create .dev.vars with your BUTTONDOWN_API_KEY"
    exit 1
fi

# Extract API key from .dev.vars
BUTTONDOWN_API_KEY=$(grep "^BUTTONDOWN_API_KEY=" .dev.vars | cut -d'=' -f2)

if [ -z "$BUTTONDOWN_API_KEY" ]; then
    echo "❌ BUTTONDOWN_API_KEY not found in .dev.vars"
    exit 1
fi

echo "📧 Testing API Key: ${BUTTONDOWN_API_KEY:0:10}..."
echo ""

# Test the API key with a simple GET request to Buttondown
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Token $BUTTONDOWN_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.buttondown.email/v1/subscribers?page=1")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

if [ "$http_status" = "200" ]; then
    echo "✅ SUCCESS: Buttondown API key is valid!"
    echo "   Your newsletter is ready to receive subscriptions."
    echo ""
    echo "📊 Subscriber count: $(echo "$body" | grep -o '"count":[0-9]*' | cut -d':' -f2)"
else
    echo "❌ ERROR: Buttondown API key is invalid"
    echo "   HTTP Status: $http_status"
    echo "   Response: $body"
    echo ""
    echo "🔧 Please check your API key at https://buttondown.com/settings"
fi