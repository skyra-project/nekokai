# ================ #
#    Base Stage    #
# ================ #

FROM node:22-alpine AS base

WORKDIR /usr/src/app

ENV YARN_DISABLE_GIT_HOOKS=1
ENV CI=true
ENV LOG_LEVEL=info
ENV FORCE_COLOR=true

RUN apk add --no-cache dumb-init

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base AS builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.base.json .
COPY --chown=node:node prisma/ prisma/
COPY --chown=node:node src/ src/

RUN yarn install --immutable \
 && yarn run prisma:generate \
 && yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

WORKDIR /usr/src/app

COPY --chown=node:node --from=builder /usr/src/app/dist dist
COPY --chown=node:node --from=builder /usr/src/app/src/locales src/locales
COPY --chown=node:node --from=builder /usr/src/app/src/.env src/.env

RUN yarn workspaces focus --all --production

# Patch .prisma with the built files
COPY --chown=node:node --from=builder /usr/src/app/node_modules/.prisma node_modules/.prisma

USER node

CMD [ "yarn", "run", "start" ]
