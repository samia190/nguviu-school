# Docker Deployment Guide

This guide covers building and deploying optimized Docker images for Railway with Alpine Linux base.

## 🎯 Optimization Summary

### Image Size Reductions:
- **Base Image**: Using `node:20-alpine` (~180MB) instead of `node:20` (~950MB)
- **Multi-stage Build**: Frontend uses 2-stage build (builder + production)
- **Production-only Dependencies**: Only installs necessary runtime deps
- **Smart .dockerignore**: Excludes dev files, node_modules, .git, docs

### Key Optimizations:
1. ✅ Alpine Linux base (70% smaller than Debian)
2. ✅ Multi-stage builds for frontend
3. ✅ Production-only npm dependencies
4. ✅ No source maps in production
5. ✅ Vite build optimization (minification, code splitting)
6. ✅ Health checks included
7. ✅ Non-root user for security
8. ✅ Layer caching optimization

---

## 📦 Building Images Locally

### Backend
```bash
cd nguviu-backend
docker build -t nguviu-backend:latest .
```

Expected size: **~250-350 MB** (vs ~1GB+ with full Node.js image)

### Frontend
```bash
cd nguviu-frontend
docker build -t nguviu-frontend:latest .
```

Expected size: **~200-300 MB** (vs ~800MB+ without multi-stage)

### Combined (using docker-compose)
```bash
# Build and run both services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

---

## 🚂 Railway Deployment

Railway automatically detects and uses Dockerfiles when present in service root directories.

### Step 1: Deploy Backend

1. Create a new Railway service from your GitHub repo
2. Set **Root Directory**: `nguviu-backend`
3. Railway will auto-detect `Dockerfile`
4. Set environment variables:
   ```
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   CORS_ORIGINS=https://your-frontend.up.railway.app
   ```
5. Railway auto-assigns `PORT` (no need to set)
6. Generate public domain
7. Deploy!

### Step 2: Deploy Frontend

1. Create another service in the same Railway project
2. Set **Root Directory**: `nguviu-frontend`
3. Railway will auto-detect `Dockerfile`
4. Set environment variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   NODE_ENV=production
   ```
5. Railway auto-assigns `PORT`
6. Generate public domain
7. Deploy!

### Step 3: Update CORS

Go back to backend service and update `CORS_ORIGINS` with the actual frontend URL.

---

## 🔍 Verifying Image Sizes

### Check built image size:
```bash
docker images | grep nguviu
```

You should see:
```
nguviu-backend    latest    abc123def456    250MB
nguviu-frontend   latest    xyz789uvw012    200MB
```

### Inspect image layers:
```bash
docker history nguviu-backend:latest
docker history nguviu-frontend:latest
```

### Check running container stats:
```bash
docker stats
```

---

## 🎨 What's in Each Dockerfile

### Backend (`nguviu-backend/Dockerfile`)
- **Base**: `node:20-alpine` (minimal Node.js)
- **Build tools**: Only python3, make, g++ for native deps (bcrypt)
- **Dependencies**: Production only (`npm ci --only=production`)
- **Security**: Runs as non-root `node` user
- **Health check**: Validates `/api/health` endpoint
- **Size**: ~250-350 MB

### Frontend (`nguviu-frontend/Dockerfile`)
- **Stage 1 (Builder)**: Builds optimized Vite app
  - Installs all dependencies
  - Runs `npm run build`
  - Creates minified production assets
- **Stage 2 (Production)**: Serves built app
  - Only copies `dist/` folder from builder
  - Installs minimal deps (just `vite` for preview)
  - Runs `vite preview` server
- **Size**: ~200-300 MB (vs ~800MB without multi-stage)

---

## 🚀 Performance Tips

### Further Size Reduction (if needed):

1. **Use compressed images** (if Railway supports):
   ```dockerfile
   FROM node:20-alpine AS squash
   # ... your build
   FROM scratch
   COPY --from=squash / /
   ```

2. **Remove build tools after npm install**:
   ```dockerfile
   RUN apk add --no-cache --virtual .build-deps python3 make g++ \
       && npm ci --only=production \
       && apk del .build-deps
   ```

