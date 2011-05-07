(function () {
  
  var U = {};
  U.foreach = function(iterable, cb, that) {
    if ($.isArray(iterable)) {
      for (var i = 0, len = iterable.length; i < len; ++i) {
        cb.call(that, iterable[i], i);
      }
    } else {
      for (var key in iterable) {
        if (iterable.hasOwnProperty(key)) {
          cb.call(that, iterable[key], key);
        }
      }
    }
  };

  var initialize = function() {
    chrome.windows.getAll({populate: true}, showInOpenedTabs);
    chrome.tabs.onUpdated.addListener(onTabUpdate);
    chrome.pageAction.onClicked.addListener(onActionClick);
  };

  var urlMatches = function(url) {
    var dotsub_pat = new RegExp("dotsub.com/transcribe");
    return dotsub_pat.test(url);
  };

  var addAction = function(tabId) {
    chrome.pageAction.show(tabId);
    chrome.tabs.executeScript(tabId, {
      code: "console.log('found dotsub " + tabId + "!');"
    });    
  };

  var onTabUpdate = function(tabId, changeInfo, tab) {
    if (urlMatches(tab.url)) {
      addAction(tabId);
      // console.log("found dotsub page! at tab id " + tabId);
    }
  };

  var onActionClick = function(tab) {
    chrome.tabs.executeScript(tab.id, {
      // code: "document.createElement('script')"
      file: "js/dom_injector.js"
    });
  };

  var showInOpenedTabs = function(windows) {
    U.foreach(windows, function(win) {
      U.foreach(win.tabs, function(tab) {
        if (urlMatches(tab.url)) {
          addAction(tab.id);
        }
      });
    });
  };

  initialize();

}());
