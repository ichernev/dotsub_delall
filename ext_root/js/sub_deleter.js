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
  
    var delete_started;
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
      if (delete_started) {
        updateUI();
        window.clearInterval(reportInterval);
        reportInterval = null;
      }
      $("#delall_dialog").remove();
      delete_started = false;
    };

    var sendReqs = function() {
      while (!aborted && req_send - resp_recv < kMaxParallelRequests && req_send < sub_ids.length) {
        initiateDelete(sub_ids[req_send]);
      }
      if (aborted || resp_recv >= sub_ids.length) {
        finishDelete();
      }
    };
  
    var startDeleteProcess = function(from, to) {
      uiTimes = null;
      aborted = false;
      var sub_trs = $("table#captionTable tr").filter(function() {
        return this.id.slice(0, 7) === "caption";
      });
      console.log(from, to);
      if (from !== "start" || to !== "end") {
        // 0 means before start, 1 means after start, 2 means after end.
        var matched = 0;
        var last_idx = sub_trs.length - 1;
        sub_trs = sub_trs.filter(function(idx) {
          var time_td = $("td.tablecell.capcell.time", this);
          if (matched === 0) {
            if (idx === 0 && from === "start") {
              matched = 1;
            } else {
              var start_tm = $("div.start", time_td).html();
              if (start_tm === from) {
                matched = 1;
              }
            }
          }  // There is no else here to enable start/end check on same sub.
          if (matched === 1) {
            if (idx === last_idx && to === "end") {
              matched = 2;
            } else {
              var stop_tm = $("div.stop", time_td).html();
              if (stop_tm === to) {
                matched = 2;
              }
            }
            return true;
          } else if (matched === 2) {
            return false;
          }
          // matched is either 0 or 1
          return matched === 1;
        });
        if (matched !== 2) {
          // Could not match start and/or end.
          return false;
        }
      }
      console.log(sub_trs);
      delete_started = true;
      sub_ids = sub_trs.map(function() { return this.id.slice(7); });

      start_at = (new Date()).getTime();
      req_send = resp_recv = 0;
      idStatus = {};
      sub_ids.each(function() { idStatus[this] = 0; });
      window.setTimeout(sendReqs, 0);
      reportInterval = window.setInterval(uiReportProgress, 1000);
      return true;
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
      $("#delall_dialog").remove();
      
      // Create new dialog.
      var ui = $("<div id='delall_dialog'>" +
          "<input class='from' type='text' maxlength='11' size='11'></input>" +
          "&nbsp;to&nbsp;" +
          "<input class='to' type='text' maxlength='11' size='11'></input>" +
          "<div class='btn'></div><br />" +
          "<a class='crnt_subs'></a><br />" +
          "<span class='caution'>WARNING! This will delete all selected " +
          "subtitles including ALL translations (if any). This operation " +
          "is irreversible! You have been warned!</span>" +
          "</div>");
      $(".btn", ui).button({ label: "Delete" }).click(function() {
        if (!startDeleteProcess($(".from", ui).val(), $(".to", ui).val())) {
          $(".caution", ui).html("Could not match start or end time. " +
            "Start should be exactly the begining of a subtitle " +
            "and end should be exactly the end of a subtitle.");
          // $(".from", ui).focus();
        } else {
          $(this).parent().empty().append($("<div class='progress'>" +
              "<span class='attr'><span class='lbl'>deleted: </span><span class='send'>0</span></span>" +
              // "<span class='lbl'>recv: </span><span class='recv'>-</span>" +
              "<span class='attr'><span class='lbl'>ETA: </span><span class='eta'>-</span></span>" +
              "<div class='progressbar'></div>" +
              "</div>"));
          $(".progressbar", ui).
            progressbar({ value: 0 }).
            position({ my: "bottom", at: "bottom", of: ui, offset: "0 -14" });
        }

      });
      $(".crnt_subs", ui).
        attr("href",
          $('div#advancedMenu > ul > li > a[href$="srt"]').attr("href")).
        text("download current subtitles").
        position({ my: "top", at: "bottom", of: $(".btn", ui), offset: "5 0" });
      $(".from", ui).
        attr("title", "starting time of initial subtitle to be deleted or 'start'").
        // val("start").
        // css({"background-color": "lightgray"}).
        bind("click focus", function() {
          if ($(this).val() === "start") {
            $(this).val("00:00.000").css({"background-color": "white"});
          }
        });
      $(".to", ui).
        attr("title", "ending time of last subtitle to be deleted or 'end'").
        val("end").
        css({"background-color": "lightgray"}).
        bind("click focus", function() {
          if ($(this).val() === "end") {
            $(this).val("00:00.000").css({"background-color": "white"});
          }
        });
      ui.
        appendTo($("body")).
        dialog({
          title: "Delete all subtitles?",
          modal: true,
          resizable: false,
          draggable: false,
          open: function() {
            $(".from", ui).blur().val("start").
              css({"background-color": "lightgray"});
          },
          close: function() {
            console.log("close event received");
            if (delete_started) {
              deleteAborted();
            } else {
              finishDelete();
            }
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
