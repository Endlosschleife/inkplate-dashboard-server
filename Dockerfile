FROM node:18-alpine3.15
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont
COPY . /server
WORKDIR /server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm i
CMD ["npm", "start"]