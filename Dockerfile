# syntax=docker/dockerfile:1

FROM golang:1.26.2-alpine AS builder
WORKDIR /src

COPY server/go.mod server/go.sum ./server/
WORKDIR /src/server
RUN go mod download

COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/agrolingo-api \
    ./cmd/api

FROM alpine:3.22
RUN apk add --no-cache ca-certificates \
    && addgroup -S agrolingo \
    && adduser -S -G agrolingo -u 10001 agrolingo

COPY --from=builder /out/agrolingo-api /usr/local/bin/agrolingo-api

USER agrolingo
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/agrolingo-api"]
