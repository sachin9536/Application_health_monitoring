# Makefile

# Compose files in desired order
COMPOSE_FILES = \
	-f compose/docker-compose.shared.yml \
	-f compose/docker-compose.services.yml \
	-f compose/docker-compose.monitoring.yml \
	-f compose/docker-compose.controller.yml

# Default target
up:
	docker compose $(COMPOSE_FILES) up --build

down:
	docker compose $(COMPOSE_FILES) down

logs:
	docker compose $(COMPOSE_FILES) logs -f

ps:
	docker compose $(COMPOSE_FILES) ps

restart:
	docker compose $(COMPOSE_FILES) down
	docker compose $(COMPOSE_FILES) up --build

clean:
	docker compose $(COMPOSE_FILES) down -v

# For running commands in a specific service container
exec:
	docker compose $(COMPOSE_FILES) exec $(service) $(cmd)