3. **Use pnpm instead of npm** (smaller node_modules):
   ```dockerfile
   RUN npm install -g pnpm && pnpm install --prod
   ```

4. **Compress with UPX** (optional, can break Node.js):
   ```dockerfile
   RUN apk add upx && upx /usr/local/bin/node
   ```

### Build Time Optimization:

1. **Use BuildKit**:
   ```bash
   DOCKER_BUILDKIT=1 docker build -t nguviu-backend .
   ```

2. **Cache npm packages**:
   ```bash
   docker build --cache-from nguviu-backend:latest -t nguviu-backend .
   ```

3. **Parallel builds**:
   ```bash
   docker-compose build --parallel
   ```

---

## 🔧 Troubleshooting

### Image too large (>4GB)
- Check `.dockerignore` excludes `node_modules`, `.git`, `dist/`
- Verify using Alpine base (`FROM node:20-alpine`)
- Use multi-stage builds for frontend
- Run `docker image prune -a` to remove old layers

### Build fails with "MODULE_NOT_FOUND"
- Ensure `package.json` includes all production dependencies
- Don't exclude critical dependencies in `.dockerignore`
- Check that `npm ci --only=production` includes what you need

### Native dependencies fail (bcrypt, sharp, etc.)
- Ensure build tools installed: `apk add python3 make g++`
- Use `npm rebuild` after install if needed
- Consider pre-built binaries for Alpine

### Container exits immediately
- Check logs: `docker logs <container-id>`
- Verify environment variables are set
- Test health check manually
- Ensure `CMD` is correct

### Port binding issues on Railway
- Don't hardcode ports - use `process.env.PORT`
- Railway assigns ports dynamically
- `EXPOSE` in Dockerfile is just documentation

---

## 📊 Size Comparison

| Setup | Backend | Frontend | Total | Railway Fit? |
|-------|---------|----------|-------|--------------|
| **Full Node.js (node:20)** | ~1.2GB | ~950MB | ~2.15GB | ✅ Yes |
| **Alpine (node:20-alpine)** | ~300MB | ~250MB | ~550MB | ✅✅✅ Yes! |
| **Alpine + Multi-stage** | ~300MB | ~200MB | ~500MB | ✅✅✅ Perfect! |
| **No optimization** | ~1.5GB | ~1.2GB | ~2.7GB | ⚠️ Tight |

Current setup targets **~500MB total** - well under Railway's 4GB limit!

---

## 🎯 Best Practices Checklist

- [x] Use Alpine base images
- [x] Multi-stage builds for frontend
- [x] Production-only dependencies
- [x] Comprehensive .dockerignore
- [x] Non-root user
- [x] Health checks
- [x] Layer caching optimization
- [x] No source maps in production
- [x] Vite build optimizations
- [x] Small attack surface

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Alpine Linux](https://alpinelinux.org/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Railway Docker Docs](https://docs.railway.app/deploy/dockerfiles)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)

---

## 🧪 Testing Locally

### Test backend:
```bash
docker run -p 4000:4000 \
  -e MONGO_URI=your-connection-string \
  -e JWT_SECRET=test-secret \
  -e NODE_ENV=production \
  nguviu-backend:latest
```

### Test frontend:
```bash
docker run -p 3000:3000 \
  -e VITE_API_URL=http://localhost:4000 \
  -e PORT=3000 \
  nguviu-frontend:latest
```

### Test with docker-compose:
```bash
# Create .env file first
echo "MONGO_URI=your-uri" > .env
echo "JWT_SECRET=secret" >> .env

docker-compose up
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/health

---

## 🎉 Success Metrics

After deploying to Railway, you should see:
- ✅ Build completes in <5 minutes
- ✅ Backend image <400MB
- ✅ Frontend image <300MB
- ✅ Total storage <1GB (well under 4GB limit)
- ✅ Fast cold starts (<10 seconds)
- ✅ Healthy status checks passing
- ✅ No memory/CPU issues

Happy shipping! 🚢
