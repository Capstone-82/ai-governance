# Deployment Guide

This guide explains how to deploy the AI Cloud Governance platform using Docker.

## Prerequisites
- Docker and Docker Compose installed
- AWS Credentials (for Bedrock access)
- OpenAI API Key (optional)
- Google Vertex AI credentials (optional)

## Quick Start (Local Deployment)

1. **Configure Environment Variables**
   Create a `.env` file in the root directory with your credentials:

   ```bash
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_BEDROCK_GUARDRAIL_ID=your_guardrail_id
   AWS_BEDROCK_GUARDRAIL_VERSION=DRAFT
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build -d
   ```

3. **Access the Application**
   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## Production Deployment (Cloud Server)

If deploying to a cloud server (AWS EC2, DigitalOcean Droplet, etc.):

1. **Update API URL**
   Edit `docker-compose.yml` to point the frontend to your server's public IP or domain:

   ```yaml
   services:
     frontend:
       build:
         context: frontend
         args:
           - VITE_API_BASE_URL=http://<YOUR-SERVER-IP>:8000
   ```

2. **Secure the Backend**
   In a production environment, you should use a reverse proxy (like Nginx or Traefik) to handle SSL/TLS termination and secure the backend API.

## Troubleshooting

- **Frontend can't connect to Backend**: Ensure the `VITE_API_BASE_URL` matches the browser-accessible URL of the backend.
- **AWS Bedrock Errors**: Verify the AWS credentials in the `.env` file have permissions to invoke Bedrock models.
