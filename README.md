# Todo App — Microservices Deployment on AWS + Kubernetes

A simple full-stack Todo application deployed as two microservices on AWS EC2 using Terraform, Ansible, Kubernetes (microk8s), and ArgoCD for GitOps-based Continuous Delivery.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  AWS EC2 (t3.medium)             │
│                                                  │
│   ┌─────────────────────────────────────────┐   │
│   │           microk8s Cluster              │   │
│   │                                         │   │
│   │  ┌──────────────┐  ┌─────────────────┐  │   │
│   │  │   Frontend   │  │    Backend      │  │   │
│   │  │ React + Nginx│  │    FastAPI      │  │   │
│   │  │  NodePort    │  │   NodePort      │  │   │
│   │  │   :31001     │  │    :31000       │  │   │
│   │  └──────────────┘  └─────────────────┘  │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │         ArgoCD  :30080          │    │   │
│   │  └─────────────────────────────────┘    │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
todo-app/
├── backend/                  # FastAPI microservice
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React microservice
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── terraform/                # AWS infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── ansible/                  # Server configuration
│   ├── inventory.ini
│   └── playbook.yml
├── k8s/                      # Kubernetes manifests
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── frontend/
│       ├── deployment.yaml
│       └── service.yaml
├── argocd/
│   └── application.yaml      # ArgoCD app definition
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI pipeline
```

---

## Prerequisites

Install these tools on your **local machine** before starting:

| Tool | Install |
|---|---|
| Terraform | https://developer.hashicorp.com/terraform/install |
| Ansible | `pip install ansible` |
| AWS CLI | https://aws.amazon.com/cli/ |
| Docker | https://docs.docker.com/get-docker/ |
| kubectl | https://kubernetes.io/docs/tasks/tools/ |
| Git | https://git-scm.com/ |

---

## Step 1 — Set Up Your GitHub Repository

1. Create a new GitHub repo (e.g., `todo-app`)
2. Push this entire project to it:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/todo-app.git
   git push -u origin main
   ```

---

## Step 2 — Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Output format: json
```

Generate an SSH key pair if you don't have one:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

---

## Step 3 — Provision Infrastructure with Terraform

```bash
cd terraform/

# Initialize Terraform (downloads AWS provider)
terraform init

# Preview what will be created
terraform plan

# Create VPC, Subnet, Security Group, and EC2 instance
terraform apply
# Type 'yes' when prompted
```

After apply completes, note the output:
```
instance_public_ip = "x.x.x.x"
ssh_command = "ssh -i ~/.ssh/id_rsa ubuntu@x.x.x.x"
```

> **Note:** If you're in a region other than `us-east-1`, update `ami_id` in `variables.tf`  
> with the Ubuntu 22.04 AMI for your region. Find it at:  
> https://cloud-images.ubuntu.com/locator/ec2/

---

## Step 4 — Configure the Server with Ansible

1. Open `ansible/inventory.ini` and replace `YOUR_EC2_PUBLIC_IP` with the IP from Step 3:
   ```ini
   [k8s_server]
   3.84.xxx.xxx ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa ...
   ```

2. Install the required Ansible community collection:
   ```bash
   ansible-galaxy collection install community.general
   ```

3. Run the playbook (takes ~5 minutes):
   ```bash
   cd ansible/
   ansible-playbook -i inventory.ini playbook.yml
   ```

   This will:
   - Update the system
   - Install microk8s (Kubernetes)
   - Enable DNS, storage, and registry addons
   - Install Docker
   - Install ArgoCD and expose it on port 30080
   - Print the ArgoCD admin password at the end (**save it**)

---

## Step 5 — Set Up Docker Hub

1. Create a free account at https://hub.docker.com
2. Create two **public** repositories:
   - `YOUR_USERNAME/todo-backend`
   - `YOUR_USERNAME/todo-frontend`

---

## Step 6 — Configure GitHub Actions Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (create at https://hub.docker.com/settings/security) |
| `EC2_PUBLIC_IP` | The EC2 public IP from Step 3 |
| `GH_PAT` | GitHub Personal Access Token with `repo` scope (create at https://github.com/settings/tokens) |

---

## Step 7 — Update Kubernetes Manifests

In `k8s/backend/deployment.yaml` and `k8s/frontend/deployment.yaml`, replace:
```yaml
image: YOUR_DOCKERHUB_USERNAME/todo-backend:latest
```
with your actual Docker Hub username, e.g.:
```yaml
image: johndoe/todo-backend:latest
```

Do the same for the frontend deployment.

---

## Step 8 — Trigger the CI Pipeline

Push any change to trigger the GitHub Actions workflow:
```bash
git add k8s/
git commit -m "update: set dockerhub username in manifests"
git push origin main
```

The CI pipeline will:
1. Build Docker images for both microservices
2. Push them to Docker Hub with the git SHA as the tag
3. Update the image tags in your K8s YAML files
4. Commit and push the updated manifests back

Check progress at: `https://github.com/YOUR_USERNAME/todo-app/actions`

