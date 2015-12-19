Template.lesionTableTimepointCell.helpers({
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

Template.lesionTableTimepointCell.events({
    'dblclick .lesionTableTimepointCell': function() {
        log.info('Double clicked on a timepoint cell');
        // Search Measurements by lesion and timepoint
        var currentMeasurement = Template.parentData(1);

        clearMeasurementTimepointData(currentMeasurement._id, this.timepointID);
    }
});