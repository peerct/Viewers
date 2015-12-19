Template.lesionTableTimepointCell.helpers({
    'hasDataAtThisTimepoint': function() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        var lesionData = Template.parentData(1);
        return (lesionData &&
            lesionData.timepoints &&
            lesionData.timepoints[this.timepointID]);
    },
    'longestDiameter': function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1);
        if (!lesionData ||
            !lesionData.timepoints ||
            !lesionData.timepoints[this.timepointID]) {
            return;
        }

        return lesionData.timepoints[this.timepointID].longestDiameter;
    }
});

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        clearMeasurementTimepointData(measurementData.id, measurementData.timepointID);
    }
}

Template.lesionTableTimepointCell.events({
    'dblclick .lesionTableTimepointCell': function() {
        log.info('Double clicked on a timepoint cell');
        // Search Measurements by lesion and timepoint
        var currentMeasurement = Template.parentData(1);

        // Create some fake measurement data
        var measurementData = {
            id: currentMeasurement._id,
            timepointID: this.timepointID
        };

        if (currentMeasurement.isTarget) {
            changeLesionLocationCallback(measurementData, null, doneCallback);
        } else {
            changeNonTargetLocationCallback(measurementData, null, doneCallback);
        }
    }
});