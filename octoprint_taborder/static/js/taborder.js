$(function() {
	function taborderViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.tabs = ko.observableArray();
		self.selectedTab = ko.observable();
		self.reloadOverlay = undefined;
		self.availableTabs = ko.observableArray();
		self.assignedTabs = ko.computed(function(){
								var tabs = ko.utils.arrayMap(self.tabs(), function(tab) {
										return tab.name();
									});
								return tabs.sort();
							});
		self.unassignedTabs = ko.computed(function() {
								//find out the categories that are missing from uniqueNames
								var differences = ko.utils.compareArrays(self.availableTabs().sort(), self.assignedTabs().sort());
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
		}

		self.onEventSettingsUpdated = function (payload) {
			self.tabs(self.settings.settings.plugins.taborder.tabs());
			self.renderTabs();
		}

		self.onAfterBinding = function(){
			self.renderTabs();
			$('ul#tabs li:not(.dropdown)').each(function(){
				var tabid = $(this).attr('id');
				if(tabid.match(/^(tab_)?(.+)_link$/g)){
					self.availableTabs.push(tabid.replace('temp_link','temperature_link').replace('term_link','terminal_link').replace('gcode_link','gcodeviewer_link').replace(/^(tab_)?(.+)_link$/g,'$2'));
				}
			});
		}

		self.onAllBound = function(allViewModels){
			$(window).resize();
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
					$('li#'+tabid+'_link a,li#tab_'+tabid+'_link a').attr('title',tab.icon_tooltip()).prepend('<i class="fa '+tab.icon()+'" style="color:'+tab.icon_color()+'"></i> ');
				}
			});
		}

		self.onStartup = function(){
			self.renderTabs();
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

		self.removeTab = function(data) {
			self.settings.settings.plugins.taborder.tabs.remove(data);
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		}

		self.move = function(amount, $index) {
			var index = $index();
			var item = self.tabs.splice(index, 1)[0];
			var newIndex = Math.max(index + amount, 0);
			self.settings.settings.plugins.taborder.tabs.splice(newIndex, 0, item);
			self.tabs(self.settings.settings.plugins.taborder.tabs());
		};

		self.moveUp = self.move.bind(self, -1);
		self.moveDown = self.move.bind(self, 1);
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
