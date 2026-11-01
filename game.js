(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // Add your custom code here.
    ui.audio = fixedAudio;
  };

  // A corrected version of the engine's audio player (dendrynexus BrowserUserInterface.audio).
  // In the engine, the fade-in after a track change reads `this.volume` inside a jQuery callback,
  // where `this` is the <audio> element that has just been faded to 0, so the new track played
  // silently (e.g. "A las barricadas" when the civil war starts). Shuffled tracks that followed
  // inherited the same volume. Same keywords as the engine, plus `now`, which switches a
  // shuffled playlist immediately instead of waiting for the current track to end.
  var fixedAudio = function(audio) {
    var self = this;
    if (self.disable_audio) {
      if (self.currentAudio) {
        self.currentAudio.pause();
        self.currentAudio.loop = false;
      }
      return;
    }
    var files = [], loop = false, queue = false, noFade = false, shuffle = false, clear = false, now = false;
    audio.split(' ').forEach(function(word) {
      if (word == 'loop') loop = true;
      else if (word == 'queue') queue = true;
      else if (word == 'nofade') noFade = true;
      else if (word == 'shuffle') shuffle = true;
      else if (word == 'clear') clear = true;
      else if (word == 'now') now = true;
      else if (word) files.push(word);
    });
    if (clear) {
      self.audioPlaylist = [];
      self.audioQueue = [];
    }
    if (files.length) self.audioPlaylist = self.audioPlaylist.concat(files);
    var file = files[0];
    if (shuffle && now && files.length) file = files[Math.floor(Math.random() * files.length)];
    var fade = self.sound_fade_time;
    var a = self.currentAudio;
    var playing = a && !a.paused && !a.ended;

    var start = function(el, src) {
      el.src = src;
      el.volume = noFade ? self.volume : 0;
      var p = el.play();
      if (p && p.catch) p.catch(function() {});
      if (!noFade) $(el).stop(true).animate({volume: self.volume}, fade);
      self.currentAudioURL = src;
      if (window.updateAudio) window.updateAudio(src);
    };
    var next = function() {
      var n;
      if (self.audioQueue.length) n = self.audioQueue.pop();
      else if (self.audioShuffling && self.audioPlaylist.length) n = self.audioPlaylist[Math.floor(Math.random() * self.audioPlaylist.length)];
      if (n) start(self.currentAudio, n);
    };

    if (file == 'null' || file == 'none') {
      self.audioShuffling = false;
      if (playing) $(a).stop(true).animate({volume: 0}, fade, function() { a.pause(); });
      if (a) a.loop = false;
      return;
    }
    if (shuffle) self.audioShuffling = true;
    else if (!queue) self.audioShuffling = false;
    if (!file) return;

    if (!a) {
      a = self.currentAudio = new Audio();
      a.onended = next;
      start(a, file);
    } else if (playing && (queue || (shuffle && !now))) {
      // Leave the current track playing; the queue or the playlist takes over when it ends.
      if (queue) self.audioQueue.push(file);
      a.onended = next;
    } else if (playing && self.currentAudioURL == file) {
      a.onended = next;
    } else if (playing && !noFade) {
      a.onended = next;
      $(a).stop(true).animate({volume: 0}, fade, function() { start(a, file); });
    } else {
      a.onended = next;
      start(a, file);
    }
    a.loop = loop;
  };

  var TITLE = "Social Democracy: An Alternate History" + '_' + "Autumn Chen";

  // the url is a link to game.json
  // test url: https://aucchen.github.io/social_democracy_mods/v0.1.json
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };

  window.showSandbox = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('sandbox')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('sandbox');
    }
  };

  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      window.dendryUI.saveSettings();
  };

  window.enableImages = function() {
    window.dendryUI.show_portraits = true;
    window.dendryUI.saveSettings();
   };

  window.disableImages = function() {
    window.dendryUI.show_portraits = false;
    window.dendryUI.saveSettings();
};

window.enableLightMode = function() {
    window.dendryUI.dark_mode = false;
    document.body.classList.remove('dark-mode');
    window.dendryUI.saveSettings();
};
window.enableDarkMode = function() {
    window.dendryUI.dark_mode = true;
    document.body.classList.add('dark-mode');
    window.dendryUI.saveSettings();
};

