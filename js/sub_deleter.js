// window.alert(window.removeTranscription);
// window.alert($);
// $.noConflict();
// window.alert($.fn.jquery);
// window.alert(jQuery.fn.jquery);
(function() {
  var closure = function($) {
    var kComminicationDivId = "dotsub_delete_all";
    var kMaxParallelRequests = 10;
    var dotsub = window;
  
    var setupCommunication = function() {
      if ($("#" + kComminicationDivId).length !== 0) {
        console.warning("already found communication div. This should never happen.");
        return;
      }
  
      var div = $("<div id='" + kComminicationDivId + "'></div>");
      div.css("visibility", "hidden");
      div.bind("deleteAllSubs", onDeleteRequest);
      div.appendTo($("body"));
  
      console.log("appended communication div");
      onDeleteRequest();
    };
  
    var req_send, resp_recv, start_at;
    var sub_ids;
    var idStatus;
    var aborted;
    var reportInterval;
  
    var initiateDelete = function(sub_id) {
      ++ req_send;
      idStatus[sub_id] = 1;
      dotsub.CaptionManager.removeTranscriptionItem(sub_id, {
        callback: function(data) {
                    subDeleted(sub_id);
                  }
      });
    };
  
    var subDeleted = function(sub_id) {
      ++ resp_recv;
      idStatus[sub_id] = 2;
      sendReqs();
      // erase subtitle from table
      // $('#caption' + sub_id).remove();
      // var removedCaption = dotsub.captions.find(function(c) {
      //   return c.id === sub_id;
      // });
      // dotsub.captions = dotsub.captions.without(removedCaption);
      // dotsub.video.setPlayerCaptions(dotsub.captions);
  
      // window.setTimeout(sendReqs, 0);
    };
  
    var updateUI = function() {
      for (var key in idStatus) {
        var val = idStatus[key];
        if (val === 2) {
          $('#caption' + key).remove();
          idStatus[key] = 3;
        }
      }
      dotsub.captions = $(dotsub.captions).filter(function() {
        return idStatus[this.id] <= 1;
      });
      try {
        dotsub.video.setPlayerCaptions(dotsub.captions);
      }
      catch (e) {
        console.log("something happened with player");
      }
    };
    window.delall_update = updateUI;

    // var reportInterval;
    var reportProgress = function() {
      var elapsed = ((new Date()).getTime() - start_at) / 1000;
      var delRate = resp_recv / (elapsed + 0.1);  // prevent division by zero
      var eta = (sub_ids.length - resp_recv) / delRate;
      console.log("req_send", req_send, "resp_recv", resp_recv, "total",
          sub_ids.length, "rate", delRate, "eta", eta);
      // if (resp_recv >= req_send && req_send === sub_ids.length) {
      //   console.log("done");
      //   window.clearInterval(window.reportInterval);
      // }
    };
  
    var finishDelete = function() {
      updateUI();
      window.clearInterval(reportInterval);
      reportInterval = null;
      $("#delall_dialog").remove();
    };

    var sendReqs = function() {
      while (!aborted && req_send - resp_recv < kMaxParallelRequests && req_send < sub_ids.length) {
        initiateDelete(sub_ids[req_send]);
      }
      if (aborted || resp_recv >= sub_ids.length) {
        finishDelete();
      }
    };
  
    var startDeleteProcess = function() {
      uiTimes = null;
      aborted = false;
      var sub_trs = $("table#captionTable tr").filter(function() {
        return this.id.slice(0, 7) === "caption";
      });
      sub_ids = sub_trs.map(function() { return this.id.slice(7); });

      start_at = (new Date()).getTime();
      req_send = resp_recv = 0;
      idStatus = {};
      sub_ids.each(function() { idStatus[this] = 0; });
      sendReqs();
      reportInterval = window.setInterval(uiReportProgress, 1000);
    };

    var deleteAborted = function() {
      aborted = true;
    };

    var uiTimes = 0;
    var uiReportProgress = function() {
      var send, eta, progress;
      if (uiTimes !== null) {
        // fake
        send = uiTimes * 2;
        eta = 10 - uiTimes;
        progress = uiTimes / 10;
      } else {
        // real
        send = req_send;
        var elapsed = ((new Date()).getTime() - start_at) / 1000;
        var delRate = resp_recv / (elapsed + 0.1);  // prevent division by zero
        eta = (sub_ids.length - resp_recv) / delRate;
        eta = (Math.ceil(eta)).toFixed(0);
        progress = resp_recv / sub_ids.length;
      }

      var ui = $("#delall_dialog");
      $(".send", ui).text(send);
      // $(".recv", ui).text(resp_recv);
      $(".eta", ui).text(eta + " sec");
      $(".progressbar", ui).progressbar("option", "value", Math.floor(progress * 100));

      if (uiTimes !== null) {
        ++ uiTimes;
        if (uiTimes > 10) {
          console.log("stopping");
          // ui.remove();
          window.clearInterval(reportInterval);
        }
      }
    };

    var startFakeDeleteProcess = function() {
      uiTimes = 0;
      aborted = false;
      reportInterval = window.setInterval(uiReportProgress, 1000);
    };

    var showUI = function() {
      // Clean up from previous dialog.
      // TODO: Detect if delete is in progress.
      $("#delall_dialog").remove();
      
      // Create new dialog.
      var ui = $("<div id='delall_dialog'>" +
          "<div class='btn'></div><br />" +
          "<a class='crnt_subs'></a>" +
          "</div>");
      $(".btn", ui).button({ label: "Delete" }).click(function() {
        $(this).parent().empty().append($("<div class='progress'>" +
            "<span class='attr'><span class='lbl'>deleted: </span><span class='send'>0</span></span>" +
            // "<span class='lbl'>recv: </span><span class='recv'>-</span>" +
            "<span class='attr'><span class='lbl'>ETA: </span><span class='eta'>-</span></span>" +
            "<div class='progressbar'></div>" +
            "</div>"));
        $(".progressbar", ui).
          progressbar({ value: 0 }).
          position({ my: "bottom", at: "bottom", of: ui, offset: "0 -14" });
        startDeleteProcess();
      }).css({ marginBottom: "5px" });
      $(".crnt_subs", ui).
        attr("href",
          $('div#advancedMenu > ul > li > a[href$="srt"]').attr("href")).
        text("download current subtitles").
        position({ my: "top", at: "bottom", of: $(".btn", ui), offset: "5 0" });
      ui.
        appendTo($("body")).
        dialog({
          title: "Delete all subtitles?",
          modal: true,
          resizable: false,
          draggable: false,
          close: function() {
            console.log("close event received");
            deleteAborted();
          }
      });
    };

    var onDeleteRequest = function() {
      console.log("delete request received");
      if ($("#delall_dialog").length === 0) {
        showUI(); 
      } else {
        console.log("delete request already in progress");
      }

      // console.log("got " + sub_trs.length + " subtitles");
      // for (var i = 0, fin = 5 < sub_trs.length ? 5 : sub_trs.length; i < fin; ++i) {
      //   console.log("sample subtitle id " + sub_trs[i].id);
      // }
      // req_send = resp_recv = 0;
      // sub_trs.each(function() {
      //     initiateDelete(this.id.slice(7));
      // });
  
      // if (sub_trs.length >= 1) {
      //   var sub_id = sub_trs[0].id.slice(7);
      //   console.info("initiating delete of sub id " + sub_id);
      //   dotsub.CaptionManager.removeTranscriptionItem(sub_id, {
      //       callback: function(data) {
      //         console.log("in remove callback");
      //         $('#caption' + sub_id).remove();
      //         var oldCaption = dotsub.captions.find(function(c) {
      //           if (c.id == sub_id) { return true; }
      //         });
      //         console.log(oldCaption, "removing from captions");
      //         dotsub.captions = dotsub.captions.without(oldCaption);
      //         dotsub.video.setPlayerCaptions(dotsub.captions);
      //       }
      //   });
      //   // x = jQuery('div#advancedMenu > ul > li > a[href$="srt"]');
      // }
    };
  
    setupCommunication();
  };

  var interval;
  interval = window.setInterval(function() {
    if (window.jQuery !== undefined && window.jQuery.fn.button !== undefined) {
      closure(jQuery);
      window.clearInterval(interval);
    } else {
      console.log('[deleter] jquery|ui not loaded');
    }
  }, 500);
}());
