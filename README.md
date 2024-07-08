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

## Reporting issues and bugs
To report any bugs or propose new features, you can open a new issue in the [dedicated section](https://github.com/klab-ilc-cnr/Maia/issues) of the main Maia repository.

In case of a bug please indicate the version of the platform used and describe the steps to replicate the error. Where possible and useful, images should also be attached.

## Versions and compatibility
| maia-fe | maia-be | TextO |
| ------------- | ------------- | ------------- |
| v. 0.9.10 | v. 0.0.6 | |
| v. 0.11.0 | v. 0.0.6 | v. 0.0.8 |
