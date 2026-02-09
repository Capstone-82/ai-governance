# Use official Python runtime
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed) and python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run defaults to port 8080. Uvicorn will listen on this port.
# The $PORT environment variable is automatically set by Cloud Run.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}