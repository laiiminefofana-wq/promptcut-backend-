FROM node:18

# Install ffmpeg + python + venv
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv

# Create python virtual environment
RUN python3 -m venv /opt/venv

# Activate venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Whisper inside venv
RUN pip install --upgrade pip
RUN pip install openai-whisper

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
