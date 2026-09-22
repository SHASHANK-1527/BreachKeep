# BreachKeep shared base image for interactive challenge containers.
# Per-room images do:  FROM breachkeep/base
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      coreutils grep sed gawk findutils procps nano less ca-certificates wget && \
    rm -rf /var/lib/apt/lists/*

ARG TTYD_VERSION=1.7.4
RUN wget -qO /usr/local/bin/ttyd \
      https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64 && \
    chmod +x /usr/local/bin/ttyd

RUN useradd -m -s /bin/bash student
USER student
WORKDIR /home/student
EXPOSE 7681
CMD ["ttyd", "-p", "7681", "-i", "0.0.0.0", "bash"]
