1. Set up the DICOM server:
- Install Docker and Orthanc
- Upload some data into Orthanc
- Leave the server running

2. Set up the Meteor OHIF Viewer (or LesionTracker) application:
- Install Meteor
- Clone the Viewers repository
- Open a new terminal tab in one of the Application directories (OHIFViewer or LesionTracker)
- Run Meteor using one of the available configuration files.

  ````
  ./bin/localhost.sh
  ````

3. Set up the Cross-origin resource sharing (CORS) proxy.
- Open a new terminal tab at the root of the Viewers repository.
- Run the Cross-origin resource sharing (CORS) proxy server in /etc

  ````
  ./setupLocalOrthanc.sh
  ````
