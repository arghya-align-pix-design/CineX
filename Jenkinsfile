pipeline {
    agent any

    environment {
        PROJECT_NAME = 'cinex'
        PROD_COMPOSE = 'docker-compose.prod.yml'
        CINEX_APP_PORTAL_URL = 'http://162.222.204.31/login'
    }

    options {
        timeout(time: 45, unit: 'MINUTES')
        ansiColor('xterm')
        disableConcurrentBuilds()
    }

    stages {
        stage('SCM Checkout') {
            steps {
                echo '=== Stage 1: Pulling latest changes from main branch ==='
                checkout scm
            }
        }

        stage('Backend Quality & Test Gate') {
            steps {
                echo '=== Stage 2: Running Spring Boot Unit/Integration Tests ==='
                dir('cinex') {
                    sh 'chmod +x mvnw'
                    sh './mvnw clean test -Dspring.profiles.active=test'
                }
            }
        }

        stage('Frontend Assets Compilation') {
            steps {
                echo '=== Stage 3: Building React 19 Production Bundle ==='
                dir('cineX_Frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Production Container Build') {
            steps {
                echo '=== Stage 4: Compiling Multi-Stage Docker Images ==='
                sh "docker compose -f ${PROD_COMPOSE} build"
            }
        }

        stage('Zero-Downtime VPS Deployment') {
            steps {
                echo '=== Stage 5: Deploying Containers to VPS Infrastructure ==='
                sh "docker compose -f ${PROD_COMPOSE} up -d --remove-orphans"
            }
        }

        stage('Production Liveness Probe') {
            steps {
                echo '=== Stage 6: Running Actuator Health Check ==='
                sleep time: 15, unit: 'SECONDS'
                sh 'curl -f http://localhost:9090/actuator/health || exit 1'
                echo '=== Production VPS Deployment Verified! ==='
            }
        }
    }

    post {
        success {
            echo '🎉 VPS Deployment Succeeded!'
        }
        failure {
            echo '⚠️ VPS Deployment Failed! Triggering diagnostic logs...'
            sh "docker compose -f ${PROD_COMPOSE} logs --tail=100"
        }
    }
}
