FROM node:18-slim

# Install ffmpeg + python
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight whisper package
RUN pip3 install --break-system-packages openai-whisper

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "server.js"]
