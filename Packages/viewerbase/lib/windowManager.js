ViewerWindows = new Meteor.Collection(null);

function findSeriesByDescription(seriesDescription, study) {
    var seriesInstanceUid;
    study.seriesList.forEach(function(series) {
        if (!series.seriesDescription) {
            return;
        }

        var currentSeriesDescription = series.seriesDescription.replace(' ', '');
        if (currentSeriesDescription === seriesDescription) {
            seriesInstanceUid = series.seriesInstanceUid;
            return false;
        }
    });

    return seriesInstanceUid;
}

/**
 * This is an example of a hanging protocol
 * It takes in a set of studies, as well as the
 * number of rows and columns in the layout.
 *
 * It returns an array of objects, one for each viewport, detailing
 * which series should be loaded in the viewport.
 *
 * @param inputData
 * @returns {Array}
 */
function defaultHangingProtocol(inputData) {
    var studies = ViewerStudies.find({}, {reactive: false}).fetch();
    var viewportRows = inputData.viewportRows;
    var viewportColumns = inputData.viewportColumns;

    // This is the most basic hanging protocol.
    var stacks = [];
    studies.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            
            // Ensure that the series has image data
            // (All images have rows)
            var anInstance = series.instances[0];
            if (!anInstance || !anInstance.rows) {
                return;
            }

            var stack = {
                series: series,
                study: study
            };
            stacks.push(stack);
        });
    });

    var viewportData = {
        viewports: []
    };

    var numViewports = viewportRows * viewportColumns;
    for (var i=0; i < numViewports; ++i) {
        if (i >= stacks.length) {
            // We don't have enough stacks to fill the desired number of viewports, so stop here
            break;
        }
        viewportData.viewports[i] = {
            seriesInstanceUid: stacks[i].series.seriesInstanceUid,
            studyInstanceUid: stacks[i].study.studyInstanceUid,
            currentImageIdIndex: 0
        };
    }
    return viewportData;
}

var hangingProtocol;
var presentationGroup = 1;

function getHangingProtocol() {
    var study = ViewerStudies.findOne();
    if (!study) {
        return;
    }

    // Find the unique modalities in this study
    var modalities = [];
    study.seriesList.forEach(function(series) {
        if (modalities.indexOf(series.modality) < 0) {
            modalities.push(series.modality);
        }
    });

    if (modalities.indexOf('MG') > -1) {
        hangingProtocol = getMammoHangingProtocolObject();
        return hangingProtocol;
    }
}

function setHangingProtocol(protocol) {
    hangingProtocol = protocol;
}

function previousPresentationGroup() {
    presentationGroup--;
    presentationGroup = Math.max(1, presentationGroup);

    log.info('previousPresentationGroup: ' + presentationGroup);
    Session.set('WindowManagerPresentationGroup', presentationGroup);
    Session.set('UseHangingProtocol', Random.id());

    updateWindows();
}

function nextPresentationGroup() {
    var numPresentationGroups = getNumPresentationGroups();

    presentationGroup++;
    presentationGroup = Math.min(numPresentationGroups, presentationGroup);

    log.info('nextPresentationGroup: ' + presentationGroup);
    Session.set('WindowManagerPresentationGroup', presentationGroup);
    Session.set('UseHangingProtocol', Random.id());

    updateWindows();
}

function getNumPresentationGroups() {
    if (!hangingProtocol || !hangingProtocol.stages) {
        return;
    }
    return hangingProtocol.stages.length;
}

function getCurrentPresentationGroup() {
    return presentationGroup;
}

function setCurrentPresentationGroup(groupNumber) {
    presentationGroup = groupNumber;
}

