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
            this.addWidgetDefinition(editor);
            this.setupJustifyCommandHandlers(editor);
        },

        addWidgetDefinition: function (editor) {
            editor.widgets.add('cmswidget', (function widgetDef() {
                return {
                    button: 'CMS Plugin',

                    template:
                        '<cms-plugin style="unset: all">' +
                        '</cms-plugin>',

                    allowedContent: 'cms-plugin',
                    disallowedContent: 'cms-plugin{float}',

                    requiredContent: 'cms-plugin',

                    upcast: function (element) {
                        return element.name === 'cms-plugin';
                    },

                    init: function () {
                        var contents = $(this.element.$).children();

                        if (contents.css('display') !== 'inline') {
                            this.wrapper.addClass('cke_widget_wrapper_force_block');
                        }

                        this.on('select', function () {
                            editor.getCommand('justifyleft').disable();
                            editor.getCommand('justifyright').disable();
                            editor.getCommand('justifycenter').disable();
                        });

                        this.on('deselect', function () {
                            editor.getCommand('justifyleft').enable();
                            editor.getCommand('justifyright').enable();
                            editor.getCommand('justifycenter').enable();
                        });
                    }
                };
            })());
        },

        setupJustifyCommandHandlers: function (editor) {
            var commands = ['left', 'center', 'right'];

            commands.forEach(function (command) {
                var justifyCommand = editor.getCommand('justify' + command);

                if (!justifyCommand) {
                    return;
                }

                var originalRefresh = justifyCommand.refresh.bind(justifyCommand);

                justifyCommand.refresh = function (ckeditor, path) {
                    if (this.state !== CKEDITOR.TRISTATE_DISABLED) {
                        originalRefresh(ckeditor, path);
                    }
                };
            });
        }
    });
})(CMS.$);
