Session.setDefault('ViewerData', {});

// Re-add any tab data saved in the Session
Object.keys(ViewerData).forEach(function(contentId) {
    var tabData = ViewerData[contentId];
    var data = {
        title: tabData.title,
        contentid: tabData.contentid
    };
    WorklistTabs.insert(data);
});

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout',
    notFoundTemplate: 'notFound'
});

Router.onBeforeAction('loading');

Router.route('/', function () {
    this.render('worklist');
});


Router.route('/viewer/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var studyInstanceUid = this.params._id;
        
        // Check if this study is already loaded in a tab
        // If it is, stop here so we don't keep adding tabs on hot-code reloads
        var tab = WorklistTabs.find({studyInstanceUid: studyInstanceUid}).fetch();
        if (tab) {
            return;
        }

        this.render('worklist');
        openNewTab(studyInstanceUid);
    }
});