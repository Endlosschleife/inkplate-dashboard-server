# Inkplate Dashboard Server
This server project takes and serves screenshots of configured websites to
show them on an Inkplate e-Paper screen.

## Development
Start a server in watch mode:
```
npm run start:watch 
```

## Run
Use the docker image from `docker pull ghcr.io/endlosschleife/inkplate-dashboard-server:latest` to 
run the server application.
Mount a config file into the container to overwrite the example `config.json`.

Example *docker-compose.yaml*
```
version: '3.2'

services:
  inkplate-dashboard-server:
    image: ghcr.io/endlosschleife/inkplate-dashboard-server:latest
    container_name: inklplate-dashboard-server
    restart: always
    ports:
      - "8082:8081"
    hostname: dashboard-server
    environment:
      - CHROMIUM_BINARY=/usr/bin/chromium
      - TZ=Europe/Berlin
    volumes:
      - ./config.json:/server/config.json
    mem_limit: 300m

```

