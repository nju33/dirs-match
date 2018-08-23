FROM node:10

MAINTAINER nju33

RUN npm i -g dirs-match

ENTRYPOINT [ "dirs-match" ]