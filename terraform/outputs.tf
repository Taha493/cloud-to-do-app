output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.todo_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.todo_server.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.todo_server.public_ip}"
}
