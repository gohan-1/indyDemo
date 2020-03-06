docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker volume prune
docker system prune
docker network prune

