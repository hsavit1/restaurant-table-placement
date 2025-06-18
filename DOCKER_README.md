# Docker Setup for Dorsia Restaurant Reservation System

This guide explains how to run the Dorsia restaurant reservation system using Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd dorsia
   ```

2. **Start the application**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - **Web App**: http://localhost:3000
   - **Database Admin** (optional): http://localhost:8080

## Available Services

### Core Services (Default)

- **`app`**: Next.js development server on port 3000
- **`postgres`**: PostgreSQL database on port 5432

### Optional Services

- **`app-prod`**: Production build on port 3001 (use `--profile production`)
- **`adminer`**: Database management tool on port 8080 (use `--profile tools`)

## Docker Commands

### Basic Operations

```bash
# Start services in development mode
docker compose up

# Start services in background
docker compose up -d

# Rebuild and start services
docker compose up --build

# Stop services
docker compose down

# View logs
docker compose logs -f app

# Access app container shell
docker compose exec app sh
```

### Production Deployment

```bash
# Run production build
docker compose --profile production up app-prod

# Run with database management tools
docker compose --profile tools up
```

### Database Operations

```bash
# Reset database and start fresh
docker compose down -v
docker compose up --build

# Run Prisma migrations manually
docker compose exec app npm run prisma:migrate:dev

# Seed the database
docker compose exec app npm run prisma:seed

# Access PostgreSQL directly
docker compose exec postgres psql -U postgres -d dorsia_dev
```

## Environment Configuration

### Development (.env)

The application uses the existing `.env` file. For Docker, the database URL is automatically configured to use the containerized PostgreSQL.

### Production

Create a `.env.production` file:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/dorsia_prod?schema=public
NEXTAUTH_SECRET=your-very-secure-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## Database

### Default Configuration

- **Host**: `postgres` (internal Docker network)
- **Port**: `5432`
- **Database**: `dorsia_dev`
- **Username**: `postgres`
- **Password**: `password`

### Data Persistence

Database data is persisted in a Docker volume named `postgres_data`. To completely reset:

```bash
docker compose down -v
docker volume rm dorsia_postgres_data
```

### External Database Access

To connect from host machine tools:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `dorsia_dev`
- **Username**: `postgres`
- **Password**: `password`

## Troubleshooting

### Port Conflicts

If you get port conflicts, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change left side to available port
```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
   ```bash
   docker compose exec postgres pg_isready -U postgres
   ```

2. Check container logs:
   ```bash
   docker compose logs postgres
   docker compose logs app
   ```

### Build Issues

1. Clear Docker cache:
   ```bash
   docker system prune -a
   ```

2. Rebuild without cache:
   ```bash
   docker compose build --no-cache
   ```

### Permission Issues (Linux/macOS)

If you encounter permission issues:

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with current user
docker compose run --user $(id -u):$(id -g) app npm run dev
```

## Development Workflow

### Making Changes

1. **Code Changes**: Files are mounted as volumes, so changes reflect immediately
2. **Package Changes**: Rebuild the container after modifying `package.json`
3. **Database Schema**: Run migrations after modifying `prisma/schema.prisma`

### Adding Dependencies

```bash
# Add new dependency
docker compose exec app npm install <package-name>

# Rebuild to include in image
docker compose up --build
```

### Database Schema Changes

```bash
# Generate and apply migration
docker compose exec app npm run prisma:migrate:dev -- --name describe_your_change

# Reset and reseed database
docker compose exec app npm run prisma:migrate:reset
```

## Performance Notes

- **Development**: Uses hot reload with file watching
- **Production**: Optimized build with standalone output
- **Database**: Uses PostgreSQL 16 Alpine for smaller image size

## Security Considerations

⚠️ **Important**: The default configuration is for development only!

For production:
1. Change default passwords
2. Use proper SSL certificates
3. Configure secure environment variables
4. Use a production-grade database setup
5. Enable proper logging and monitoring

## Useful Links

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres) 