$(function() {
	function taborderViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.touchui = parameters[1];
		self.tabs = ko.observableArray();
		self.hidden_tabs = ko.observableArray();
		self.selectedTab = ko.observable();
		self.reloadOverlay = undefined;
		self.availableTabs = ko.observableArray();
		self.assignedTabs = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabs = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabsByID = ko.pureComputed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										if(tab.name().indexOf('plugin_') > -1){
											return 'tab_' + tab.name() + '_link';
										} else {
											return tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode') + '_link';
										}
									});
								return tabs;
							});
		self.unassignedTabs = ko.pureComputed(function() {
								//find out the categories that are missing from uniqueNames
								var combined_tabs = self.assignedTabs().concat(self.hiddenTabs());
								var differences = ko.utils.compareArrays(self.availableTabs().sort(), combined_tabs.sort());
								//return a flat list of differences
								var results = [];
								ko.utils.arrayForEach(differences, function(difference) {
									if (difference.status === "deleted") {
										results.push(difference.value);
									}
								});
								return results;
							});

		self.onBeforeBinding = function() {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		};

		self.onEventSettingsUpdated = function (payload) {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
			if (self.active_settings_tabs !== ko.toJSON(self.settings.settings.plugins.taborder.tabs) || self.active_settings_hidden_tabs !== ko.toJSON(self.settings.settings.plugins.taborder.hidden_tabs)){
				self.showReloadDialog();
			}
		};

		self.onAfterBinding = function(){
			self.active_settings_tabs = ko.toJSON(self.settings.settings.plugins.taborder.tabs);
			self.active_settings_hidden_tabs = ko.toJSON(self.settings.settings.plugins.taborder.hidden_tabs);
			$('ul#tabs li:not(.dropdown)').each(function(){
				var tabid = $(this).attr('id');
				var tabname = $(this).text();
				if(tabid.match(/^(tab_)?(.+)_link$/g)){
					self.availableTabs.push(tabid.replace('temp_link','temperature_link').replace('term_link','terminal_link').replace(/^gcode_link$/,'gcodeviewer_link').replace(/^(tab_)?(.+)_link$/g,'$2'));
				}
			});
		};

		self.onAllBound = function(allViewModels){
			self.renderTabs();
		};

		self.renderTabs = function(){
			if (self.touchui && self.touchui.isActive()) {
				return;
			}

			ko.utils.arrayForEach(self.tabs(), function(tab) {
				var tabid = tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode'); // fix for default tab ids not matching links.
				if (!tab.showtext()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text('');
				} else if (tab.usetitle()){
                    $('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text(tab.icon_tooltip());
                }
				if ($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').children('i').length > 0) {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).children('i').addClass(tab.icon()).css({'color':tab.icon_color()});
				} else {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="'+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
			ko.utils.arrayForEach(self.hidden_tabs(), function(tab) {
				var tabid = tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode'); // fix for default tab ids not matching links.
				if (!tab.showtext()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text('');
				}
				if (tab.usetitle()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text(tab.icon_tooltip());
				}
				if ($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').children('i').length > 0) {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).children('i').addClass(tab.icon()).css({'color':tab.icon_color()});
				} else {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="'+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
		};

		self.onStartupComplete = function(){
			if (self.touchui && self.touchui.isActive()) {
				return;
			}

			if($('#tabs').data('tabdrop') === undefined){
				$('#tabs').tabdrop({hidden: self.hiddenTabsByID()});
			}
			setTimeout(function(){$(window).resize();},200);
		};

		self.showReloadDialog = function(){
			$('#reloadui_overlay_wrapper > div > div > p:nth-child(2)').html('Tab Order changes detected, you must force a browser refresh now for these new changes to take effect. This will not interrupt any print jobs you might have ongoing. Please hold down the <code>shift</code> or <code>ctrl</code> key (based on your browser) and press F5.');
			$('#reloadui_overlay_wrapper button').remove();
			$('#reloadui_overlay').modal();
		};

		self.addMissingTab = function(data) {
			var tabid = data.replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode');
			if($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').length) {
				var tabname = $('li#' + tabid + '_link a,li#tab_' + tabid + '_link a').text().trim();
			} else {
				var tabname = '';
			}
			self.selectedTab({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'usetitle':ko.observable(false),'icon_color':ko.observable(''),'icon_tooltip':ko.observable(tabname)});
			self.settings.settings.plugins.taborder.tabs.push(self.selectedTab());
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			$('#TabOrderEditor').modal('show');
		};

		self.addHiddenMissingTab = function(data) {
			var tabid = data.replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode');
			if($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').length) {
				var tabname = $('li#' + tabid + '_link a,li#tab_' + tabid + '_link a').text().trim();
			} else {
				var tabname = '';
			}
			self.selectedTab({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'usetitle':ko.observable(false),'icon_color':ko.observable(''),'icon_tooltip':ko.observable(tabname)});
			self.settings.settings.plugins.taborder.hidden_tabs.push(self.selectedTab());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
			$('#TabOrderEditor').modal('show');
		};

		self.editTab = function(data) {
			console.log(data);
			self.selectedTab(data);
			$('#TabOrderEditor').modal('show');
		};

		self.removeTab = function(data) {
			self.settings.settings.plugins.taborder.tabs.remove(data);
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		};

		self.removeHiddenTab = function(data) {
			self.settings.settings.plugins.taborder.hidden_tabs.remove(data);
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		};

		self.taborder_icons = [ {
            title: "fab fa-500px",
            searchTerms: []
        }, {
            title: "fab fa-accessible-icon",
            searchTerms: [ "accessibility", "handicap", "person", "wheelchair", "wheelchair-alt" ]
        }, {
            title: "fab fa-accusoft",
            searchTerms: []
        }, {
            title: "fab fa-acquisitions-incorporated",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "game", "gaming", "tabletop" ]
        }, {
            title: "fas fa-ad",
            searchTerms: []
        }, {
            title: "fas fa-address-book",
            searchTerms: []
        }, {
            title: "far fa-address-book",
            searchTerms: []
        }, {
            title: "fas fa-address-card",
            searchTerms: []
        }, {
            title: "far fa-address-card",
            searchTerms: []
        }, {
            title: "fas fa-adjust",
            searchTerms: [ "contrast" ]
        }, {
            title: "fab fa-adn",
            searchTerms: []
        }, {
            title: "fab fa-adversal",
            searchTerms: []
        }, {
            title: "fab fa-affiliatetheme",
            searchTerms: []
        }, {
            title: "fas fa-air-freshener",
            searchTerms: []
        }, {
            title: "fab fa-algolia",
            searchTerms: []
        }, {
            title: "fas fa-align-center",
            searchTerms: [ "middle", "text" ]
        }, {
            title: "fas fa-align-justify",
            searchTerms: [ "text" ]
        }, {
            title: "fas fa-align-left",
            searchTerms: [ "text" ]
        }, {
            title: "fas fa-align-right",
            searchTerms: [ "text" ]
        }, {
            title: "fab fa-alipay",
            searchTerms: []
        }, {
            title: "fas fa-allergies",
            searchTerms: [ "freckles", "hand", "intolerances", "pox", "spots" ]
        }, {
            title: "fab fa-amazon",
            searchTerms: []
        }, {
            title: "fab fa-amazon-pay",
            searchTerms: []
        }, {
            title: "fas fa-ambulance",
            searchTerms: [ "help", "machine", "support", "vehicle" ]
        }, {
            title: "fas fa-american-sign-language-interpreting",
            searchTerms: []
        }, {
            title: "fab fa-amilia",
            searchTerms: []
        }, {
            title: "fas fa-anchor",
            searchTerms: [ "link" ]
        }, {
            title: "fab fa-android",
            searchTerms: [ "robot" ]
        }, {
            title: "fab fa-angellist",
            searchTerms: []
        }, {
            title: "fas fa-angle-double-down",
            searchTerms: [ "arrows" ]
        }, {
            title: "fas fa-angle-double-left",
            searchTerms: [ "arrows", "back", "laquo", "previous", "quote" ]
        }, {
            title: "fas fa-angle-double-right",
            searchTerms: [ "arrows", "forward", "next", "quote", "raquo" ]
        }, {
            title: "fas fa-angle-double-up",
            searchTerms: [ "arrows" ]
        }, {
            title: "fas fa-angle-down",
            searchTerms: [ "arrow" ]
        }, {
            title: "fas fa-angle-left",
            searchTerms: [ "arrow", "back", "previous" ]
        }, {
            title: "fas fa-angle-right",
            searchTerms: [ "arrow", "forward", "next" ]
        }, {
            title: "fas fa-angle-up",
            searchTerms: [ "arrow" ]
        }, {
            title: "fas fa-angry",
            searchTerms: [ "disapprove", "emoticon", "face", "mad", "upset" ]
        }, {
            title: "far fa-angry",
            searchTerms: [ "disapprove", "emoticon", "face", "mad", "upset" ]
        }, {
            title: "fab fa-angrycreative",
            searchTerms: []
        }, {
            title: "fab fa-angular",
            searchTerms: []
        }, {
            title: "fas fa-ankh",
            searchTerms: [ "amulet", "copper", "coptic christianity", "copts", "crux ansata", "egyptian", "venus" ]
        }, {
            title: "fab fa-app-store",
            searchTerms: []
        }, {
            title: "fab fa-app-store-ios",
            searchTerms: []
        }, {
            title: "fab fa-apper",
            searchTerms: []
        }, {
            title: "fab fa-apple",
            searchTerms: [ "food", "fruit", "mac", "osx" ]
        }, {
            title: "fas fa-apple-alt",
            searchTerms: [ "fall", "food", "fruit", "fuji", "macintosh", "seasonal" ]
        }, {
            title: "fab fa-apple-pay",
            searchTerms: []
        }, {
            title: "fas fa-archive",
            searchTerms: [ "box", "package", "storage" ]
        }, {
            title: "fas fa-archway",
            searchTerms: [ "arc", "monument", "road", "street" ]
        }, {
            title: "fas fa-arrow-alt-circle-down",
            searchTerms: [ "arrow-circle-o-down", "download" ]
        }, {
            title: "far fa-arrow-alt-circle-down",
            searchTerms: [ "arrow-circle-o-down", "download" ]
        }, {
            title: "fas fa-arrow-alt-circle-left",
            searchTerms: [ "arrow-circle-o-left", "back", "previous" ]
        }, {
            title: "far fa-arrow-alt-circle-left",
            searchTerms: [ "arrow-circle-o-left", "back", "previous" ]
        }, {
            title: "fas fa-arrow-alt-circle-right",
            searchTerms: [ "arrow-circle-o-right", "forward", "next" ]
        }, {
            title: "far fa-arrow-alt-circle-right",
            searchTerms: [ "arrow-circle-o-right", "forward", "next" ]
        }, {
            title: "fas fa-arrow-alt-circle-up",
            searchTerms: [ "arrow-circle-o-up" ]
        }, {
            title: "far fa-arrow-alt-circle-up",
            searchTerms: [ "arrow-circle-o-up" ]
        }, {
            title: "fas fa-arrow-circle-down",
            searchTerms: [ "download" ]
        }, {
            title: "fas fa-arrow-circle-left",
            searchTerms: [ "back", "previous" ]
        }, {
            title: "fas fa-arrow-circle-right",
            searchTerms: [ "forward", "next" ]
        }, {
            title: "fas fa-arrow-circle-up",
            searchTerms: []
        }, {
            title: "fas fa-arrow-down",
            searchTerms: [ "download" ]
        }, {
            title: "fas fa-arrow-left",
            searchTerms: [ "back", "previous" ]
        }, {
            title: "fas fa-arrow-right",
            searchTerms: [ "forward", "next" ]
        }, {
            title: "fas fa-arrow-up",
            searchTerms: []
        }, {
            title: "fas fa-arrows-alt",
            searchTerms: [ "arrow", "arrows", "bigger", "enlarge", "expand", "fullscreen", "move", "position", "reorder", "resize" ]
        }, {
            title: "fas fa-arrows-alt-h",
            searchTerms: [ "arrows-h", "resize" ]
        }, {
            title: "fas fa-arrows-alt-v",
            searchTerms: [ "arrows-v", "resize" ]
        }, {
            title: "fas fa-assistive-listening-systems",
            searchTerms: []
        }, {
            title: "fas fa-asterisk",
            searchTerms: [ "details" ]
        }, {
            title: "fab fa-asymmetrik",
            searchTerms: []
        }, {
            title: "fas fa-at",
            searchTerms: [ "e-mail", "email" ]
        }, {
            title: "fas fa-atlas",
            searchTerms: [ "book", "directions", "geography", "map", "wayfinding" ]
        }, {
            title: "fas fa-atom",
            searchTerms: [ "atheism", "chemistry", "science" ]
        }, {
            title: "fab fa-audible",
            searchTerms: []
        }, {
            title: "fas fa-audio-description",
            searchTerms: []
        }, {
            title: "fab fa-autoprefixer",
            searchTerms: []
        }, {
            title: "fab fa-avianex",
            searchTerms: []
        }, {
            title: "fab fa-aviato",
            searchTerms: []
        }, {
            title: "fas fa-award",
            searchTerms: [ "honor", "praise", "prize", "recognition", "ribbon" ]
        }, {
            title: "fab fa-aws",
            searchTerms: []
        }, {
            title: "fas fa-backspace",
            searchTerms: [ "command", "delete", "keyboard", "undo" ]
        }, {
            title: "fas fa-backward",
            searchTerms: [ "previous", "rewind" ]
        }, {
            title: "fas fa-balance-scale",
            searchTerms: [ "balanced", "justice", "legal", "measure", "weight" ]
        }, {
            title: "fas fa-ban",
            searchTerms: [ "abort", "ban", "block", "cancel", "delete", "hide", "prohibit", "remove", "stop", "trash" ]
        }, {
            title: "fas fa-band-aid",
            searchTerms: [ "bandage", "boo boo", "ouch" ]
        }, {
            title: "fab fa-bandcamp",
            searchTerms: []
        }, {
            title: "fas fa-barcode",
            searchTerms: [ "scan" ]
        }, {
            title: "fas fa-bars",
            searchTerms: [ "checklist", "drag", "hamburger", "list", "menu", "nav", "navigation", "ol", "reorder", "settings", "todo", "ul" ]
        }, {
            title: "fas fa-baseball-ball",
            searchTerms: []
        }, {
            title: "fas fa-basketball-ball",
            searchTerms: []
        }, {
            title: "fas fa-bath",
            searchTerms: []
        }, {
            title: "fas fa-battery-empty",
            searchTerms: [ "power", "status" ]
        }, {
            title: "fas fa-battery-full",
            searchTerms: [ "power", "status" ]
        }, {
            title: "fas fa-battery-half",
            searchTerms: [ "power", "status" ]
        }, {
            title: "fas fa-battery-quarter",
            searchTerms: [ "power", "status" ]
        }, {
            title: "fas fa-battery-three-quarters",
            searchTerms: [ "power", "status" ]
        }, {
            title: "fas fa-bed",
            searchTerms: [ "lodging", "sleep", "travel" ]
        }, {
            title: "fas fa-beer",
            searchTerms: [ "alcohol", "bar", "beverage", "drink", "liquor", "mug", "stein" ]
        }, {
            title: "fab fa-behance",
            searchTerms: []
        }, {
            title: "fab fa-behance-square",
            searchTerms: []
        }, {
            title: "fas fa-bell",
            searchTerms: [ "alert", "notification", "reminder" ]
        }, {
            title: "far fa-bell",
            searchTerms: [ "alert", "notification", "reminder" ]
        }, {
            title: "fas fa-bell-slash",
            searchTerms: []
        }, {
            title: "far fa-bell-slash",
            searchTerms: []
        }, {
            title: "fas fa-bezier-curve",
            searchTerms: [ "curves", "illustrator", "lines", "path", "vector" ]
        }, {
            title: "fas fa-bible",
            searchTerms: [ "book", "catholicism", "christianity" ]
        }, {
            title: "fas fa-bicycle",
            searchTerms: [ "bike", "gears", "transportation", "vehicle" ]
        }, {
            title: "fab fa-bimobject",
            searchTerms: []
        }, {
            title: "fas fa-binoculars",
            searchTerms: []
        }, {
            title: "fas fa-birthday-cake",
            searchTerms: []
        }, {
            title: "fab fa-bitbucket",
            searchTerms: [ "bitbucket-square", "git" ]
        }, {
            title: "fab fa-bitcoin",
            searchTerms: []
        }, {
            title: "fab fa-bity",
            searchTerms: []
        }, {
            title: "fab fa-black-tie",
            searchTerms: []
        }, {
            title: "fab fa-blackberry",
            searchTerms: []
        }, {
            title: "fas fa-blender",
            searchTerms: []
        }, {
            title: "fas fa-blender-phone",
            searchTerms: [ "appliance", "fantasy", "silly" ]
        }, {
            title: "fas fa-blind",
            searchTerms: []
        }, {
            title: "fab fa-blogger",
            searchTerms: []
        }, {
            title: "fab fa-blogger-b",
            searchTerms: []
        }, {
            title: "fab fa-bluetooth",
            searchTerms: []
        }, {
            title: "fab fa-bluetooth-b",
            searchTerms: []
        }, {
            title: "fas fa-bold",
            searchTerms: []
        }, {
            title: "fas fa-bolt",
            searchTerms: [ "electricity", "lightning", "weather", "zap" ]
        }, {
            title: "fas fa-bomb",
            searchTerms: []
        }, {
            title: "fas fa-bone",
            searchTerms: []
        }, {
            title: "fas fa-bong",
            searchTerms: [ "aparatus", "cannabis", "marijuana", "pipe", "smoke", "smoking" ]
        }, {
            title: "fas fa-book",
            searchTerms: [ "documentation", "read" ]
        }, {
            title: "fas fa-book-dead",
            searchTerms: [ "Dungeons & Dragons", "crossbones", "d&d", "dark arts", "death", "dnd", "documentation", "evil", "fantasy", "halloween", "holiday", "read", "skull", "spell" ]
        }, {
            title: "fas fa-book-open",
            searchTerms: [ "flyer", "notebook", "open book", "pamphlet", "reading" ]
        }, {
            title: "fas fa-book-reader",
            searchTerms: [ "library" ]
        }, {
            title: "fas fa-bookmark",
            searchTerms: [ "save" ]
        }, {
            title: "far fa-bookmark",
            searchTerms: [ "save" ]
        }, {
            title: "fas fa-bowling-ball",
            searchTerms: []
        }, {
            title: "fas fa-box",
            searchTerms: [ "package" ]
        }, {
            title: "fas fa-box-open",
            searchTerms: []
        }, {
            title: "fas fa-boxes",
            searchTerms: []
        }, {
            title: "fas fa-braille",
            searchTerms: []
        }, {
            title: "fas fa-brain",
            searchTerms: [ "cerebellum", "gray matter", "intellect", "medulla oblongata", "mind", "noodle", "wit" ]
        }, {
            title: "fas fa-briefcase",
            searchTerms: [ "bag", "business", "luggage", "office", "work" ]
        }, {
            title: "fas fa-briefcase-medical",
            searchTerms: [ "health briefcase" ]
        }, {
            title: "fas fa-broadcast-tower",
            searchTerms: [ "airwaves", "radio", "waves" ]
        }, {
            title: "fas fa-broom",
            searchTerms: [ "clean", "firebolt", "fly", "halloween", "holiday", "nimbus 2000", "quidditch", "sweep", "witch" ]
        }, {
            title: "fas fa-brush",
            searchTerms: [ "bristles", "color", "handle", "painting" ]
        }, {
            title: "fab fa-btc",
            searchTerms: []
        }, {
            title: "fas fa-bug",
            searchTerms: [ "insect", "report" ]
        }, {
            title: "fas fa-building",
            searchTerms: [ "apartment", "business", "company", "office", "work" ]
        }, {
            title: "far fa-building",
            searchTerms: [ "apartment", "business", "company", "office", "work" ]
        }, {
            title: "fas fa-bullhorn",
            searchTerms: [ "announcement", "broadcast", "louder", "megaphone", "share" ]
        }, {
            title: "fas fa-bullseye",
            searchTerms: [ "target" ]
        }, {
            title: "fas fa-burn",
            searchTerms: [ "energy" ]
        }, {
            title: "fab fa-buromobelexperte",
            searchTerms: []
        }, {
            title: "fas fa-bus",
            searchTerms: [ "machine", "public transportation", "transportation", "vehicle" ]
        }, {
            title: "fas fa-bus-alt",
            searchTerms: [ "machine", "public transportation", "transportation", "vehicle" ]
        }, {
            title: "fas fa-business-time",
            searchTerms: [ "briefcase", "business socks", "clock", "flight of the conchords", "wednesday" ]
        }, {
            title: "fab fa-buysellads",
            searchTerms: []
        }, {
            title: "fas fa-calculator",
            searchTerms: []
        }, {
            title: "fas fa-calendar",
            searchTerms: [ "calendar-o", "date", "event", "schedule", "time", "when" ]
        }, {
            title: "far fa-calendar",
            searchTerms: [ "calendar-o", "date", "event", "schedule", "time", "when" ]
        }, {
            title: "fas fa-calendar-alt",
            searchTerms: [ "calendar", "date", "event", "schedule", "time", "when" ]
        }, {
            title: "far fa-calendar-alt",
            searchTerms: [ "calendar", "date", "event", "schedule", "time", "when" ]
        }, {
            title: "fas fa-calendar-check",
            searchTerms: [ "accept", "agree", "appointment", "confirm", "correct", "done", "ok", "select", "success", "todo" ]
        }, {
            title: "far fa-calendar-check",
            searchTerms: [ "accept", "agree", "appointment", "confirm", "correct", "done", "ok", "select", "success", "todo" ]
        }, {
            title: "fas fa-calendar-minus",
            searchTerms: [ "delete", "negative", "remove" ]
        }, {
            title: "far fa-calendar-minus",
            searchTerms: [ "delete", "negative", "remove" ]
        }, {
            title: "fas fa-calendar-plus",
            searchTerms: [ "add", "create", "new", "positive" ]
        }, {
            title: "far fa-calendar-plus",
            searchTerms: [ "add", "create", "new", "positive" ]
        }, {
            title: "fas fa-calendar-times",
            searchTerms: [ "archive", "delete", "remove", "x" ]
        }, {
            title: "far fa-calendar-times",
            searchTerms: [ "archive", "delete", "remove", "x" ]
        }, {
            title: "fas fa-camera",
            searchTerms: [ "photo", "picture", "record" ]
        }, {
            title: "fas fa-camera-retro",
            searchTerms: [ "photo", "picture", "record" ]
        }, {
            title: "fas fa-campground",
            searchTerms: [ "camping", "fall", "outdoors", "seasonal", "tent" ]
        }, {
            title: "fas fa-cannabis",
            searchTerms: [ "bud", "chronic", "drugs", "endica", "endo", "ganja", "marijuana", "mary jane", "pot", "reefer", "sativa", "spliff", "weed", "whacky-tabacky" ]
        }, {
            title: "fas fa-capsules",
            searchTerms: [ "drugs", "medicine" ]
        }, {
            title: "fas fa-car",
            searchTerms: [ "machine", "transportation", "vehicle" ]
        }, {
            title: "fas fa-car-alt",
            searchTerms: []
        }, {
            title: "fas fa-car-battery",
            searchTerms: []
        }, {
            title: "fas fa-car-crash",
            searchTerms: []
        }, {
            title: "fas fa-car-side",
            searchTerms: []
        }, {
            title: "fas fa-caret-down",
            searchTerms: [ "arrow", "dropdown", "menu", "more", "triangle down" ]
        }, {
            title: "fas fa-caret-left",
            searchTerms: [ "arrow", "back", "previous", "triangle left" ]
        }, {
            title: "fas fa-caret-right",
            searchTerms: [ "arrow", "forward", "next", "triangle right" ]
        }, {
            title: "fas fa-caret-square-down",
            searchTerms: [ "caret-square-o-down", "dropdown", "menu", "more" ]
        }, {
            title: "far fa-caret-square-down",
            searchTerms: [ "caret-square-o-down", "dropdown", "menu", "more" ]
        }, {
            title: "fas fa-caret-square-left",
            searchTerms: [ "back", "caret-square-o-left", "previous" ]
        }, {
            title: "far fa-caret-square-left",
            searchTerms: [ "back", "caret-square-o-left", "previous" ]
        }, {
            title: "fas fa-caret-square-right",
            searchTerms: [ "caret-square-o-right", "forward", "next" ]
        }, {
            title: "far fa-caret-square-right",
            searchTerms: [ "caret-square-o-right", "forward", "next" ]
        }, {
            title: "fas fa-caret-square-up",
            searchTerms: [ "caret-square-o-up" ]
        }, {
            title: "far fa-caret-square-up",
            searchTerms: [ "caret-square-o-up" ]
        }, {
            title: "fas fa-caret-up",
            searchTerms: [ "arrow", "triangle up" ]
        }, {
            title: "fas fa-cart-arrow-down",
            searchTerms: [ "shopping" ]
        }, {
            title: "fas fa-cart-plus",
            searchTerms: [ "add", "create", "new", "positive", "shopping" ]
        }, {
            title: "fas fa-cat",
            searchTerms: [ "feline", "halloween", "holiday", "kitten", "kitty", "meow", "pet" ]
        }, {
            title: "fab fa-cc-amazon-pay",
            searchTerms: []
        }, {
            title: "fab fa-cc-amex",
            searchTerms: [ "amex" ]
        }, {
            title: "fab fa-cc-apple-pay",
            searchTerms: []
        }, {
            title: "fab fa-cc-diners-club",
            searchTerms: []
        }, {
            title: "fab fa-cc-discover",
            searchTerms: []
        }, {
            title: "fab fa-cc-jcb",
            searchTerms: []
        }, {
            title: "fab fa-cc-mastercard",
            searchTerms: []
        }, {
            title: "fab fa-cc-paypal",
            searchTerms: []
        }, {
            title: "fab fa-cc-stripe",
            searchTerms: []
        }, {
            title: "fab fa-cc-visa",
            searchTerms: []
        }, {
            title: "fab fa-centercode",
            searchTerms: []
        }, {
            title: "fas fa-certificate",
            searchTerms: [ "badge", "star" ]
        }, {
            title: "fas fa-chair",
            searchTerms: [ "furniture", "seat" ]
        }, {
            title: "fas fa-chalkboard",
            searchTerms: [ "blackboard", "learning", "school", "teaching", "whiteboard", "writing" ]
        }, {
            title: "fas fa-chalkboard-teacher",
            searchTerms: [ "blackboard", "instructor", "learning", "professor", "school", "whiteboard", "writing" ]
        }, {
            title: "fas fa-charging-station",
            searchTerms: []
        }, {
            title: "fas fa-chart-area",
            searchTerms: [ "analytics", "area-chart", "graph" ]
        }, {
            title: "fas fa-chart-bar",
            searchTerms: [ "analytics", "bar-chart", "graph" ]
        }, {
            title: "far fa-chart-bar",
            searchTerms: [ "analytics", "bar-chart", "graph" ]
        }, {
            title: "fas fa-chart-line",
            searchTerms: [ "activity", "analytics", "dashboard", "graph", "line-chart" ]
        }, {
            title: "fas fa-chart-pie",
            searchTerms: [ "analytics", "graph", "pie-chart" ]
        }, {
            title: "fas fa-check",
            searchTerms: [ "accept", "agree", "checkmark", "confirm", "correct", "done", "notice", "notification", "notify", "ok", "select", "success", "tick", "todo", "yes" ]
        }, {
            title: "fas fa-check-circle",
            searchTerms: [ "accept", "agree", "confirm", "correct", "done", "ok", "select", "success", "todo", "yes" ]
        }, {
            title: "far fa-check-circle",
            searchTerms: [ "accept", "agree", "confirm", "correct", "done", "ok", "select", "success", "todo", "yes" ]
        }, {
            title: "fas fa-check-double",
            searchTerms: [ "accept", "agree", "checkmark", "confirm", "correct", "done", "notice", "notification", "notify", "ok", "select", "success", "tick", "todo" ]
        }, {
            title: "fas fa-check-square",
            searchTerms: [ "accept", "agree", "checkmark", "confirm", "correct", "done", "ok", "select", "success", "todo", "yes" ]
        }, {
            title: "far fa-check-square",
            searchTerms: [ "accept", "agree", "checkmark", "confirm", "correct", "done", "ok", "select", "success", "todo", "yes" ]
        }, {
            title: "fas fa-chess",
            searchTerms: []
        }, {
            title: "fas fa-chess-bishop",
            searchTerms: []
        }, {
            title: "fas fa-chess-board",
            searchTerms: []
        }, {
            title: "fas fa-chess-king",
            searchTerms: []
        }, {
            title: "fas fa-chess-knight",
            searchTerms: []
        }, {
            title: "fas fa-chess-pawn",
            searchTerms: []
        }, {
            title: "fas fa-chess-queen",
            searchTerms: []
        }, {
            title: "fas fa-chess-rook",
            searchTerms: []
        }, {
            title: "fas fa-chevron-circle-down",
            searchTerms: [ "arrow", "dropdown", "menu", "more" ]
        }, {
            title: "fas fa-chevron-circle-left",
            searchTerms: [ "arrow", "back", "previous" ]
        }, {
            title: "fas fa-chevron-circle-right",
            searchTerms: [ "arrow", "forward", "next" ]
        }, {
            title: "fas fa-chevron-circle-up",
            searchTerms: [ "arrow" ]
        }, {
            title: "fas fa-chevron-down",
            searchTerms: []
        }, {
            title: "fas fa-chevron-left",
            searchTerms: [ "back", "bracket", "previous" ]
        }, {
            title: "fas fa-chevron-right",
            searchTerms: [ "bracket", "forward", "next" ]
        }, {
            title: "fas fa-chevron-up",
            searchTerms: []
        }, {
            title: "fas fa-child",
            searchTerms: []
        }, {
            title: "fab fa-chrome",
            searchTerms: [ "browser" ]
        }, {
            title: "fas fa-church",
            searchTerms: [ "building", "community", "religion" ]
        }, {
            title: "fas fa-circle",
            searchTerms: [ "circle-thin", "dot", "notification" ]
        }, {
            title: "far fa-circle",
            searchTerms: [ "circle-thin", "dot", "notification" ]
        }, {
            title: "fas fa-circle-notch",
            searchTerms: [ "circle-o-notch" ]
        }, {
            title: "fas fa-city",
            searchTerms: [ "buildings", "busy", "skyscrapers", "urban", "windows" ]
        }, {
            title: "fas fa-clipboard",
            searchTerms: [ "paste" ]
        }, {
            title: "far fa-clipboard",
            searchTerms: [ "paste" ]
        }, {
            title: "fas fa-clipboard-check",
            searchTerms: [ "accept", "agree", "confirm", "done", "ok", "select", "success", "todo", "yes" ]
        }, {
            title: "fas fa-clipboard-list",
            searchTerms: [ "checklist", "completed", "done", "finished", "intinerary", "ol", "schedule", "todo", "ul" ]
        }, {
            title: "fas fa-clock",
            searchTerms: [ "date", "late", "schedule", "timer", "timestamp", "watch" ]
        }, {
            title: "far fa-clock",
            searchTerms: [ "date", "late", "schedule", "timer", "timestamp", "watch" ]
        }, {
            title: "fas fa-clone",
            searchTerms: [ "copy", "duplicate" ]
        }, {
            title: "far fa-clone",
            searchTerms: [ "copy", "duplicate" ]
        }, {
            title: "fas fa-closed-captioning",
            searchTerms: [ "cc" ]
        }, {
            title: "far fa-closed-captioning",
            searchTerms: [ "cc" ]
        }, {
            title: "fas fa-cloud",
            searchTerms: [ "save" ]
        }, {
            title: "fas fa-cloud-download-alt",
            searchTerms: [ "import" ]
        }, {
            title: "fas fa-cloud-meatball",
            searchTerms: []
        }, {
            title: "fas fa-cloud-moon",
            searchTerms: [ "crescent", "evening", "halloween", "holiday", "lunar", "night", "sky" ]
        }, {
            title: "fas fa-cloud-moon-rain",
            searchTerms: []
        }, {
            title: "fas fa-cloud-rain",
            searchTerms: [ "precipitation" ]
        }, {
            title: "fas fa-cloud-showers-heavy",
            searchTerms: [ "precipitation", "rain", "storm" ]
        }, {
            title: "fas fa-cloud-sun",
            searchTerms: [ "day", "daytime", "fall", "outdoors", "seasonal" ]
        }, {
            title: "fas fa-cloud-sun-rain",
            searchTerms: []
        }, {
            title: "fas fa-cloud-upload-alt",
            searchTerms: [ "cloud-upload" ]
        }, {
            title: "fab fa-cloudscale",
            searchTerms: []
        }, {
            title: "fab fa-cloudsmith",
            searchTerms: []
        }, {
            title: "fab fa-cloudversify",
            searchTerms: []
        }, {
            title: "fas fa-cocktail",
            searchTerms: [ "alcohol", "beverage", "drink" ]
        }, {
            title: "fas fa-code",
            searchTerms: [ "brackets", "html" ]
        }, {
            title: "fas fa-code-branch",
            searchTerms: [ "branch", "code-fork", "fork", "git", "github", "rebase", "svn", "vcs", "version" ]
        }, {
            title: "fab fa-codepen",
            searchTerms: []
        }, {
            title: "fab fa-codiepie",
            searchTerms: []
        }, {
            title: "fas fa-coffee",
            searchTerms: [ "beverage", "breakfast", "cafe", "drink", "fall", "morning", "mug", "seasonal", "tea" ]
        }, {
            title: "fas fa-cog",
            searchTerms: [ "settings" ]
        }, {
            title: "fas fa-cogs",
            searchTerms: [ "gears", "settings" ]
        }, {
            title: "fas fa-coins",
            searchTerms: []
        }, {
            title: "fas fa-columns",
            searchTerms: [ "dashboard", "panes", "split" ]
        }, {
            title: "fas fa-comment",
            searchTerms: [ "bubble", "chat", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "far fa-comment",
            searchTerms: [ "bubble", "chat", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "fas fa-comment-alt",
            searchTerms: [ "bubble", "chat", "commenting", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "far fa-comment-alt",
            searchTerms: [ "bubble", "chat", "commenting", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "fas fa-comment-dollar",
            searchTerms: []
        }, {
            title: "fas fa-comment-dots",
            searchTerms: []
        }, {
            title: "far fa-comment-dots",
            searchTerms: []
        }, {
            title: "fas fa-comment-slash",
            searchTerms: []
        }, {
            title: "fas fa-comments",
            searchTerms: [ "bubble", "chat", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "far fa-comments",
            searchTerms: [ "bubble", "chat", "conversation", "feedback", "message", "note", "notification", "sms", "speech", "texting" ]
        }, {
            title: "fas fa-comments-dollar",
            searchTerms: []
        }, {
            title: "fas fa-compact-disc",
            searchTerms: [ "bluray", "cd", "disc", "media" ]
        }, {
            title: "fas fa-compass",
            searchTerms: [ "directory", "location", "menu", "safari" ]
        }, {
            title: "far fa-compass",
            searchTerms: [ "directory", "location", "menu", "safari" ]
        }, {
            title: "fas fa-compress",
            searchTerms: [ "collapse", "combine", "contract", "merge", "smaller" ]
        }, {
            title: "fas fa-concierge-bell",
            searchTerms: [ "attention", "hotel", "service", "support" ]
        }, {
            title: "fab fa-connectdevelop",
            searchTerms: []
        }, {
            title: "fab fa-contao",
            searchTerms: []
        }, {
            title: "fas fa-cookie",
            searchTerms: [ "baked good", "chips", "food", "snack", "sweet", "treat" ]
        }, {
            title: "fas fa-cookie-bite",
            searchTerms: [ "baked good", "bitten", "chips", "eating", "food", "snack", "sweet", "treat" ]
        }, {
            title: "fas fa-copy",
            searchTerms: [ "clone", "duplicate", "file", "files-o" ]
        }, {
            title: "far fa-copy",
            searchTerms: [ "clone", "duplicate", "file", "files-o" ]
        }, {
            title: "fas fa-copyright",
            searchTerms: []
        }, {
            title: "far fa-copyright",
            searchTerms: []
        }, {
            title: "fas fa-couch",
            searchTerms: [ "furniture", "sofa" ]
        }, {
            title: "fab fa-cpanel",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-by",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-nc",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-nc-eu",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-nc-jp",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-nd",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-pd",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-pd-alt",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-remix",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-sa",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-sampling",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-sampling-plus",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-share",
            searchTerms: []
        }, {
            title: "fab fa-creative-commons-zero",
            searchTerms: []
        }, {
            title: "fas fa-credit-card",
            searchTerms: [ "buy", "checkout", "credit-card-alt", "debit", "money", "payment", "purchase" ]
        }, {
            title: "far fa-credit-card",
            searchTerms: [ "buy", "checkout", "credit-card-alt", "debit", "money", "payment", "purchase" ]
        }, {
            title: "fab fa-critical-role",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "game", "gaming", "tabletop" ]
        }, {
            title: "fas fa-crop",
            searchTerms: [ "design" ]
        }, {
            title: "fas fa-crop-alt",
            searchTerms: []
        }, {
            title: "fas fa-cross",
            searchTerms: [ "catholicism", "christianity" ]
        }, {
            title: "fas fa-crosshairs",
            searchTerms: [ "gpd", "picker", "position" ]
        }, {
            title: "fas fa-crow",
            searchTerms: [ "bird", "bullfrog", "fauna", "halloween", "holiday", "toad" ]
        }, {
            title: "fas fa-crown",
            searchTerms: []
        }, {
            title: "fab fa-css3",
            searchTerms: [ "code" ]
        }, {
            title: "fab fa-css3-alt",
            searchTerms: []
        }, {
            title: "fas fa-cube",
            searchTerms: [ "package" ]
        }, {
            title: "fas fa-cubes",
            searchTerms: [ "packages" ]
        }, {
            title: "fas fa-cut",
            searchTerms: [ "scissors" ]
        }, {
            title: "fab fa-cuttlefish",
            searchTerms: []
        }, {
            title: "fab fa-d-and-d",
            searchTerms: []
        }, {
            title: "fab fa-d-and-d-beyond",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "gaming", "tabletop" ]
        }, {
            title: "fab fa-dashcube",
            searchTerms: []
        }, {
            title: "fas fa-database",
            searchTerms: []
        }, {
            title: "fas fa-deaf",
            searchTerms: []
        }, {
            title: "fab fa-delicious",
            searchTerms: []
        }, {
            title: "fas fa-democrat",
            searchTerms: [ "american", "democratic party", "donkey", "election", "left", "left-wing", "liberal", "politics", "usa" ]
        }, {
            title: "fab fa-deploydog",
            searchTerms: []
        }, {
            title: "fab fa-deskpro",
            searchTerms: []
        }, {
            title: "fas fa-desktop",
            searchTerms: [ "computer", "cpu", "demo", "desktop", "device", "machine", "monitor", "pc", "screen" ]
        }, {
            title: "fab fa-dev",
            searchTerms: []
        }, {
            title: "fab fa-deviantart",
            searchTerms: []
        }, {
            title: "fas fa-dharmachakra",
            searchTerms: [ "buddhism", "buddhist", "wheel of dharma" ]
        }, {
            title: "fas fa-diagnoses",
            searchTerms: []
        }, {
            title: "fas fa-dice",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-d20",
            searchTerms: [ "Dungeons & Dragons", "chance", "d&d", "dnd", "fantasy", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-d6",
            searchTerms: [ "Dungeons & Dragons", "chance", "d&d", "dnd", "fantasy", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-five",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-four",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-one",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-six",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-three",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fas fa-dice-two",
            searchTerms: [ "chance", "gambling", "game", "roll" ]
        }, {
            title: "fab fa-digg",
            searchTerms: []
        }, {
            title: "fab fa-digital-ocean",
            searchTerms: []
        }, {
            title: "fas fa-digital-tachograph",
            searchTerms: []
        }, {
            title: "fas fa-directions",
            searchTerms: []
        }, {
            title: "fab fa-discord",
            searchTerms: []
        }, {
            title: "fab fa-discourse",
            searchTerms: []
        }, {
            title: "fas fa-divide",
            searchTerms: []
        }, {
            title: "fas fa-dizzy",
            searchTerms: [ "dazed", "disapprove", "emoticon", "face" ]
        }, {
            title: "far fa-dizzy",
            searchTerms: [ "dazed", "disapprove", "emoticon", "face" ]
        }, {
            title: "fas fa-dna",
            searchTerms: [ "double helix", "helix" ]
        }, {
            title: "fab fa-dochub",
            searchTerms: []
        }, {
            title: "fab fa-docker",
            searchTerms: []
        }, {
            title: "fas fa-dog",
            searchTerms: [ "canine", "fauna", "mammmal", "pet", "pooch", "puppy", "woof" ]
        }, {
            title: "fas fa-dollar-sign",
            searchTerms: [ "$", "dollar-sign", "money", "price", "usd" ]
        }, {
            title: "fas fa-dolly",
            searchTerms: []
        }, {
            title: "fas fa-dolly-flatbed",
            searchTerms: []
        }, {
            title: "fas fa-donate",
            searchTerms: [ "generosity", "give" ]
        }, {
            title: "fas fa-door-closed",
            searchTerms: []
        }, {
            title: "fas fa-door-open",
            searchTerms: []
        }, {
            title: "fas fa-dot-circle",
            searchTerms: [ "bullseye", "notification", "target" ]
        }, {
            title: "far fa-dot-circle",
            searchTerms: [ "bullseye", "notification", "target" ]
        }, {
            title: "fas fa-dove",
            searchTerms: [ "bird", "fauna", "flying", "peace" ]
        }, {
            title: "fas fa-download",
            searchTerms: [ "import" ]
        }, {
            title: "fab fa-draft2digital",
            searchTerms: []
        }, {
            title: "fas fa-drafting-compass",
            searchTerms: [ "mechanical drawing", "plot", "plotting" ]
        }, {
            title: "fas fa-dragon",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy" ]
        }, {
            title: "fas fa-draw-polygon",
            searchTerms: []
        }, {
            title: "fab fa-dribbble",
            searchTerms: []
        }, {
            title: "fab fa-dribbble-square",
            searchTerms: []
        }, {
            title: "fab fa-dropbox",
            searchTerms: []
        }, {
            title: "fas fa-drum",
            searchTerms: [ "instrument", "music", "percussion", "snare", "sound" ]
        }, {
            title: "fas fa-drum-steelpan",
            searchTerms: [ "calypso", "instrument", "music", "percussion", "reggae", "snare", "sound", "steel", "tropical" ]
        }, {
            title: "fas fa-drumstick-bite",
            searchTerms: []
        }, {
            title: "fab fa-drupal",
            searchTerms: []
        }, {
            title: "fas fa-dumbbell",
            searchTerms: [ "exercise", "gym", "strength", "weight", "weight-lifting" ]
        }, {
            title: "fas fa-dungeon",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "door", "entrance", "fantasy", "gate" ]
        }, {
            title: "fab fa-dyalog",
            searchTerms: []
        }, {
            title: "fab fa-earlybirds",
            searchTerms: []
        }, {
            title: "fab fa-ebay",
            searchTerms: []
        }, {
            title: "fab fa-edge",
            searchTerms: [ "browser", "ie" ]
        }, {
            title: "fas fa-edit",
            searchTerms: [ "edit", "pen", "pencil", "update", "write" ]
        }, {
            title: "far fa-edit",
            searchTerms: [ "edit", "pen", "pencil", "update", "write" ]
        }, {
            title: "fas fa-eject",
            searchTerms: []
        }, {
            title: "fab fa-elementor",
            searchTerms: []
        }, {
            title: "fas fa-ellipsis-h",
            searchTerms: [ "dots", "drag", "kebab", "list", "menu", "nav", "navigation", "ol", "reorder", "settings", "ul" ]
        }, {
            title: "fas fa-ellipsis-v",
            searchTerms: [ "dots", "drag", "kebab", "list", "menu", "nav", "navigation", "ol", "reorder", "settings", "ul" ]
        }, {
            title: "fab fa-ello",
            searchTerms: []
        }, {
            title: "fab fa-ember",
            searchTerms: []
        }, {
            title: "fab fa-empire",
            searchTerms: []
        }, {
            title: "fas fa-envelope",
            searchTerms: [ "e-mail", "email", "letter", "mail", "message", "notification", "support" ]
        }, {
            title: "far fa-envelope",
            searchTerms: [ "e-mail", "email", "letter", "mail", "message", "notification", "support" ]
        }, {
            title: "fas fa-envelope-open",
            searchTerms: [ "e-mail", "email", "letter", "mail", "message", "notification", "support" ]
        }, {
            title: "far fa-envelope-open",
            searchTerms: [ "e-mail", "email", "letter", "mail", "message", "notification", "support" ]
        }, {
            title: "fas fa-envelope-open-text",
            searchTerms: []
        }, {
            title: "fas fa-envelope-square",
            searchTerms: [ "e-mail", "email", "letter", "mail", "message", "notification", "support" ]
        }, {
            title: "fab fa-envira",
            searchTerms: [ "leaf" ]
        }, {
            title: "fas fa-equals",
            searchTerms: []
        }, {
            title: "fas fa-eraser",
            searchTerms: [ "delete", "remove" ]
        }, {
            title: "fab fa-erlang",
            searchTerms: []
        }, {
            title: "fab fa-ethereum",
            searchTerms: []
        }, {
            title: "fab fa-etsy",
            searchTerms: []
        }, {
            title: "fas fa-euro-sign",
            searchTerms: [ "eur" ]
        }, {
            title: "fas fa-exchange-alt",
            searchTerms: [ "arrow", "arrows", "exchange", "reciprocate", "return", "swap", "transfer" ]
        }, {
            title: "fas fa-exclamation",
            searchTerms: [ "alert", "danger", "error", "important", "notice", "notification", "notify", "problem", "warning" ]
        }, {
            title: "fas fa-exclamation-circle",
            searchTerms: [ "alert", "danger", "error", "important", "notice", "notification", "notify", "problem", "warning" ]
        }, {
            title: "fas fa-exclamation-triangle",
            searchTerms: [ "alert", "danger", "error", "important", "notice", "notification", "notify", "problem", "warning" ]
        }, {
            title: "fas fa-expand",
            searchTerms: [ "bigger", "enlarge", "resize" ]
        }, {
            title: "fas fa-expand-arrows-alt",
            searchTerms: [ "arrows-alt", "bigger", "enlarge", "move", "resize" ]
        }, {
            title: "fab fa-expeditedssl",
            searchTerms: []
        }, {
            title: "fas fa-external-link-alt",
            searchTerms: [ "external-link", "new", "open" ]
        }, {
            title: "fas fa-external-link-square-alt",
            searchTerms: [ "external-link-square", "new", "open" ]
        }, {
            title: "fas fa-eye",
            searchTerms: [ "optic", "see", "seen", "show", "sight", "views", "visible" ]
        }, {
            title: "far fa-eye",
            searchTerms: [ "optic", "see", "seen", "show", "sight", "views", "visible" ]
        }, {
            title: "fas fa-eye-dropper",
            searchTerms: [ "eyedropper" ]
        }, {
            title: "fas fa-eye-slash",
            searchTerms: [ "blind", "hide", "show", "toggle", "unseen", "views", "visible", "visiblity" ]
        }, {
            title: "far fa-eye-slash",
            searchTerms: [ "blind", "hide", "show", "toggle", "unseen", "views", "visible", "visiblity" ]
        }, {
            title: "fab fa-facebook",
            searchTerms: [ "facebook-official", "social network" ]
        }, {
            title: "fab fa-facebook-f",
            searchTerms: [ "facebook" ]
        }, {
            title: "fab fa-facebook-messenger",
            searchTerms: []
        }, {
            title: "fab fa-facebook-square",
            searchTerms: [ "social network" ]
        }, {
            title: "fab fa-fantasy-flight-games",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "game", "gaming", "tabletop" ]
        }, {
            title: "fas fa-fast-backward",
            searchTerms: [ "beginning", "first", "previous", "rewind", "start" ]
        }, {
            title: "fas fa-fast-forward",
            searchTerms: [ "end", "last", "next" ]
        }, {
            title: "fas fa-fax",
            searchTerms: []
        }, {
            title: "fas fa-feather",
            searchTerms: [ "bird", "light", "plucked", "quill" ]
        }, {
            title: "fas fa-feather-alt",
            searchTerms: [ "bird", "light", "plucked", "quill" ]
        }, {
            title: "fas fa-female",
            searchTerms: [ "human", "person", "profile", "user", "woman" ]
        }, {
            title: "fas fa-fighter-jet",
            searchTerms: [ "airplane", "fast", "fly", "goose", "maverick", "plane", "quick", "top gun", "transportation", "travel" ]
        }, {
            title: "fas fa-file",
            searchTerms: [ "document", "new", "page", "pdf", "resume" ]
        }, {
            title: "far fa-file",
            searchTerms: [ "document", "new", "page", "pdf", "resume" ]
        }, {
            title: "fas fa-file-alt",
            searchTerms: [ "document", "file-text", "invoice", "new", "page", "pdf" ]
        }, {
            title: "far fa-file-alt",
            searchTerms: [ "document", "file-text", "invoice", "new", "page", "pdf" ]
        }, {
            title: "fas fa-file-archive",
            searchTerms: [ ".zip", "bundle", "compress", "compression", "download", "zip" ]
        }, {
            title: "far fa-file-archive",
            searchTerms: [ ".zip", "bundle", "compress", "compression", "download", "zip" ]
        }, {
            title: "fas fa-file-audio",
            searchTerms: []
        }, {
            title: "far fa-file-audio",
            searchTerms: []
        }, {
            title: "fas fa-file-code",
            searchTerms: []
        }, {
            title: "far fa-file-code",
            searchTerms: []
        }, {
            title: "fas fa-file-contract",
            searchTerms: [ "agreement", "binding", "document", "legal", "signature" ]
        }, {
            title: "fas fa-file-csv",
            searchTerms: [ "spreadsheets" ]
        }, {
            title: "fas fa-file-download",
            searchTerms: []
        }, {
            title: "fas fa-file-excel",
            searchTerms: []
        }, {
            title: "far fa-file-excel",
            searchTerms: []
        }, {
            title: "fas fa-file-export",
            searchTerms: []
        }, {
            title: "fas fa-file-image",
            searchTerms: []
        }, {
            title: "far fa-file-image",
            searchTerms: []
        }, {
            title: "fas fa-file-import",
            searchTerms: []
        }, {
            title: "fas fa-file-invoice",
            searchTerms: [ "bill", "document", "receipt" ]
        }, {
            title: "fas fa-file-invoice-dollar",
            searchTerms: [ "$", "bill", "document", "dollar-sign", "money", "receipt", "usd" ]
        }, {
            title: "fas fa-file-medical",
            searchTerms: []
        }, {
            title: "fas fa-file-medical-alt",
            searchTerms: []
        }, {
            title: "fas fa-file-pdf",
            searchTerms: []
        }, {
            title: "far fa-file-pdf",
            searchTerms: []
        }, {
            title: "fas fa-file-powerpoint",
            searchTerms: []
        }, {
            title: "far fa-file-powerpoint",
            searchTerms: []
        }, {
            title: "fas fa-file-prescription",
            searchTerms: [ "drugs", "medical", "medicine", "rx" ]
        }, {
            title: "fas fa-file-signature",
            searchTerms: [ "John Hancock", "contract", "document", "name" ]
        }, {
            title: "fas fa-file-upload",
            searchTerms: []
        }, {
            title: "fas fa-file-video",
            searchTerms: []
        }, {
            title: "far fa-file-video",
            searchTerms: []
        }, {
            title: "fas fa-file-word",
            searchTerms: []
        }, {
            title: "far fa-file-word",
            searchTerms: []
        }, {
            title: "fas fa-fill",
            searchTerms: [ "bucket", "color", "paint", "paint bucket" ]
        }, {
            title: "fas fa-fill-drip",
            searchTerms: [ "bucket", "color", "drop", "paint", "paint bucket", "spill" ]
        }, {
            title: "fas fa-film",
            searchTerms: [ "movie" ]
        }, {
            title: "fas fa-filter",
            searchTerms: [ "funnel", "options" ]
        }, {
            title: "fas fa-fingerprint",
            searchTerms: [ "human", "id", "identification", "lock", "smudge", "touch", "unique", "unlock" ]
        }, {
            title: "fas fa-fire",
            searchTerms: [ "caliente", "flame", "heat", "hot", "popular" ]
        }, {
            title: "fas fa-fire-extinguisher",
            searchTerms: []
        }, {
            title: "fab fa-firefox",
            searchTerms: [ "browser" ]
        }, {
            title: "fas fa-first-aid",
            searchTerms: []
        }, {
            title: "fab fa-first-order",
            searchTerms: []
        }, {
            title: "fab fa-first-order-alt",
            searchTerms: []
        }, {
            title: "fab fa-firstdraft",
            searchTerms: []
        }, {
            title: "fas fa-fish",
            searchTerms: [ "fauna", "gold", "swimming" ]
        }, {
            title: "fas fa-fist-raised",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "hand", "ki", "monk", "resist", "strength", "unarmed combat" ]
        }, {
            title: "fas fa-flag",
            searchTerms: [ "country", "notice", "notification", "notify", "pole", "report", "symbol" ]
        }, {
            title: "far fa-flag",
            searchTerms: [ "country", "notice", "notification", "notify", "pole", "report", "symbol" ]
        }, {
            title: "fas fa-flag-checkered",
            searchTerms: [ "notice", "notification", "notify", "pole", "racing", "report", "symbol" ]
        }, {
            title: "fas fa-flag-usa",
            searchTerms: [ "betsy ross", "country", "old glory", "stars", "stripes", "symbol" ]
        }, {
            title: "fas fa-flask",
            searchTerms: [ "beaker", "experimental", "labs", "science" ]
        }, {
            title: "fab fa-flickr",
            searchTerms: []
        }, {
            title: "fab fa-flipboard",
            searchTerms: []
        }, {
            title: "fas fa-flushed",
            searchTerms: [ "embarrassed", "emoticon", "face" ]
        }, {
            title: "far fa-flushed",
            searchTerms: [ "embarrassed", "emoticon", "face" ]
        }, {
            title: "fab fa-fly",
            searchTerms: []
        }, {
            title: "fas fa-folder",
            searchTerms: []
        }, {
            title: "far fa-folder",
            searchTerms: []
        }, {
            title: "fas fa-folder-minus",
            searchTerms: [ "archive", "delete", "negative", "remove" ]
        }, {
            title: "fas fa-folder-open",
            searchTerms: []
        }, {
            title: "far fa-folder-open",
            searchTerms: []
        }, {
            title: "fas fa-folder-plus",
            searchTerms: [ "add", "create", "new", "positive" ]
        }, {
            title: "fas fa-font",
            searchTerms: [ "text" ]
        }, {
            title: "fab fa-font-awesome",
            searchTerms: [ "meanpath" ]
        }, {
            title: "fab fa-font-awesome-alt",
            searchTerms: []
        }, {
            title: "fab fa-font-awesome-flag",
            searchTerms: []
        }, {
            title: "far fa-font-awesome-logo-full",
            searchTerms: []
        }, {
            title: "fas fa-font-awesome-logo-full",
            searchTerms: []
        }, {
            title: "fab fa-font-awesome-logo-full",
            searchTerms: []
        }, {
            title: "fab fa-fonticons",
            searchTerms: []
        }, {
            title: "fab fa-fonticons-fi",
            searchTerms: []
        }, {
            title: "fas fa-football-ball",
            searchTerms: [ "fall", "pigskin", "seasonal" ]
        }, {
            title: "fab fa-fort-awesome",
            searchTerms: [ "castle" ]
        }, {
            title: "fab fa-fort-awesome-alt",
            searchTerms: [ "castle" ]
        }, {
            title: "fab fa-forumbee",
            searchTerms: []
        }, {
            title: "fas fa-forward",
            searchTerms: [ "forward", "next" ]
        }, {
            title: "fab fa-foursquare",
            searchTerms: []
        }, {
            title: "fab fa-free-code-camp",
            searchTerms: []
        }, {
            title: "fab fa-freebsd",
            searchTerms: []
        }, {
            title: "fas fa-frog",
            searchTerms: [ "amphibian", "bullfrog", "fauna", "hop", "kermit", "kiss", "prince", "ribbit", "toad", "wart" ]
        }, {
            title: "fas fa-frown",
            searchTerms: [ "disapprove", "emoticon", "face", "rating", "sad" ]
        }, {
            title: "far fa-frown",
            searchTerms: [ "disapprove", "emoticon", "face", "rating", "sad" ]
        }, {
            title: "fas fa-frown-open",
            searchTerms: [ "disapprove", "emoticon", "face", "rating", "sad" ]
        }, {
            title: "far fa-frown-open",
            searchTerms: [ "disapprove", "emoticon", "face", "rating", "sad" ]
        }, {
            title: "fab fa-fulcrum",
            searchTerms: []
        }, {
            title: "fas fa-funnel-dollar",
            searchTerms: []
        }, {
            title: "fas fa-futbol",
            searchTerms: [ "ball", "football", "soccer" ]
        }, {
            title: "far fa-futbol",
            searchTerms: [ "ball", "football", "soccer" ]
        }, {
            title: "fab fa-galactic-republic",
            searchTerms: [ "politics", "star wars" ]
        }, {
            title: "fab fa-galactic-senate",
            searchTerms: [ "star wars" ]
        }, {
            title: "fas fa-gamepad",
            searchTerms: [ "controller" ]
        }, {
            title: "fas fa-gas-pump",
            searchTerms: []
        }, {
            title: "fas fa-gavel",
            searchTerms: [ "hammer", "judge", "lawyer", "opinion" ]
        }, {
            title: "fas fa-gem",
            searchTerms: [ "diamond" ]
        }, {
            title: "far fa-gem",
            searchTerms: [ "diamond" ]
        }, {
            title: "fas fa-genderless",
            searchTerms: []
        }, {
            title: "fab fa-get-pocket",
            searchTerms: []
        }, {
            title: "fab fa-gg",
            searchTerms: []
        }, {
            title: "fab fa-gg-circle",
            searchTerms: []
        }, {
            title: "fas fa-ghost",
            searchTerms: [ "apparition", "blinky", "clyde", "floating", "halloween", "holiday", "inky", "pinky", "spirit" ]
        }, {
            title: "fas fa-gift",
            searchTerms: [ "generosity", "giving", "party", "present", "wrapped" ]
        }, {
            title: "fab fa-git",
            searchTerms: []
        }, {
            title: "fab fa-git-square",
            searchTerms: []
        }, {
            title: "fab fa-github",
            searchTerms: [ "octocat" ]
        }, {
            title: "fab fa-github-alt",
            searchTerms: [ "octocat" ]
        }, {
            title: "fab fa-github-square",
            searchTerms: [ "octocat" ]
        }, {
            title: "fab fa-gitkraken",
            searchTerms: []
        }, {
            title: "fab fa-gitlab",
            searchTerms: [ "Axosoft" ]
        }, {
            title: "fab fa-gitter",
            searchTerms: []
        }, {
            title: "fas fa-glass-martini",
            searchTerms: [ "alcohol", "bar", "beverage", "drink", "glass", "liquor", "martini" ]
        }, {
            title: "fas fa-glass-martini-alt",
            searchTerms: []
        }, {
            title: "fas fa-glasses",
            searchTerms: [ "foureyes", "hipster", "nerd", "reading", "sight", "spectacles" ]
        }, {
            title: "fab fa-glide",
            searchTerms: []
        }, {
            title: "fab fa-glide-g",
            searchTerms: []
        }, {
            title: "fas fa-globe",
            searchTerms: [ "all", "coordinates", "country", "earth", "global", "gps", "language", "localize", "location", "map", "online", "place", "planet", "translate", "travel", "world" ]
        }, {
            title: "fas fa-globe-africa",
            searchTerms: [ "all", "country", "earth", "global", "gps", "language", "localize", "location", "map", "online", "place", "planet", "translate", "travel", "world" ]
        }, {
            title: "fas fa-globe-americas",
            searchTerms: [ "all", "country", "earth", "global", "gps", "language", "localize", "location", "map", "online", "place", "planet", "translate", "travel", "world" ]
        }, {
            title: "fas fa-globe-asia",
            searchTerms: [ "all", "country", "earth", "global", "gps", "language", "localize", "location", "map", "online", "place", "planet", "translate", "travel", "world" ]
        }, {
            title: "fab fa-gofore",
            searchTerms: []
        }, {
            title: "fas fa-golf-ball",
            searchTerms: []
        }, {
            title: "fab fa-goodreads",
            searchTerms: []
        }, {
            title: "fab fa-goodreads-g",
            searchTerms: []
        }, {
            title: "fab fa-google",
            searchTerms: []
        }, {
            title: "fab fa-google-drive",
            searchTerms: []
        }, {
            title: "fab fa-google-play",
            searchTerms: []
        }, {
            title: "fab fa-google-plus",
            searchTerms: [ "google-plus-circle", "google-plus-official" ]
        }, {
            title: "fab fa-google-plus-g",
            searchTerms: [ "google-plus", "social network" ]
        }, {
            title: "fab fa-google-plus-square",
            searchTerms: [ "social network" ]
        }, {
            title: "fab fa-google-wallet",
            searchTerms: []
        }, {
            title: "fas fa-gopuram",
            searchTerms: [ "building", "entrance", "hinduism", "temple", "tower" ]
        }, {
            title: "fas fa-graduation-cap",
            searchTerms: [ "learning", "school", "student" ]
        }, {
            title: "fab fa-gratipay",
            searchTerms: [ "favorite", "heart", "like", "love" ]
        }, {
            title: "fab fa-grav",
            searchTerms: []
        }, {
            title: "fas fa-greater-than",
            searchTerms: []
        }, {
            title: "fas fa-greater-than-equal",
            searchTerms: []
        }, {
            title: "fas fa-grimace",
            searchTerms: [ "cringe", "emoticon", "face" ]
        }, {
            title: "far fa-grimace",
            searchTerms: [ "cringe", "emoticon", "face" ]
        }, {
            title: "fas fa-grin",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "far fa-grin",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "fas fa-grin-alt",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "far fa-grin-alt",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "fas fa-grin-beam",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "far fa-grin-beam",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "fas fa-grin-beam-sweat",
            searchTerms: [ "emoticon", "face", "smile" ]
        }, {
            title: "far fa-grin-beam-sweat",
            searchTerms: [ "emoticon", "face", "smile" ]
        }, {
            title: "fas fa-grin-hearts",
            searchTerms: [ "emoticon", "face", "love", "smile" ]
        }, {
            title: "far fa-grin-hearts",
            searchTerms: [ "emoticon", "face", "love", "smile" ]
        }, {
            title: "fas fa-grin-squint",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "far fa-grin-squint",
            searchTerms: [ "emoticon", "face", "laugh", "smile" ]
        }, {
            title: "fas fa-grin-squint-tears",
            searchTerms: [ "emoticon", "face", "happy", "smile" ]
        }, {
            title: "far fa-grin-squint-tears",
            searchTerms: [ "emoticon", "face", "happy", "smile" ]
        }, {
            title: "fas fa-grin-stars",
            searchTerms: [ "emoticon", "face", "star-struck" ]
        }, {
            title: "far fa-grin-stars",
            searchTerms: [ "emoticon", "face", "star-struck" ]
        }, {
            title: "fas fa-grin-tears",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-grin-tears",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-grin-tongue",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-grin-tongue",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-grin-tongue-squint",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-grin-tongue-squint",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-grin-tongue-wink",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-grin-tongue-wink",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-grin-wink",
            searchTerms: [ "emoticon", "face", "flirt", "laugh", "smile" ]
        }, {
            title: "far fa-grin-wink",
            searchTerms: [ "emoticon", "face", "flirt", "laugh", "smile" ]
        }, {
            title: "fas fa-grip-horizontal",
            searchTerms: [ "affordance", "drag", "drop", "grab", "handle" ]
        }, {
            title: "fas fa-grip-vertical",
            searchTerms: [ "affordance", "drag", "drop", "grab", "handle" ]
        }, {
            title: "fab fa-gripfire",
            searchTerms: []
        }, {
            title: "fab fa-grunt",
            searchTerms: []
        }, {
            title: "fab fa-gulp",
            searchTerms: []
        }, {
            title: "fas fa-h-square",
            searchTerms: [ "hospital", "hotel" ]
        }, {
            title: "fab fa-hacker-news",
            searchTerms: []
        }, {
            title: "fab fa-hacker-news-square",
            searchTerms: []
        }, {
            title: "fab fa-hackerrank",
            searchTerms: []
        }, {
            title: "fas fa-hammer",
            searchTerms: [ "admin", "fix", "repair", "settings", "tool" ]
        }, {
            title: "fas fa-hamsa",
            searchTerms: [ "amulet", "christianity", "islam", "jewish", "judaism", "muslim", "protection" ]
        }, {
            title: "fas fa-hand-holding",
            searchTerms: []
        }, {
            title: "fas fa-hand-holding-heart",
            searchTerms: []
        }, {
            title: "fas fa-hand-holding-usd",
            searchTerms: [ "$", "dollar sign", "donation", "giving", "money", "price" ]
        }, {
            title: "fas fa-hand-lizard",
            searchTerms: []
        }, {
            title: "far fa-hand-lizard",
            searchTerms: []
        }, {
            title: "fas fa-hand-paper",
            searchTerms: [ "stop" ]
        }, {
            title: "far fa-hand-paper",
            searchTerms: [ "stop" ]
        }, {
            title: "fas fa-hand-peace",
            searchTerms: []
        }, {
            title: "far fa-hand-peace",
            searchTerms: []
        }, {
            title: "fas fa-hand-point-down",
            searchTerms: [ "finger", "hand-o-down", "point" ]
        }, {
            title: "far fa-hand-point-down",
            searchTerms: [ "finger", "hand-o-down", "point" ]
        }, {
            title: "fas fa-hand-point-left",
            searchTerms: [ "back", "finger", "hand-o-left", "left", "point", "previous" ]
        }, {
            title: "far fa-hand-point-left",
            searchTerms: [ "back", "finger", "hand-o-left", "left", "point", "previous" ]
        }, {
            title: "fas fa-hand-point-right",
            searchTerms: [ "finger", "forward", "hand-o-right", "next", "point", "right" ]
        }, {
            title: "far fa-hand-point-right",
            searchTerms: [ "finger", "forward", "hand-o-right", "next", "point", "right" ]
        }, {
            title: "fas fa-hand-point-up",
            searchTerms: [ "finger", "hand-o-up", "point" ]
        }, {
            title: "far fa-hand-point-up",
            searchTerms: [ "finger", "hand-o-up", "point" ]
        }, {
            title: "fas fa-hand-pointer",
            searchTerms: [ "select" ]
        }, {
            title: "far fa-hand-pointer",
            searchTerms: [ "select" ]
        }, {
            title: "fas fa-hand-rock",
            searchTerms: []
        }, {
            title: "far fa-hand-rock",
            searchTerms: []
        }, {
            title: "fas fa-hand-scissors",
            searchTerms: []
        }, {
            title: "far fa-hand-scissors",
            searchTerms: []
        }, {
            title: "fas fa-hand-spock",
            searchTerms: []
        }, {
            title: "far fa-hand-spock",
            searchTerms: []
        }, {
            title: "fas fa-hands",
            searchTerms: []
        }, {
            title: "fas fa-hands-helping",
            searchTerms: [ "aid", "assistance", "partnership", "volunteering" ]
        }, {
            title: "fas fa-handshake",
            searchTerms: [ "greeting", "partnership" ]
        }, {
            title: "far fa-handshake",
            searchTerms: [ "greeting", "partnership" ]
        }, {
            title: "fas fa-hanukiah",
            searchTerms: [ "candle", "hanukkah", "jewish", "judaism", "light" ]
        }, {
            title: "fas fa-hashtag",
            searchTerms: []
        }, {
            title: "fas fa-hat-wizard",
            searchTerms: [ "Dungeons & Dragons", "buckle", "cloth", "clothing", "d&d", "dnd", "fantasy", "halloween", "holiday", "mage", "magic", "pointy", "witch" ]
        }, {
            title: "fas fa-haykal",
            searchTerms: [ "bahai", "bahá'í", "star" ]
        }, {
            title: "fas fa-hdd",
            searchTerms: [ "cpu", "hard drive", "harddrive", "machine", "save", "storage" ]
        }, {
            title: "far fa-hdd",
            searchTerms: [ "cpu", "hard drive", "harddrive", "machine", "save", "storage" ]
        }, {
            title: "fas fa-heading",
            searchTerms: [ "header" ]
        }, {
            title: "fas fa-headphones",
            searchTerms: [ "audio", "listen", "music", "sound", "speaker" ]
        }, {
            title: "fas fa-headphones-alt",
            searchTerms: [ "audio", "listen", "music", "sound", "speaker" ]
        }, {
            title: "fas fa-headset",
            searchTerms: [ "audio", "gamer", "gaming", "listen", "live chat", "microphone", "shot caller", "sound", "support", "telemarketer" ]
        }, {
            title: "fas fa-heart",
            searchTerms: [ "favorite", "like", "love" ]
        }, {
            title: "far fa-heart",
            searchTerms: [ "favorite", "like", "love" ]
        }, {
            title: "fas fa-heartbeat",
            searchTerms: [ "ekg", "lifeline", "vital signs" ]
        }, {
            title: "fas fa-helicopter",
            searchTerms: [ "airwolf", "apache", "chopper", "flight", "fly" ]
        }, {
            title: "fas fa-highlighter",
            searchTerms: [ "edit", "marker", "sharpie", "update", "write" ]
        }, {
            title: "fas fa-hiking",
            searchTerms: [ "activity", "backpack", "fall", "fitness", "outdoors", "seasonal", "walking" ]
        }, {
            title: "fas fa-hippo",
            searchTerms: [ "fauna", "hungry", "mammmal" ]
        }, {
            title: "fab fa-hips",
            searchTerms: []
        }, {
            title: "fab fa-hire-a-helper",
            searchTerms: []
        }, {
            title: "fas fa-history",
            searchTerms: []
        }, {
            title: "fas fa-hockey-puck",
            searchTerms: []
        }, {
            title: "fas fa-home",
            searchTerms: [ "house", "main" ]
        }, {
            title: "fab fa-hooli",
            searchTerms: []
        }, {
            title: "fab fa-hornbill",
            searchTerms: []
        }, {
            title: "fas fa-horse",
            searchTerms: [ "equus", "fauna", "mammmal", "neigh" ]
        }, {
            title: "fas fa-hospital",
            searchTerms: [ "building", "emergency room", "medical center" ]
        }, {
            title: "far fa-hospital",
            searchTerms: [ "building", "emergency room", "medical center" ]
        }, {
            title: "fas fa-hospital-alt",
            searchTerms: [ "building", "emergency room", "medical center" ]
        }, {
            title: "fas fa-hospital-symbol",
            searchTerms: []
        }, {
            title: "fas fa-hot-tub",
            searchTerms: []
        }, {
            title: "fas fa-hotel",
            searchTerms: [ "building", "lodging" ]
        }, {
            title: "fab fa-hotjar",
            searchTerms: []
        }, {
            title: "fas fa-hourglass",
            searchTerms: []
        }, {
            title: "far fa-hourglass",
            searchTerms: []
        }, {
            title: "fas fa-hourglass-end",
            searchTerms: []
        }, {
            title: "fas fa-hourglass-half",
            searchTerms: []
        }, {
            title: "fas fa-hourglass-start",
            searchTerms: []
        }, {
            title: "fas fa-house-damage",
            searchTerms: [ "devastation", "home" ]
        }, {
            title: "fab fa-houzz",
            searchTerms: []
        }, {
            title: "fas fa-hryvnia",
            searchTerms: [ "money" ]
        }, {
            title: "fab fa-html5",
            searchTerms: []
        }, {
            title: "fab fa-hubspot",
            searchTerms: []
        }, {
            title: "fas fa-i-cursor",
            searchTerms: []
        }, {
            title: "fas fa-id-badge",
            searchTerms: []
        }, {
            title: "far fa-id-badge",
            searchTerms: []
        }, {
            title: "fas fa-id-card",
            searchTerms: [ "document", "identification", "issued" ]
        }, {
            title: "far fa-id-card",
            searchTerms: [ "document", "identification", "issued" ]
        }, {
            title: "fas fa-id-card-alt",
            searchTerms: [ "demographics" ]
        }, {
            title: "fas fa-image",
            searchTerms: [ "album", "photo", "picture" ]
        }, {
            title: "far fa-image",
            searchTerms: [ "album", "photo", "picture" ]
        }, {
            title: "fas fa-images",
            searchTerms: [ "album", "photo", "picture" ]
        }, {
            title: "far fa-images",
            searchTerms: [ "album", "photo", "picture" ]
        }, {
            title: "fab fa-imdb",
            searchTerms: []
        }, {
            title: "fas fa-inbox",
            searchTerms: []
        }, {
            title: "fas fa-indent",
            searchTerms: []
        }, {
            title: "fas fa-industry",
            searchTerms: [ "factory", "manufacturing" ]
        }, {
            title: "fas fa-infinity",
            searchTerms: []
        }, {
            title: "fas fa-info",
            searchTerms: [ "details", "help", "information", "more" ]
        }, {
            title: "fas fa-info-circle",
            searchTerms: [ "details", "help", "information", "more" ]
        }, {
            title: "fab fa-instagram",
            searchTerms: []
        }, {
            title: "fab fa-internet-explorer",
            searchTerms: [ "browser", "ie" ]
        }, {
            title: "fab fa-ioxhost",
            searchTerms: []
        }, {
            title: "fas fa-italic",
            searchTerms: [ "italics" ]
        }, {
            title: "fab fa-itunes",
            searchTerms: []
        }, {
            title: "fab fa-itunes-note",
            searchTerms: []
        }, {
            title: "fab fa-java",
            searchTerms: []
        }, {
            title: "fas fa-jedi",
            searchTerms: [ "star wars" ]
        }, {
            title: "fab fa-jedi-order",
            searchTerms: [ "star wars" ]
        }, {
            title: "fab fa-jenkins",
            searchTerms: []
        }, {
            title: "fab fa-joget",
            searchTerms: []
        }, {
            title: "fas fa-joint",
            searchTerms: [ "blunt", "cannabis", "doobie", "drugs", "marijuana", "roach", "smoke", "smoking", "spliff" ]
        }, {
            title: "fab fa-joomla",
            searchTerms: []
        }, {
            title: "fas fa-journal-whills",
            searchTerms: [ "book", "jedi", "star wars", "the force" ]
        }, {
            title: "fab fa-js",
            searchTerms: []
        }, {
            title: "fab fa-js-square",
            searchTerms: []
        }, {
            title: "fab fa-jsfiddle",
            searchTerms: []
        }, {
            title: "fas fa-kaaba",
            searchTerms: [ "building", "cube", "islam", "muslim" ]
        }, {
            title: "fab fa-kaggle",
            searchTerms: []
        }, {
            title: "fas fa-key",
            searchTerms: [ "password", "unlock" ]
        }, {
            title: "fab fa-keybase",
            searchTerms: []
        }, {
            title: "fas fa-keyboard",
            searchTerms: [ "input", "type" ]
        }, {
            title: "far fa-keyboard",
            searchTerms: [ "input", "type" ]
        }, {
            title: "fab fa-keycdn",
            searchTerms: []
        }, {
            title: "fas fa-khanda",
            searchTerms: [ "chakkar", "sikh", "sikhism", "sword" ]
        }, {
            title: "fab fa-kickstarter",
            searchTerms: []
        }, {
            title: "fab fa-kickstarter-k",
            searchTerms: []
        }, {
            title: "fas fa-kiss",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "far fa-kiss",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "fas fa-kiss-beam",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "far fa-kiss-beam",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "fas fa-kiss-wink-heart",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "far fa-kiss-wink-heart",
            searchTerms: [ "beso", "emoticon", "face", "love", "smooch" ]
        }, {
            title: "fas fa-kiwi-bird",
            searchTerms: [ "bird", "fauna" ]
        }, {
            title: "fab fa-korvue",
            searchTerms: []
        }, {
            title: "fas fa-landmark",
            searchTerms: [ "building", "historic", "memoroable", "politics" ]
        }, {
            title: "fas fa-language",
            searchTerms: [ "dialect", "idiom", "localize", "speech", "translate", "vernacular" ]
        }, {
            title: "fas fa-laptop",
            searchTerms: [ "computer", "cpu", "dell", "demo", "device", "dude you're getting", "mac", "macbook", "machine", "pc" ]
        }, {
            title: "fas fa-laptop-code",
            searchTerms: []
        }, {
            title: "fab fa-laravel",
            searchTerms: []
        }, {
            title: "fab fa-lastfm",
            searchTerms: []
        }, {
            title: "fab fa-lastfm-square",
            searchTerms: []
        }, {
            title: "fas fa-laugh",
            searchTerms: [ "LOL", "emoticon", "face", "laugh" ]
        }, {
            title: "far fa-laugh",
            searchTerms: [ "LOL", "emoticon", "face", "laugh" ]
        }, {
            title: "fas fa-laugh-beam",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-laugh-beam",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-laugh-squint",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-laugh-squint",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-laugh-wink",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "far fa-laugh-wink",
            searchTerms: [ "LOL", "emoticon", "face" ]
        }, {
            title: "fas fa-layer-group",
            searchTerms: [ "layers" ]
        }, {
            title: "fas fa-leaf",
            searchTerms: [ "eco", "flora", "nature", "plant" ]
        }, {
            title: "fab fa-leanpub",
            searchTerms: []
        }, {
            title: "fas fa-lemon",
            searchTerms: [ "food" ]
        }, {
            title: "far fa-lemon",
            searchTerms: [ "food" ]
        }, {
            title: "fab fa-less",
            searchTerms: []
        }, {
            title: "fas fa-less-than",
            searchTerms: []
        }, {
            title: "fas fa-less-than-equal",
            searchTerms: []
        }, {
            title: "fas fa-level-down-alt",
            searchTerms: [ "level-down" ]
        }, {
            title: "fas fa-level-up-alt",
            searchTerms: [ "level-up" ]
        }, {
            title: "fas fa-life-ring",
            searchTerms: [ "support" ]
        }, {
            title: "far fa-life-ring",
            searchTerms: [ "support" ]
        }, {
            title: "fas fa-lightbulb",
            searchTerms: [ "idea", "inspiration" ]
        }, {
            title: "far fa-lightbulb",
            searchTerms: [ "idea", "inspiration" ]
        }, {
            title: "fab fa-line",
            searchTerms: []
        }, {
            title: "fas fa-link",
            searchTerms: [ "chain" ]
        }, {
            title: "fab fa-linkedin",
            searchTerms: [ "linkedin-square" ]
        }, {
            title: "fab fa-linkedin-in",
            searchTerms: [ "linkedin" ]
        }, {
            title: "fab fa-linode",
            searchTerms: []
        }, {
            title: "fab fa-linux",
            searchTerms: [ "tux" ]
        }, {
            title: "fas fa-lira-sign",
            searchTerms: [ "try", "turkish" ]
        }, {
            title: "fas fa-list",
            searchTerms: [ "checklist", "completed", "done", "finished", "ol", "todo", "ul" ]
        }, {
            title: "fas fa-list-alt",
            searchTerms: [ "checklist", "completed", "done", "finished", "ol", "todo", "ul" ]
        }, {
            title: "far fa-list-alt",
            searchTerms: [ "checklist", "completed", "done", "finished", "ol", "todo", "ul" ]
        }, {
            title: "fas fa-list-ol",
            searchTerms: [ "checklist", "list", "numbers", "ol", "todo", "ul" ]
        }, {
            title: "fas fa-list-ul",
            searchTerms: [ "checklist", "list", "ol", "todo", "ul" ]
        }, {
            title: "fas fa-location-arrow",
            searchTerms: [ "address", "coordinates", "gps", "location", "map", "place", "where" ]
        }, {
            title: "fas fa-lock",
            searchTerms: [ "admin", "protect", "security" ]
        }, {
            title: "fas fa-lock-open",
            searchTerms: [ "admin", "lock", "open", "password", "protect" ]
        }, {
            title: "fas fa-long-arrow-alt-down",
            searchTerms: [ "long-arrow-down" ]
        }, {
            title: "fas fa-long-arrow-alt-left",
            searchTerms: [ "back", "long-arrow-left", "previous" ]
        }, {
            title: "fas fa-long-arrow-alt-right",
            searchTerms: [ "long-arrow-right" ]
        }, {
            title: "fas fa-long-arrow-alt-up",
            searchTerms: [ "long-arrow-up" ]
        }, {
            title: "fas fa-low-vision",
            searchTerms: []
        }, {
            title: "fas fa-luggage-cart",
            searchTerms: []
        }, {
            title: "fab fa-lyft",
            searchTerms: []
        }, {
            title: "fab fa-magento",
            searchTerms: []
        }, {
            title: "fas fa-magic",
            searchTerms: [ "autocomplete", "automatic", "mage", "magic", "spell", "witch", "wizard" ]
        }, {
            title: "fas fa-magnet",
            searchTerms: []
        }, {
            title: "fas fa-mail-bulk",
            searchTerms: []
        }, {
            title: "fab fa-mailchimp",
            searchTerms: []
        }, {
            title: "fas fa-male",
            searchTerms: [ "human", "man", "person", "profile", "user" ]
        }, {
            title: "fab fa-mandalorian",
            searchTerms: []
        }, {
            title: "fas fa-map",
            searchTerms: [ "coordinates", "location", "paper", "place", "travel" ]
        }, {
            title: "far fa-map",
            searchTerms: [ "coordinates", "location", "paper", "place", "travel" ]
        }, {
            title: "fas fa-map-marked",
            searchTerms: [ "address", "coordinates", "destination", "gps", "localize", "location", "map", "paper", "pin", "place", "point of interest", "position", "route", "travel", "where" ]
        }, {
            title: "fas fa-map-marked-alt",
            searchTerms: [ "address", "coordinates", "destination", "gps", "localize", "location", "map", "paper", "pin", "place", "point of interest", "position", "route", "travel", "where" ]
        }, {
            title: "fas fa-map-marker",
            searchTerms: [ "address", "coordinates", "gps", "localize", "location", "map", "pin", "place", "position", "travel", "where" ]
        }, {
            title: "fas fa-map-marker-alt",
            searchTerms: [ "address", "coordinates", "gps", "localize", "location", "map", "pin", "place", "position", "travel", "where" ]
        }, {
            title: "fas fa-map-pin",
            searchTerms: [ "address", "coordinates", "gps", "localize", "location", "map", "marker", "place", "position", "travel", "where" ]
        }, {
            title: "fas fa-map-signs",
            searchTerms: []
        }, {
            title: "fab fa-markdown",
            searchTerms: []
        }, {
            title: "fas fa-marker",
            searchTerms: [ "edit", "sharpie", "update", "write" ]
        }, {
            title: "fas fa-mars",
            searchTerms: [ "male" ]
        }, {
            title: "fas fa-mars-double",
            searchTerms: []
        }, {
            title: "fas fa-mars-stroke",
            searchTerms: []
        }, {
            title: "fas fa-mars-stroke-h",
            searchTerms: []
        }, {
            title: "fas fa-mars-stroke-v",
            searchTerms: []
        }, {
            title: "fas fa-mask",
            searchTerms: [ "costume", "disguise", "halloween", "holiday", "secret", "super hero" ]
        }, {
            title: "fab fa-mastodon",
            searchTerms: []
        }, {
            title: "fab fa-maxcdn",
            searchTerms: []
        }, {
            title: "fas fa-medal",
            searchTerms: []
        }, {
            title: "fab fa-medapps",
            searchTerms: []
        }, {
            title: "fab fa-medium",
            searchTerms: []
        }, {
            title: "fab fa-medium-m",
            searchTerms: []
        }, {
            title: "fas fa-medkit",
            searchTerms: [ "first aid", "firstaid", "health", "help", "support" ]
        }, {
            title: "fab fa-medrt",
            searchTerms: []
        }, {
            title: "fab fa-meetup",
            searchTerms: []
        }, {
            title: "fab fa-megaport",
            searchTerms: []
        }, {
            title: "fas fa-meh",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "far fa-meh",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "fas fa-meh-blank",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "far fa-meh-blank",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "fas fa-meh-rolling-eyes",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "far fa-meh-rolling-eyes",
            searchTerms: [ "emoticon", "face", "neutral", "rating" ]
        }, {
            title: "fas fa-memory",
            searchTerms: [ "DIMM", "RAM" ]
        }, {
            title: "fas fa-menorah",
            searchTerms: [ "candle", "hanukkah", "jewish", "judaism", "light" ]
        }, {
            title: "fas fa-mercury",
            searchTerms: [ "transgender" ]
        }, {
            title: "fas fa-meteor",
            searchTerms: []
        }, {
            title: "fas fa-microchip",
            searchTerms: [ "cpu", "processor" ]
        }, {
            title: "fas fa-microphone",
            searchTerms: [ "record", "sound", "voice" ]
        }, {
            title: "fas fa-microphone-alt",
            searchTerms: [ "record", "sound", "voice" ]
        }, {
            title: "fas fa-microphone-alt-slash",
            searchTerms: [ "disable", "mute", "record", "sound", "voice" ]
        }, {
            title: "fas fa-microphone-slash",
            searchTerms: [ "disable", "mute", "record", "sound", "voice" ]
        }, {
            title: "fas fa-microscope",
            searchTerms: []
        }, {
            title: "fab fa-microsoft",
            searchTerms: []
        }, {
            title: "fas fa-minus",
            searchTerms: [ "collapse", "delete", "hide", "minify", "negative", "remove", "trash" ]
        }, {
            title: "fas fa-minus-circle",
            searchTerms: [ "delete", "hide", "negative", "remove", "trash" ]
        }, {
            title: "fas fa-minus-square",
            searchTerms: [ "collapse", "delete", "hide", "minify", "negative", "remove", "trash" ]
        }, {
            title: "far fa-minus-square",
            searchTerms: [ "collapse", "delete", "hide", "minify", "negative", "remove", "trash" ]
        }, {
            title: "fab fa-mix",
            searchTerms: []
        }, {
            title: "fab fa-mixcloud",
            searchTerms: []
        }, {
            title: "fab fa-mizuni",
            searchTerms: []
        }, {
            title: "fas fa-mobile",
            searchTerms: [ "apple", "call", "cell phone", "cellphone", "device", "iphone", "number", "screen", "telephone", "text" ]
        }, {
            title: "fas fa-mobile-alt",
            searchTerms: [ "apple", "call", "cell phone", "cellphone", "device", "iphone", "number", "screen", "telephone", "text" ]
        }, {
            title: "fab fa-modx",
            searchTerms: []
        }, {
            title: "fab fa-monero",
            searchTerms: []
        }, {
            title: "fas fa-money-bill",
            searchTerms: [ "buy", "cash", "checkout", "money", "payment", "price", "purchase" ]
        }, {
            title: "fas fa-money-bill-alt",
            searchTerms: [ "buy", "cash", "checkout", "money", "payment", "price", "purchase" ]
        }, {
            title: "far fa-money-bill-alt",
            searchTerms: [ "buy", "cash", "checkout", "money", "payment", "price", "purchase" ]
        }, {
            title: "fas fa-money-bill-wave",
            searchTerms: []
        }, {
            title: "fas fa-money-bill-wave-alt",
            searchTerms: []
        }, {
            title: "fas fa-money-check",
            searchTerms: [ "bank check", "cheque" ]
        }, {
            title: "fas fa-money-check-alt",
            searchTerms: [ "bank check", "cheque" ]
        }, {
            title: "fas fa-monument",
            searchTerms: [ "building", "historic", "memoroable" ]
        }, {
            title: "fas fa-moon",
            searchTerms: [ "contrast", "crescent", "darker", "lunar", "night" ]
        }, {
            title: "far fa-moon",
            searchTerms: [ "contrast", "crescent", "darker", "lunar", "night" ]
        }, {
            title: "fas fa-mortar-pestle",
            searchTerms: [ "crush", "culinary", "grind", "medical", "mix", "spices" ]
        }, {
            title: "fas fa-mosque",
            searchTerms: [ "building", "islam", "muslim" ]
        }, {
            title: "fas fa-motorcycle",
            searchTerms: [ "bike", "machine", "transportation", "vehicle" ]
        }, {
            title: "fas fa-mountain",
            searchTerms: []
        }, {
            title: "fas fa-mouse-pointer",
            searchTerms: [ "select" ]
        }, {
            title: "fas fa-music",
            searchTerms: [ "note", "sound" ]
        }, {
            title: "fab fa-napster",
            searchTerms: []
        }, {
            title: "fab fa-neos",
            searchTerms: []
        }, {
            title: "fas fa-network-wired",
            searchTerms: []
        }, {
            title: "fas fa-neuter",
            searchTerms: []
        }, {
            title: "fas fa-newspaper",
            searchTerms: [ "article", "press" ]
        }, {
            title: "far fa-newspaper",
            searchTerms: [ "article", "press" ]
        }, {
            title: "fab fa-nimblr",
            searchTerms: []
        }, {
            title: "fab fa-nintendo-switch",
            searchTerms: []
        }, {
            title: "fab fa-node",
            searchTerms: []
        }, {
            title: "fab fa-node-js",
            searchTerms: []
        }, {
            title: "fas fa-not-equal",
            searchTerms: []
        }, {
            title: "fas fa-notes-medical",
            searchTerms: []
        }, {
            title: "fab fa-npm",
            searchTerms: []
        }, {
            title: "fab fa-ns8",
            searchTerms: []
        }, {
            title: "fab fa-nutritionix",
            searchTerms: []
        }, {
            title: "fas fa-object-group",
            searchTerms: [ "design" ]
        }, {
            title: "far fa-object-group",
            searchTerms: [ "design" ]
        }, {
            title: "fas fa-object-ungroup",
            searchTerms: [ "design" ]
        }, {
            title: "far fa-object-ungroup",
            searchTerms: [ "design" ]
        }, {
            title: "fab fa-odnoklassniki",
            searchTerms: []
        }, {
            title: "fab fa-odnoklassniki-square",
            searchTerms: []
        }, {
            title: "fas fa-oil-can",
            searchTerms: []
        }, {
            title: "fab fa-old-republic",
            searchTerms: [ "politics", "star wars" ]
        }, {
            title: "fas fa-om",
            searchTerms: [ "buddhism", "hinduism", "jainism", "mantra" ]
        }, {
            title: "fab fa-opencart",
            searchTerms: []
        }, {
            title: "fab fa-openid",
            searchTerms: []
        }, {
            title: "fab fa-opera",
            searchTerms: []
        }, {
            title: "fab fa-optin-monster",
            searchTerms: []
        }, {
            title: "fab fa-osi",
            searchTerms: []
        }, {
            title: "fas fa-otter",
            searchTerms: [ "fauna", "mammmal" ]
        }, {
            title: "fas fa-outdent",
            searchTerms: []
        }, {
            title: "fab fa-page4",
            searchTerms: []
        }, {
            title: "fab fa-pagelines",
            searchTerms: [ "eco", "flora", "leaf", "leaves", "nature", "plant", "tree" ]
        }, {
            title: "fas fa-paint-brush",
            searchTerms: []
        }, {
            title: "fas fa-paint-roller",
            searchTerms: [ "brush", "painting", "tool" ]
        }, {
            title: "fas fa-palette",
            searchTerms: [ "colors", "painting" ]
        }, {
            title: "fab fa-palfed",
            searchTerms: []
        }, {
            title: "fas fa-pallet",
            searchTerms: []
        }, {
            title: "fas fa-paper-plane",
            searchTerms: []
        }, {
            title: "far fa-paper-plane",
            searchTerms: []
        }, {
            title: "fas fa-paperclip",
            searchTerms: [ "attachment" ]
        }, {
            title: "fas fa-parachute-box",
            searchTerms: [ "aid", "assistance", "rescue", "supplies" ]
        }, {
            title: "fas fa-paragraph",
            searchTerms: []
        }, {
            title: "fas fa-parking",
            searchTerms: []
        }, {
            title: "fas fa-passport",
            searchTerms: [ "document", "identification", "issued" ]
        }, {
            title: "fas fa-pastafarianism",
            searchTerms: [ "agnosticism", "atheism", "flying spaghetti monster", "fsm" ]
        }, {
            title: "fas fa-paste",
            searchTerms: [ "clipboard", "copy" ]
        }, {
            title: "fab fa-patreon",
            searchTerms: []
        }, {
            title: "fas fa-pause",
            searchTerms: [ "wait" ]
        }, {
            title: "fas fa-pause-circle",
            searchTerms: []
        }, {
            title: "far fa-pause-circle",
            searchTerms: []
        }, {
            title: "fas fa-paw",
            searchTerms: [ "animal", "pet" ]
        }, {
            title: "fab fa-paypal",
            searchTerms: []
        }, {
            title: "fas fa-peace",
            searchTerms: []
        }, {
            title: "fas fa-pen",
            searchTerms: [ "design", "edit", "update", "write" ]
        }, {
            title: "fas fa-pen-alt",
            searchTerms: [ "design", "edit", "update", "write" ]
        }, {
            title: "fas fa-pen-fancy",
            searchTerms: [ "design", "edit", "fountain pen", "update", "write" ]
        }, {
            title: "fas fa-pen-nib",
            searchTerms: [ "design", "edit", "fountain pen", "update", "write" ]
        }, {
            title: "fas fa-pen-square",
            searchTerms: [ "edit", "pencil-square", "update", "write" ]
        }, {
            title: "fas fa-pencil-alt",
            searchTerms: [ "design", "edit", "pencil", "update", "write" ]
        }, {
            title: "fas fa-pencil-ruler",
            searchTerms: []
        }, {
            title: "fab fa-penny-arcade",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "game", "gaming", "pax", "tabletop" ]
        }, {
            title: "fas fa-people-carry",
            searchTerms: [ "movers" ]
        }, {
            title: "fas fa-percent",
            searchTerms: []
        }, {
            title: "fas fa-percentage",
            searchTerms: []
        }, {
            title: "fab fa-periscope",
            searchTerms: []
        }, {
            title: "fas fa-person-booth",
            searchTerms: [ "changing", "changing room", "election", "human", "person", "vote", "voting" ]
        }, {
            title: "fab fa-phabricator",
            searchTerms: []
        }, {
            title: "fab fa-phoenix-framework",
            searchTerms: []
        }, {
            title: "fab fa-phoenix-squadron",
            searchTerms: []
        }, {
            title: "fas fa-phone",
            searchTerms: [ "call", "earphone", "number", "support", "telephone", "voice" ]
        }, {
            title: "fas fa-phone-slash",
            searchTerms: []
        }, {
            title: "fas fa-phone-square",
            searchTerms: [ "call", "number", "support", "telephone", "voice" ]
        }, {
            title: "fas fa-phone-volume",
            searchTerms: [ "telephone", "volume-control-phone" ]
        }, {
            title: "fab fa-php",
            searchTerms: []
        }, {
            title: "fab fa-pied-piper",
            searchTerms: []
        }, {
            title: "fab fa-pied-piper-alt",
            searchTerms: []
        }, {
            title: "fab fa-pied-piper-hat",
            searchTerms: [ "clothing" ]
        }, {
            title: "fab fa-pied-piper-pp",
            searchTerms: []
        }, {
            title: "fas fa-piggy-bank",
            searchTerms: [ "save", "savings" ]
        }, {
            title: "fas fa-pills",
            searchTerms: [ "drugs", "medicine" ]
        }, {
            title: "fab fa-pinterest",
            searchTerms: []
        }, {
            title: "fab fa-pinterest-p",
            searchTerms: []
        }, {
            title: "fab fa-pinterest-square",
            searchTerms: []
        }, {
            title: "fas fa-place-of-worship",
            searchTerms: []
        }, {
            title: "fas fa-plane",
            searchTerms: [ "airplane", "destination", "fly", "location", "mode", "travel", "trip" ]
        }, {
            title: "fas fa-plane-arrival",
            searchTerms: [ "airplane", "arriving", "destination", "fly", "land", "landing", "location", "mode", "travel", "trip" ]
        }, {
            title: "fas fa-plane-departure",
            searchTerms: [ "airplane", "departing", "destination", "fly", "location", "mode", "take off", "taking off", "travel", "trip" ]
        }, {
            title: "fas fa-play",
            searchTerms: [ "music", "playing", "sound", "start" ]
        }, {
            title: "fas fa-play-circle",
            searchTerms: [ "playing", "start" ]
        }, {
            title: "far fa-play-circle",
            searchTerms: [ "playing", "start" ]
        }, {
            title: "fab fa-playstation",
            searchTerms: []
        }, {
            title: "fas fa-plug",
            searchTerms: [ "connect", "online", "power" ]
        }, {
            title: "fas fa-plus",
            searchTerms: [ "add", "create", "expand", "new", "positive" ]
        }, {
            title: "fas fa-plus-circle",
            searchTerms: [ "add", "create", "expand", "new", "positive" ]
        }, {
            title: "fas fa-plus-square",
            searchTerms: [ "add", "create", "expand", "new", "positive" ]
        }, {
            title: "far fa-plus-square",
            searchTerms: [ "add", "create", "expand", "new", "positive" ]
        }, {
            title: "fas fa-podcast",
            searchTerms: []
        }, {
            title: "fas fa-poll",
            searchTerms: [ "results", "survey", "vote", "voting" ]
        }, {
            title: "fas fa-poll-h",
            searchTerms: [ "results", "survey", "vote", "voting" ]
        }, {
            title: "fas fa-poo",
            searchTerms: []
        }, {
            title: "fas fa-poo-storm",
            searchTerms: [ "mess", "poop", "shit" ]
        }, {
            title: "fas fa-poop",
            searchTerms: []
        }, {
            title: "fas fa-portrait",
            searchTerms: []
        }, {
            title: "fas fa-pound-sign",
            searchTerms: [ "gbp" ]
        }, {
            title: "fas fa-power-off",
            searchTerms: [ "on", "reboot", "restart" ]
        }, {
            title: "fas fa-pray",
            searchTerms: []
        }, {
            title: "fas fa-praying-hands",
            searchTerms: []
        }, {
            title: "fas fa-prescription",
            searchTerms: [ "drugs", "medical", "medicine", "rx" ]
        }, {
            title: "fas fa-prescription-bottle",
            searchTerms: [ "drugs", "medical", "medicine", "rx" ]
        }, {
            title: "fas fa-prescription-bottle-alt",
            searchTerms: [ "drugs", "medical", "medicine", "rx" ]
        }, {
            title: "fas fa-print",
            searchTerms: []
        }, {
            title: "fas fa-procedures",
            searchTerms: []
        }, {
            title: "fab fa-product-hunt",
            searchTerms: []
        }, {
            title: "fas fa-project-diagram",
            searchTerms: []
        }, {
            title: "fab fa-pushed",
            searchTerms: []
        }, {
            title: "fas fa-puzzle-piece",
            searchTerms: [ "add-on", "addon", "section" ]
        }, {
            title: "fab fa-python",
            searchTerms: []
        }, {
            title: "fab fa-qq",
            searchTerms: []
        }, {
            title: "fas fa-qrcode",
            searchTerms: [ "scan" ]
        }, {
            title: "fas fa-question",
            searchTerms: [ "help", "information", "support", "unknown" ]
        }, {
            title: "fas fa-question-circle",
            searchTerms: [ "help", "information", "support", "unknown" ]
        }, {
            title: "far fa-question-circle",
            searchTerms: [ "help", "information", "support", "unknown" ]
        }, {
            title: "fas fa-quidditch",
            searchTerms: []
        }, {
            title: "fab fa-quinscape",
            searchTerms: []
        }, {
            title: "fab fa-quora",
            searchTerms: []
        }, {
            title: "fas fa-quote-left",
            searchTerms: []
        }, {
            title: "fas fa-quote-right",
            searchTerms: []
        }, {
            title: "fas fa-quran",
            searchTerms: [ "book", "islam", "muslim" ]
        }, {
            title: "fab fa-r-project",
            searchTerms: []
        }, {
            title: "fas fa-rainbow",
            searchTerms: []
        }, {
            title: "fas fa-random",
            searchTerms: [ "shuffle", "sort" ]
        }, {
            title: "fab fa-ravelry",
            searchTerms: []
        }, {
            title: "fab fa-react",
            searchTerms: []
        }, {
            title: "fab fa-reacteurope",
            searchTerms: []
        }, {
            title: "fab fa-readme",
            searchTerms: []
        }, {
            title: "fab fa-rebel",
            searchTerms: []
        }, {
            title: "fas fa-receipt",
            searchTerms: [ "check", "invoice", "table" ]
        }, {
            title: "fas fa-recycle",
            searchTerms: []
        }, {
            title: "fab fa-red-river",
            searchTerms: []
        }, {
            title: "fab fa-reddit",
            searchTerms: []
        }, {
            title: "fab fa-reddit-alien",
            searchTerms: []
        }, {
            title: "fab fa-reddit-square",
            searchTerms: []
        }, {
            title: "fas fa-redo",
            searchTerms: [ "forward", "refresh", "reload", "repeat" ]
        }, {
            title: "fas fa-redo-alt",
            searchTerms: [ "forward", "refresh", "reload", "repeat" ]
        }, {
            title: "fas fa-registered",
            searchTerms: []
        }, {
            title: "far fa-registered",
            searchTerms: []
        }, {
            title: "fab fa-renren",
            searchTerms: []
        }, {
            title: "fas fa-reply",
            searchTerms: []
        }, {
            title: "fas fa-reply-all",
            searchTerms: []
        }, {
            title: "fab fa-replyd",
            searchTerms: []
        }, {
            title: "fas fa-republican",
            searchTerms: [ "american", "conservative", "election", "elephant", "politics", "republican party", "right", "right-wing", "usa" ]
        }, {
            title: "fab fa-researchgate",
            searchTerms: []
        }, {
            title: "fab fa-resolving",
            searchTerms: []
        }, {
            title: "fas fa-retweet",
            searchTerms: [ "refresh", "reload", "share", "swap" ]
        }, {
            title: "fab fa-rev",
            searchTerms: []
        }, {
            title: "fas fa-ribbon",
            searchTerms: [ "badge", "cause", "lapel", "pin" ]
        }, {
            title: "fas fa-ring",
            searchTerms: [ "Dungeons & Dragons", "Gollum", "band", "binding", "d&d", "dnd", "fantasy", "jewelry", "precious" ]
        }, {
            title: "fas fa-road",
            searchTerms: [ "street" ]
        }, {
            title: "fas fa-robot",
            searchTerms: []
        }, {
            title: "fas fa-rocket",
            searchTerms: [ "app" ]
        }, {
            title: "fab fa-rocketchat",
            searchTerms: []
        }, {
            title: "fab fa-rockrms",
            searchTerms: []
        }, {
            title: "fas fa-route",
            searchTerms: []
        }, {
            title: "fas fa-rss",
            searchTerms: [ "blog" ]
        }, {
            title: "fas fa-rss-square",
            searchTerms: [ "blog", "feed" ]
        }, {
            title: "fas fa-ruble-sign",
            searchTerms: [ "rub" ]
        }, {
            title: "fas fa-ruler",
            searchTerms: []
        }, {
            title: "fas fa-ruler-combined",
            searchTerms: []
        }, {
            title: "fas fa-ruler-horizontal",
            searchTerms: []
        }, {
            title: "fas fa-ruler-vertical",
            searchTerms: []
        }, {
            title: "fas fa-running",
            searchTerms: [ "jog", "sprint" ]
        }, {
            title: "fas fa-rupee-sign",
            searchTerms: [ "indian", "inr" ]
        }, {
            title: "fas fa-sad-cry",
            searchTerms: [ "emoticon", "face", "tear", "tears" ]
        }, {
            title: "far fa-sad-cry",
            searchTerms: [ "emoticon", "face", "tear", "tears" ]
        }, {
            title: "fas fa-sad-tear",
            searchTerms: [ "emoticon", "face", "tear", "tears" ]
        }, {
            title: "far fa-sad-tear",
            searchTerms: [ "emoticon", "face", "tear", "tears" ]
        }, {
            title: "fab fa-safari",
            searchTerms: [ "browser" ]
        }, {
            title: "fab fa-sass",
            searchTerms: []
        }, {
            title: "fas fa-save",
            searchTerms: [ "floppy", "floppy-o" ]
        }, {
            title: "far fa-save",
            searchTerms: [ "floppy", "floppy-o" ]
        }, {
            title: "fab fa-schlix",
            searchTerms: []
        }, {
            title: "fas fa-school",
            searchTerms: []
        }, {
            title: "fas fa-screwdriver",
            searchTerms: [ "admin", "fix", "repair", "settings", "tool" ]
        }, {
            title: "fab fa-scribd",
            searchTerms: []
        }, {
            title: "fas fa-scroll",
            searchTerms: [ "Dungeons & Dragons", "announcement", "d&d", "dnd", "fantasy", "paper" ]
        }, {
            title: "fas fa-search",
            searchTerms: [ "bigger", "enlarge", "magnify", "preview", "zoom" ]
        }, {
            title: "fas fa-search-dollar",
            searchTerms: []
        }, {
            title: "fas fa-search-location",
            searchTerms: []
        }, {
            title: "fas fa-search-minus",
            searchTerms: [ "minify", "negative", "smaller", "zoom", "zoom out" ]
        }, {
            title: "fas fa-search-plus",
            searchTerms: [ "bigger", "enlarge", "magnify", "positive", "zoom", "zoom in" ]
        }, {
            title: "fab fa-searchengin",
            searchTerms: []
        }, {
            title: "fas fa-seedling",
            searchTerms: []
        }, {
            title: "fab fa-sellcast",
            searchTerms: [ "eercast" ]
        }, {
            title: "fab fa-sellsy",
            searchTerms: []
        }, {
            title: "fas fa-server",
            searchTerms: [ "cpu" ]
        }, {
            title: "fab fa-servicestack",
            searchTerms: []
        }, {
            title: "fas fa-shapes",
            searchTerms: [ "circle", "square", "triangle" ]
        }, {
            title: "fas fa-share",
            searchTerms: []
        }, {
            title: "fas fa-share-alt",
            searchTerms: []
        }, {
            title: "fas fa-share-alt-square",
            searchTerms: []
        }, {
            title: "fas fa-share-square",
            searchTerms: [ "send", "social" ]
        }, {
            title: "far fa-share-square",
            searchTerms: [ "send", "social" ]
        }, {
            title: "fas fa-shekel-sign",
            searchTerms: [ "ils" ]
        }, {
            title: "fas fa-shield-alt",
            searchTerms: [ "achievement", "award", "block", "defend", "security", "winner" ]
        }, {
            title: "fas fa-ship",
            searchTerms: [ "boat", "sea" ]
        }, {
            title: "fas fa-shipping-fast",
            searchTerms: []
        }, {
            title: "fab fa-shirtsinbulk",
            searchTerms: []
        }, {
            title: "fas fa-shoe-prints",
            searchTerms: [ "feet", "footprints", "steps" ]
        }, {
            title: "fas fa-shopping-bag",
            searchTerms: []
        }, {
            title: "fas fa-shopping-basket",
            searchTerms: []
        }, {
            title: "fas fa-shopping-cart",
            searchTerms: [ "buy", "checkout", "payment", "purchase" ]
        }, {
            title: "fab fa-shopware",
            searchTerms: []
        }, {
            title: "fas fa-shower",
            searchTerms: []
        }, {
            title: "fas fa-shuttle-van",
            searchTerms: [ "machine", "public-transportation", "transportation", "vehicle" ]
        }, {
            title: "fas fa-sign",
            searchTerms: []
        }, {
            title: "fas fa-sign-in-alt",
            searchTerms: [ "arrow", "enter", "join", "log in", "login", "sign in", "sign up", "sign-in", "signin", "signup" ]
        }, {
            title: "fas fa-sign-language",
            searchTerms: []
        }, {
            title: "fas fa-sign-out-alt",
            searchTerms: [ "arrow", "exit", "leave", "log out", "logout", "sign-out" ]
        }, {
            title: "fas fa-signal",
            searchTerms: [ "bars", "graph", "online", "status" ]
        }, {
            title: "fas fa-signature",
            searchTerms: [ "John Hancock", "cursive", "name", "writing" ]
        }, {
            title: "fab fa-simplybuilt",
            searchTerms: []
        }, {
            title: "fab fa-sistrix",
            searchTerms: []
        }, {
            title: "fas fa-sitemap",
            searchTerms: [ "directory", "hierarchy", "ia", "information architecture", "organization" ]
        }, {
            title: "fab fa-sith",
            searchTerms: []
        }, {
            title: "fas fa-skull",
            searchTerms: [ "bones", "skeleton", "yorick" ]
        }, {
            title: "fas fa-skull-crossbones",
            searchTerms: [ "Dungeons & Dragons", "alert", "bones", "d&d", "danger", "dead", "deadly", "death", "dnd", "fantasy", "halloween", "holiday", "jolly-roger", "pirate", "poison", "skeleton", "warning" ]
        }, {
            title: "fab fa-skyatlas",
            searchTerms: []
        }, {
            title: "fab fa-skype",
            searchTerms: []
        }, {
            title: "fab fa-slack",
            searchTerms: [ "anchor", "hash", "hashtag" ]
        }, {
            title: "fab fa-slack-hash",
            searchTerms: [ "anchor", "hash", "hashtag" ]
        }, {
            title: "fas fa-slash",
            searchTerms: []
        }, {
            title: "fas fa-sliders-h",
            searchTerms: [ "settings", "sliders" ]
        }, {
            title: "fab fa-slideshare",
            searchTerms: []
        }, {
            title: "fas fa-smile",
            searchTerms: [ "approve", "emoticon", "face", "happy", "rating", "satisfied" ]
        }, {
            title: "far fa-smile",
            searchTerms: [ "approve", "emoticon", "face", "happy", "rating", "satisfied" ]
        }, {
            title: "fas fa-smile-beam",
            searchTerms: [ "emoticon", "face", "happy", "positive" ]
        }, {
            title: "far fa-smile-beam",
            searchTerms: [ "emoticon", "face", "happy", "positive" ]
        }, {
            title: "fas fa-smile-wink",
            searchTerms: [ "emoticon", "face", "happy" ]
        }, {
            title: "far fa-smile-wink",
            searchTerms: [ "emoticon", "face", "happy" ]
        }, {
            title: "fas fa-smog",
            searchTerms: [ "dragon" ]
        }, {
            title: "fas fa-smoking",
            searchTerms: [ "cigarette", "nicotine", "smoking status" ]
        }, {
            title: "fas fa-smoking-ban",
            searchTerms: [ "no smoking", "non-smoking" ]
        }, {
            title: "fab fa-snapchat",
            searchTerms: []
        }, {
            title: "fab fa-snapchat-ghost",
            searchTerms: []
        }, {
            title: "fab fa-snapchat-square",
            searchTerms: []
        }, {
            title: "fas fa-snowflake",
            searchTerms: [ "precipitation", "seasonal", "winter" ]
        }, {
            title: "far fa-snowflake",
            searchTerms: [ "precipitation", "seasonal", "winter" ]
        }, {
            title: "fas fa-socks",
            searchTerms: [ "business socks", "business time", "flight of the conchords", "wednesday" ]
        }, {
            title: "fas fa-solar-panel",
            searchTerms: [ "clean", "eco-friendly", "energy", "green", "sun" ]
        }, {
            title: "fas fa-sort",
            searchTerms: [ "order" ]
        }, {
            title: "fas fa-sort-alpha-down",
            searchTerms: [ "sort-alpha-asc" ]
        }, {
            title: "fas fa-sort-alpha-up",
            searchTerms: [ "sort-alpha-desc" ]
        }, {
            title: "fas fa-sort-amount-down",
            searchTerms: [ "sort-amount-asc" ]
        }, {
            title: "fas fa-sort-amount-up",
            searchTerms: [ "sort-amount-desc" ]
        }, {
            title: "fas fa-sort-down",
            searchTerms: [ "arrow", "descending", "sort-desc" ]
        }, {
            title: "fas fa-sort-numeric-down",
            searchTerms: [ "numbers", "sort-numeric-asc" ]
        }, {
            title: "fas fa-sort-numeric-up",
            searchTerms: [ "numbers", "sort-numeric-desc" ]
        }, {
            title: "fas fa-sort-up",
            searchTerms: [ "arrow", "ascending", "sort-asc" ]
        }, {
            title: "fab fa-soundcloud",
            searchTerms: []
        }, {
            title: "fas fa-spa",
            searchTerms: [ "flora", "mindfullness", "plant", "wellness" ]
        }, {
            title: "fas fa-space-shuttle",
            searchTerms: [ "astronaut", "machine", "nasa", "rocket", "transportation" ]
        }, {
            title: "fab fa-speakap",
            searchTerms: []
        }, {
            title: "fas fa-spider",
            searchTerms: [ "arachnid", "bug", "charlotte", "crawl", "eight", "halloween", "holiday" ]
        }, {
            title: "fas fa-spinner",
            searchTerms: [ "loading", "progress" ]
        }, {
            title: "fas fa-splotch",
            searchTerms: []
        }, {
            title: "fab fa-spotify",
            searchTerms: []
        }, {
            title: "fas fa-spray-can",
            searchTerms: []
        }, {
            title: "fas fa-square",
            searchTerms: [ "block", "box" ]
        }, {
            title: "far fa-square",
            searchTerms: [ "block", "box" ]
        }, {
            title: "fas fa-square-full",
            searchTerms: []
        }, {
            title: "fas fa-square-root-alt",
            searchTerms: []
        }, {
            title: "fab fa-squarespace",
            searchTerms: []
        }, {
            title: "fab fa-stack-exchange",
            searchTerms: []
        }, {
            title: "fab fa-stack-overflow",
            searchTerms: []
        }, {
            title: "fas fa-stamp",
            searchTerms: []
        }, {
            title: "fas fa-star",
            searchTerms: [ "achievement", "award", "favorite", "important", "night", "rating", "score" ]
        }, {
            title: "far fa-star",
            searchTerms: [ "achievement", "award", "favorite", "important", "night", "rating", "score" ]
        }, {
            title: "fas fa-star-and-crescent",
            searchTerms: [ "islam", "muslim" ]
        }, {
            title: "fas fa-star-half",
            searchTerms: [ "achievement", "award", "rating", "score", "star-half-empty", "star-half-full" ]
        }, {
            title: "far fa-star-half",
            searchTerms: [ "achievement", "award", "rating", "score", "star-half-empty", "star-half-full" ]
        }, {
            title: "fas fa-star-half-alt",
            searchTerms: [ "achievement", "award", "rating", "score", "star-half-empty", "star-half-full" ]
        }, {
            title: "fas fa-star-of-david",
            searchTerms: [ "jewish", "judaism" ]
        }, {
            title: "fas fa-star-of-life",
            searchTerms: []
        }, {
            title: "fab fa-staylinked",
            searchTerms: []
        }, {
            title: "fab fa-steam",
            searchTerms: []
        }, {
            title: "fab fa-steam-square",
            searchTerms: []
        }, {
            title: "fab fa-steam-symbol",
            searchTerms: []
        }, {
            title: "fas fa-step-backward",
            searchTerms: [ "beginning", "first", "previous", "rewind", "start" ]
        }, {
            title: "fas fa-step-forward",
            searchTerms: [ "end", "last", "next" ]
        }, {
            title: "fas fa-stethoscope",
            searchTerms: []
        }, {
            title: "fab fa-sticker-mule",
            searchTerms: []
        }, {
            title: "fas fa-sticky-note",
            searchTerms: []
        }, {
            title: "far fa-sticky-note",
            searchTerms: []
        }, {
            title: "fas fa-stop",
            searchTerms: [ "block", "box", "square" ]
        }, {
            title: "fas fa-stop-circle",
            searchTerms: []
        }, {
            title: "far fa-stop-circle",
            searchTerms: []
        }, {
            title: "fas fa-stopwatch",
            searchTerms: [ "time" ]
        }, {
            title: "fas fa-store",
            searchTerms: []
        }, {
            title: "fas fa-store-alt",
            searchTerms: []
        }, {
            title: "fab fa-strava",
            searchTerms: []
        }, {
            title: "fas fa-stream",
            searchTerms: []
        }, {
            title: "fas fa-street-view",
            searchTerms: [ "map" ]
        }, {
            title: "fas fa-strikethrough",
            searchTerms: []
        }, {
            title: "fab fa-stripe",
            searchTerms: []
        }, {
            title: "fab fa-stripe-s",
            searchTerms: []
        }, {
            title: "fas fa-stroopwafel",
            searchTerms: [ "dessert", "food", "sweets", "waffle" ]
        }, {
            title: "fab fa-studiovinari",
            searchTerms: []
        }, {
            title: "fab fa-stumbleupon",
            searchTerms: []
        }, {
            title: "fab fa-stumbleupon-circle",
            searchTerms: []
        }, {
            title: "fas fa-subscript",
            searchTerms: []
        }, {
            title: "fas fa-subway",
            searchTerms: [ "machine", "railway", "train", "transportation", "vehicle" ]
        }, {
            title: "fas fa-suitcase",
            searchTerms: [ "baggage", "luggage", "move", "suitcase", "travel", "trip" ]
        }, {
            title: "fas fa-suitcase-rolling",
            searchTerms: []
        }, {
            title: "fas fa-sun",
            searchTerms: [ "brighten", "contrast", "day", "lighter", "sol", "solar", "star", "weather" ]
        }, {
            title: "far fa-sun",
            searchTerms: [ "brighten", "contrast", "day", "lighter", "sol", "solar", "star", "weather" ]
        }, {
            title: "fab fa-superpowers",
            searchTerms: []
        }, {
            title: "fas fa-superscript",
            searchTerms: [ "exponential" ]
        }, {
            title: "fab fa-supple",
            searchTerms: []
        }, {
            title: "fas fa-surprise",
            searchTerms: [ "emoticon", "face", "shocked" ]
        }, {
            title: "far fa-surprise",
            searchTerms: [ "emoticon", "face", "shocked" ]
        }, {
            title: "fas fa-swatchbook",
            searchTerms: []
        }, {
            title: "fas fa-swimmer",
            searchTerms: [ "athlete", "head", "man", "person", "water" ]
        }, {
            title: "fas fa-swimming-pool",
            searchTerms: [ "ladder", "recreation", "water" ]
        }, {
            title: "fas fa-synagogue",
            searchTerms: [ "building", "jewish", "judaism", "star of david", "temple" ]
        }, {
            title: "fas fa-sync",
            searchTerms: [ "exchange", "refresh", "reload", "rotate", "swap" ]
        }, {
            title: "fas fa-sync-alt",
            searchTerms: [ "refresh", "reload", "rotate" ]
        }, {
            title: "fas fa-syringe",
            searchTerms: [ "immunizations", "needle" ]
        }, {
            title: "fas fa-table",
            searchTerms: [ "data", "excel", "spreadsheet" ]
        }, {
            title: "fas fa-table-tennis",
            searchTerms: []
        }, {
            title: "fas fa-tablet",
            searchTerms: [ "apple", "device", "ipad", "kindle", "screen" ]
        }, {
            title: "fas fa-tablet-alt",
            searchTerms: [ "apple", "device", "ipad", "kindle", "screen" ]
        }, {
            title: "fas fa-tablets",
            searchTerms: [ "drugs", "medicine" ]
        }, {
            title: "fas fa-tachometer-alt",
            searchTerms: [ "dashboard", "tachometer" ]
        }, {
            title: "fas fa-tag",
            searchTerms: [ "label" ]
        }, {
            title: "fas fa-tags",
            searchTerms: [ "labels" ]
        }, {
            title: "fas fa-tape",
            searchTerms: []
        }, {
            title: "fas fa-tasks",
            searchTerms: [ "downloading", "downloads", "loading", "progress", "settings" ]
        }, {
            title: "fas fa-taxi",
            searchTerms: [ "cab", "cabbie", "car", "car service", "lyft", "machine", "transportation", "uber", "vehicle" ]
        }, {
            title: "fab fa-teamspeak",
            searchTerms: []
        }, {
            title: "fas fa-teeth",
            searchTerms: []
        }, {
            title: "fas fa-teeth-open",
            searchTerms: []
        }, {
            title: "fab fa-telegram",
            searchTerms: []
        }, {
            title: "fab fa-telegram-plane",
            searchTerms: []
        }, {
            title: "fas fa-temperature-high",
            searchTerms: [ "mercury", "thermometer", "warm" ]
        }, {
            title: "fas fa-temperature-low",
            searchTerms: [ "cool", "mercury", "thermometer" ]
        }, {
            title: "fab fa-tencent-weibo",
            searchTerms: []
        }, {
            title: "fas fa-terminal",
            searchTerms: [ "code", "command", "console", "prompt" ]
        }, {
            title: "fas fa-text-height",
            searchTerms: []
        }, {
            title: "fas fa-text-width",
            searchTerms: []
        }, {
            title: "fas fa-th",
            searchTerms: [ "blocks", "boxes", "grid", "squares" ]
        }, {
            title: "fas fa-th-large",
            searchTerms: [ "blocks", "boxes", "grid", "squares" ]
        }, {
            title: "fas fa-th-list",
            searchTerms: [ "checklist", "completed", "done", "finished", "ol", "todo", "ul" ]
        }, {
            title: "fab fa-the-red-yeti",
            searchTerms: []
        }, {
            title: "fas fa-theater-masks",
            searchTerms: []
        }, {
            title: "fab fa-themeco",
            searchTerms: []
        }, {
            title: "fab fa-themeisle",
            searchTerms: []
        }, {
            title: "fas fa-thermometer",
            searchTerms: [ "mercury", "status", "temperature" ]
        }, {
            title: "fas fa-thermometer-empty",
            searchTerms: [ "mercury", "status", "temperature" ]
        }, {
            title: "fas fa-thermometer-full",
            searchTerms: [ "fever", "mercury", "status", "temperature" ]
        }, {
            title: "fas fa-thermometer-half",
            searchTerms: [ "mercury", "status", "temperature" ]
        }, {
            title: "fas fa-thermometer-quarter",
            searchTerms: [ "mercury", "status", "temperature" ]
        }, {
            title: "fas fa-thermometer-three-quarters",
            searchTerms: [ "mercury", "status", "temperature" ]
        }, {
            title: "fab fa-think-peaks",
            searchTerms: []
        }, {
            title: "fas fa-thumbs-down",
            searchTerms: [ "disagree", "disapprove", "dislike", "hand", "thumbs-o-down" ]
        }, {
            title: "far fa-thumbs-down",
            searchTerms: [ "disagree", "disapprove", "dislike", "hand", "thumbs-o-down" ]
        }, {
            title: "fas fa-thumbs-up",
            searchTerms: [ "agree", "approve", "favorite", "hand", "like", "ok", "okay", "success", "thumbs-o-up", "yes", "you got it dude" ]
        }, {
            title: "far fa-thumbs-up",
            searchTerms: [ "agree", "approve", "favorite", "hand", "like", "ok", "okay", "success", "thumbs-o-up", "yes", "you got it dude" ]
        }, {
            title: "fas fa-thumbtack",
            searchTerms: [ "coordinates", "location", "marker", "pin", "thumb-tack" ]
        }, {
            title: "fas fa-ticket-alt",
            searchTerms: [ "ticket" ]
        }, {
            title: "fas fa-times",
            searchTerms: [ "close", "cross", "error", "exit", "incorrect", "notice", "notification", "notify", "problem", "wrong", "x" ]
        }, {
            title: "fas fa-times-circle",
            searchTerms: [ "close", "cross", "exit", "incorrect", "notice", "notification", "notify", "problem", "wrong", "x" ]
        }, {
            title: "far fa-times-circle",
            searchTerms: [ "close", "cross", "exit", "incorrect", "notice", "notification", "notify", "problem", "wrong", "x" ]
        }, {
            title: "fas fa-tint",
            searchTerms: [ "drop", "droplet", "raindrop", "waterdrop" ]
        }, {
            title: "fas fa-tint-slash",
            searchTerms: []
        }, {
            title: "fas fa-tired",
            searchTerms: [ "emoticon", "face", "grumpy" ]
        }, {
            title: "far fa-tired",
            searchTerms: [ "emoticon", "face", "grumpy" ]
        }, {
            title: "fas fa-toggle-off",
            searchTerms: [ "switch" ]
        }, {
            title: "fas fa-toggle-on",
            searchTerms: [ "switch" ]
        }, {
            title: "fas fa-toilet-paper",
            searchTerms: [ "bathroom", "halloween", "holiday", "lavatory", "prank", "restroom", "roll" ]
        }, {
            title: "fas fa-toolbox",
            searchTerms: [ "admin", "container", "fix", "repair", "settings", "tools" ]
        }, {
            title: "fas fa-tooth",
            searchTerms: [ "bicuspid", "dental", "molar", "mouth", "teeth" ]
        }, {
            title: "fas fa-torah",
            searchTerms: [ "book", "jewish", "judaism" ]
        }, {
            title: "fas fa-torii-gate",
            searchTerms: [ "building", "shintoism" ]
        }, {
            title: "fas fa-tractor",
            searchTerms: []
        }, {
            title: "fab fa-trade-federation",
            searchTerms: []
        }, {
            title: "fas fa-trademark",
            searchTerms: []
        }, {
            title: "fas fa-traffic-light",
            searchTerms: []
        }, {
            title: "fas fa-train",
            searchTerms: [ "bullet", "locomotive", "railway" ]
        }, {
            title: "fas fa-transgender",
            searchTerms: [ "intersex" ]
        }, {
            title: "fas fa-transgender-alt",
            searchTerms: []
        }, {
            title: "fas fa-trash",
            searchTerms: [ "delete", "garbage", "hide", "remove" ]
        }, {
            title: "fas fa-trash-alt",
            searchTerms: [ "delete", "garbage", "hide", "remove", "trash", "trash-o" ]
        }, {
            title: "far fa-trash-alt",
            searchTerms: [ "delete", "garbage", "hide", "remove", "trash", "trash-o" ]
        }, {
            title: "fas fa-tree",
            searchTerms: [ "bark", "fall", "flora", "forest", "nature", "plant", "seasonal" ]
        }, {
            title: "fab fa-trello",
            searchTerms: []
        }, {
            title: "fab fa-tripadvisor",
            searchTerms: []
        }, {
            title: "fas fa-trophy",
            searchTerms: [ "achievement", "award", "cup", "game", "winner" ]
        }, {
            title: "fas fa-truck",
            searchTerms: [ "delivery", "shipping" ]
        }, {
            title: "fas fa-truck-loading",
            searchTerms: []
        }, {
            title: "fas fa-truck-monster",
            searchTerms: []
        }, {
            title: "fas fa-truck-moving",
            searchTerms: []
        }, {
            title: "fas fa-truck-pickup",
            searchTerms: []
        }, {
            title: "fas fa-tshirt",
            searchTerms: [ "cloth", "clothing" ]
        }, {
            title: "fas fa-tty",
            searchTerms: []
        }, {
            title: "fab fa-tumblr",
            searchTerms: []
        }, {
            title: "fab fa-tumblr-square",
            searchTerms: []
        }, {
            title: "fas fa-tv",
            searchTerms: [ "computer", "display", "monitor", "television" ]
        }, {
            title: "fab fa-twitch",
            searchTerms: []
        }, {
            title: "fab fa-twitter",
            searchTerms: [ "social network", "tweet" ]
        }, {
            title: "fab fa-twitter-square",
            searchTerms: [ "social network", "tweet" ]
        }, {
            title: "fab fa-typo3",
            searchTerms: []
        }, {
            title: "fab fa-uber",
            searchTerms: []
        }, {
            title: "fab fa-uikit",
            searchTerms: []
        }, {
            title: "fas fa-umbrella",
            searchTerms: [ "protection", "rain" ]
        }, {
            title: "fas fa-umbrella-beach",
            searchTerms: [ "protection", "recreation", "sun" ]
        }, {
            title: "fas fa-underline",
            searchTerms: []
        }, {
            title: "fas fa-undo",
            searchTerms: [ "back", "control z", "exchange", "oops", "return", "rotate", "swap" ]
        }, {
            title: "fas fa-undo-alt",
            searchTerms: [ "back", "control z", "exchange", "oops", "return", "swap" ]
        }, {
            title: "fab fa-uniregistry",
            searchTerms: []
        }, {
            title: "fas fa-universal-access",
            searchTerms: []
        }, {
            title: "fas fa-university",
            searchTerms: [ "bank", "institution" ]
        }, {
            title: "fas fa-unlink",
            searchTerms: [ "chain", "chain-broken", "remove" ]
        }, {
            title: "fas fa-unlock",
            searchTerms: [ "admin", "lock", "password", "protect" ]
        }, {
            title: "fas fa-unlock-alt",
            searchTerms: [ "admin", "lock", "password", "protect" ]
        }, {
            title: "fab fa-untappd",
            searchTerms: []
        }, {
            title: "fas fa-upload",
            searchTerms: [ "export", "publish" ]
        }, {
            title: "fab fa-usb",
            searchTerms: []
        }, {
            title: "fas fa-user",
            searchTerms: [ "account", "avatar", "head", "human", "man", "person", "profile" ]
        }, {
            title: "far fa-user",
            searchTerms: [ "account", "avatar", "head", "human", "man", "person", "profile" ]
        }, {
            title: "fas fa-user-alt",
            searchTerms: [ "account", "avatar", "head", "human", "man", "person", "profile" ]
        }, {
            title: "fas fa-user-alt-slash",
            searchTerms: []
        }, {
            title: "fas fa-user-astronaut",
            searchTerms: [ "avatar", "clothing", "cosmonaut", "space", "suit" ]
        }, {
            title: "fas fa-user-check",
            searchTerms: []
        }, {
            title: "fas fa-user-circle",
            searchTerms: [ "account", "avatar", "head", "human", "man", "person", "profile" ]
        }, {
            title: "far fa-user-circle",
            searchTerms: [ "account", "avatar", "head", "human", "man", "person", "profile" ]
        }, {
            title: "fas fa-user-clock",
            searchTerms: []
        }, {
            title: "fas fa-user-cog",
            searchTerms: []
        }, {
            title: "fas fa-user-edit",
            searchTerms: []
        }, {
            title: "fas fa-user-friends",
            searchTerms: []
        }, {
            title: "fas fa-user-graduate",
            searchTerms: [ "cap", "clothing", "commencement", "gown", "graduation", "student" ]
        }, {
            title: "fas fa-user-injured",
            searchTerms: [ "cast", "ouch", "sling" ]
        }, {
            title: "fas fa-user-lock",
            searchTerms: []
        }, {
            title: "fas fa-user-md",
            searchTerms: [ "doctor", "job", "medical", "nurse", "occupation", "profile" ]
        }, {
            title: "fas fa-user-minus",
            searchTerms: [ "delete", "negative", "remove" ]
        }, {
            title: "fas fa-user-ninja",
            searchTerms: [ "assassin", "avatar", "dangerous", "deadly", "sneaky" ]
        }, {
            title: "fas fa-user-plus",
            searchTerms: [ "positive", "sign up", "signup" ]
        }, {
            title: "fas fa-user-secret",
            searchTerms: [ "clothing", "coat", "hat", "incognito", "privacy", "spy", "whisper" ]
        }, {
            title: "fas fa-user-shield",
            searchTerms: []
        }, {
            title: "fas fa-user-slash",
            searchTerms: [ "ban", "remove" ]
        }, {
            title: "fas fa-user-tag",
            searchTerms: []
        }, {
            title: "fas fa-user-tie",
            searchTerms: [ "avatar", "business", "clothing", "formal" ]
        }, {
            title: "fas fa-user-times",
            searchTerms: [ "archive", "delete", "remove", "x" ]
        }, {
            title: "fas fa-users",
            searchTerms: [ "people", "persons", "profiles" ]
        }, {
            title: "fas fa-users-cog",
            searchTerms: []
        }, {
            title: "fab fa-ussunnah",
            searchTerms: []
        }, {
            title: "fas fa-utensil-spoon",
            searchTerms: [ "spoon" ]
        }, {
            title: "fas fa-utensils",
            searchTerms: [ "cutlery", "dinner", "eat", "food", "knife", "restaurant", "spoon" ]
        }, {
            title: "fab fa-vaadin",
            searchTerms: []
        }, {
            title: "fas fa-vector-square",
            searchTerms: [ "anchors", "lines", "object" ]
        }, {
            title: "fas fa-venus",
            searchTerms: [ "female" ]
        }, {
            title: "fas fa-venus-double",
            searchTerms: []
        }, {
            title: "fas fa-venus-mars",
            searchTerms: []
        }, {
            title: "fab fa-viacoin",
            searchTerms: []
        }, {
            title: "fab fa-viadeo",
            searchTerms: []
        }, {
            title: "fab fa-viadeo-square",
            searchTerms: []
        }, {
            title: "fas fa-vial",
            searchTerms: [ "test tube" ]
        }, {
            title: "fas fa-vials",
            searchTerms: [ "lab results", "test tubes" ]
        }, {
            title: "fab fa-viber",
            searchTerms: []
        }, {
            title: "fas fa-video",
            searchTerms: [ "camera", "film", "movie", "record", "video-camera" ]
        }, {
            title: "fas fa-video-slash",
            searchTerms: []
        }, {
            title: "fas fa-vihara",
            searchTerms: [ "buddhism", "buddhist", "building", "monastery" ]
        }, {
            title: "fab fa-vimeo",
            searchTerms: []
        }, {
            title: "fab fa-vimeo-square",
            searchTerms: []
        }, {
            title: "fab fa-vimeo-v",
            searchTerms: [ "vimeo" ]
        }, {
            title: "fab fa-vine",
            searchTerms: []
        }, {
            title: "fab fa-vk",
            searchTerms: []
        }, {
            title: "fab fa-vnv",
            searchTerms: []
        }, {
            title: "fas fa-volleyball-ball",
            searchTerms: []
        }, {
            title: "fas fa-volume-down",
            searchTerms: [ "audio", "lower", "music", "quieter", "sound", "speaker" ]
        }, {
            title: "fas fa-volume-mute",
            searchTerms: []
        }, {
            title: "fas fa-volume-off",
            searchTerms: [ "audio", "music", "mute", "sound" ]
        }, {
            title: "fas fa-volume-up",
            searchTerms: [ "audio", "higher", "louder", "music", "sound", "speaker" ]
        }, {
            title: "fas fa-vote-yea",
            searchTerms: [ "accept", "cast", "election", "politics", "positive", "yes" ]
        }, {
            title: "fas fa-vr-cardboard",
            searchTerms: [ "google", "reality", "virtual" ]
        }, {
            title: "fab fa-vuejs",
            searchTerms: []
        }, {
            title: "fas fa-walking",
            searchTerms: []
        }, {
            title: "fas fa-wallet",
            searchTerms: []
        }, {
            title: "fas fa-warehouse",
            searchTerms: []
        }, {
            title: "fas fa-water",
            searchTerms: []
        }, {
            title: "fab fa-weebly",
            searchTerms: []
        }, {
            title: "fab fa-weibo",
            searchTerms: []
        }, {
            title: "fas fa-weight",
            searchTerms: [ "measurement", "scale", "weight" ]
        }, {
            title: "fas fa-weight-hanging",
            searchTerms: [ "anvil", "heavy", "measurement" ]
        }, {
            title: "fab fa-weixin",
            searchTerms: []
        }, {
            title: "fab fa-whatsapp",
            searchTerms: []
        }, {
            title: "fab fa-whatsapp-square",
            searchTerms: []
        }, {
            title: "fas fa-wheelchair",
            searchTerms: [ "handicap", "person" ]
        }, {
            title: "fab fa-whmcs",
            searchTerms: []
        }, {
            title: "fas fa-wifi",
            searchTerms: []
        }, {
            title: "fab fa-wikipedia-w",
            searchTerms: []
        }, {
            title: "fas fa-wind",
            searchTerms: [ "air", "blow", "breeze", "fall", "seasonal" ]
        }, {
            title: "fas fa-window-close",
            searchTerms: []
        }, {
            title: "far fa-window-close",
            searchTerms: []
        }, {
            title: "fas fa-window-maximize",
            searchTerms: []
        }, {
            title: "far fa-window-maximize",
            searchTerms: []
        }, {
            title: "fas fa-window-minimize",
            searchTerms: []
        }, {
            title: "far fa-window-minimize",
            searchTerms: []
        }, {
            title: "fas fa-window-restore",
            searchTerms: []
        }, {
            title: "far fa-window-restore",
            searchTerms: []
        }, {
            title: "fab fa-windows",
            searchTerms: [ "microsoft" ]
        }, {
            title: "fas fa-wine-bottle",
            searchTerms: [ "alcohol", "beverage", "drink", "glass", "grapes" ]
        }, {
            title: "fas fa-wine-glass",
            searchTerms: [ "alcohol", "beverage", "drink", "grapes" ]
        }, {
            title: "fas fa-wine-glass-alt",
            searchTerms: [ "alcohol", "beverage", "drink", "grapes" ]
        }, {
            title: "fab fa-wix",
            searchTerms: []
        }, {
            title: "fab fa-wizards-of-the-coast",
            searchTerms: [ "Dungeons & Dragons", "d&d", "dnd", "fantasy", "game", "gaming", "tabletop" ]
        }, {
            title: "fab fa-wolf-pack-battalion",
            searchTerms: []
        }, {
            title: "fas fa-won-sign",
            searchTerms: [ "krw" ]
        }, {
            title: "fab fa-wordpress",
            searchTerms: []
        }, {
            title: "fab fa-wordpress-simple",
            searchTerms: []
        }, {
            title: "fab fa-wpbeginner",
            searchTerms: []
        }, {
            title: "fab fa-wpexplorer",
            searchTerms: []
        }, {
            title: "fab fa-wpforms",
            searchTerms: []
        }, {
            title: "fab fa-wpressr",
            searchTerms: [ "rendact" ]
        }, {
            title: "fas fa-wrench",
            searchTerms: [ "fix", "settings", "spanner", "tool", "update" ]
        }, {
            title: "fas fa-x-ray",
            searchTerms: [ "radiological images", "radiology" ]
        }, {
            title: "fab fa-xbox",
            searchTerms: []
        }, {
            title: "fab fa-xing",
            searchTerms: []
        }, {
            title: "fab fa-xing-square",
            searchTerms: []
        }, {
            title: "fab fa-y-combinator",
            searchTerms: []
        }, {
            title: "fab fa-yahoo",
            searchTerms: []
        }, {
            title: "fab fa-yandex",
            searchTerms: []
        }, {
            title: "fab fa-yandex-international",
            searchTerms: []
        }, {
            title: "fab fa-yelp",
            searchTerms: []
        }, {
            title: "fas fa-yen-sign",
            searchTerms: [ "jpy", "money" ]
        }, {
            title: "fas fa-yin-yang",
            searchTerms: [ "daoism", "opposites", "taoism" ]
        }, {
            title: "fab fa-yoast",
            searchTerms: []
        }, {
            title: "fab fa-youtube",
            searchTerms: [ "film", "video", "youtube-play", "youtube-square" ]
        }, {
            title: "fab fa-youtube-square",
            searchTerms: []
        }, {
            title: "fab fa-zhihu",
            searchTerms: []
        } ];
	}

	OCTOPRINT_VIEWMODELS.push({
		construct: taborderViewModel,
		dependencies: ["settingsViewModel", "touchUIViewModel"],
		optional: ["touchUIViewModel"],
		elements: ["#settings_plugin_taborder"]
	});
});
