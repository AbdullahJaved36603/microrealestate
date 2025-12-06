# Railway Deployment Setup Guide

## Prerequisites
- Railway account at https://railway.app
- Railway project created

## Step 1: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Required Secrets:
1. **RAILWAY_TOKEN**: `ebd48637-6806-4d47-8c8e-e85f40dc37af`
   - This is your Railway API token for CI/CD deployment

2. **RAILWAY_GATEWAY_URL**: The public URL of your gateway service
   - Example: `https://gateway-production-xxxx.up.railway.app`

3. **RAILWAY_LANDLORD_APP_URL**: The public URL of your landlord frontend
   - Example: `https://landlord-frontend-production-xxxx.up.railway.app`

## Step 2: Create Railway Project & Services

In your Railway dashboard, create a new project and add these services:

### Services to Create:
1. **mongodb** - MongoDB database
   - Use Railway's MongoDB template
   - Note the connection string

2. **redis** - Redis cache
   - Use Railway's Redis template
   - Note the connection string

3. **gateway** - API Gateway
   - Deploy from: `services/gateway`
   - Dockerfile: `services/gateway/Dockerfile`

4. **api** - Main API
   - Deploy from: `services/api`
   - Dockerfile: `services/api/Dockerfile`

5. **tenantapi** - Tenant API
   - Deploy from: `services/tenantapi`
   - Dockerfile: `services/tenantapi/Dockerfile`

6. **authenticator** - Auth Service
   - Deploy from: `services/authenticator`
   - Dockerfile: `services/authenticator/Dockerfile`

7. **pdfgenerator** - PDF Generator
   - Deploy from: `services/pdfgenerator`
   - Dockerfile: `services/pdfgenerator/Dockerfile`

8. **emailer** - Email Service
   - Deploy from: `services/emailer`
   - Dockerfile: `services/emailer/Dockerfile`

9. **resetservice** - Reset Service
   - Deploy from: `services/resetservice`
   - Dockerfile: `services/resetservice/Dockerfile`

10. **landlord-frontend** - Landlord UI
    - Deploy from: `webapps/landlord`
    - Dockerfile: `webapps/landlord/Dockerfile`

11. **tenant-frontend** - Tenant UI
    - Deploy from: `webapps/tenant`
    - Dockerfile: `webapps/tenant/Dockerfile`

## Step 3: Configure Environment Variables

For each service, add the necessary environment variables from your `base.env` file.

### Common Variables for Backend Services:
```
NODE_ENV=production
MONGO_URL=<from Railway MongoDB service>
REDIS_URL=<from Railway Redis service>
GATEWAY_URL=<gateway service URL>
```

### Frontend Variables:
```
NEXT_PUBLIC_GATEWAY_URL=<gateway service URL>
```

## Step 4: Enable Public Networking

For services that need to be publicly accessible:
1. Go to each service → Settings → Networking
2. Click "Generate Domain" to get a public URL
3. Update your GitHub secrets with these URLs

## Step 5: Deploy

Once everything is configured:
1. Push to master branch
2. GitHub Actions will automatically:
   - Lint code
   - Build Docker images
   - Push to GHCR
   - Deploy to Railway
   - Run health checks
   - Execute E2E tests

## Monitoring

- View logs in Railway dashboard for each service
- Check GitHub Actions for deployment status
- Monitor service health in Railway metrics

## Cost Management

Railway free tier includes:
- $5/month credit
- After free credit, pay-as-you-go pricing

To optimize costs:
- Scale down unused services
- Use Railway's sleep feature for non-production environments
- Monitor resource usage in Railway dashboard

## Troubleshooting

### Deployment fails
- Check Railway logs for the specific service
- Verify environment variables are set correctly
- Ensure Dockerfiles are building successfully

### Services can't connect to each other
- Use Railway's private networking
- Reference services by their internal Railway URLs (e.g., `mongodb.railway.internal`)

### Out of memory errors
- Increase service memory in Railway settings
- Optimize Docker image sizes
- Check for memory leaks in application code
