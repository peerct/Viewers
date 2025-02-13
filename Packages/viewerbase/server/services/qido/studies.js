/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param server
 * @param filter
 * @returns {string} The URL with encoded filter query data
 */
function filterToQIDOURL(server, filter) {
    var parameters = {
        PatientName : filter.patientName,
        PatientID: filter.patientId,
        AccessionNumber : filter.accessionNumber,
        limit : filter.limit || 20,
        includefield : server.qidoSupportsIncludeField ? 'all' : undefined
    };
    return server.qidoRoot + '/studies?' + encodeQueryData(parameters);
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param resultData
 * @returns {Array} An array of Study MetaData objects
 */
function resultDataToStudies(resultData) {
    var studies = [];

    resultData.forEach(function(study) {
        studies.push({
          studyInstanceUid: DICOMWeb.getString(study['0020000D']),
          // 00080005 = SpecificCharacterSet
          studyDate: DICOMWeb.getString(study['00080020']),
          studyTime: DICOMWeb.getString(study['00080030']),
          accessionNumber: DICOMWeb.getString(study['00080050']),
          referringPhysicianName: DICOMWeb.getString(study['00080090']),
          // 00081190 = URL
          patientName: DICOMWeb.getName(study['00100010']),
          patientId: DICOMWeb.getString(study['00100020']),
          patientBirthdate: DICOMWeb.getString(study['00100030']),
          patientSex: DICOMWeb.getString(study['00100040']),
          imageCount: DICOMWeb.getString(study['00201208']),
          studyId: DICOMWeb.getString(study['00200010']),
          studyDescription: DICOMWeb.getString(study['00081030']),
          modalities: DICOMWeb.getString(study['00080061'])
        });
    });
    return studies;
}


Services.QIDO.Studies = function(server, filter) {
    var url = filterToQIDOURL(server, filter);
    var result = DICOMWeb.getJSON(url, server.requestOptions);
    return resultDataToStudies(result.data);
};