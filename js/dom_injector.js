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
    var customEvent = document.createEvent('Event');
    customEvent.initEvent('deleteAllSubs', false, false);
    var communicationDiv = document.getElementById('dotsub_delete_all');
    communicationDiv.dispatchEvent(customEvent);
    return;
  }
  
  // Load jquery.
  var script;
  script = document.createElement("script");
  script.type = "text/javascript";
  script.src = chrome.extension.getURL("lib/jquery-1.6.js") + "?foo";
  document.head.appendChild(script);
  
  // Load deleter script.
  script = document.createElement("script");
  script.type = "text/javascript";
  script.src = chrome.extension.getURL("js/sub_deleter.js") + "?foo";
  document.head.appendChild(script);
}());
