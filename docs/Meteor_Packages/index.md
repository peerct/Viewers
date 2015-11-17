### Cornerstone Family of Libraries ([*cornerstone*](/Meteor_Packages/Cornerstone))
This package contains a number of front-end libraries that help us build web-based medical imaging applications.

### DICOM Web Helper Functions (*dicomweb*)
This is the smallest package in the repository. It contains a number of helper functions for retrieving common value types (e.g. JSON, patient name, image frame) from a DICOM image. This package is for server-side usage.

### Tabbed Study Work List (*worklist*)
This package holds Meteor components and functions for the tabbed Work List structure found in the bundled applications. The Work List package is responsible for searching and displaying results in the worklist and creating / deleting tabs. Upon tab creation / focus, the Viewer template is rendered into the tab container with the set of specified studies. When the tab is changed, the entire Viewer is removed from the DOM tree.

### Basic Viewer Components (*viewerbase*)
This is the largest package in the repository. It holds a large number of re-usable Meteor components that are used to build both the OHIF Viewer and Lesion Tracker.

### Lesion Tracker (*lesiontracker*)
This package stores all of the oncology-specific tools and functions developed for the Lesion Tracker application. Here we store, for example, the Target measurement and Non-target pointer tools that are used to monitor tumour burden over time.

This package also stores Meteor components for the interactive lesion table used in the Lesion Tracker, and dialog boxes for the callbacks attached to the Target and Non-target tools.
