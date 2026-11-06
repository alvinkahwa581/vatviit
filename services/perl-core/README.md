# Mojolicious core-service foundation

An isolated Perl/Mojolicious service starter. It exposes health and capability metadata only; it is not connected to the existing Node.js API, a database, user accounts, or a broker.

Install Mojolicious from `cpanfile`, then run:

```sh
perl app.pl daemon -l http://127.0.0.1:3000
PERL5LIB=lib prove -lr t
```

Before deployment, define ownership, authentication, rate limits, database and observability needs, service-to-service contracts, and a rollback route. The existing Node.js API remains authoritative.
