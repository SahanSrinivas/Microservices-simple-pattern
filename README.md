# 🚀 GCP Microservices with Binary Authorization CI/CD

> **Production-grade microservices architecture** with automated deployments, image signing, and security enforcement on Google Kubernetes Engine.

**Live Demo**: [gcpstudycircle.online](https://gcpstudycircle.online)

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
- [Phase 2: Security Infrastructure](#phase-2-security-infrastructure)
- [Phase 3: CI/CD Pipeline](#phase-3-cicd-pipeline)
- [Phase 4: Automated Deployment](#phase-4-automated-deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Requests                                │
│                              ↓                                       │
│                    gcpstudycircle.online                            │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Global Load Balancer (HTTPS)                      │
│              - Managed SSL Certificate (Auto-provisioned)            │
│              - Static IP: gcpstudycircle-ip                         │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      GKE Ingress Controller                          │
│                    Path-Based Routing Rules:                         │
│                    /          → React Frontend                       │
│                    /api/java  → Spring Boot Backend                  │
│                    /api/python → FastAPI Backend                     │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
        ┌──────────────────────┼──────────────────────┐
        ↓                      ↓                      ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │  Backend A   │      │  Backend B   │
│              │      │              │      │              │
│    React     │      │ Spring Boot  │      │   FastAPI    │
│   (Port 80)  │      │  (Port 8080) │      │  (Port 8000) │
│              │      │   Java 17    │      │  Python 3.9  │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔐 Security & CI/CD Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Developer Push to GitHub                         │
│                      git push origin main                            │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloud Build Trigger (Auto)                        │
│              - Builds Docker Images (3 services)                     │
│              - Pushes to Artifact Registry                           │
│              - Tags: springboot-app, fastapi-app, react-app         │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Binary Authorization                              │
│              📌 SERVICE ACCOUNT REQUIRED                             │
│              - Signs images with KMS key                             │
│              - Creates attestations                                  │
│              - Validates signatures                                  │
│                                                                       │
│   Required Permissions for: [PROJECT_NUMBER]-compute@developer...   │
│   ✓ roles/cloudkms.signerVerifier                                   │
│   ✓ roles/binaryauthorization.attestorsViewer                       │
│   ✓ roles/containeranalysis.notes.attacher                          │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Cloud Deploy Pipeline                           │
│              - Executes Skaffold rendering                           │
│              - Creates Release                                       │
│              - Deploys to GKE (prod target)                         │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    GKE Cluster (my-cluster)                         │
│              - Validates signed images                               │
│              - Deploys pods (3 services)                            │
│              - Updates running services                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + Nginx | Single Page Application |
| **Backend A** | Spring Boot 3 (Java 17) | REST API Service |
| **Backend B** | FastAPI (Python 3.9) | REST API Service |
| **Container Registry** | Artifact Registry | Docker image storage |
| **Orchestration** | Google Kubernetes Engine | Container management |
| **CI/CD** | Cloud Build + Cloud Deploy | Automated pipeline |
| **Security** | Binary Authorization + KMS | Image signing & validation |
| **Load Balancing** | Global HTTP(S) Load Balancer | Traffic routing |
| **DNS** | Cloud DNS / External registrar | Domain management |

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] **Google Cloud Project** (ID: `sampleprojecttesting-478502`)
- [ ] **Billing enabled** on your GCP project
- [ ] **Domain name** registered (e.g., gcpstudycircle.online)
- [ ] **Tools installed locally**:
  - `gcloud` CLI ([Install](https://cloud.google.com/sdk/docs/install))
  - `kubectl` ([Install](https://kubernetes.io/docs/tasks/tools/))
  - `git`

### Initial Setup

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project sampleprojecttesting-478502

# Set default region
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a
```

---

## 📦 Phase 1: Infrastructure Setup

### 1.1 Enable Required APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  container.googleapis.com \
  compute.googleapis.com
```

### 1.2 Create Artifact Registry

```bash
gcloud artifacts repositories create microservices-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for microservices"
```

**Verify creation:**
```bash
gcloud artifacts repositories list --location=us-central1
```

### 1.3 Reserve Static Global IP

```bash
gcloud compute addresses create gcpstudycircle-ip --global
```

**Get your IP address (save this for DNS):**
```bash
gcloud compute addresses describe gcpstudycircle-ip --global --format="get(address)"
```

### 1.4 Create GKE Cluster

```bash
gcloud container clusters create my-cluster \
  --zone us-central1-a \
  --project sampleprojecttesting-478502 \
  --machine-type e2-medium \
  --num-nodes 3 \
  --enable-autoscaling --min-nodes 3 --max-nodes 5 \
  --enable-binauthz-evaluation \
  --scopes "https://www.googleapis.com/auth/cloud-platform"
```

⏱️ **This takes 5-10 minutes**

**Connect to your cluster:**
```bash
gcloud container clusters get-credentials my-cluster \
  --zone us-central1-a \
  --project sampleprojecttesting-478502
```

**Verify connection:**
```bash
kubectl cluster-info
kubectl get nodes
```

### 1.5 Initial Docker Image Builds

Build and push all three services to Artifact Registry:

```bash
# Spring Boot Backend
cd backend-java
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/springboot-app:v1 .

# FastAPI Backend
cd ../backend-python
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/fastapi-app:v1 .

# React Frontend
cd ../frontend-react
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/react-app:v1 .
```

**Verify images:**
```bash
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo
```

---

## 🔒 Phase 2: Security Infrastructure (Binary Authorization)

### 2.1 Enable Security APIs

```bash
gcloud services enable \
  binaryauthorization.googleapis.com \
  containeranalysis.googleapis.com \
  cloudkms.googleapis.com \
  clouddeploy.googleapis.com
```

### 2.2 Create KMS Signing Keys

```bash
# Create keyring
gcloud kms keyrings create binauthz-keys --location us-central1

# Create signing key
gcloud kms keys create codelab-signer \
  --keyring binauthz-keys \
  --location us-central1 \
  --purpose asymmetric-signing \
  --default-algorithm rsa-sign-pkcs1-4096-sha512
```

**Verify key creation:**
```bash
gcloud kms keys list --location us-central1 --keyring binauthz-keys
```

### 2.3 Create Container Analysis Note

This note serves as the authority for attestations.

**Create note payload file:**
```bash
cat > note_payload.json << EOF
{
  "name": "projects/sampleprojecttesting-478502/notes/production-deployer",
  "attestation": {
    "hint": {
      "human_readable_name": "Production Deployer Note"
    }
  }
}
EOF
```

**Create the note using REST API:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  --data-binary @note_payload.json \
  "https://containeranalysis.googleapis.com/v1/projects/sampleprojecttesting-478502/notes/?noteId=production-deployer"
```

**Verify note creation:**
```bash
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://containeranalysis.googleapis.com/v1/projects/sampleprojecttesting-478502/notes/production-deployer"
```

### 2.4 Create Binary Authorization Attestor

```bash
# Create attestor
gcloud container binauthz attestors create production-attestor \
  --project sampleprojecttesting-478502 \
  --attestation-authority-note production-deployer \
  --attestation-authority-note-project sampleprojecttesting-478502

# Add public key to attestor
gcloud container binauthz attestors public-keys add \
  --attestor production-attestor \
  --project sampleprojecttesting-478502 \
  --keyversion-project sampleprojecttesting-478502 \
  --keyversion-location us-central1 \
  --keyversion-keyring binauthz-keys \
  --keyversion-key codelab-signer \
  --keyversion 1
```

**Verify attestor:**
```bash
gcloud container binauthz attestors list --project sampleprojecttesting-478502
```

### 2.5 🔑 Grant Service Account Permissions (CRITICAL)

> ⚠️ **IMPORTANT**: These permissions allow Cloud Build to sign images and create attestations.

**Get your Compute Engine service account:**
```bash
export PROJECT_NUMBER=$(gcloud projects describe sampleprojecttesting-478502 --format="value(projectNumber)")
export COMPUTE_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Service Account: $COMPUTE_EMAIL"
```

**Grant the three required roles:**

```bash
# 1. Permission to sign images with KMS
gcloud kms keys add-iam-policy-binding codelab-signer \
  --location us-central1 \
  --keyring binauthz-keys \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/cloudkms.signerVerifier" \
  --project sampleprojecttesting-478502

# 2. Permission to view attestor configuration
gcloud container binauthz attestors add-iam-policy-binding production-attestor \
  --project sampleprojecttesting-478502 \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/binaryauthorization.attestorsViewer"

# 3. Permission to attach attestation notes
gcloud projects add-iam-policy-binding sampleprojecttesting-478502 \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/containeranalysis.notes.attacher"
```

**Verify permissions:**
```bash
# Verify KMS permission
gcloud kms keys get-iam-policy codelab-signer \
  --location us-central1 \
  --keyring binauthz-keys

# Verify attestor permission
gcloud container binauthz attestors get-iam-policy production-attestor \
  --project sampleprojecttesting-478502

# Verify project-level permission
gcloud projects get-iam-policy sampleprojecttesting-478502 \
  --flatten="bindings[].members" \
  --filter="bindings.members:$COMPUTE_EMAIL"
```

### 2.6 Configure Binary Authorization Policy

Create a policy that requires attestations for the production cluster:

```bash
cat > binauthz-policy.yaml << EOF
admissionWhitelistPatterns:
- namePattern: gcr.io/cloudbuild-images/*
defaultAdmissionRule:
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  evaluationMode: REQUIRE_ATTESTATION
  requireAttestationsBy:
  - projects/sampleprojecttesting-478502/attestors/production-attestor
name: projects/sampleprojecttesting-478502/policy
EOF

gcloud container binauthz policy import binauthz-policy.yaml
```

---

## ⚙️ Phase 3: CI/CD Pipeline Setup

### 3.1 Create Cloud Deploy Pipeline Configuration

**Create `clouddeploy.yaml` in your project root:**
```yaml
apiVersion: deploy.cloud.google.com/v1
kind: DeliveryPipeline
metadata:
  name: microservices-pipeline
serialPipeline:
  stages:
  - targetId: prod
    profiles: []
---
apiVersion: deploy.cloud.google.com/v1
kind: Target
metadata:
  name: prod
gke:
  cluster: projects/sampleprojecttesting-478502/locations/us-central1-a/clusters/my-cluster
```

### 3.2 Create Skaffold Configuration

**Create `skaffold.yaml` in your project root:**
```yaml
apiVersion: skaffold/v4beta6
kind: Config
metadata:
  name: microservices
build:
  artifacts:
  - image: us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/springboot-app
    context: backend-java
  - image: us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/fastapi-app
    context: backend-python
  - image: us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/react-app
    context: frontend-react
manifests:
  rawYaml:
  - k8s/gcp-deployments.yaml
deploy:
  kubectl: {}
```

### 3.3 Create Cloud Build Configuration

**Create `cloudbuild.yaml` in your project root:**
```yaml
steps:
  # Build Spring Boot
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/springboot-app:$SHORT_SHA'
      - './backend-java'
    id: 'build-springboot'

  # Build FastAPI
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/fastapi-app:$SHORT_SHA'
      - './backend-python'
    id: 'build-fastapi'

  # Build React
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/react-app:$SHORT_SHA'
      - './frontend-react'
    id: 'build-react'

  # Push all images
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/springboot-app:$SHORT_SHA'
    id: 'push-springboot'
    waitFor: ['build-springboot']

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/fastapi-app:$SHORT_SHA'
    id: 'push-fastapi'
    waitFor: ['build-fastapi']

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/react-app:$SHORT_SHA'
    id: 'push-react'
    waitFor: ['build-react']

  # Sign Spring Boot image
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud beta container binauthz attestations sign-and-create \
          --project="$PROJECT_ID" \
          --artifact-url="us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/springboot-app:$SHORT_SHA" \
          --attestor="production-attestor" \
          --attestor-project="$PROJECT_ID" \
          --keyversion-project="$PROJECT_ID" \
          --keyversion-location="us-central1" \
          --keyversion-keyring="binauthz-keys" \
          --keyversion-key="codelab-signer" \
          --keyversion="1"
    id: 'attest-springboot'
    waitFor: ['push-springboot']

  # Sign FastAPI image
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud beta container binauthz attestations sign-and-create \
          --project="$PROJECT_ID" \
          --artifact-url="us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/fastapi-app:$SHORT_SHA" \
          --attestor="production-attestor" \
          --attestor-project="$PROJECT_ID" \
          --keyversion-project="$PROJECT_ID" \
          --keyversion-location="us-central1" \
          --keyversion-keyring="binauthz-keys" \
          --keyversion-key="codelab-signer" \
          --keyversion="1"
    id: 'attest-fastapi'
    waitFor: ['push-fastapi']

  # Sign React image
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud beta container binauthz attestations sign-and-create \
          --project="$PROJECT_ID" \
          --artifact-url="us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/react-app:$SHORT_SHA" \
          --attestor="production-attestor" \
          --attestor-project="$PROJECT_ID" \
          --keyversion-project="$PROJECT_ID" \
          --keyversion-location="us-central1" \
          --keyversion-keyring="binauthz-keys" \
          --keyversion-key="codelab-signer" \
          --keyversion="1"
    id: 'attest-react'
    waitFor: ['push-react']

  # Create Cloud Deploy release
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud deploy releases create release-$SHORT_SHA \
          --project=$PROJECT_ID \
          --region=us-central1 \
          --delivery-pipeline=microservices-pipeline \
          --images=springboot-app=us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/springboot-app:$SHORT_SHA,fastapi-app=us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/fastapi-app:$SHORT_SHA,react-app=us-central1-docker.pkg.dev/$PROJECT_ID/microservices-repo/react-app:$SHORT_SHA
    id: 'create-release'
    waitFor: ['attest-springboot', 'attest-fastapi', 'attest-react']

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

timeout: '1800s'
```

### 3.4 Register Cloud Deploy Pipeline

```bash
gcloud deploy apply \
  --file=clouddeploy.yaml \
  --region=us-central1 \
  --project=sampleprojecttesting-478502
```

**Verify pipeline:**
```bash
gcloud deploy delivery-pipelines list --region=us-central1
```

### 3.5 Create Cloud Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=YOUR_REPO_NAME \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name=microservices-trigger \
  --region=us-central1
```

> 📝 **Note**: Replace `YOUR_REPO_NAME` and `YOUR_GITHUB_USERNAME` with your actual GitHub repository details.

**Connect your GitHub repository** (if not already connected):
```bash
gcloud builds triggers import --source=/path/to/trigger.yaml
```

---

## 🚀 Phase 4: Automated Deployment

### 4.1 Configure DNS

1. Get your static IP address:
   ```bash
   gcloud compute addresses describe gcpstudycircle-ip --global --format="get(address)"
   ```

2. Add an **A Record** in your DNS provider:
   - **Type**: A
   - **Host**: @ (or your subdomain)
   - **Value**: [Your Static IP]
   - **TTL**: 3600

### 4.2 Deploy Initial Kubernetes Resources

```bash
# Navigate to k8s directory
cd k8s

# Apply all resources
kubectl apply -f gcp-deployments.yaml

# Verify deployment
kubectl get deployments
kubectl get services
kubectl get ingress
kubectl get managedcertificate
```

**Expected output:**
```
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
react-app    1/1     1            1           2m
springboot   1/1     1            1           2m
fastapi      1/1     1            1           2m
```

### 4.3 Monitor SSL Certificate Provisioning

```bash
kubectl describe managedcertificate gcpstudycircle-cert
```

**Status progression:**
- `Provisioning` → Initial state (wait 15-60 minutes)
- `ProvisioningFailed` → Check DNS configuration
- `Active` → Certificate is ready ✅

### 4.4 Trigger Your First Automated Deployment

```bash
# Make a small change to any service
echo "// Trigger deployment" >> backend-java/src/main/java/com/example/demo/DemoController.java

# Commit and push
git add .
git commit -m "Trigger first automated deployment"
git push origin main
```

**Monitor the pipeline:**
```bash
# Watch Cloud Build
gcloud builds list --limit=5

# Watch Cloud Deploy
gcloud deploy releases list --delivery-pipeline=microservices-pipeline --region=us-central1

# Watch Kubernetes rollout
kubectl rollout status deployment/springboot
```

---

## 📁 Project Structure

```
gcp-microservices/
│
├── README.md                          # This file
├── cloudbuild.yaml                    # CI/CD pipeline definition
├── clouddeploy.yaml                   # Cloud Deploy configuration
├── skaffold.yaml                      # Skaffold build/deploy config
│
├── backend-java/                      # Spring Boot Service
│   ├── src/
│   │   └── main/java/com/example/
│   ├── Dockerfile
│   └── pom.xml
│
├── backend-python/                    # FastAPI Service
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend-react/                    # React Frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
└── k8s/                               # Kubernetes Manifests
    └── gcp-deployments.yaml           # All K8s resources
        ├── Deployments (3)
        ├── Services (3)
        ├── Ingress (1)
        └── ManagedCertificate (1)
```

---

## 🔍 Verification & Testing

### Test Endpoints

Once deployed, test your services:

```bash
# Frontend (React)
curl https://gcpstudycircle.online/

# Spring Boot API
curl https://gcpstudycircle.online/api/java/hello

# FastAPI
curl https://gcpstudycircle.online/api/python/hello
```

### Check Pod Health

```bash
# Get pod status
kubectl get pods

# View pod logs
kubectl logs -l app=springboot
kubectl logs -l app=fastapi
kubectl logs -l app=react-app

# Describe pod for troubleshooting
kubectl describe pod <POD_NAME>
```

### Monitor Binary Authorization

```bash
# Check attestations for an image
gcloud container binauthz attestations list \
  --project=sampleprojecttesting-478502 \
  --attestor=production-attestor \
  --artifact-url="us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/springboot-app:v1"
```

---

## 🐛 Troubleshooting

### Issue 1: Certificate Not Provisioning

**Symptom**: ManagedCertificate stuck in `Provisioning` or `ProvisioningFailed`

**Solutions**:
```bash
# 1. Verify DNS propagation
nslookup gcpstudycircle.online

# 2. Check certificate status
kubectl describe managedcertificate gcpstudycircle-cert

# 3. Verify Ingress has static IP
kubectl get ingress gcpstudycircle-ingress -o yaml | grep "ingress.gcp.kubernetes.io/pre-shared-cert"

# 4. Delete and recreate if necessary
kubectl delete managedcertificate gcpstudycircle-cert
kubectl apply -f k8s/gcp-deployments.yaml
```

### Issue 2: Binary Authorization Blocking Deployments

**Symptom**: Pods stuck in `ImagePullBackOff` with admission error

**Solutions**:
```bash
# 1. Check if images are attested
gcloud container binauthz attestations list \
  --attestor=production-attestor \
  --project=sampleprojecttesting-478502

# 2. Verify service account permissions
gcloud kms keys get-iam-policy codelab-signer \
  --location us-central1 \
  --keyring binauthz-keys

# 3. Temporarily disable Binary Authorization for testing
kubectl patch cluster my-cluster \
  --type merge \
  --patch '{"spec":{"binaryAuthorization":{"evaluationMode":"DISABLED"}}}'

# 4. Re-attest images manually
gcloud beta container binauthz attestations sign-and-create \
  --artifact-url="us-central1-docker.pkg.dev/sampleprojecttesting-478502/microservices-repo/springboot-app:v1" \
  --attestor="production-attestor" \
  --attestor-project="sampleprojecttesting-478502" \
  --keyversion-project="sampleprojecttesting-478502" \
  --keyversion-location="us-central1" \
  --keyversion-keyring="binauthz-keys" \
  --keyversion-key="codelab-signer" \
  --keyversion="1"
```

### Issue 3: Cloud Deploy Release Failed

**Symptom**: Release stuck in `FAILED` state

**Solutions**:
```bash
# 1. Check release details
gcloud deploy releases describe release-<SHA> \
  --delivery-pipeline=microservices-pipeline \
  --region=us-central1

# 2. Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>

# 3. Verify Skaffold syntax
skaffold validate -f skaffold.yaml

# 4. Abandon failed release and retry
gcloud deploy releases abandon release-<SHA> \
  --delivery-pipeline=microservices-pipeline \
  --region=us-central1
```

### Issue 4: 502/503 Errors from Load Balancer

**Symptom**: Ingress returns 502 Bad Gateway or 503 Service Unavailable

**Solutions**:
```bash
# 1. Check backend service health
kubectl get endpoints

# 2. Verify pod readiness
kubectl get pods -o wide

# 3. Check service port configuration
kubectl describe service springboot-service

# 4. View ingress backend status
kubectl describe ingress gcpstudycircle-ingress

# 5. Check container logs
kubectl logs -l app=springboot --tail=50
```

### Issue 5: Permission Denied Errors in Cloud Build

**Symptom**: Cloud Build fails with "Permission denied" during attestation

**Solution**:
```bash
# Re-apply all service account permissions
export PROJECT_NUMBER=$(gcloud projects describe sampleprojecttesting-478502 --format="value(projectNumber)")
export COMPUTE_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant all three roles again
gcloud kms keys add-iam-policy-binding codelab-signer \
  --location us-central1 \
  --keyring binauthz-keys \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/cloudkms.signerVerifier" \
  --project sampleprojecttesting-478502

gcloud container binauthz attestors add-iam-policy-binding production-attestor \
  --project sampleprojecttesting-478502 \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/binaryauthorization.attestorsViewer"

gcloud projects add-iam-policy-binding sampleprojecttesting-478502 \
  --member="serviceAccount:$COMPUTE_EMAIL" \
  --role="roles/containeranalysis.notes.attacher"
```

---

## 📊 Cost Estimation

**Monthly costs (approximate)**:

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| GKE Cluster | 3x e2-medium nodes | ~$75 |
| Cloud Load Balancer | Global HTTPS | ~$20 |
| Artifact Registry | Storage + bandwidth | ~$5 |
| Cloud Build | 120 build minutes/month | Free tier |
| Cloud KMS | 1 key, attestation ops | ~$1 |
| **Total** | | **~$100/month** |

---

## 🎯 Key Takeaways

✅ **Production-ready**: Automated CI/CD with security enforcement  
✅ **Scalable**: Auto-scaling enabled (3-5 nodes)  
✅ **Secure**: Binary Authorization ensures only signed images deploy  
✅ **Observable**: Cloud Logging enabled for all components  
✅ **Maintainable**: GitOps workflow - push to deploy  

---

## 📚 Additional Resources

- [Google Cloud Deploy Documentation](https://cloud.google.com/deploy/docs)
- [Binary Authorization Guide](https://cloud.google.com/binary-authorization/docs)
- [GKE Best Practices](https://cloud.google.com/kubernetes-engine/docs/best-practices)
- [Skaffold Documentation](https://skaffold.dev/docs/)

---

## 📝 License

MIT License - Feel free to use this project as a template for your own microservices architecture.

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ using Google Cloud Platform**
