FROM node:14-alpine
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