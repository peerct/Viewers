### Requirements
- The primary dependency is [Meteor](https://www.meteor.com/install): a complete platform for building web and mobile apps in pure JavaScript.

- To host locally, you also need a DICOM server

The easiest DICOM server to set up is [Orthanc](http://www.orthanc-server.com/), which can be installed using [Docker](docker.com). Sébastien Jodogne hosts an image of [Orthanc for Docker](https://github.com/jodogne/OrthancDocker) on Github which can be set up in minutes.

The packages in this repository are designed to use Web Access to DICOM Objects (WADO) Service requests and are therefore capable of connecting to many types of DICOM servers. These applications have been successfully tested with [Orthanc](http://www.orthanc-server.com/) and [dcm4che](http://www.dcm4che.org/).

[Here](/Usage/Docker_Usage) we will only specify how to get a simple installation set up with [Orthanc for Docker](https://github.com/jodogne/OrthancDocker).
