
# node-registry-proxy

Container registry proxy wrote in nodejs, supporting public docker hub image and AWS ECR.

The application also does caching of both layer files and manifest to avoid throttle.


## Usage

```
npm run start:aws // AWS ECR backend
npm run start:docker // Docker hub backend
```

The ECR backend requires [AWS CLI](https://aws.amazon.com/cli/) to be installed and configured in the environment.

Docker hub backend requires no additional configuration.

The application as it is does not have ssl capability, an additional docker engine configuration is required to whitelist the proxy ip in order to directly pull from docker cli.

```
"insecure-registries": [
    "host:port"
]
```
