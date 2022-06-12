FROM node:18
RUN apt-get update
RUN apt-get install -y \
      ca-certificates \
      chromium

COPY . /server
WORKDIR /server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm i

CMD ["npm", "start"]