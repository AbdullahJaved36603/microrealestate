#!/bin/bash

echo "Generating secure secrets for MicroRealEstate..."
echo ""

# Generate all secrets
ACCESS_TOKEN_SECRET=$(openssl rand -base64 12)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 12)
RESET_TOKEN_SECRET=$(openssl rand -base64 12)
APPCREDZ_TOKEN_SECRET=$(openssl rand -base64 12)
CIPHER_IV_KEY=$(openssl rand -base64 12)
CIPHER_KEY=$(openssl rand -base64 12)
REDIS_PASSWORD=$(openssl rand -base64 12)

echo "Generated secrets:"
echo "ACCESS_TOKEN_SECRET: $ACCESS_TOKEN_SECRET"
echo "REFRESH_TOKEN_SECRET: $REFRESH_TOKEN_SECRET"
echo "RESET_TOKEN_SECRET: $RESET_TOKEN_SECRET"
echo "APPCREDZ_TOKEN_SECRET: $APPCREDZ_TOKEN_SECRET"
echo "CIPHER_IV_KEY: $CIPHER_IV_KEY"
echo "CIPHER_KEY: $CIPHER_KEY"
echo "REDIS_PASSWORD: $REDIS_PASSWORD"
echo ""

# Create the .env file
cat > .env << ENVFILE
# ============================================
# Generated Secrets
# ============================================
ACCESS_TOKEN_SECRET=$ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
RESET_TOKEN_SECRET=$RESET_TOKEN_SECRET
APPCREDZ_TOKEN_SECRET=$APPCREDZ_TOKEN_SECRET
CIPHER_IV_KEY=$CIPHER_IV_KEY
CIPHER_KEY=$CIPHER_KEY
REDIS_PASSWORD=$REDIS_PASSWORD

# ============================================
# Application Configuration
# ============================================
MRE_VERSION=latest
NODE_ENV=production
LOGGER_LEVEL=info

# ============================================
# Database Configuration
# ============================================
MONGO_PORT=27017
MONGO_URL=mongodb://mongo/mredb

# ============================================
# Redis Configuration
# ============================================
REDIS_PORT=6379
REDIS_URL=redis://redis

# ============================================
# Gateway Configuration
# ============================================
APP_PORT=8080
GATEWAY_PORT=8080
GATEWAY_DEBUG_PORT=9225
GATEWAY_EXPOSE_FRONTENDS=true
CORS_ENABLED=true
DOMAIN_URL=http://localhost
GATEWAY_URL=http://localhost:8080
DOCKER_GATEWAY_URL=http://gateway:8080

# ============================================
# Authenticator Configuration
# ============================================
AUTHENTICATOR_PORT=8000
AUTHENTICATOR_DEBUG_PORT=9226
AUTHENTICATOR_ACCESS_TOKEN_SECRET=$ACCESS_TOKEN_SECRET
AUTHENTICATOR_REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
AUTHENTICATOR_RESET_TOKEN_SECRET=$RESET_TOKEN_SECRET
AUTHENTICATOR_URL=http://authenticator:8000

# ============================================
# PDF Generator Configuration
# ============================================
PDFGENERATOR_PORT=8300
PDFGENERATOR_DEBUG_PORT=9227
PDFGENERATOR_URL=http://pdfgenerator:8300/pdfgenerator

# ============================================
# Email Configuration
# ============================================
EMAILER_PORT=8400
EMAILER_DEBUG_PORT=9228
ALLOW_SENDING_EMAILS=false
EMAIL_FROM=noreply@localhost
EMAIL_REPLY_TO=noreply@localhost
EMAILER_URL=http://emailer:8400/emailer

# ============================================
# API Configuration
# ============================================
API_PORT=8200
API_DEBUG_PORT=9229
DEMO_MODE=false
RESTORE_DB=false
API_URL=http://api:8200/api/v2

# ============================================
# Tenant API Configuration
# ============================================
TENANTAPI_PORT=8250
TENANTAPI_DEBUG_PORT=9240
TENANTAPI_URL=http://tenantapi:8250/tenantapi

# ============================================
# Reset Service Configuration
# ============================================
RESETSERVICE_PORT=8900
RESETSERVICE_DEBUG_PORT=9230
RESETSERVICE_URL=http://resetservice:8900

# ============================================
# Frontend Configuration
# ============================================
APP_NAME=MicroRealEstate
SIGNUP=true

# Landlord Frontend
LANDLORD_FRONTEND_PORT=8180
LANDLORD_BASE_PATH=/landlord
LANDLORD_FRONTEND_URL=http://landlord-frontend:8180
LANDLORD_APP_URL=http://localhost:8080/landlord

# Tenant Frontend
TENANT_FRONTEND_PORT=8190
TENANT_BASE_PATH=/tenant
TENANT_FRONTEND_URL=http://tenant-frontend:8190
TENANT_APP_URL=http://localhost:8080/tenant
ENVFILE

echo "✅ .env file created successfully!"
echo ""
echo "To start the application, run:"
echo "docker compose up"
echo ""
echo "Then access:"
echo "- Landlord portal: http://localhost:8080/landlord"
echo "- Tenant portal:   http://localhost:8080/tenant"
