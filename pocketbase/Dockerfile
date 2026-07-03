FROM alpine:latest

RUN apk add --no-cache unzip curl ca-certificates

WORKDIR /pb

# Resolve the latest PocketBase linux/amd64 release and install it.
RUN PB_URL="$(curl -fsSL https://api.github.com/repos/pocketbase/pocketbase/releases/latest \
      | grep -o 'https://[^"]*linux_amd64\.zip')" \
    && curl -fsSLo pocketbase.zip "$PB_URL" \
    && unzip pocketbase.zip \
    && rm pocketbase.zip \
    && chmod +x /pb/pocketbase

COPY pb_hooks /pb/pb_hooks

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
