FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y nginx nodejs npm gcc g++ make && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY web /app/web
RUN cd /app/web && npm install && npm run build

COPY server /app/server

# Copy the Nginx configuration file into the container
COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /app/server

CMD ["./entrypoint.sh"] 