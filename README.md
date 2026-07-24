# 🎬 CineX — Enterprise Multiplex & Online Ticket Booking Platform

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot 3.5](https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL 15](https://img.shields.io/badge/PostgreSQL-15-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D.svg?style=flat-square&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-29.x-2496ED.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639.svg?style=flat-square&logo=nginx)](https://nginx.org/)

> **CineX** is a modern, high-throughput movie ticket booking and multiplex management platform designed to deliver seamless, real-time ticket booking, dynamic seat selection, and comprehensive vendor administration. Built with microservice-ready domain boundaries, it is currently deployed in a production VPS environment with a clear roadmap towards automated Jenkins CI/CD pipelines and Kubernetes container orchestration.

---

## 🌟 Key Features

### 🍿 Consumer Experience
- **Interactive Seat Map**: Real-time seat reservation with instant layout rendering and lock management.
- **Dynamic Catalog**: City-based movie schedules, filterable by date, language, 2D/3D, and genre.
- **Instant Booking Engine**: Seamless checkout process featuring mock Razorpay payment gateway integration, loading state feedback, and automated ticket generation.
- **Authentication & Security**: Secure user registration, JWT-based state management, password hashing, and session expiration control.

### 🏢 Vendor & Admin Dashboard
- **Multiplex Administration**: Multi-theatre registration enforcing strict setup rules (Theatre $\rightarrow$ Screen Layout $\rightarrow$ Show Scheduling).
- **Show Scheduling Lock System**: Prevents scheduling without validated physical screen configuration.
- **Analytics & Catalog Management**: Real-time sales insights, movie CRUD operations, and screen capacity planning.

---

## 🏛️ System Architecture & Production Setup

CineX is architected using a **Domain-Driven Containerized Monolith** pattern, ready for seamless decomposition into independent microservices (Auth, Catalog, Booking, Notification).

```
                             ┌────────────────────────┐
                             │    Client Browser      │
                             └───────────┬────────────┘
                                         │ HTTPS (443 / 80)
                                         ▼
                             ┌────────────────────────┐
                             │   Nginx Reverse Proxy  │
                             └─────┬────────────┬─────┘
                                   │            │
             /api/* (Backend)      │            │  /* (Frontend)
                                   ▼            ▼
                    ┌───────────────────┐  ┌───────────────────┐
                    │  Spring Boot      │  │  React 19 + Vite  │
                    │  Backend Container│  │  Frontend Container│
                    │  (Port 9090)      │  │  (Port 5173)      │
                    └─────────┬─────────┘  └───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌─────────────────┐ ┌─────────────────┐
           │ PostgreSQL 15   │ │ Redis 7 Cache   │
           │ (Port 5434)     │ │ (Port 6381)     │
           └─────────────────┘ └─────────────────┘
```

### Infrastructure Highlights
- **Nginx Reverse Proxy**: Single entry point handling SSL termination (Let's Encrypt Certbot), HTTP to HTTPS redirection, path-based routing, and gzip compression.
- **Containerized Environment**: Isolated Docker containers managed via environment-driven Docker Compose files for consistent development and production parity.
- **Database & Cache**: Relational data stored in PostgreSQL with indexed schema constraints; Redis utilized for fast show availability caching and session storage.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Shadcn/UI, Axios, React Router v7 |
| **Backend** | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Hibernate ORM, Lombok |
| **Data & Storage** | PostgreSQL 15, Redis 7 |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, Let's Encrypt SSL Certbot, Git, Linux (Ubuntu 26.04) |
| **Observability** | Spring Boot Actuator, Prometheus Metrics Endpoint, Health Probes |

---

## 🗺️ Architectural Roadmap & CI/CD Evolution

```
[ Phase 1: Current ] ──► [ Phase 2: Jenkins CI/CD ] ──► [ Phase 3: Kubernetes K8s ] ──► [ Phase 4: Microservices ]
Containerized Monolith    Automated Webhook Builds       Zero-Downtime Orchestration    Auth/Catalog/Booking Split
```

### 🔄 Planned Jenkins CI/CD Pipeline
1. **GitHub Webhook Integration**: Automated build triggers on every commit/merge to the `main` branch.
2. **Quality Gate & Testing**: Automated Maven unit/integration testing and static code analysis (SonarQube).
3. **Container Registry Pipeline**: Automatic Docker image compilation, version tagging, and registry push.

### ☸️ Planned Kubernetes (K8s) Deployment
1. **Zero-Downtime Rolling Updates**: Declarative K8s `Deployment` updates ensuring zero user interruption.
2. **Auto-Scaling**: Horizontal Pod Autoscaler (HPA) triggered by CPU/Memory utilization spikes.
3. **Ingress Controller**: Path-based ingress routing with automatic TLS management via `cert-manager`.

---

## 🛡️ Resilience & Fail-Safe Engineering

To maintain 99.9% uptime and system reliability in production, the following fail-safe measures are baked into the architecture:

- **Liveness & Readiness Probes**: `/actuator/health/readiness` and `/actuator/health/liveness` ensure traffic is routed strictly to fully initialized, healthy instances.
- **Automatic Container Restarts**: `restart: unless-stopped` recovery policies for PostgreSQL, Redis, and Spring Boot containers.
- **Circuit Breakers**: Resilience4j patterns protecting critical paths against third-party dependency failures (e.g., SMTP mailers, payment gateways).
- **HikariCP Connection Pool Resilience**: Tuned leak detection, connection validation timeouts, and retry policies.
- **Automated Rollback Strategy**: Instant deployment rollback via `kubectl rollout undo` if newly deployed pods fail health thresholds.

---

## ⚡ Quick Start for Developers

### Prerequisites
- Java 21 JDK installed
- Node.js 20+ & npm
- Docker Desktop / Docker Engine

### 1. Clone & Setup Environment
```bash
git clone https://github.com/arghya-align-pix-design/CineX.git
cd CineX
```

### 2. Launch Local Infrastructure
```bash
docker-compose up -d postgres redis
```

### 3. Start Backend Server
```bash
cd cinex
./mvnw spring-boot:run
```
> Backend runs at `http://localhost:9090` (Health Check: `http://localhost:9090/actuator/health`)

### 4. Start Frontend Client
```bash
cd cineX_Frontend
npm install
npm run dev
```
> Frontend accessible at `http://localhost:5173`

---

## 👨‍💻 Author

**Arghya Dip Paul** — Full Stack & Systems Engineer
- GitHub: [arghya-align-pix-design](https://github.com/arghya-align-pix-design)
- Focus: Distributed Systems, Spring Boot, React, Cloud Infrastructure & DevOps

