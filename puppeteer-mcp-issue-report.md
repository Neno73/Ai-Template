# Puppeteer MCP Server Setup Issue Report

## Problem Summary
Docker build fails during Chrome installation due to GPG key verification failure. Additional security configuration needed for containerized Puppeteer operation.

## Technical Details

### Key Files
**Dockerfile (partial)**
```dockerfile
# Install Chrome dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        libgbm-dev \
        xvfb

# Chrome installation
RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrom-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google-chrome.list
```

**Error Log**
```
W: GPG error: http://dl.google.com/linux/chrome/deb stable InRelease: 
The following signatures couldn't be verified because the public key is not available: 
NO_PUBKEY 32EE5355A6BC6E42
E: The repository 'http://dl.google.com/linux/chrome/deb stable InRelease' is not signed.
```

### Critical Issues
1. **Keyring Filename Mismatch**  
   Typo in sources.list reference:  
   `googlechrom-keyring.gpg` vs actual `googlechrome-keyring.gpg`

2. **Security Configuration**  
   Missing Chrome sandbox arguments and container capabilities

3. **Dependency Chain**  
   Required packages:
   - Chrome Stable: 121.0.6167.140
   - Puppeteer: 24.2.0
   - Node: 18-slim

## Recommended Fixes

1. **Correct Keyring Reference**
```diff
- signed-by=/usr/share/keyrings/googlechrom-keyring.gpg
+ signed-by=/usr/share/keyrings/googlechrome-keyring.gpg
```

2. **Add Chrome Launch Arguments**
```javascript
const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
});
```

3. **Update Docker Run Command**
```json
"args": [
  "run",
  "-i",
  "--rm",
  "--init",
  "--shm-size=2gb",
  "--cap-add=SYS_ADMIN",
  "-e", "DOCKER_CONTAINER=true",
  "-v", "/tmp/.X11-unix:/tmp/.X11-unix",
  "puppeteer-server:latest"
]
```

## Verification Steps
1. Rebuild Docker image with corrected keyring path
2. Test container with:
```bash
docker run -it --rm puppeteer-server:latest node -e "require('./build/index.js')"
```
3. Check MCP server connectivity on port 7623

## Environment Details
- OS: Debian Bookworm (Docker)
- Node.js: 18.18.2
- Docker: 24.0.7
- Build System: Legacy Docker builder