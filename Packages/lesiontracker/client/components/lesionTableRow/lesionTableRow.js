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
        Meteor.call("removeMeasurement", measurementData.id, function(error, response) {
            console.log('Removed!');
        });
    }
}

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
var keys = {
    D: 68,
    DELETE: 46
};

Template.lesionTableRow.events({
    'dblclick .location': function() {
        log.info('Double clicked on Lesion Location cell');

        var measurementData = this;

        // TODO = Fix this weird issue? Need to set toolData's ID properly..
        measurementData.id = this._id;

        changeLesionLocationCallback(measurementData, null, doneCallback);
    },
    'keydown .location': function(e) {
        var keyCode = e.which;

        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            var currentMeasurement = this;
            var options = {
                keyPressAllowed: false
            };

            showConfirmDialog(function() {
                Meteor.call("removeMeasurement", currentMeasurement._id, function(error, response) {
                    if (error) {
                        log.warn(error);
                    }
                    log.info(response);
                });
            }, options);
        }
    }
});
