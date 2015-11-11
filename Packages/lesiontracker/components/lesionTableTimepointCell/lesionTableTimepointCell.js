Template.lesionTableTimepointCell.helpers({
    'longestDiameter': function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1);
        if (!lesionData.timepoints || !lesionData.timepoints[this._id]) {
            return;
        }
        return lesionData.timepoints[this._id].longestDiameter;
    }
});