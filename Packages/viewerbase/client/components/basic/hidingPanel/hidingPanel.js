Template.hidingPanel.events({
    'mouseover div.hidingPanel': function(e, template) {

        if (!template.panelPinned.get()) {

            var hidingPanel = $(e.currentTarget);
            hidingPanel.css({
                width: "122px"
            });

            // Set panel as open
            template.hidingPanelOpen.set(true);

            // Rotate Arrow Icon
            $('.arrowIcon').css( {'transform': 'rotate(180deg)'});

            // Set panel content opacity
            $(".hidingPanelContent").css("opacity", "1");
        }
    },

    'mouseout div.hidingPanel': function(e, template) {

        if (!template.panelPinned.get()) {
            var hidingPanel = $(e.currentTarget);
            hidingPanel.css({
                width: "1%"
            });

            // Set panel as closed
            template.hidingPanelOpen.set(false);

            // Rotate Arrow Icon
            $('.arrowIcon').css( {'transform': 'rotate(0deg)'});

            // Set panel content opacity
            $(".hidingPanelContent").css("opacity", "0");

        }
    },

    'click button.btnPin': function(e, template) {
        var panelPinned = template.panelPinned.get();
        panelPinned = !panelPinned;
        template.panelPinned.set(panelPinned);
        if(panelPinned) {
            // Calculate newWidth of viewportAndLesionTable
            var viewerWidth = $("#viewer").width();
            var newPercentageOfviewportAndLesionTable = 100 - 122 / viewerWidth *100;
            $("#viewportAndLesionTable").css("width", newPercentageOfviewportAndLesionTable+"%");

            resizeViewportElements();
        }else{

            // Calculate newWidth of viewportAndLesionTable
            $("#viewportAndLesionTable").css("width", "99%");

            resizeViewportElements();
        }
    }
});

Template.hidingPanel.helpers({
    'studyDateIsShown': function() {
        return true;
    },
    'panelPinned': function() {
        return Template.instance().panelPinned.get();
    },
    'hidingPanelOpen': function() {
        return Template.instance().hidingPanelOpen.get();
    }
});

Template.hidingPanel.onCreated(function() {
    this.hidingPanelOpen =  new ReactiveVar(false);
    this.panelPinned = new ReactiveVar(false);
});