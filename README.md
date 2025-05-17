## How to Run Locally
1. Login to Docker
   ```bash
   docker login
   ```
2. Pull Docker images from dockerhub for both frontend and backend
   ```bash
   docker pull trishanu8295/disease-analysis-node-frontend:0.0.1.RELEASE
   ```
   ```bash
   docker pull trishanu8295/disease-analysis-python-flask:0.0.1.RELEASE
   ```
3. Run containers on respective ports
   ```bash
   docker run -d -p 3000:3000 trishanu8295/disease-analysis-node-frontend:0.0.1.RELEASE
   ```
   ```bash
   docker run -d -p 5000:5000 trishanu8295/disease-analysis-python-flask:0.0.1.RELEASE
   ```
4. Navigate to http://localhost:3000 .

## Demo Video

[![Watch the Demo](https://img.youtube.com/vi/ckyNkg6FUJg/0.jpg)](https://youtu.be/ckyNkg6FUJg)
