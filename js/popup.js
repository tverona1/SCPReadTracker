'use strict'

const stateManager = new StateManager();
const BaseUrl = 'http://www.scpwiki.com/scp-';

/**
 * Downloads given contents
 * @param {string} name - Filename to use
 * @param {object} contents - Contents to download
 * @param {string} mime_type - Mime type. If not specified, assumes text/plain.
 */
function download(name, contents, mime_type) {
    mime_type = mime_type || "text/plain";

    var blob = new Blob([contents], { type: mime_type });

    var dlink = document.createElement('a');
    dlink.download = name;
    dlink.href = window.URL.createObjectURL(blob);
    dlink.onclick = function (e) {
        // revokeObjectURL needs a delay to work properly
        var that = this;
        setTimeout(function () {
            window.URL.revokeObjectURL(that.href);
        }, 1500);
    };

    dlink.click();
    dlink.remove();
}

/**
 * Processes popup page - lists read pages & prepares download link
 */
function process() {
    var readPages = stateManager.getStates(true);

    var pageReadCount = $('#pages-read-count');
    pageReadCount.text(readPages.length);

    var jsonList = {};
    var list = $('ul#read-pages');
    for (var i = 0; i < readPages.length; i++) {
        // Create link to read page & add to list
        var href = BaseUrl + readPages[i];
        var title = 'SCP-' + readPages[i];
        var a = $('<a>').attr('href', href).text(title);
        var li = $('<li>').addClass('item-read').append(a);
        list.append(li);
        jsonList[href] = title;
    }

    // If we have read pages, show download link
    if (readPages.length > 0) {
        $('#download-button').click(function () {
            download('SCPReadList.json', JSON.stringify(jsonList), 'application/json');
        })
    } else {
        $('#download-button').hide();
    }
}

/**
 * Main entry point
 */
function main() {
    // Initialize state manager.
    stateManager.initialize(process, undefined, process);
}

main();