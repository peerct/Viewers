Template.viewer.onCreated(function() {
    // Attach the Window resize listener
    $(window).on('resize', handleResize);

    var self = this;

    var firstMeasurementsActivated = false;

    log.info("viewer onCreated");

    OHIF = OHIF || {
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
        toggleLesionTrackerTools: toggleLesionTrackerTools,
        clearTools: clearTools,
        lesion: function() {
            toolManager.setActiveTool("lesion");
        },
        nonTarget: function() {
            toolManager.setActiveTool("nonTarget");
        }
    };

    // The hotkey can also be an array (e.g. ["NUMPAD0", "0"])
    OHIF.viewer.defaultHotkeys.toggleLesionTrackerTools = "O";
    OHIF.viewer.defaultHotkeys.lesion = "T"; // Target
    OHIF.viewer.defaultHotkeys.nonTarget = "N"; // Non-target

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

    self.autorun(function() {
        var patientId = Session.get('patientId');
        self.subscribe('timepoints', patientId);
        self.subscribe('measurements', patientId);

        if (self.subscriptionsReady()) {
            ViewerStudies.find().observe({
                added: function(study) {
                    // TODO = Replace this whole section when we have a
                    // timepoint-to-study association modal

                    // First, check if we have a timepoint related to this
                    // study date already
                    var timepoint = Timepoints.findOne({
                        timepointName: study.studyDate
                    });

                    // If we do, stop here
                    if (timepoint) {
                        log.warn("A timepoint with that study date already exists!");
                        return;
                    }

                    // Next, check the first timepoint in the collection
                    var testTimepoint = Timepoints.findOne({});

                    // If it relates to another subject, we need to stop here as well
                    // because the tab may be changing.
                    if (testTimepoint && testTimepoint.patientId !== study.patientId) {
                        log.warn("Timepoints collection related to the wrong subject");
                        return;
                    }

                    // Otherwise, we need to add a timepoint related to this study date
                    log.info('Inserting a new timepoint');
                    Timepoints.insert({
                        patientId: study.patientId,
                        timepointName: study.studyDate,
                        timepointID: uuid.v4()
                    });
                }
            });

            // This is used to re-add tools from the database into the
            // Cornerstone ToolData structure
            Measurements.find().observe({
                added: function(data) {
                    if (data.toolDataInsertedManually === true) {
                        return;
                    }

                    // Activate first measurements in image box as default if exists
                    if (!firstMeasurementsActivated) {
                        var templateData = {
                            contentId: Session.get("activeContentId")
                        };

                        // Activate measurement
                        activateLesion(data._id, templateData);
                        firstMeasurementsActivated = true;
                    }

                    log.info('Measurement added');

                    addMeasurementAsToolData(data);

                    updateRelatedElements(data.imageId);
                },
                removed: function(data) {
                    // Check that this Measurement actually contains timepoint data
                    if (!data.timepoints) {
                        return;
                    }

                    // Get the Measurement ID and relevant tool so we can remove
                    // tool data for this Measurement
                    var measurementId = data._id;
                    var toolType = data.isTarget ? 'lesion' : 'nonTarget';

                    // Find the list of imageIds that needs to be updated
                    var imageIds = [];
                    Object.keys(data.timepoints).forEach(function(timepointID) {
                        // Clear the toolData for this timepoint
                        var imageId = data.timepoints[timepointID].imageId;
                        removeToolDataWithMeasurementId(imageId, toolType, measurementId);

                        // Add this imageId to the list to be updated
                        // (if they are currently displayed)
                        imageIds.push(imageId);
                    });

                    // Find the enabled Cornerstone elements currently displaying these image IDs
                    var enabledElements = [];
                    imageIds.forEach(function(imageId) {
                        var elems = cornerstone.getEnabledElementsByImageId(imageId);
                        enabledElements = enabledElements.concat(elems);
                    });

                    // Update each related viewport
                    enabledElements.forEach(function(enabledElement) {
                        // Skip thumbnails or other elements that are not primary viewports
                        var element = enabledElement.element;
                        if (!element.classList.contains('imageViewerViewport')) {
                            return;
                        }
                        cornerstone.updateImage(element);
                    });
                }
            });
        }
    });

    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.updateImageSynchronizer);
});

function updateRelatedElements(imageId) {
    // Get all on-screen elements with this imageId
    var enabledElements = cornerstone.getEnabledElementsByImageId(imageId);

    // TODO=Check original event to prevent duplicate updateImage calls

    // Loop through these elements
    enabledElements.forEach(function(enabledElement) {
        // Update the display so the tool is removed
        var element = enabledElement.element;
        cornerstone.updateImage(element);
    });
}

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

        // This is probably not the best approach to prevent duplicates
        if (toolState[imageId][toolType] && toolState[imageId][toolType].data) {
            var measurementHasNoIdYet = false;
            toolState[imageId][toolType].data.forEach(function(measurement) {
                if (measurement.id === 'notready') {
                    measurementHasNoIdYet = true;
                    return false;
                }
            });

            // Stop here if it appears that we are creating this measurement right now,
            // and would not like this function to add another copy of it to the toolData
            if (measurementHasNoIdYet === true) {
                return;
            }
        }

        if (!toolState[imageId][toolType]) {
            toolState[imageId][toolType] = {
                data: []
            };
        } else {
            var alreadyExists = false;
            if (toolState[imageId][toolType].data.length) {
                toolState[imageId][toolType].data.forEach(function(measurement) {
                    if (measurement.id === data._id) {
                        alreadyExists = true;
                        return false;
                    }
                });
            }

            if (alreadyExists === true) {
                return;
            }
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
        measurementData.id = data._id;

        toolState[imageId][toolType].data.push(measurementData);
    });
}

Template.viewer.onRendered(function() {
    // Enable hotkeys
    enableHotkeys();
});

Template.viewer.onDestroyed(function() {
    log.info("onDestroyed");

    // Remove the Window resize listener
    $(window).off('resize', handleResize);

    OHIF.viewer.updateImageSynchronizer.destroy();
});

Template.viewer.events({
    'CornerstoneToolsMeasurementModified .imageViewerViewport': function(e, template, eventData) {
        handleMeasurementModified(e, eventData);
    },
    'CornerstoneToolsMeasurementRemoved .imageViewerViewport': function(e, template, eventData) {
        handleMeasurementRemoved(e, eventData);
    }
});

function handleMeasurementModified(e, eventData) {
    log.info('CornerstoneToolsMeasurementModified');
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
            LesionManager.updateLesionData(measurementData);
            break;
    }
}

function handleMeasurementRemoved(e, eventData) {
    log.info('CornerstoneToolsMeasurementRemoved');
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
            var measurement = Measurements.findOne(measurementData.id, {
                reactive: false
            });

            if (!measurement) {
                return;
            }

            clearMeasurementTimepointData(measurement._id, measurementData.timepointID);
            break;
    }
}