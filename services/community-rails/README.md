# VaTViT community service foundation

An isolated Rails API-only starter with health and development-status endpoints. It contains no community content, account data, authentication, or broker functionality and is not deployed to a subdomain.

## Run locally

Use Ruby 3.3+ and Bundler:

```sh
bundle install
bundle exec rails server -p 3002
bundle exec rails test
```

Before deployment, choose the community hostname, hosting provider, identity integration, data retention rules, and operations owner. Keep this service separate from account and trading APIs.
