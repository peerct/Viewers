function resizeViewports() {
    log.info("viewer resizeViewports");

    // Handle resizing of image viewer viewports
    // For some reason, this seems to need to be on
    // another delay, or the resizing won't work properly
    viewportResizeTimer = setTimeout(function() {
        var elements = $('.imageViewerViewport');
        elements.each(function(index) {
            var element = this;
            if (!element) {
                return;
            }
            cornerstone.resize(element, true);
        });
    }, 1);
}

var resizeTimer;
Template.viewer.onCreated(function() {
    // Avoid doing DOM manipulation during the resize handler
    // because it is fired very often.
    // Resizing is therefore performed 100 ms after the resize event stops.
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            resizeViewports();
        }, 100);
    });

    var self = this;
    log.info("viewer onCreated");

    OHIF = {
        viewer: {}
    };

    OHIF.viewer.loadIndicatorDelay = 3000;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};

    OHIF.viewer.functionList = {
        invert: function(element) {
            var viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        resetViewport: function(element) {
            cornerstone.reset(element);
        },
        playClip: function(element) {
            var viewportIndex = $('.imageViewerViewport').index(element);
            var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
            if (isPlaying === true) {
                cornerstoneTools.stopClip(element);
            } else {
                cornerstoneTools.playClip(element);
            }
            OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
            Session.set('UpdateCINE', Random.id());
        },
        previousPresentationGroup: function() {
            WindowManager.previousPresentationGroup();
        },
        nextPresentationGroup: function() {
            WindowManager.nextPresentationGroup();
        }
    };


    if (isTouchDevice()) {
        OHIF.viewer.tooltipConfig = {
            trigger: 'manual'
        };
    } else {
        OHIF.viewer.tooltipConfig = {
            trigger: 'hover'
        };
    }

    var contentId = this.data.contentId;

    if (ViewerData[contentId].loadedSeriesData) {
        log.info('Reloading previous loadedSeriesData');

        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};

        ViewerData[contentId].loadedSeriesData = OHIF.viewer.loadedSeriesData;

        // Update the viewer data object
        ViewerData[contentId].viewportColumns = 2;
        ViewerData[contentId].viewportRows = 1;
        ViewerData[contentId].activeViewport = 0;
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || 0);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies = new Meteor.Collection(null);
    this.data.studies.forEach(function(study) {
        study.selected = true;
        ViewerStudies.insert(study);
    });

    var patientId = this.data.studies[0].patientId;
    Session.set('patientId', patientId);

    initialized = false;
    self.autorun(function() {
        var patientId = Session.get('patientId');
        self.subscribe('timepoints', patientId);
        self.subscribe('measurements', patientId);

        if (!self.subscriptionsReady()) {
            return;
        }

        if (initialized === true) {
            return;
        }

        ViewerStudies.find().forEach(function(study) {
            var timepoint = Timepoints.findOne({timepointName: study.studyDate});
            if (timepoint) {
                log.warn("A timepoint with that study date already exists!");
                return;
            }

            var timepointID = uuid.v4();

            var testTimepoint = Timepoints.findOne({});
            if (testTimepoint && testTimepoint.patientId !== study.patientId) {
                log.warn("Timepoints collection related to the wrong subject");
                return;
            }

            log.info('Inserting a new timepoint');
            Timepoints.insert({
                patientId: study.patientId,
                timepointID: timepointID,
                timepointName: study.studyDate
            });
        });

        // This is used to re-add tools from the database into the
        // Cornerstone ToolData structure
        Measurements.find().observe({
            added: function (data) {
                if (data.toolDataInsertedManually === true) {
                    return;
                }

                log.info('Measurement added');
                addMeasurementAsToolData(data);
            }
        });

        initialized = true;
    });

    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.updateImageSynchronizer);
});

function addMeasurementAsToolData(data) {
    // Check what toolType we should be adding this to, based on the isTarget value
    // of the stored Measurement
    var toolType = data.isTarget ? 'lesion' : 'nonTarget';
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    // Loop through the timepoint data for this measurement
    Object.keys(data.timepoints).forEach(function(key) {
        var storedData = data.timepoints[key];
        var imageId = storedData.imageId;

        if (!toolState[imageId]) {
            toolState[imageId] = {};
        }

        if (!toolState[imageId][toolType]) {
            toolState[imageId][toolType] = {
                data: []
            };
        }

        // Create measurementData structure based on the lesion data at this timepoint
        // We will add this into the toolData for this imageId
        var measurementData = storedData;
        measurementData.isTarget = data.isTarget;
        measurementData.lesionNumber = data.lesionNumber;
        measurementData.measurementText = data.measurementText;
        measurementData.lesionName = data.lesionName;
        measurementData.isDeleted = data.isDeleted;
        measurementData.location = data.location;
        measurementData.locationUID = data.locationUID;
        measurementData.patientId = patientId;
        measurementData.visible = data.visible;
        measurementData.active = data.active;
        measurementData.uid = data.uid;

        toolState[imageId][toolType].data.push(measurementData);
    });
}

Template.viewer.onDestroyed(function() {
    log.info("onDestroyed");
    OHIF.viewer.updateImageSynchronizer.destroy();
});