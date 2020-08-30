'use strict'

chrome.browserAction.onClicked.addListener(function (tab) {
	// Open a new tab to show popup page
	chrome.tabs.create({
		'url': chrome.runtime.getURL('../html/popup.html')
	});
});
