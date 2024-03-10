FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm gcc g++ make

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY web /app/web
RUN cd /app/web && npm install && npm run build

COPY server /app/server

WORKDIR /app/server

CMD ["./entrypoint.sh"]