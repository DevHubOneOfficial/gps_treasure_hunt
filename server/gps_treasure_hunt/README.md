# GPS Treasure Hunt Server

Small NestJS API for a GPS treasure hunt. The server exposes one endpoint:

- `GET /coordinates`

It reads treasure entries from `data/data.json`, filters them by the current server time, loads the referenced image files from `data/images/`, and returns the active entries as JSON.

## Project Layout

- `src/` application code
- `data/data.json` treasure definitions
- `data/images/` clue images returned by the API
- `Dockerfile` production image build
- `docker-compose.yml` local or server deployment

## Endpoint

After deployment, the API is available at:

```text
http://<server-ip>:3040/coordinates
```

The compose file maps host port `3040` to container port `3000`.

## Deploy On An Ubuntu EC2 Instance

These steps assume:

- Ubuntu EC2 instance
- SSH access to the instance
- Git installed or installable
- AWS security group allows inbound TCP `3040` from the clients that need access

### 1. Connect To The EC2 Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@<your-ec2-public-ip>
```

### 2. Install Git

```bash
sudo apt update
sudo apt install -y git
```

### 3. Install Docker Engine And Docker Compose Plugin

The commands below follow Docker's official Ubuntu installation instructions using Docker's `apt` repository.

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify Docker:

```bash
sudo docker run hello-world
sudo systemctl status docker
docker compose version
```

Optional: allow the `ubuntu` user to run Docker without `sudo`.

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Clone The Repository

```bash
git clone <your-repo-url>
cd gps_treasure_hunt/server/gps_treasure_hunt
```

If the repo directory name differs, adjust the `cd` command accordingly.

### 5. Start The Server

Build the image and start the container:

```bash
docker compose up --build -d
```

Check that it is running:

```bash
docker compose ps
docker compose logs --tail=100
```

### 6. Test The Endpoint

From the EC2 instance:

```bash
curl http://localhost:3040/coordinates
```

From your local machine:

```bash
curl http://<your-ec2-public-ip>:3040/coordinates
```

If you cannot reach it publicly, check:

- AWS security group inbound rule for TCP `3040`
- EC2 instance firewall rules if `ufw` is enabled
- that the container is running with `docker compose ps`

## Updating The Server After A Git Pull

### Code changes

If you changed files under `src/`, rebuild and restart:

```bash
git pull
docker compose up --build -d
```

### Data changes only

The compose file mounts `./data` into the container as a volume, so changes to `data/data.json` or `data/images/` do not require rebuilding the image.

After pulling new data changes:

```bash
git pull
docker compose restart
```

This restart is still needed because the app loads `data.json` on process startup.

## Common Commands

Start in background:

```bash
docker compose up -d
```

Rebuild and restart:

```bash
docker compose up --build -d
```

Restart without rebuild:

```bash
docker compose restart
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

## Notes

- The application currently listens on port `3000` inside the container.
- The host exposes it on port `3040` through `docker-compose.yml`.
- The `/coordinates` response depends on the date ranges configured in `data/data.json`.
- If no entry is active for the current date, the API returns a message instead of coordinates.

## Source For Docker Install Commands

Official Docker documentation for Ubuntu:

- https://docs.docker.com/engine/install/ubuntu/
