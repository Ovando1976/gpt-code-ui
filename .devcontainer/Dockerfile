# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates gnupg2 lsb-release build-essential \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs git-lfs \
  && git lfs install --system \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_PREFIX=/home/vscode/.npm-global
RUN mkdir -p /home/vscode/.npm-global && chown -R vscode:vscode /home/vscode/.npm-global

USER vscode
