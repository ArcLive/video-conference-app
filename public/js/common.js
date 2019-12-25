var common = {
    hideCount: 1,

    init: function() {
        $('.modal').modal();
        $('select').formSelect();
    },

    setHideCount: function(count) {
        common.hideCount = count;
    },

    // Helper to parse query string
    getQueryStringValue: function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    showBusyLoad: function(message) {
        if (!message)
            message = 'Please wait...';
        
        if (!$('#busy_indicator').length) {
            var busy_indicator = $(`<DIV id='busy_indicator' style='width:100%; height:100%; position:fixed; top:0; left:0; z-index:999;'></div>`)[0];
            var busy_indicator_message = $(`<div id='busy_indicator_message' style='text-align:center; position:fixed; width:50%; margin-left:-25%; top:30%; left:50%; z-index:1000;'>${message}</div>`)[0];
            document.body.insertBefore(busy_indicator_message, document.body.childNodes[0]);
            document.body.insertBefore(busy_indicator, document.body.childNodes[0]);
        }

        $('#busy_indicator').show();
        $('#busy_indicator_message').html(message);
        $('#busy_indicator_message').show();

        common.setHideCount(1);
    },

    hideBusyLoad: function () {
        common.hideCount -= 1;
        console.log(common.hideCount);
        if (common.hideCount) return;
        $('#busy_indicator').hide();
        $('#busy_indicator_message').hide();
    }
};

$(document).ready(function() {
    common.init();
});