window.enableGrayMode = function() {
    window.dendryUI.gray_mode = true;
    document.body.classList.add('gray-mode');
    window.dendryUI.saveSettings();
};
window.disableGrayMode = function() {
    window.dendryUI.gray_mode = false;
    document.body.classList.remove('gray-mode');
    window.dendryUI.saveSettings();
};

  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (show_portraits) {
        $('#images_yes')[0].checked = true;
    } else {
        $('#images_no')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode')[0].checked = true;
    } else {
        $('#light_mode')[0].checked = true;
    }
    if (window.dendryUI.gray_mode) {
        $('#gray_on')[0].checked = true;
    } else {
        $('#gray_no')[0].checked = true;
    }
  };

  
  // This function allows you to modify the text before it's displayed.
  // E.g. wrapping chat-like messages in spans.
  window.displayText = function(text) {
      return text;
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  window.updateSidebar = function() {
      $('#qualities').empty();
      var scene = dendryUI.game.scenes[window.statusTab];
      dendryUI.dendryEngine._runActions(scene.onArrival);
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
  };

  window.updateSidebarRight = function() {
    $('#qualities_right').empty();
    var scene = dendryUI.game.scenes[window.statusTabRight];
    dendryUI.dendryEngine._runActions(scene.onArrival);
    var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
    $('#qualities_right').append(dendryUI.contentToHTML.convert(displayContent));
};

  window.changeTab = function(newTab, tabId, isRight) {
      if (tabId == 'poll_tab' && (dendryUI.dendryEngine.state.qualities.historical_mode || dendryUI.dendryEngine.state.qualities.rubicon)) {
          if (dendryUI.dendryEngine.state.qualities.historical_mode && !dendryUI.dendryEngine.state.qualities.rubicon) window.alert('Polls are not available in historical mode.');
          if (dendryUI.dendryEngine.state.qualities.rubicon) window.alert('Polls are not available after crossing the rubicon.');
          return;
      }
      var tabButton = document.getElementById(tabId);
      var tabButtons = document.getElementsByClassName('tab_button');
      for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
      }
      tabButton.className += ' active';
      if (isRight) {
        window.statusTabRight = newTab;
        window.updateSidebarRight();
        } else {
          window.statusTab = newTab;
          window.updateSidebar();
    }
  };

  window.onDisplayContent = function() {
      window.updateSidebar();
      window.updateSidebarRight();
  };

  window.toggleDem = function toggleDemographicTable() {
      const resultsDiv = document.getElementById('results');
      // Toggle display between 'none' and 'block'
      if (resultsDiv.style.display === 'none' || resultsDiv.style.display === '') {
          resultsDiv.style.display = 'block'; // or 'table' for the table specifically
      } else {
          resultsDiv.style.display = 'none';
      }
  };
  window.toggleGraph = function toggleGraph() {
      const svgElement = document.getElementById('party_support_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleElectionGraph = function toggleElectionGraph() {
      const svgElement = document.getElementById('election_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleNews = function toggleNews() {
      // If the Era II labor news is showing, go back to the other news first.
      const labor = document.querySelectorAll('.labor');
      if (labor.length && labor[0].style.display === 'block') {
          labor.forEach(function (element) { element.style.display = 'none'; });
          document.querySelectorAll('.other').forEach(function (element) { element.style.display = 'block'; });
      }
      const elements = document.querySelectorAll('.dnvp');
      const elements2 = document.querySelectorAll('.other');
      const button = document.getElementById('news_tab');

      if (!button) {
          console.error('Button with id "news_tab" not found.');
          return;
      }

      elements.forEach(function (element) {
          if (element.style.display !== 'block') {
              element.style.display = 'block';
              button.innerHTML = "View Other News";
          } else {
              element.style.display = 'none';
              button.innerHTML = "View Right-Wing News";
          }
      });

      elements2.forEach(function (element) {
          if (element.style.display !== 'none') {
              element.style.display = 'none';
          } else {
              element.style.display = 'block';
          }
      });

      button.style.backgroundColor = '#dddddd';
      const lbutton = document.getElementById('labor_tab');
      if (lbutton) lbutton.innerHTML = "View Labor News";
  };
  // The Era II labor news: shows the .labor paragraphs instead of the other news, and back.
  window.toggleLaborNews = function toggleLaborNews() {
      const button = document.getElementById('labor_tab');
      const labor = document.querySelectorAll('.labor');
      const showing = labor.length && labor[0].style.display === 'block';
      labor.forEach(function (element) { element.style.display = showing ? 'none' : 'block'; });
      document.querySelectorAll('.other').forEach(function (element) { element.style.display = showing ? 'block' : 'none'; });
      document.querySelectorAll('.dnvp').forEach(function (element) { element.style.display = 'none'; });
      const nbutton = document.getElementById('news_tab');
      if (nbutton) nbutton.innerHTML = "View Right-Wing News";
      if (button) {
          button.innerHTML = showing ? "View Labor News" : "View Other News";
          button.style.backgroundColor = '#dddddd';
      }
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };


  window.justLoaded = true;
  window.statusTab = "status";
  window.statusTabRight = "status_right";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.onload = function() {
    window.dendryUI.loadSettings({show_portraits: true});
    if (window.dendryUI.dark_mode) {
        document.body.classList.add('dark-mode');
    }
    if (window.dendryUI.gray_mode) {
        document.body.classList.add('gray-mode');
    }
    window.pinnedCardsDescription = "Advisor cards - actions are only usable once per 6 months.";
    window.statusTab = "status";
    window.updateSidebar();
    window.statusTabRight = "status_right";
    window.updateSidebarRight();
  };

}());
