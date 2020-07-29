# coding=utf-8

import octoprint.plugin
import os

class taborder(octoprint.plugin.AssetPlugin,
				octoprint.plugin.TemplatePlugin,
                octoprint.plugin.SettingsPlugin):

	##-- AssetPlugin mixin
	def get_assets(self):
		return dict(js=["js/bootstrap-tabdrop.js","js/jquery-ui.min.js","js/knockout-sortable.js","js/taborder.js","js/spectrum.js","js/fontawesome-iconpicker.js","js/ko.iconpicker.js"],
					css=["css/taborder.css","css/font-awesome.min.css","css/spectrum.css","css/font-awesome-v4-shims.min.css","css/fontawesome-iconpicker.css"])

	##-- Settings mixin
	def get_settings_defaults(self):
		return dict(tabs=[],hidden_tabs=[])

	def get_settings_version(self):
		return 5

	def on_settings_migrate(self, target, current=None):
		if current is None or current < 3:
			# Reset tab settings to defaults.
			self._logger.debug("Resetting TabOrder Tabs to default.")
			self._settings.set(['tabs'], self.get_settings_defaults()["tabs"])
		elif current == 3:
			updated_tabs = []
			for tab in self._settings.get(["tabs"]):
				icon_new = "fas " + tab["icon"]
				tab["icon"] = icon_new
				tab["usetitle"] = False
				updated_tabs.append(tab)
			self._settings.set(["tabs"], updated_tabs)
		elif current == 4:
			updated_tabs = []
			for tab in self._settings.get(["tabs"]):
				tab["usetitle"] = False
				updated_tabs.append(tab)
			self._settings.set(["tabs"], updated_tabs)

	def on_settings_save(self, data):
		old_tabs = self._settings.get(["tabs"]) + self._settings.get(["hidden_tabs"])

		octoprint.plugin.SettingsPlugin.on_settings_save(self, data)

		new_tabs = self._settings.get(["tabs"]) + self._settings.get(["hidden_tabs"])
		if old_tabs != new_tabs:
			self._logger.info("tabs changed from {old_tabs} to {new_tabs} reordering tabs.".format(**locals()))
			flattened_tabs = []
			for tab in new_tabs:
				flattened_tabs.append(tab["name"])
			self._settings.global_set(["appearance","components","order","tab"],flattened_tabs)

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
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = taborder()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}
