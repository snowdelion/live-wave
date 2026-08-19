# LiveWave - Observability

**Observability** directory contains the pre-configured observability for **LiveWave**, including metrics collection, log aggregation, and visualization.

## Table of Contents

- [Stack](#stack)
- [Structure](#structure)
- [Security](#security)
- [Dashboards](#dashboards)
- [Links](#links)

## Stack

- **Prometheus**: scrapes and stores time-series metrics from the backend
- **Loki**: aggregates and indexes structured JSON logs from the backend
- **Grafana**: unified visualization layer

## Structure

### `grafana/` structure:

- `dashboards/` - pre-built JSON dashboards (API and Logs)
- `provisioning/` - auto-configuration for datasources and dashboards

### `loki/` structure:

- `loki-config.yml` - Loki retention, storage, and schema configuration

### `prometheus/` structure:

- `prometheus.dev.yml` - Prometheus scrape configs and rules
- `token` - (gitignored) actual bearer token used in dev
- `token.example` - template for the secure metrics scraping token

## Security

To prevent unauthorized access to backend metrics, Prometheus authenticates with the backend using a admin _Bearer token_ from `token` file.

### First-time setup:

1. Copy the example file: `cp observability/prometheus/token.example observability/prometheus/token`

2. Generate a secure random string and paste it into the token file:

- Windows:

```bash
`([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()).Replace("-","").Substring(0,64)`
```

- Linux/macOS:

```bash
`openssl rand -hex 32`
```

3. Ensure the exact same token is set in your backend `.env.local` as `METRICS_BEARER_TOKEN`

4. Restart the Docker containers to apply the changes
   > `token` is already in `.gitignore`

## Dashboards

Grafana provisioning and dashboards are automatically loaded when Grafana starts.

### 1. API Overview (Prometheus)

- Total number of requests
- Requests per second
- Queries by methods
- Errors (4xx/5xx) per period
- Most common paths
- Success and failure monitor checks

### 2. Logs Overview (Loki)

- Total number of logs
- Distribution of logs by levels
- Errors/warns for the period
- Number of logs per minute
- Search by text

## Links

- Grafana: http://localhost:3001
  - Default credentials: admin / admin (or as defined in .env.local)
- Prometheus UI: http://localhost:9090
- Loki API: http://localhost:3100

---

For infrastructure startup commands, refer to the [Root README](../README.md)
