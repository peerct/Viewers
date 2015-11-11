// This event determines whether or not to show the lesion dialog
// If there already exists a lesion with this specific lesion number,
// related to the chosen location.
function getLesionLocationCallback(measurementData, eventData, doneCallback) {
    // Get the lesion location dialog
    var lesionDialog = $("#lesionLocationDialog");

    // Find the select option box
    var selector = lesionDialog.find("select#selectLesionLocation");

    // Get the current element's timepointID
    measurementData.timepointID = getTimepointIdFromElement(eventData.element);

    // Get a lesion number for this lesion, depending on whether or not the same lesion previously
    // exists at a different timepoint
    var lesionNumber = measurementManagerDAL.getNewLesionNumber(measurementData.timepointID, isTarget=true);
    measurementData.lesionNumber = lesionNumber;

    // Find out if this lesion number is already added in the lesion manager for another timepoint
    // If it is, stop here because we don't need the dialog.
    var locationUID = measurementManagerDAL.lesionNumberExists(measurementData);
    if (locationUID) {
        measurementData.locationUID = locationUID;
        measurementManagerDAL.updateTimepointData(measurementData);
        closeHandler();
        return;
    }
    // If it isn't, continue to open the dialog and have the user choose a lesion location

    // Attach close handler if the user clicks the close button
    var close = lesionDialog.find("#btnCloseLesionPopup");
    close.off('click');
    close.on('click', function() {
        closeHandler();
    });

    function closeHandler() {
        // Hide the lesion dialog
        lesionDialog.css('display', 'none');

        // Fire the doneCallback with the lesion number
        doneCallback(lesionNumber);

        // Get the current value of the select option box
        var currentValue = selector.find("option:selected").val();

        // Select the first option for the next time the dialog is opened
        selector.val(currentValue);
    }

    // Attach keypress handlers so the user can close with the Enter button
    lesionDialog.off("keypress");
    lesionDialog.on('keypress', keyPressHandler);

    // This is the keypress callback function
    function keyPressHandler(e) {
        // If Enter is pressed, close the dialog
        if (e.which === 13) {
            closeHandler();
        }
    }

    // Show the lesion location dialog above
    lesionDialog.css({
        top: eventData.currentPoints.page.y - lesionDialog.outerHeight() - 40,
        left: eventData.currentPoints.page.x - lesionDialog.outerWidth() / 2,
        display: 'block'
    });

    // Attach a callback for the select box
    selector.off('change');
    selector.on('change', function(e) {
        // Get the current value of the selector
        var selectedOptionId = this.value;

        // If the selected option is still the default (-1)
        // then stop here
        if (selectedOptionId < 0) {
            return;
        }

        // Get selected location data
        var locationObj = LesionLocations.findOne({_id: selectedOptionId});

        
        var id;
        var existingLocation = PatientLocations.findOne({location: locationObj.location});
        if (existingLocation) {
            id = existingLocation._id;
        } else {
            // Adds location data to PatientLocation and retrieve the location ID
            id = PatientLocations.insert({location: locationObj.location});
        }

        // Link locationUID with active lesion measurementData
        measurementData.locationUID = id;

        /// Set the isTarget value to true, since this is the target-lesion dialog callback
        measurementData.isTarget = true;

        // Adds lesion data to timepoints array
        measurementManagerDAL.addLesionData(measurementData);

        // Close the dialog
        closeHandler();
    });
}

function changeLesionLocationCallback(measurementData, eventData, doneCallback) {
    doneCallback(prompt('Change your lesion location:'));
}

var config = {
    getLesionLocationCallback: getLesionLocationCallback,
    changeLesionLocationCallback: changeLesionLocationCallback
};

cornerstoneTools.lesion.setConfiguration(config);


LesionLocations = new Meteor.Collection(null);

LesionLocations.insert({
    location: "Brain Brainstem",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebellum Left",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebrum Left",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Cerebrum Right",
    hasDescription: false,
    description: ""
});

LesionLocations.insert({
    location: "Brain Multiple Sites",
    hasDescription: false,
    description: ""
});

var lastAddedLesionData;

Template.lesionLocationDialog.onRendered(function() {
    // Observe Measurements Collection Changes
    Measurements.find().observe({
        added: function(lesionData) {
            lastAddedLesionData = lesionData;
        },
        changed: function(lesionData) {
            console.log("lesionData has changed!");
        }
    });
});

Template.lesionLocationDialog.helpers({
    'lesionLocations': function() {
        return LesionLocations.find();
    }
});