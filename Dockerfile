FROM node:18

# Install ffmpeg + python
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip

# Install Whisper
RUN pip3 install openai-whisper

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
