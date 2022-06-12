FROM node:18-alpine3.15
RUN apk add --no-cache \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont 

# chromium armv7 is not available in newer repository
RUN apk add --no-cache chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main

COPY . /server
WORKDIR /server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm i
CMD ["npm", "start"]