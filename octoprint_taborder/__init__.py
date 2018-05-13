# coding=utf-8

import octoprint.plugin
import os

class taborder(octoprint.plugin.AssetPlugin,
				octoprint.plugin.TemplatePlugin,
                octoprint.plugin.SettingsPlugin):
	
	##-- AssetPlugin mixin
	def get_assets(self):
		return dict(js=["js/taborder.js","js/spectrum.js"],
					css=["css/taborder.css","css/font-awesome.min.css","css/spectrum.css"])
		
	##-- Settings mixin
	def get_settings_defaults(self):
		return dict(tabs=[])
		
	def get_settings_version(self):
		return 3
		
	def on_settings_migrate(self, target, current=None):
		if current is None or current < self.get_settings_version():
			# Reset plug settings to defaults.
			self._logger.debug("Resetting TabOrder Tabs to default.")
			self._settings.set(['tabs'], self.get_settings_defaults()["tabs"])
		
	def on_settings_save(self, data):
		flattened_old_tabs = self._settings.global_get(["appearance","components","order","tab"])
		
		flattened_new_tabs = []
		for tab in data["tabs"]:
			flattened_new_tabs.append(tab["name"])
				
		if flattened_old_tabs != flattened_new_tabs:
			self._logger.info("Tab order changed from {flattened_old_tabs} to {flattened_new_tabs} reordering tabs.".format(**locals()))
			self._settings.global_set(["appearance","components","order","tab"],flattened_new_tabs)
			self._plugin_manager.send_plugin_message(self._identifier, dict(reload=True))
			
		octoprint.plugin.SettingsPlugin.on_settings_save(self, data)
	
	##-- Template mixin
	def get_template_configs(self):
		return [dict(type="settings",custom_bindings=True)]

	##~~ Softwareupdate hook
	def get_version(self):
		return self._plugin_version
		
	def get_update_information(self):
		return dict(
			taborder=dict(
				displayName="Tab Order",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="jneilliii",
				repo="OctoPrint-TabOrder",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/jneilliii/OctoPrint-TabOrder/archive/{target_version}.zip"
			)
		)

__plugin_name__ = "Tab Order"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = taborder()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}