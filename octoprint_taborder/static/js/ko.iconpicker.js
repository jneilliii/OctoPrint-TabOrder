ko.bindingHandlers.iconpicker = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        //initialize iconpicker with some optional options
        var options = allBindingsAccessor().iconpickerOptions || {};
        $(element).iconpicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function () {
            var observable = valueAccessor();
            observable($(element).iconpicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).iconpicker("destroy");
        });

    },
    //update the control when the view model changes
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).iconpicker("setDate", value);
    }
};