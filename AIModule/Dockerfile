FROM tensorflow/tensorflow:2.15.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN grep -vE "^(tensorflow|tf-keras)" requirements.txt > req_docker.txt && \
    python3 -m pip install --no-cache-dir -r req_docker.txt && \
    python3 -m pip install "setuptools<71" --force-reinstall && \
    python3 -m pip install --no-cache-dir openai-whisper==20231117 --no-build-isolation && \
    rm -rf /root/.cache/pip

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
