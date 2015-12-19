clearMeasurementTimepointData = function(measurementId, timepointId) {
    var lesionData = Measurements.findOne(measurementId);

    // Check that this Measurement actually contains data for this timepoint
    if (!lesionData.timepoints[timepointId]) {
        return;
    }

    // Retrieve the Measurement data for this timepoint
    var currentTimepointData = lesionData.timepoints[timepointId];

    // Reset the timepoint data
    // The reset mechanism depends on whether or not this is a target measurement
    if (lesionData.isTarget === true) {
        // TODO= Update short axis length here too!
        currentTimepointData.longestDiameter = '';
    } else {
        // TODO= Fix this when we are not storing "response" inside longestDiameter
        currentTimepointData.longestDiameter = '';
        currentTimepointData.response = '';
    }

    // Update the timepoints value of the Measurement object with
    // the updated values
    Measurements.update(measurementId, {
        $set: {
            timepoints: lesionData.timepoints
        }
    });
};