function updateWindows(data) {
    ViewerWindows.remove({});

    // First, retrieve any saved viewport data from this tab
    var contentId = Session.get('activeContentId');
    var savedData = ViewerData[contentId];

    // Next, check if we are using a hanging protocol
    var usingHP = savedData.usingHP || Session.get('UseHangingProtocol');

    // Check if there is an applicable protocol
    var applicableProtocol = getHangingProtocol();

    // If we are using a hanging protocol, and no inputs have been given to this
    // function, we should apply the HP now
    if (applicableProtocol && !data && usingHP !== false) {
        var hpAppliedSuccessfully = WindowManager.useHangingProtocol(applicableProtocol);
        if (hpAppliedSuccessfully !== false) {
            return;
        }
    }

    var viewportRows,
        viewportColumns;

    if (data) {
        // If data has been specified, we should use this data and tell the viewer that the
        // use of any protocols has been interrupted.
        viewportRows = data.viewportRows || 1;
        viewportColumns = data.viewportColumns || 1;
    } else {
        // If no data has been specified, and we are not currently using any protocols,
        // we should check if we need to apply a HP. If we don't, we should just fill
        // viewports in order of series for the current study

        // Check if we have any saved viewport layout data
        // If we do, recover it now
        viewportRows = savedData.viewportRows || 1;
        viewportColumns = savedData.viewportColumns || 1;
    }

    var viewportData;
    if (data && data.loadedSeriesData && !$.isEmptyObject(data.loadedSeriesData)) {
        viewportData = {
            viewports: data.loadedSeriesData
        };
    } else if (!$.isEmptyObject(savedData.loadedSeriesData)) {
        viewportData = {
            viewports: savedData.loadedSeriesData
        };
    }

    var stacksByViewport = defaultHangingProtocol({
        viewportRows: viewportRows,
        viewportColumns: viewportColumns
    });


    // Update viewerData
    ViewerData[contentId].usingHP = false;
    ViewerData[contentId].viewportRows = viewportRows;
    ViewerData[contentId].viewportColumns = viewportColumns;
    Session.set("ViewerData", ViewerData);

    var numViewports = viewportRows * viewportColumns;

    var data = [];
    for (var i=0; i < numViewports; ++i) {
        if (viewportData && !$.isEmptyObject(viewportData.viewports[i])) {
            dataToUse = viewportData.viewports[i];
        } else if (stacksByViewport && !$.isEmptyObject(stacksByViewport.viewports[i])) {
            dataToUse = stacksByViewport.viewports[i];
        }

        var window = {
            viewportIndex: i,
            // These two are necessary because otherwise the width and height helpers
            // don't get the right data context. Seems to be related to the "each" loop.
            viewportColumns: viewportColumns,
            viewportRows: viewportRows,
            seriesInstanceUid: dataToUse.seriesInstanceUid,
            studyInstanceUid: dataToUse.studyInstanceUid,
            currentImageIdIndex: dataToUse.currentImageIdIndex,
            viewport: dataToUse.viewport
        };

        data.push(window);
    }

    // Here we will find out if we need to load any other studies into the viewer
    var studiesReady = loadMissingStudies(data);
    studiesReady.then(function() {
        data.forEach(function(window) {
            ViewerWindows.insert(window);
        });
    }, function(error) {
        log.warn(error);
    });
}

function loadMissingStudies(data) {
    // We will make a list of unique studyInstanceUids
    var uniqueStudyInstanceUids = [];

    var deferredList = [];
    var loadingDeferred = $.Deferred();

    data.forEach(function(inputData) {
        var deferred = $.Deferred();

        var studyInstanceUid = inputData.studyInstanceUid;
        if (!studyInstanceUid) {
            return;
        }

        // If this studyInstanceUid is already in the list, stop here
        if (uniqueStudyInstanceUids.indexOf(studyInstanceUid) > -1) {
            return;
        }

        // Otherwise, add it to the list
        uniqueStudyInstanceUids.push(studyInstanceUid);

        // Check that we already have this study in ViewerStudies
        var loadedStudy = ViewerStudies.findOne({
            studyInstanceUid: studyInstanceUid
        }, {
            reactive: false
        });

        if (loadedStudy) {
            return;
        }

        deferredList.push(deferred);

        // If any of the associated studies is not already loaded, load it now
        Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
            if (error) {
                deferred.reject();
            }
            // Sort the study's series and instances by series and instance number
            sortStudy(study);

            // Insert it into the ViewerStudies Collection
            ViewerStudies.insert(study);
            deferred.resolve();
        });
    });

    // When all necessary studies are loaded, resolve the primary deferred
    $.when.apply($, deferredList).done(function() {
        loadingDeferred.resolve();
    });

    return loadingDeferred.promise();
}

