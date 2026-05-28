Before building any docker image, always ensure the following principles are applied:
- Docker Hub Verification: check Docker Hub and confirm that any public base image pulled, is the official, stable, and lightweight image recommended for the specific use case.
- create a .dockerignore file to exclude unnecessary files from being copied to the image.
- Use Multi-Stage Builds
- Minimize the Image
- Optimize File Permissions
- on docker hub, for any base image, you should always pay attention to the Overview, Installation, and Configuration sections on the image page and ensure the image is configured properly.
- ensure port mapping is done correctly.
- if enviromental variables are used to configure the application, prompt me to provide the values before building the image.
- refer to `.github/docker-compose.yaml` and `.github/Dockerfile` for examples of how to structure the docker-compose.yaml file and Dockerfile.