Template.viewer.onCreated(function() {
    // Attach the Window resize listener
    $(window).on('resize', handleResize);

    log.info("viewer onCreated");

    OHIF = window.OHIF || {
        viewer: {}
    };

    OHIF.viewer.loadIndicatorDelay = 500;
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
        clearTools: function(element) {
            var toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
            toolStateManager.clear(element);
            cornerstone.updateImage(element);
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
        ViewerData[contentId].viewportColumns = 1;
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

    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.updateImageSynchronizer);
});

Template.viewer.onDestroyed(function() {
    log.info("onDestroyed");
    OHIF.viewer.updateImageSynchronizer.destroy();
});