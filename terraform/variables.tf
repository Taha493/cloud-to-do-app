variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID (update per region)"
  type        = string
  # Ubuntu 22.04 LTS in us-east-1 (update if using a different region)
  default = "ami-0c7217cdde317cfec"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"  # 2 vCPU, 4GB RAM — enough for microk8s
}

variable "public_key_path" {
  description = "Path to your SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
