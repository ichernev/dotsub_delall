// (function() {
//   var deleteSubs = function() {
//     console.log("greetings from content script");
//     // var all_imgs = $("table#captionTable tr td a.delete img");
//     // if (!$.isArray(all_imgs)) {
//     //   all_imgs = [all_imgs];
//     // }
//     // console.log("all_imgs len: " + all_imgs.length);
//     // all_imgs[0].click();
//   };
// 
// 
//   deleteSubs();
// }());

// console.log("foo is the new bar");
//
(function() {
  if (document.getElementById("dotsub_delete_all")) {
    // Code is injected, just send a message to initiate delete.
    var customEvent = document.createEvent('Event');
    customEvent.initEvent('deleteAllSubs', false, false);
    var communicationDiv = document.getElementById('dotsub_delete_all');
    communicationDiv.dispatchEvent(customEvent);
    return;
  }

  var injectJS = function(path) {
    var script;
    script = document.createElement("script");
    script.type = "text/javascript";
    script.src = chrome.extension.getURL(path);
    document.head.appendChild(script);
  };

  var injectCSS = function(path) {
    var link;
    link = document.createElement("link");
    link.href = chrome.extension.getURL(path);
    link.rel = "stylesheet";
    link.type = "text/css";
    document.head.appendChild(link);
  };
  
  // jquery stuff
  injectJS("lib/jquery-1.6.js");
  injectJS("lib/jquery-ui-1.8.12.custom.min.js");
  injectCSS("css/ui-lightness/jquery-ui-1.8.12.custom.css");

  // my stuff
  injectJS("js/sub_deleter.js");
  injectCSS("css/sub_deleter.css");
}());
