### **Step 1: Prerequisites**

Make sure you have these installed:

- **Node.js** (v16+): https://nodejs.org/
- **Git**: https://git-scm.com/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/

### **Step 2: Download the Project**

```bash
# Clone or download this project
cd ADVANCED_JAVA_PROJECT
```

### **Step 3: Install Dependencies**

```bash
# Navigate to src folder
cd src

# Install all required packages
npm install
```

### **Step 4: Setup MongoDB (Cloud)**

1. Go to https://www.mongodb.com/atlas
2. Create a **FREE** account
3. Create a new cluster (choose FREE tier)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0...`)

### **Step 5: Create Environment File**

Create a new file called `.env` in the `src/` folder:

```env
DB_CONNECTION=mongodb+srv://hmajzoub12:BUx5eWvTkUKmZpDv@cluster3.txaovrq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=YOUR_NEO4J_PASSWORD
SECRET_TOKEN_KEY=YOUR_GENERATED_JWT_SECRET
```

**🔐 Generate your JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ IMPORTANT SECURITY:**

- Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your MongoDB credentials
- Replace `YOUR_NEO4J_PASSWORD` with a secure password
- Replace `YOUR_GENERATED_JWT_SECRET` with the generated secret above
- **NEVER** commit the `.env` file to Git (it's already in `.gitignore`)

### **Step 6: Start Local Databases**

Create `docker-compose.yml` in the main project folder:

```yaml
version: "3.8"
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  neo4j:
    image: neo4j:latest
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/YOUR_PASSWORD
    restart: unless-stopped
```

Start the databases:

```bash
# Go back to main project folder
cd ..

# Start Redis and Neo4j
docker-compose up -d

# Check if they're running
docker-compose ps
```

### **Step 7: Test Database Connections**

```bash
# Go back to src folder
cd src

# Test Neo4j connection
node test-neo4j.js
```

You should see: `Neo4j test query result: 1`

### **Step 8: Start the Server**

```bash
# Start in development mode
npm run dev
```

You should see:

```
✅ Server running at http://localhost:3001
Connected to MongoDB
```

### **Step 9: Test Your API**

Open your browser and go to: http://localhost:3001/api/test

You should see:

```json
{
  "message": "Backend is working!",
  "timestamp": "2025-06-28T10:30:00.000Z"
}
```

🎉 **SUCCESS!** Your backend is now running!

## 🐛 **Troubleshooting**

**❌ MongoDB Connection Error:**

- Check your connection string in `.env`
- Make sure you replaced `YOUR_USERNAME` and `YOUR_PASSWORD`
- Ensure MongoDB Atlas allows connections from your IP
- Check if your password contains special characters (URL encode them)

**❌ Docker Not Working:**

```bash
# Check if Docker is running
docker --version

# Restart containers
docker-compose down
docker-compose up -d

# Check container logs
docker-compose logs
```

## 📁 **Project Structure**

```
src/
├── controllers/     # API business logic
├── models/         # Database schemas
├── routes/         # API endpoints
├── middleware/     # Authentication & validation
├── utils/          # Database connections
├── uploads/        # Uploaded images
└── index.js        # Main server file
```
