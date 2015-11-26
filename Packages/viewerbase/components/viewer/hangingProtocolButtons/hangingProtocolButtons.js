Template.hangingProtocolButtons.helpers({
    'isNextAvailable': function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        var numPresentationGroups = WindowManager.getNumPresentationGroups();
        return presentationGroup < numPresentationGroups;
    },
    'isPreviousAvailable': function() {
        var presentationGroup = Session.get('WindowManagerPresentationGroup');
        return presentationGroup > 1;
    }
});

Template.hangingProtocolButtons.events({
    'click #previousPresentationGroup': function() {
        WindowManager.previousPresentationGroup();
    },
    'click #nextPresentationGroup': function() {
        WindowManager.nextPresentationGroup();
    }
});