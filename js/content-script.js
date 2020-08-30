'use strict'

const RegExpUrl = new RegExp('/scp-\\d+(?:$|/$)', 'ig');

const stateManager = new StateManager();

/**
 * Process SCP pages and sets image read / unread icon.
 */
function processScpPage() {
  const url = window.location.href;

  // Match on /scp-XXXX url
  if (!url.match(RegExpUrl)) {
    return;
  }

  // Also match on 'scp' tag, except for scp-001 which doesn't have a tag
  const scpTag = $('div.page-tags span a').filter(function () {
    return $(this).text().toLowerCase().trim() === 'scp';
  });
  if (!url.includes('/scp-001') && scpTag.length === 0) {
    return;
  }

  console.debug(`Found scp page: ${url}`);

  // Set style for image
  const styleId = 'page-read-style';
  if ($(`style#${styleId}`).length === 0) {
    const style = '#page-read-img { border: 0; position: relative; height: 42px; bottom: 0; vertical-align: bottom }';
    $('head').append($(`<style type="text/css" id="${styleId}">`).text(style));
  }

  // Set the image
  setImage(stateManager.getState(url));
}

/**
 * Set the image. Also registered click callback on the image to toggle the state.
 * @param {*} isRead - whether to set read or unread image
 */
function setImage(isRead) {
  const url = window.location.href;

  const imgId = 'page-read-img';
  const imgUrl = chrome.runtime.getURL(isRead ? 'images/page_read.png' : 'images/page_unread.png');
  const imgAlt = isRead ? 'Page read' : 'Page unread';
  const img = `<img id="${imgId}" alt="${imgAlt}" src="${imgUrl}">`;

  // Force page title to show
  $('div#page-title').show();

  var imgElement = undefined;
  if ($(`img#${imgId}`).length === 0) {
    imgElement = $('div#page-title').prepend(img);
  } else {
    imgElement = $(`img#${imgId}`).replaceWith(img);
  }
  imgElement.on('click', function () {
    stateManager.toggleState(url, function (value) { setImage(value); });
  });
}

/**
 * Processes any URLs referencing scp pages and adds a read icon to the links
 */
function processRefUrls() {
  const readPageCheckId = 'read-page-check';
  const readImg = `<img id="${readPageCheckId}" alt="Page Read" src="${chrome.runtime.getURL('images/eye_full.png')}" style="height: 2em; width: auto; position: relative; vertical-align: bottom; padding-right: 2px; bottom: -2px">`;

  $('a').each((idx, elem) => {
    if ($(elem).attr('href') && $(elem).attr('href').match(RegExpUrl) && !$(elem).attr('href').includes('/forum/') &&
      stateManager.getState($(elem).attr('href')) &&
      $(elem).find(`#${readPageCheckId}`).length === 0) {
      $(elem).prepend(readImg);
    }
  });
}

/**
 * Process SCP pages and referencing links
 */
function process() {
  // Process SCP page
  processScpPage();

  // Process referencing URLs
  processRefUrls();
}

/**
 * Main entry point
 */
function main() {
  // Initialize state manager.
  stateManager.initialize(process, undefined, process);
}

main();
