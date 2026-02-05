#!/bin/bash
set -a
source .env
set +a
go run cmd/app/main.go
