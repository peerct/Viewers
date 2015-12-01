/**
 * Creates a QIDO URL given the server settings and a study instance UID
 * @param server
 * @param studyInstanceUid
 * @returns {string} URL to be used for QIDO calls
 */
function buildUrl(server, studyInstanceUid) {
    return server.qidoRoot + '/studies/' + studyInstanceUid + '/instances';
}

/**
 * Parses data returned from a QIDO search and transforms it into
 * an array of series that are present in the study
 *
 * @param server The DICOM server
 * @param studyInstanceUid
 * @param resultData
 * @returns {Array} Series List
 */
function resultDataToStudyMetadata(server, studyInstanceUid, resultData) {
    var seriesMap = {};
    var seriesList = [];

    resultData.forEach(function(instanceRaw) {
        var instance = instanceRaw.toObject();
        // Use seriesMap to cache series data
        // If the series instance UID has already been used to
        // process series data, continue using that series
        var seriesInstanceUid = instance[0x0020000E];
        var series = seriesMap[seriesInstanceUid];

        // If no series data exists in the seriesMap cache variable,
        // process any available series data
        if (!series) {
            series = {
                seriesInstanceUid: seriesInstanceUid,
                seriesNumber: instance[0x00200011],
                instances: []
            };

            // Save this data in the seriesMap cache variable
            seriesMap[seriesInstanceUid] = series;
            seriesList.push(series);
        }

        // The uri for the dicomweb
        // NOTE: DCM4CHEE seems to return the data zipped
        // NOTE: Orthanc returns the data with multi-part mime which cornerstoneWADOImageLoader doesn't
        //       know how to parse yet
        //var uri = DICOMWeb.getString(instance['00081190']);
        //uri = uri.replace('wado-rs', 'dicom-web');

        // manually create a WADO-URI from the UIDs
        // NOTE: Haven't been able to get Orthanc's WADO-URI to work yet - maybe its not configured?
        var sopInstanceUid = instance[0x00080018];
        var uri = server.wadoUriRoot + '?requestType=WADO&studyUID=' + studyInstanceUid + '&seriesUID=' + seriesInstanceUid + '&objectUID=' + sopInstanceUid + "&contentType=application%2Fdicom";

        // Add this instance to the current series
        series.instances.push({
            sopClassUid: instance[0x00080016],
            sopInstanceUid: sopInstanceUid,
            uri: uri,
            instanceNumber: instance[0x00200013]
        });
    });
    return seriesList;
}

/**
 * Retrieve a set of instances using a QIDO call
 * @param server
 * @param studyInstanceUid
 * @returns {{wadoUriRoot: String, studyInstanceUid: String, seriesList: Array}}
 */
Services.DIMSE.Instances = function(server, studyInstanceUid) {
    //var url = buildUrl(server, studyInstanceUid);
    var result = DIMSE.retrieveInstances(studyInstanceUid);

    return {
        wadoUriRoot: server.wadoUriRoot,
        studyInstanceUid: studyInstanceUid,
        seriesList: resultDataToStudyMetadata(server, studyInstanceUid, result)
    };
};