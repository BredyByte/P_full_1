DOCKER_COMPOSE = docker-compose -f ./docker-compose.yml
DOCKER_NETWORK = app_network
FRONT_VOL = frontend_volume
BACK_VOL = backend_volume

all:
	-@ $(DOCKER_COMPOSE) up --build

reback:
	-@ $(DOCKER_COMPOSE) restart backend

clean:
	-@ $(DOCKER_COMPOSE) down
	-@ docker network rm $(DOCKER_NETWORK)
	-@ docker volume rm $(FRONT_VOL)
	-@ docker volume rm $(BACK_VOL)

re: clean all
