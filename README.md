GCP Microservices Pattern: React, Spring Boot, FastAPI on GKE

Domain: gcpstudycircle.online



Infrastructure: Google Kubernetes Engine (GKE), Artifact Registry, Cloud Load Balancing, Managed SSL.



This project implements a production-grade microservices architecture using the Path-Based Routing pattern.



🏗️ Architecture

Frontend: React (Serves UI) → Routes to /



Backend A: Spring Boot (Java 17) → Routes to /api/java



Backend B: FastAPI (Python 3.9) → Routes to /api/python



Ingress: GKE Global Load Balancer (Handles HTTPS \& Routing)



🚀 Prerequisites

Google Cloud Project (ID: sampleprojecttesting-478502)



Tools Installed:



gcloud CLI



kubectl



Git



🛠️ Step 1: GCP Setup

1\. Enable APIs

Bash



gcloud services enable artifactregistry.googleapis.com container.googleapis.com

2\. Create Artifact Registry

Bash



gcloud artifacts repositories create microservices-repo \\

&nbsp;   --repository-format=docker \\

&nbsp;   --location=us-central1 \\

&nbsp;   --description="Docker repo for microservices"

3\. Reserve Static IP

Bash



gcloud compute addresses create gcpstudycircle-ip --global

Note: Save this IP address for your DNS settings.



4\. Create GKE Cluster

Bash



gcloud container clusters create my-cluster \\

&nbsp;   --zone us-central1-a \\

&nbsp;   --project sampleprojecttesting-478502 \\

&nbsp;   --machine-type e2-medium \\

&nbsp;   --num-nodes 3 \\

&nbsp;   --enable-autoscaling --min-nodes 3 --max-nodes 5 \\

&nbsp;   --scopes "https://www.googleapis.com/auth/cloud-platform"

📂 Step 2: Build \& Push Images

We use Cloud Build to build and push images directly to Artifact Registry (no local Docker required).



Backend A: Spring Boot

Bash



cd backend-java

gcloud builds submit --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/springboot-app:v1 .

Backend B: FastAPI

Bash



cd ../backend-python

gcloud builds submit --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/fastapi-app:v1 .

Frontend: React

Bash



cd ../frontend-react

gcloud builds submit --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/react-app:v1 .

☸️ Step 3: Kubernetes Deployment

1\. Connect to Cluster

Bash



gcloud container clusters get-credentials my-cluster --zone us-central1-a --project sampleprojecttesting-478502

2\. Apply Manifests

Navigate to the k8s folder and apply the configuration.



Bash



cd ../k8s

kubectl apply -f gcp-deployments.yaml

3\. Verify Deployment

Check if all pods are running:



Bash



kubectl get pods

Expected Output: 3 pods with status Running (1/1).



🌐 Step 4: DNS \& Final Config

1\. Get Load Balancer IP

Bash



gcloud compute addresses describe gcpstudycircle-ip --global --format="get(address)"

2\. Update DNS

Go to your domain registrar (e.g., GoDaddy, Namecheap) and add an A Record:



Type: A



Host: @



Value: \[YOUR\_LOAD\_BALANCER\_IP]



3\. Wait for SSL

Google Managed Certificates take 15-60 minutes to provision after DNS propagation. Check status:



Bash



kubectl describe managedcertificate gcpstudycircle-cert

Status should eventually change to Active.



📁 Project Structure

Plaintext



/gcp-study-circle

├── backend-java/           # Spring Boot App

│   ├── src/

│   ├── Dockerfile

│   └── pom.xml

├── backend-python/         # FastAPI App

│   ├── main.py

│   ├── requirements.txt

│   └── Dockerfile

├── frontend-react/         # React App

│   ├── public/

│   ├── src/

│   ├── Dockerfile

│   ├── nginx.conf

│   └── package.json

└── k8s/                    # Kubernetes Configs

&nbsp;   └── gcp-deployments.yaml

