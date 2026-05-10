ARTIFACT_REVISION = 1.0.0
APP_NAME = bpcl-api
TENENT_NAME = bpcl
IMAGES_TAG = ${shell git describe --exact-match 2> /dev/null || echo ${ARTIFACT_REVISION}}
IMAGE_DIRS = $(wildcard ./)

PACKAGE_DETAILS := $(wildcard */package.json)
PROJECTS = $(IMAGE_DIRS)
ECHO = ${shell echo -e}
VERSION=$(shell cat package.json | grep version | head -1 | cut -d\" -f4 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')

.PHONY: build
build:
	$(eval IMAGE_NAME := $(TENENT_NAME)/$(APP_NAME))
	$(eval APP_VERSION := $(VERSION))
	docker build --pull --rm=true -t ${IMAGE_NAME} -t ${IMAGE_NAME}:${APP_VERSION} ${PROJECTS} --build-arg VERSION={APP_VERSION}

build-latest:
	$(eval IMAGE_NAME := $(TENENT_NAME)/$(APP_NAME))
	docker build --pull -t ${IMAGE_NAME}:latest ${PROJECTS}

build-tag:
	$(eval IMAGE_NAME := $(TENENT_NAME)/$(APP_NAME))
	$(eval APP_VERSION := $(VERSION))
	docker build --pull -t ${IMAGE_NAME}:${APP_VERSION} ${PROJECTS} --build-arg VERSION={APP_VERSION}

.PHONY:
release: 
	$(eval RELEASE_VERSION = v$(VERSION))
	@git fetch --all --tags && git checkout tags/$(RELEASE_VERSION) -B $(RELEASE_VERSION)-branch && make

.PHONY: clean
clean:
	@echo 'cleaning bad images'
	$(eval BAD_IMAGES := $(shell docker images --filter dangling=true -q --no-trunc))
	@docker rmi ${BAD_IMAGES}

version: 
	@echo $(APP_NAME)
	@echo $(TENENT_NAME)
	@echo $(VERSION)