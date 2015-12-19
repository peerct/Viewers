Template.lesionTableRow.helpers({
    'timepoints': function() {
        return Timepoints.find({}, {sort: {timepointName: 1}});
    }
});

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        showConfirmDialog(function() {
            log.info('Confirm clicked!');
            clearMeasurementTimepointData(measurementData.id, measurementData.timepointID);
        });
    }
}

Template.lesionTableRow.events({
    'dblclick .location': function() {
        log.info('Double clicked on Lesion Location cell');
        // Search Measurements by lesion and timepoint
        var currentMeasurement = Template.parentData(1);

        // Create some fake measurement data
        var measurementData = {
            id: currentMeasurement._id,
            timepointID: this.timepointID
        };

        changeLesionLocationCallback(measurementData, null, doneCallback);
    },
    'keypress .location': function(e) {
        var keyCode = e.keyCode;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            var currentMeasurement = Template.parentData(1);
            var currentTimepointID = this.timepointID;

            showConfirmDialog(function() {
                log.info('Removing Lesion: ' + currentMeasurement._id);
                clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        }
    }
});
