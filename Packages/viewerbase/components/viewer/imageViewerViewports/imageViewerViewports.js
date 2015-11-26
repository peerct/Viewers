Template.imageViewerViewports.onCreated(function() {
   WindowManager.init();
});

Template.imageViewerViewports.helpers({
    height: function() {
        var viewportRows = this.viewportRows || 1;
        return 100 / viewportRows;
    },
    width: function() {
        var viewportColumns = this.viewportColumns || 1;
        return 100 / viewportColumns;
    },
    viewerWindow: function() {
        return ViewerWindows.find();
    }
});

var savedSeriesData,
    savedViewportRows,
    savedViewportColumns;

Template.imageViewerViewports.events({
    'dblclick .imageViewerViewport': function(e) {
        var container = $(".viewerMain").get(0);
        var data;
        var contentId = this.contentId || $("#viewer").parents(".tab-pane.active").attr('id');

        // If there is more than one viewport on screen
        // And one of them is double-clicked, it should be rendered alone
        // If it is double-clicked again, the viewer should revert to the previous layout
        if ($(e.currentTarget).hasClass('zoomed')) {
            // Revert to saved settings
            ViewerData[contentId].loadedSeriesData = $.extend(true, {}, savedSeriesData);
            ViewerData[contentId].viewportRows = savedViewportRows;
            ViewerData[contentId].viewportColumns = savedViewportColumns;

            savedViewportRows = 0;
            savedViewportColumns = 0;

            data = {
                viewportRows: ViewerData[contentId].viewportRows,
                viewportColumns: ViewerData[contentId].viewportColumns
            };

            // Render the imageViewerViewports template with these settings
            $('#imageViewerViewports').remove();
            UI.renderWithData(Template.imageViewerViewports, data, container);

            // Remove the 'zoomed' class from any viewports
            $('.imageViewerViewport').removeClass('zoomed');
        } else {
            // Zoom to single viewport

            // If only one viewport is on-screen, stop here
            if (ViewerData[contentId].viewportRows === 1 &&
                ViewerData[contentId].viewportColumns === 1) {
                return;
            }

            // Save the current settings
            savedSeriesData = $.extend(true, {}, ViewerData[contentId].loadedSeriesData);
            savedViewportRows = ViewerData[contentId].viewportRows;
            savedViewportColumns = ViewerData[contentId].viewportColumns;
            
            // Get the clicked-on viewport's index
            var viewportIndex = this.viewportIndex;

            // Set the first viewport's data to be the same as the currently clicked-on viewport
            ViewerData[contentId].loadedSeriesData[0] = ViewerData[contentId].loadedSeriesData[viewportIndex];

            // Set the basic template data
            data = {
                viewportRows: 1,
                viewportColumns: 1
            };

            // Render the imageViewerViewports template with these settings
            $('#imageViewerViewports').remove();
            UI.renderWithData(Template.imageViewerViewports, data, container);

            // Add the 'zoomed' class to the lone remaining viewport
            $('.imageViewerViewport').eq(0).addClass('zoomed');

        }
    }
});