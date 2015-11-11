Measurements = new Meteor.Collection(null);
Timepoints = new Meteor.Collection(null);

// When nonTarget lesion is added to image, insert data to lesion table
function nonTargetToolAdded(e, eventData, lesionData) {

    // Set timepointID
    var element = e.currentTarget;
    lesionData.timepointID = getTimepointIdFromElement(element);

    var locationUID = measurementManagerDAL.isLesionNumberAdded(lesionData);
    if (locationUID) {
        // location is selected and disable select location in dialog
        lesionData.locationUID = locationUID;
        var locationName = measurementManagerDAL.getLocationName(locationUID);

        $("#selectNonTargetLesionLocation option").each(function()
        {
            if ($(this).text() === locationName) {
                // Select location in locations dropdown list
                $("#selectNonTargetLesionLocation option").eq($(this).index()).attr("selected", "selected");
                return;
            }
        });

        $("#selectNonTargetLesionLocation").attr("disabled", "disabled");
    } else{

        // If selectNonTargetLesionLocation is disabled, make it enable
        $("#selectNonTargetLesionLocation").removeAttr("disabled");
    }

    // Save lesionData in Session to use after location and response are selected
    Session.set("nonTargetLesionData", lesionData);

    var dialogPointsOnPage = eventData.currentPoints.page;
    $("#modal-dialog-container-nonTargetLesion").css({
        "top": dialogPointsOnPage.y,
        "left": dialogPointsOnPage.x
    });

    $("#nonTargetLesionLocationDialog").modal("show");

}

// Activate selected lesions when lesion table row is clicked
function updateLesions(e) {
    // lesionNumber of measurement = id of row
    var lesionNumber = parseInt($(e.currentTarget).attr("id"), 10);
    var isTarget = $(e.currentTarget).find('td').eq(2).html().trim() === 'N'?false:true;

    // Find data for specific lesion
    var measurementData = Measurements.find({
        lesionNumber: lesionNumber,
        isTarget: isTarget
    }).fetch()[0];

    var timepoints = measurementData.timepoints;

    $(".imageViewerViewport").each(function(index, element) {
        // Get the timepointID related to the image viewer viewport
        // from the DOM itself. This will be changed later when a
        // real association between viewports and timepoints is created.
        var timepointID = getTimepointIdFromElement(element);
        var timepointObject = timepoints[timepointID];

        // Defines event data
        var eventData = {
            enabledElement: cornerstone.getEnabledElement(element),
            lesionData: {
                isTarget: isTarget,
                lesionNumber: lesionNumber,
                imageId: timepointObject.imageId
            },
            type: "active"
        };

        if (timepointObject.longestDiameter === "") {
            eventData.type = "inactive";
        }

        if (!isTarget) {
            $(element).trigger("NonTargetToolSelected", eventData);

            // Deactivate lesion tool measurements
            eventData.type = "inactive";
            $(element).trigger("LesionToolSelected", eventData);
            return;
        }
        $(element).trigger("LesionToolSelected", eventData);

        // Deactivate nonTarget tool measurements
        eventData.type = "inactive";
        $(element).trigger("NonTargetToolSelected", eventData);

    });
}

getStudyDateString = function(element) {
    var enabledElement = cornerstone.getEnabledElement(element);
    if (!enabledElement || !enabledElement.image) {
        return;
    }

    var imageId = enabledElement.image.imageId;
    var studyMetaData = cornerstoneTools.metaData.get('study', imageId);
    var studyDateString = moment(studyMetaData.studyDate).format('YYYY/MM/DD');
    return studyDateString;
};

getTimepointIdFromElement = function(element) {
    var studyDateString = getStudyDateString(element);

    var timepointID;
    var existingTimepoint = Timepoints.findOne({timepointName: studyDateString});
    if (existingTimepoint) {
        timepointID = existingTimepoint._id;
    } else {
        // Adds location data to PatientLocation and retrieve the location ID
        timepointID = Timepoints.insert({timepointName: studyDateString});
    }

    return timepointID;
};

Template.lesionTable.onRendered(function() {
    $(".imageViewerViewport").each(function(index, element) {
        // FUTURE = On load series data into viewport, create a new timepoint
        // unless it already exists
        
        var timepointID = getTimepointIdFromElement(element);

        // Listen NonTargetToolAdded Event
        $(element).on("NonTargetToolAdded", nonTargetToolAdded);
    });
});


Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find();
    },
    'timepoints': function() {
        return Timepoints.find();
    }
});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e) {
        updateLesions(e);
    }
});