function loadSeriesInViewport(seriesData, element) {
    rerenderViewportWithNewSeries(element, seriesData);
    Session.set('UseHangingProtocol', false);
}

function initialize() {
    updateWindows();
}

function setLayout (data) {
    WindowManager.updateWindows(data);
}

function useHangingProtocol(applicableProtocol) {
    log.info('Using hanging protocol');

    Session.set('WindowManagerPresentationGroup', presentationGroup);
    Session.set('UseHangingProtocol', Random.id());

    var contentId = Session.get('activeContentId');
    ViewerData[contentId].usingHP = true;
    Session.set("ViewerData", ViewerData);

    var currentStudy = ViewerStudies.findOne({}, {reactive: false});

    var otherStudies = WorklistStudies.find({
        patientId: currentStudy.patientId,
        studyInstanceUid: {
            $ne: currentStudy.studyInstanceUid
        }
    }, {
        reactive: false,
        $sort: {
            studyDate: 1
        }
    }).fetch();

    if (!otherStudies.length) {
        return false;
    }

    var missingStudies = [];
    var studyInstanceUid;
    applicableProtocol.studiesNeeded.forEach(function(study) {
        if (study === 'current') {
            studyInstanceUid = currentStudy.studyInstanceUid;
        } else if (study === 'prior') {
            studyInstanceUid = otherStudies[0].studyInstanceUid;
        }

        var studyExists = ViewerStudies.findOne({
            studyInstanceUid: studyInstanceUid
        }, {
            reactive: false
        });

        if (!studyExists) {
            missingStudies.push({
                studyInstanceUid: studyInstanceUid
            });
        }
    });

    var studiesReady = loadMissingStudies(missingStudies);

    studiesReady.then(function() {
        var currentProtocolData = applicableProtocol.stages[presentationGroup - 1];

        var viewportRows = currentProtocolData.rows;
        var viewportColumns = currentProtocolData.columns;

        var study;
        currentProtocolData.viewports.forEach(function(viewport, viewportIndex) {
            if (viewport.study === 'current') {
                study = currentStudy;
            } else if (viewport.study === 'prior') {
                study = ViewerStudies.findOne({
                    studyInstanceUid: {
                        $ne: currentStudy.studyInstanceUid
                    }
                }, {
                    reactive: false,
                    $sort: {studyDate: 1}
                });
            }

            var seriesInstanceUid = findSeriesByDescription(viewport.seriesDescription, study);

            var window = {
                viewportIndex: viewportIndex,
                viewportRows: viewportRows,
                viewportColumns: viewportColumns,
                seriesInstanceUid: seriesInstanceUid,
                studyInstanceUid: study.studyInstanceUid,
                currentImageIdIndex: 0,
                options: viewport.options
            };

            ViewerWindows.insert(window);
        });

        // Update viewerData
        ViewerData[contentId].usingHP = true;
        ViewerData[contentId].viewportRows = viewportRows;
        ViewerData[contentId].viewportColumns = viewportColumns;
        Session.set("ViewerData", ViewerData);
    });
}

WindowManager = {
    init: initialize,
    setLayout: setLayout,
    updateWindows: updateWindows,
    useHangingProtocol: useHangingProtocol,
    loadSeriesInViewport: loadSeriesInViewport,
    setHangingProtocol: setHangingProtocol,
    getHangingProtocol: getHangingProtocol,
    getNumPresentationGroups: getNumPresentationGroups,
    setCurrentPresentationGroup: setCurrentPresentationGroup,
    getCurrentPresentationGroup: getCurrentPresentationGroup,
    nextPresentationGroup: nextPresentationGroup,
    previousPresentationGroup: previousPresentationGroup
};
