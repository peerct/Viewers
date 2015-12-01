var activeTool;

var alwaysEnabledTools = [];

var tools = {};

var initialized = false;

function configureTools() {
    // Set the configuration for the multitouch pan tool
    var multiTouchPanConfig = {
        testPointers: function(eventData) {
            return (eventData.numPointers >= 3);
        }
    };
    cornerstoneTools.panMultiTouch.setConfiguration(multiTouchPanConfig);
}

toolManager = {
    init: function() {
        toolManager.addTool('wwwc', {
            mouse: cornerstoneTools.wwwc,
            touch: cornerstoneTools.wwwcTouchDrag
        });
        toolManager.addTool('zoom', {
            mouse: cornerstoneTools.zoom,
            touch: cornerstoneTools.zoomTouchDrag
        });
        toolManager.addTool('wwwcRegion', {
            mouse: cornerstoneTools.wwwcRegion,
            touch: cornerstoneTools.wwwcRegionTouch
        });
        toolManager.addTool('dragProbe', {
            mouse: cornerstoneTools.dragProbe,
            touch: cornerstoneTools.dragProbeTouch
        });
        toolManager.addTool('pan', {
            mouse: cornerstoneTools.pan,
            touch: cornerstoneTools.panTouchDrag
        });
        toolManager.addTool('stackScroll', {
            mouse: cornerstoneTools.stackScroll,
            touch: cornerstoneTools.stackScrollTouchDrag
        });
        toolManager.addTool('length', {
            mouse: cornerstoneTools.length,
            touch: cornerstoneTools.lengthTouch
        });
        toolManager.addTool('angle', {
            mouse: cornerstoneTools.simpleAngle,
            touch: cornerstoneTools.simpleAngleTouch
        });
        toolManager.addTool('magnify', {
            mouse: cornerstoneTools.magnify,
            touch: cornerstoneTools.magnifyTouchDrag
        });
        toolManager.addTool('ellipticalRoi', {
            mouse: cornerstoneTools.ellipticalRoi,
            touch: cornerstoneTools.ellipticalRoiTouch
        });
        toolManager.addTool('rectangleRoi', {
            mouse: cornerstoneTools.rectangleRoi,
            touch: cornerstoneTools.rectangleRoiTouch
        });
        toolManager.addTool('annotate', {
            mouse: cornerstoneTools.arrowAnnotate,
            touch: cornerstoneTools.arrowAnnotateTouch
        });
        activeTool = OHIF.viewer.defaultTool;

        configureTools();
        initialized = true;
    },
    addTool: function(name, base) {
        tools[name] = base;
    },
    setActiveToolForElement: function(tool, element) {
        var canvases = $(element).find('canvas');
        if (element.classList.contains('empty') || !canvases.length) {
            return;
        }

        // First, deactivate the current active tool
        tools[activeTool].mouse.deactivate(element, 1);

        if (tools[activeTool].touch) {
            tools[activeTool].touch.deactivate(element);
        }

        // Enable any tools set as 'Always enabled'
        alwaysEnabledTools.forEach(function(toolType) {
            cornerstoneTools[toolType].enable(element);
        });

        // Get the stack toolData
        var toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            return;
        }

        // Get the imageIds for this element
        var imageIds = toolData.data[0].imageIds;

        // Deactivate all the middle mouse, right click, and scroll wheel tools
        cornerstoneTools.pan.deactivate(element);
        cornerstoneTools.zoom.deactivate(element);
        cornerstoneTools.zoomWheel.deactivate(element);
        cornerstoneTools.stackScrollWheel.deactivate(element);

        // Reactivate the relevant scrollwheel tool for this element
        if (imageIds.length > 1) {
            // scroll is the default tool for middle mouse wheel for stacks
            cornerstoneTools.stackScrollWheel.activate(element);
        } else {
            // zoom is the default tool for middle mouse wheel for single images (non stacks)
            cornerstoneTools.zoomWheel.activate(element);
        }

        // This block ensures that the middle mouse and scroll tools keep working
        if (tool === 'pan') {
            cornerstoneTools.pan.activate(element, 3); // 3 means left mouse button and middle mouse button
            cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
        } else if (tool === 'zoom') {
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 5); // 5 means left mouse button and right mouse button
        } else {
            // Reactivate the middle mouse and right click tools
            cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
            cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button

            // Activate the chosen tool
            tools[tool].mouse.activate(element, 1);
        }

        if (tools[tool].touch) {
            tools[tool].touch.activate(element);
        }

        cornerstoneTools.zoomTouchPinch.activate(element);
        cornerstoneTools.panMultiTouch.activate(element);
    },
    setActiveTool: function(tool, elements) {
        if (!initialized) {
            toolManager.init();
        }

        $('#toolbar .btn-group button').removeClass('active');
        var toolButton = document.getElementById(tool);
        toolButton.classList.add('active');

        // Otherwise, set the active tool for all viewport elements
        $(elements).each(function(index, element) {
            toolManager.setActiveToolForElement(tool, element);
        });
        activeTool = tool;
    },
    getActiveTool: function() {
        if (!activeTool) {
            activeTool = OHIF.viewer.defaultTool;
        }
        return activeTool;
    },
    setDefaultTool: function(tool) {
        OHIF.viewer.defaultTool = tool;
    },
    getDefaultTool: function() {
        return OHIF.viewer.defaultTool;
    },
    setAlwaysEnabledTools: function(tools) {
        alwaysEnabledTools = tools;
    },
    getAlwaysEnabledTools: function() {
        return alwaysEnabledTools;
    },
    toggleAlwaysEnabledTool: function(tool) {
        var whatToDo;

        var index = alwaysEnabledTools.indexOf(tool);

        // If we are trying to toggle on/off the active tool, stop here
        // Because the active tool disappearing is probably not what the user wants
        if (tool === activeTool) {
            return;
        }

        if (index >= 0) {
            // The tool is already enabled, or it is the active tool, disable it
            whatToDo = 'disable';
            alwaysEnabledTools.splice(index, 1);
        } else {
            // The tool is not enabled yet, enable it
            whatToDo =  'enable';
            alwaysEnabledTools.push(tool);
        }
        
        log.info(whatToDo + ' ' + tool);

        $('.imageViewerViewport').not('.empty').each(function(index, element) {
            var enabledElement;
            try {
                enabledElement = cornerstone.getEnabledElement(element);
            } catch(error) {
                log.warn(error);
                return;
            }

            // Note that tools should be running updateImage inside their enable/disable functions,
            // or nothing will change when this runs
            cornerstoneTools[tool][whatToDo](element);

            if (!enabledElement.image) {
                return;
            }
        });
    }
};
