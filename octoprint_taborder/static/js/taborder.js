$(function() {
	function taborderViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.tabs = ko.observableArray();
		self.hidden_tabs = ko.observableArray();
		self.selectedTab = ko.observable();
		self.reloadOverlay = undefined;
		self.availableTabs = ko.observableArray();
		self.assignedTabs = ko.computed(function(){
								var tabs = ko.utils.arrayMap(self.tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabs = ko.computed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.hiddenTabsByID = ko.computed(function(){
								var tabs = ko.utils.arrayMap(self.hidden_tabs(), function(tab) {
										if(tab.name().indexOf('plugin_') > -1){
											return 'tab_' + tab.name() + '_link';
										} else {
											return tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode') + '_link';
										}
									});
								return tabs;
							});
		self.unassignedTabs = ko.computed(function() {
								//find out the categories that are missing from uniqueNames
								var combined_tabs = self.assignedTabs().concat(self.hiddenTabs())
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
		}

		self.onEventSettingsUpdated = function (payload) {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
			self.renderTabs();
		}

		self.onAfterBinding = function(){
			//self.renderTabs();
			$('ul#tabs li:not(.dropdown)').each(function(){
				var tabid = $(this).attr('id');
				if(tabid.match(/^(tab_)?(.+)_link$/g)){
					self.availableTabs.push(tabid.replace('temp_link','temperature_link').replace('term_link','terminal_link').replace('gcode_link','gcodeviewer_link').replace(/^(tab_)?(.+)_link$/g,'$2'));
				}
			});
		}

		self.onAllBound = function(allViewModels){
			self.renderTabs();
		}

		self.renderTabs = function(){
			ko.utils.arrayForEach(self.tabs(), function(tab) {
				var tabid = tab.name().replace('temperature','temp').replace('terminal','term').replace('gcodeviewer','gcode'); // fix for default tab ids not matching links.
				if (!tab.showtext()){
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').text('');
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
				if ($('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').children('i').length > 0) {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).children('i').addClass(tab.icon()).css({'color':tab.icon_color()});
				} else {
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="'+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
		}

		self.onStartupComplete = function(){
			if($('#tabs').data('tabdrop') == undefined){
				$('#tabs').tabdrop({hidden: self.hiddenTabsByID()});
			}
			setTimeout(function(){$(window).resize();},200);
		}

		self.onDataUpdaterPluginMessage = function(plugin, data) {
			if (plugin != "taborder") {
				return;
			}
			if (data.reload) {
				new PNotify({
					title: 'Reload Required',
					text: 'Tab order has changed and a reload of the web interface is required.\n\n<span class="label label-important">After the save operation is complete<\/span> hold down the <span class="label">CTRL<\/span> key on your keyboard and press the <span class="label">F5<\/span> key.\n\n',
					hide: false,
					icon: 'icon icon-refresh',
					addclass: 'taborder-reloadneeded',
					confirm: {
						confirm: true,
						buttons: [{
								text: 'Ok',
								addClass: 'btn',
								click: function(notice) {
											notice.remove();
										}
							},
							{
								text: 'Cancel',
								addClass: 'hidden',
								click: function(notice) {
											notice.remove();
										}
							},

							]
					},
					buttons: {
						closer: false,
						sticker: false
					},
					history: {
						history: false
					}
				});
			};
		};

		self.addMissingTab = function(data) {
			self.settings.settings.plugins.taborder.tabs.push({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'icon_color':ko.observable('#000000'),'icon_tooltip':ko.observable('')});
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		}

		self.addHiddenMissingTab = function(data) {
			self.settings.settings.plugins.taborder.hidden_tabs.push({'name':ko.observable(data),'icon':ko.observable(''),'showtext':ko.observable(true),'icon_color':ko.observable('#000000'),'icon_tooltip':ko.observable('')});
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		}

		self.removeTab = function(data) {
			self.settings.settings.plugins.taborder.tabs.remove(data);
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		}

		self.removeHiddenTab = function(data) {
			self.settings.settings.plugins.taborder.hidden_tabs.remove(data);
			self.hidden_tabs(self.settings.settings.plugins.taborder.hidden_tabs());
		}
	}

	// This is how our plugin registers itself with the application, by adding some configuration
	// information to the global variable OCTOPRINT_VIEWMODELS
	ADDITIONAL_VIEWMODELS.push([
		// This is the constructor to call for instantiating the plugin
		taborderViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		["settingsViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		["#settings_plugin_taborder_form"]
	]);
});
