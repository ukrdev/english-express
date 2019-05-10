#!/bin/bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/db:/app/db \
  -v $(pwd)/sessions:/app/sessions \
  --name english-express \
  english-express
