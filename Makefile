dev-up-d:
	docker-compose -f docker-compose.frontend.yml up -d --build

dev-up:
	docker-compose -f docker-compose.frontend.yml up --build

dev-down:
	docker-compose -f docker-compose.frontend.yml down

dev-rebuild: dev-down dev-up

prod-up-d:
	docker-compose -f docker-compose.dev.yml up -d --build

prod-up:
	docker-compose -f docker-compose.dev.yml up --build

prod-down:
	docker-compose -f docker-compose.dev.yml down
