Enterprise Multi-AZ 3-Tier Web Application Infrastructure on AWS
An enterprise-grade, highly available, and resilient 3-tier web architecture deployed on Amazon Web Services (AWS), strictly aligned with the AWS Well-Architected Framework pillars: Operational Excellence, Security, Reliability, and Performance Efficiency.

Architecture Overview
The infrastructure isolates responsibilities into three distinct architectural tiers across two Availability Zones (us-east-1a & us-east-1b):

Public Subnets: Internet Gateway, Internet-Facing Application Load Balancer (ALB), and NAT Gateways.
Private App Subnets: Auto Scaling Group running Node.js Express instances (t3.micro) mounted to Amazon EFS (NFSv4).
Isolated DB Subnets: Dedicated Amazon RDS MySQL database tier with no direct internet route.
Serverless Pipeline: S3 Private Vault triggering AWS Lambda (Node.js) to publish upload telemetry via Amazon SNS.

Core Engineering Decisions
Zero Hardcoded Secrets: Database credentials are retrieved dynamically at runtime via AWS Secrets Manager using an IAM Instance Profile.

Headless Management (Zero SSH): Ingress port 22 is disabled across all compute instances. Remote access is governed strictly by AWS Systems Manager (SSM) Session Manager.

High Availability & Elasticity: The application tier is fronted by an Application Load Balancer and managed by an Auto Scaling Group across multiple AZs with automated self-healing.

Shared Storage Persistence: Amazon EFS is mounted across instances to provide consistent POSIX-compliant shared storage with in-transit TLS encryption.

Event-Driven Serverless Integration: File uploads to Amazon S3 trigger an asynchronous AWS Lambda function that parses object metadata and publishes notifications to Amazon SNS.

Proactive Observability: CloudWatch Alarms continuously monitor target group health metrics (UnHealthyHostCount), triggering automated notifications upon failure.

Infrastructure Specifications
Networking: Amazon VPC (CIDR 10.0.0.0/16) with 6 subnets across 2 Availability Zones (Public, Private App, Isolated DB).

Compute Tier: Amazon Linux 2023, t3.micro EC2 fleet managed by Auto Scaling Group (Min: 2, Desired: 2, Max: 4).

Load Balancer: Internet-facing Application Load Balancer with HTTP health checks on port 3000 (/health).

Database Tier: Amazon RDS MySQL instance deployed across isolated database subnets.

Shared Storage: Amazon EFS with multi-AZ mount targets and TLS encryption (Port 2049).

Serverless Tier: Amazon S3 bucket, AWS Lambda (Node.js 20), and Amazon SNS topic for event processing.

Security & IAM: Principle of least privilege enforced via EnterpriseAppEC2Role and EnterpriseLambdaProcessingRole.

Monitoring: Amazon CloudWatch metrics, alarms, and CloudWatch Log groups.

Verification & Resilience Testing
End-to-End API Validation: Verified database connectivity and atomic writes to Amazon EFS via the /api/status endpoint.

Self-Healing Chaos Simulation: Manually terminated an EC2 instance in one AZ; traffic was sustained without interruption by the ALB while the Auto Scaling Group provisioned a healthy replacement instance automatically.

Event Pipeline Verification: Verified S3 event triggers invoking the Lambda worker and delivering automated email notifications via Amazon SNS.
