ARG NODE_VERSION=22.17-alpine
ARG VERSION=1.0.0
 
##############################################################
## Building project                                         ##
##############################################################
FROM node:${NODE_VERSION} as builder
 
ENV NODE_ENV build
 
RUN apk add --no-cache --update --virtual build-base python3-dev python3 make gcc g++
 
WORKDIR /home/node/build
 
COPY package.json package-lock.json ./
RUN npm install -f
 
COPY . ./
RUN npm run build
 
##############################################################
## Install production dependencies.                         ##
##############################################################
FROM builder as production-deps
 
WORKDIR /home/node/prod
 
COPY --from=builder /home/node/build/package*.json ./
RUN npm install --only=production -f && npm cache clean --force
 
##############################################################
## Production Server                                        ##
##############################################################
FROM node:${NODE_VERSION}
ARG VERSION
 
LABEL maintainer="bmqa"
LABEL app.name="bpcl-api"
LABEL app.version=${VERSION}
 
RUN apk add --update --no-cache tini && \
    rm -rf /var/cache/apk/*
 
ENV APP_HOME=/usr/src/app
 
ARG node_env=production
ENV PORT=3300
ENV NODE_ENV=production
 
WORKDIR $APP_HOME
 
# Copy all files
COPY --from=production-deps /home/node/prod/node_modules $APP_HOME/node_modules
COPY --from=builder /home/node/build/dist/ $APP_HOME/dist/
COPY package.json package-lock.json $APP_HOME/
COPY uploads/ $APP_HOME/uploads/

VOLUME [ "$APP_HOME/uploads/" ]
 
EXPOSE $PORT
 
# Exec app
ENTRYPOINT [ "tini", "--" ]
CMD [ "node", "dist/src/main.js" ]