---

## Step 9 — Configure ArgoCD

1. Update `argocd/application.yaml` — replace the repoURL:
   ```yaml
   repoURL: https://github.com/YOUR_GITHUB_USERNAME/todo-app
   ```

2. SSH into your EC2 instance:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@YOUR_EC2_IP
   ```

3. Apply the ArgoCD application manifest:
   ```bash
   microk8s kubectl apply -f - <<'EOF'
   # paste contents of argocd/application.yaml here
   EOF
   ```
   Or copy the file to the server and apply it:
   ```bash
   # From your local machine:
   scp -i ~/.ssh/id_rsa argocd/application.yaml ubuntu@YOUR_EC2_IP:~/
   # Then on the server:
   microk8s kubectl apply -f application.yaml
   ```

4. Access the ArgoCD UI at: `http://YOUR_EC2_IP:30080`
   - Username: `admin`
   - Password: (printed by Ansible in Step 4)

5. ArgoCD will automatically sync and deploy both microservices.

---

## Step 10 — Verify Deployment

SSH into the EC2 instance and run:
```bash
microk8s kubectl get pods
microk8s kubectl get services
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS
todo-backend-xxxx-xxxx            1/1     Running   0
todo-frontend-xxxx-xxxx           1/1     Running   0

NAME                      TYPE       PORT(S)
todo-backend-service      NodePort   8000:31000/TCP
todo-frontend-service     NodePort   80:31001/TCP
```

Access the app:
- **Frontend**: `http://YOUR_EC2_IP:31001`
- **Backend API**: `http://YOUR_EC2_IP:31000/docs` (Swagger UI)
- **ArgoCD**: `http://YOUR_EC2_IP:30080`

---

## CI/CD Flow Summary

```
Code push to main
      │
      ▼
GitHub Actions CI
  ├── Build backend Docker image
  ├── Build frontend Docker image
  ├── Push both to Docker Hub (tagged with git SHA)
  └── Update image tags in k8s/*.yaml → commit back to repo
                          │
                          ▼
                    ArgoCD detects
                    manifest change
                          │
                          ▼
                  Syncs microk8s cluster
                  with updated images
                          │
                          ▼
                  New pods rolling out ✅
```

---

## Cleanup

To destroy all AWS resources when done:
```bash
cd terraform/
terraform destroy
# Type 'yes' when prompted
```

---

## Troubleshooting

**Pods not starting:**
```bash
microk8s kubectl describe pod POD_NAME
microk8s kubectl logs POD_NAME
```

**ArgoCD not syncing:**
- Check the repo URL in `argocd/application.yaml` is correct
- Make sure the repo is public, or add a private repo credential in ArgoCD UI

**Cannot SSH into EC2:**
- Verify port 22 is open in the Security Group (it is by default in this setup)
- Confirm you're using the right key: `ssh -i ~/.ssh/id_rsa ubuntu@IP`

**CI pipeline failing:**
- Verify all 4 GitHub Secrets are set correctly
- Check Docker Hub repo names match what's in the workflow
