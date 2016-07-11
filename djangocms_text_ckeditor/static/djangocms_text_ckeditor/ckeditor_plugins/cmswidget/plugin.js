(function ($) {
    CKEDITOR.plugins.add('cmswidget', {
        requires: 'widget',
        onLoad: function () {
            CKEDITOR.addCss(
                '.cke_widget_wrapper_force_block{' +
                    'display:block!important;' +
                '}' +
                '.cke_widget_block>.cke_widget_element{' +
                    'display:block!important;' +
                '}'
            );
        },

        init: function (editor) {
            editor.widgets.add('cmswidget', (function widgetDef() {
                return {
                    button: 'CMS Plugin',

                    template:
                        '<cms-plugin style="unset: all">' +
                        '</cms-plugin>',

                    allowedContent: 'cms-plugin[*]',

                    requiredContent: 'cms-plugin',

                    upcast: function (element) {
                        return element.name === 'cms-plugin';
                    },

                    init: function () {
                        var contents = $(this.element.$).children();

                        if (contents.css('display') !== 'inline') {
                            this.wrapper.addClass('cke_widget_wrapper_force_block');
                        }
                    }
                };
            })());
        }
    });
})(CMS.$);
