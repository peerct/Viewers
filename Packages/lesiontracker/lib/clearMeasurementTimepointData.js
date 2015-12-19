clearMeasurementTimepointData = function(measurementId, timepointId) {
    var lesionData = Measurements.findOne(measurementId);

    // Check that this Measurement actually contains data for this timepoint
    if (!lesionData || !lesionData.timepoints[timepointId]) {
        return;
    }

    // Clear the Measurement data for this timepoint
    delete lesionData.timepoints[timepointId];

    if (Object.keys(lesionData.timepoints).length === 0) {
        Meteor.call("removeMeasurement", measurementId, function(error, response) {
            console.log('Removed!');
        });
    } else {
        // Update the Timepoint object of the Measurement document
        Measurements.update(measurementId, {
            $set: {
                timepoints: lesionData.timepoints
            }
        });
    }
};
