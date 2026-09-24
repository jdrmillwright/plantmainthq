# Production Dockerfile for PlantMaintHQ Static Site & Engine
FROM python:3.11-slim

WORKDIR /app

# Copy application files
COPY . /app

# Compile static HTML build and generate all programmatic pages
RUN python3 engine.py

# Configure container runtime
ENV PORT=8080
EXPOSE 8080

# Ensure execution permissions for launcher scripts
RUN chmod +x start.sh ship 2>/dev/null || true

# Run web server serving compiled public directory
CMD ["./start.sh"]
