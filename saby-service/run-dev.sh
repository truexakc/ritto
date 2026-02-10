#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Run the service
go run cmd/app/main.go
