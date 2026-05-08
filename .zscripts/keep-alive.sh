#!/bin/bash
while true; do
  cd /home/z/my-project
  bun run dev
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
