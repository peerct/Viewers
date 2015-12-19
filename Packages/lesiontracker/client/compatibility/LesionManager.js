var LesionManager = (function() {
    PatientLocations = new Meteor.Collection(null);

    /**
     * Retrieve a location name (e.g. Liver Right) from the
     * PatientLocations Collection by id, if it exists. Otherwise,
     * return an empty string.
     *
     * @param id
     * @returns {*|string}
     */
    function getLocationName(id) {
        var locationObject = PatientLocations.findOne(id);
        if (!locationObject || !locationObject.location) {
            return '';
        }
        
        return locationObject.location;
    }

    /**
     * Update the Timepoint object for a specific Measurement.
     * If no measurement exists yet, one will be created.
     *
     * Input is toolData from the lesion or nonTarget tool
     *
     * @param lesionData
     */
    function updateLesionData(lesionData) {
        // Find the related Timepoint from the Timepoints Collection
        var timepointID = lesionData.timepointID;
        var timepoint = Timepoints.findOne({timepointID: timepointID});
        if (!timepoint) {
            log.warn('Timepoint in an image is not present in the Timepoints Collection?');
            return;
        }

        // Find the specific lesion to be updated
        var existingMeasurement = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });

        // Create a structure for the timepointData based
        // on this Lesion's toolData
        var timepointData = {
            seriesInstanceUid: lesionData.seriesInstanceUid,
            studyInstanceUid: lesionData.studyInstanceUid,
            handles: lesionData.handles,
            imageId: lesionData.imageId
        };

        if (lesionData.isTarget === true) {
            // TODO = Add short axis
            timepointData.longestDiameter = lesionData.measurementText;
        } else {
            timepointData.response = lesionData.response;
        }

        // If no such lesion exists, we need to add one
        if (!existingMeasurement) {
            // Create a data structure for the Measurement
            // based on the current tool data
            var measurement = lesionData;

            // Retrieve the location name given the locationUID
            if (lesionData.locationUID !== undefined) {
                measurement.location = getLocationName(lesionData.locationUID);
            }

            // Add toolData parameters to the Measurement at this Timepoint
            measurement.timepoints = {};
            measurement.timepoints[timepointID] = timepointData;

            // Set a flag to prevent duplication of toolData
            measurement.toolDataInsertedManually = true;

            // Insert this into the Measurements Collection
            // Save the ID into the toolData (not sure if this works?
            measurement.id = Measurements.insert(measurement);
        } else {
            lesionData.id = existingMeasurement._id;

            // Update timepoints from lesion data
            existingMeasurement.timepoints[timepointID] = timepointData;

            Measurements.update(existingMeasurement._id, {
                $set: {
                    timepoints: existingMeasurement.timepoints
                }
            });
        }
    }

    // Returns new lesion number according to timepointID
    function getNewLesionNumber(timepointID, isTarget) {
        // Get all current lesion measurements
        var measurements = Measurements.find({isTarget: isTarget},{sort: {lesionNumber: 1}}).fetch();

        // If no measurements exist yet, start at 1
        if (!measurements.length) {
            return 1;
        }

        // If measurements exist, find the last lesion number
        // from the given timepoint
        var lesionNumberCounter = 0;
        for (var i = 0; i < measurements.length; i++) {
            var measurement = measurements[i];
            var timepoints = measurement.timepoints;

            if (!timepoints[timepointID]) {
                // Find lesion number for this timepointID
                return measurement.lesionNumber;
            }

            if (timepoints[timepointID].longestDiameter === '') {
                return measurement.lesionNumber;
            } else {
                lesionNumberCounter = lesionNumberCounter + 1;
            }
        }
        return lesionNumberCounter + 1;
    }

    /**
     * If the current Lesion Number already exists
     * for any other timepoint, returns lesion locationUID
     * @param lesionData
     * @returns {*}
     */
    function lesionNumberExists(lesionData) {
        var measurement = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });

        if (!measurement) {
            return;
        }

        return measurement.locationUID;
    }

    return {
        updateLesionData: updateLesionData,
        getNewLesionNumber: getNewLesionNumber,
        lesionNumberExists: lesionNumberExists,
        getLocationName: getLocationName
    };
})();