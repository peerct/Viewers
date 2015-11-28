var net = Npm.require('net'),
    Future = Npm.require('fibers/future');

DIMSE = {};

DIMSE.associate = function(contexts, callback) {
  var host = Meteor.settings.dimse.host, 
      port = Meteor.settings.dimse.port,
      ae = Meteor.settings.dimse.hostAE;

  var client = net.connect({host : host, port: port},
    function() { //'connect' listener
      console.log('==Connected');
      
      var conn = new Connection(client);
      conn.associate({contexts : contexts, hostAE : ae}, function(pdu) {
        // associated
        console.log('==Associated');
        callback.call(conn, pdu);
      });
  });     
};

DIMSE.retrieveStudies = function() {
  var start = new Date();
  DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu){
    this.setFindContext(C.SOP_STUDY_ROOT_FIND);
    var result = this.findStudies({
      0x0020000D : "", 0x00080060 : "",
      0x00080005 : "", 0x00080020 : "", 0x00080030 : "", 0x00080090 : "",
      0x00100010 : "", 0x00100020 : "", 0x00200010 : ""
    }), o = this;

    var studies = [];
    result.on('result', function(msg){
      studies.push(msg);
    });

    result.on('end', function(){
      o.release();
    });

    this.on('close', function(){
      var time = new Date() - start;console.log(time + 'ms taken');
      console.log(studies[0].toString(), studies.length);
    })
  });
};

DIMSE.retrieveSeries = function(studyInstanceUID) {
  var start = new Date();
  DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu){
    this.setFindContext(C.SOP_STUDY_ROOT_FIND);
    var result = this.findSeries({
      0x0020000D : studyInstanceUID ? studyInstanceUID : "",
      0x00080005 : "", 0x00080020 : "", 0x00080030 : "", 0x00080090 : "",
      0x00100010 : "", 0x00100020 : "", 0x00200010 : "", 0x0008103E : "",
      0x0020000E : "", 0x00200011 : ""
    }), o = this;

    var studies = [];
    result.on('result', function(msg){
      studies.push(msg);
    });

    result.on('end', function(){
      o.release();
    });

    this.on('close', function(){
      var time = new Date() - start;console.log(time + 'ms taken');
      console.log(studies[0].toString());
    })
  });
};

DIMSE.retrieveInstances = function(studyInstanceUID, seriesInstanceUID) {
  var start = new Date();
  DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu){
    this.setFindContext(C.SOP_STUDY_ROOT_FIND);
    var result = this.findInstances({
      0x0020000D : studyInstanceUID ? studyInstanceUID : "",
      0x0020000E : (studyInstanceUID && seriesInstanceUID) ? seriesInstanceUID : "",
      0x00080005 : "", 0x00080020 : "", 0x00080030 : "", 0x00080090 : "",
      0x00100010 : "", 0x00100020 : "", 0x00200010 : "", 0x0008103E : "",
      0x00200011 : "", 0x00080016 : "", 0x00080018 : "", 0x00200013 : "",
      0x00280010 : "", 0x00280011 : "", 0x00280100 : "", 0x00280103 : ""
    }), o = this;

    var instances = [];
    result.on('result', function(msg){
      instances.push(msg);
    });

    result.on('end', function(){
      o.release();
    });

    this.on('close', function(){
      var time = new Date() - start;console.log(time + 'ms taken');
      console.log(instances[0].toString());
    })
  });
};