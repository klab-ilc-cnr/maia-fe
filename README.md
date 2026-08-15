# Maia
Maia is an open and collaborative web tool based on semantic web and linked open data technologies for text annotation, e-lexicography, and lexical linking.

It's developed by the [KLAB group](https://www.ilc.cnr.it/klab/) of the ILC CNR.

## Maia interface 
This repository hosts the Maia interface, developed using the Angular v. 14.2 framework.

## Getting Started
To be able to instantiate your own installation of the Maia interface, you must have a development environment compatible with the Angular v. 14.2 framework (refer to the official documentation for dependencies) and have set up a working version of the [maia-be](https://github.com/klab-ilc-cnr/maia-be) back-end.

Once you clone the project (or fork it) you can prepare a package for deployment using branches:

- master: stable version
- develop: version with the latest developments, but for this reason subject to frequent changes

Once the branch is selected, the basic steps to follow are:

1. from terminal `npm install` to download all dependencies
2. edit the environment.production.ts file indicating the applicationSubTitle which will be the name of your application
3. from terminal compile the code with the command `ng build --base-href=\“\” --output-path=maia -c production`

The deployment package will then be available in the maia folder.

### Local development proxy

For local development with `ng serve`, Angular CLI expects a proxy configuration file: copy the provided stub once and, if needed, fill it with the target of your `maia-be` backend:

```
cp src/proxy_stub.conf.json src/proxy.conf.json
```

`src/proxy.conf.json` is intentionally gitignored (machine-specific), so it will not appear in commits; the versioned default is the empty stub `src/proxy_stub.conf.json`.

## Reporting issues and bugs
To report any bugs or propose new features, you can open a new issue in the [dedicated section](https://github.com/klab-ilc-cnr/Maia/issues) of the main Maia repository.

In case of a bug please indicate the version of the platform used and describe the steps to replicate the error. Where possible and useful, images should also be attached.

## Versions and compatibility
| maia-fe | maia-be | TextO | LexO |
| ------------- | ------------- | ------------- | ------------- |
| v. 0.20.0 | v. 0.0.14 | v. 0.1.8 | v. 1.2.1 |
| v. 0.19.1 | v. 0.0.14 | v. 0.1.7 | v. 1.2.1 |
| v. 0.17.4 | v. 0.0.12 | v. 0.1.6 | v. 1.2 |
| v. 0.17.00 | v. 0.0.11 | v. 0.1.4 | v. 1.2 |
| v. 0.16.14 | v. 0.0.10 | v. 0.1.3 | v. 1.1.1 |
| v. 0.15.4 | v. 0.0.10 | v. 0.1.3 | v. 1.1.1 |
| v. 0.15.0 | v. 0.0.10 | v. 0.1.2 | v. 1.1 |
| v. 0.13.10 | v. 0.0.8 | v. 0.1.1 | |
| v. 0.13.5 | v. 0.0.7 | v. 0.1.1 | |
| v. 0.12.4 | v. 0.0.7 | v. 0.1.0* | |
| v. 0.11.0 | v. 0.0.6 | v. 0.0.8 | |
| v. 0.9.10 | v. 0.0.6 | | |


*02/08/2024 version


