(function ($) {
    CKEDITOR.plugins.add('cmsplugins', {

        // Register the icons. They must match command names.
        icons: 'cmsplugins',

        // The plugin initialization logic goes inside this method.
        init: function (editor) {
            var that = this;

            this.options = CMS.CKEditor.options.settings;
            this.editor = editor;

            /**
            * populated with _fresh_ child plugins
            */
            this.child_plugins = [];
            this.setupCancelCleanupCallback(this.options);

            // don't do anything if there are no plugins defined
            if (this.options === undefined || this.options.plugins === undefined) {
                return false;
            }

            this.setupDialog();

            // add the button
            this.editor.ui.add('cmsplugins', CKEDITOR.UI_PANELBUTTON, {
                toolbar: 'cms,0',
                label: this.options.lang.toolbar,
                title: this.options.lang.toolbar,
                className: 'cke_panelbutton__cmsplugins',
                modes: { wysiwyg: 1 },
                editorFocus: 0,

                panel: {
                    css: [CKEDITOR.skin.getPath('editor')].concat(that.editor.config.contentsCss),
                    attributes: { 'role': 'cmsplugins', 'aria-label': this.options.lang.aria }
                },

                // this is called when creating the dropdown list
                onBlock: function (panel, block) {
                    block.element.setHtml(that.editor.plugins.cmsplugins.setupDropdown());

                    var anchors = $(block.element.$).find('.cke_panel_listItem a');

                    anchors.bind('click', function (e) {
                        e.preventDefault();

                        that.addPlugin($(this), panel);
                    });
                }
            });

            // handle edit event via context menu
            if (this.editor.contextMenu) {
                this.setupContextMenu();
            }

            this.editor.addCommand('cmspluginsEdit', {
                exec: function () {
                    var element = that.getElementFromSelection();
                    var plugin = that.getPluginWidget(element);

                    if (plugin) {
                        that.editPlugin(plugin);
                    }
                }
            });

            // handle edit event on double click
            // if event is a jQuery event (touchend), than we mutate
            // event a bit so we make the payload similar to what ckeditor.event produces
            var handleEdit = function (event) {
                var element;

                if (event.type === 'touchend' || event.type === 'click') {
                    // pick cke_widget span
                    // eslint-disable-next-line new-cap
                    element = new CKEDITOR.dom.element($(event.currentTarget).closest('cms-plugin')[0]).getParent();

                    event.data = event.data || {};
                    // have to fake selection to be able to replace markup after editing
                    that.editor.getSelection().fake(element);
                }

                that.editor.execCommand('cmspluginsEdit');
            };

            this.editor.on('doubleclick', handleEdit);
            this.editor.on('instanceReady', function () {
                CMS.$('cms-plugin', CMS.$('iframe.cke_wysiwyg_frame')[0]
                    .contentWindow.document.documentElement).on('click touchend', handleEdit);
            });

            this.setupDataProcessor();
        },

        getElementFromSelection: function () {
            var selection = this.editor.getSelection();
            var element = selection.getSelectedElement() ||
                selection.getCommonAncestor().getAscendant('cms-plugin', true);

            return element;
        },

        getPluginWidget: function (element) {
            if (!element) {
                return null;
            }
            return element.getAscendant('cms-plugin', true) || element.findOne('cms-plugin');
        },

        setupDialog: function () {
            var that = this;
            var definition = function () {
                return {
                    title: '',
                    minWidth: 600,
                    minHeight: 200,
                    contents: [{
                        elements: [
                            {
                                type: 'html',
                                html: '<iframe style="position:static; width:100%; height:100%; border:none;" />'
                            }
                        ]
                    }],
                    onOk: function () {
                        var iframe = $(CKEDITOR.dialog.getCurrent().parts.contents.$).find('iframe').contents();

                        iframe.find('form').submit();

                        // catch the reload event and reattach
                        var reload = CMS.API.Helpers.reloadBrowser;

                        CMS.API.Helpers.reloadBrowser = function () {
                            CKEDITOR.dialog.getCurrent().hide();

                            that.insertPlugin(CMS.API.Helpers.dataBridge);

                            CMS.API.Helpers.reloadBrowser = reload;
                            return false;
                        };
                        return false;
                    }
                };
            };

            // set default definition and open dialog
            CKEDITOR.dialog.add('cmspluginsDialog', definition);
        },

        setupDropdown: function () {
            var tpl = '<div class="cke_panel_block">';

            // loop through the groups
            $.each(this.options.plugins, function (i, group) {
                // add template
                tpl += '<h1 class="cke_panel_grouptitle">' + group.group + '</h1>';
                tpl += '<ul role="presentation" class="cke_panel_list">';
                // loop through the plugins
                $.each(group.items, function (ii, item) {
                    tpl += '<li class="cke_panel_listItem"><a href="#" rel="' + item.type + '">' +
                        item.title + '</a></li>';
                });
                tpl += '</ul>';
            });

            tpl += '</div>';

            return tpl;
        },

        setupContextMenu: function () {
            var that = this;

            this.editor.addMenuGroup('cmspluginsGroup');
            this.editor.addMenuItem('cmspluginsItem', {
                label: this.options.lang.edit,
                icon: this.path + 'icons/cmsplugins.png',
                command: 'cmspluginsEdit',
                group: 'cmspluginsGroup'
            });

            this.editor.removeMenuItem('image');

            this.editor.contextMenu.addListener(function (element) {
                var plugin = that.getPluginWidget(element);

                if (plugin) {
                    return { cmspluginsItem: CKEDITOR.TRISTATE_OFF };
                }
            });
        },

        editPlugin: function (element) {
            var id = element.getAttribute('id');

            this.editor.openDialog('cmspluginsDialog');
            var body = CMS.$(document);

            // now tweak in dynamic stuff
            var dialog = CKEDITOR.dialog.getCurrent();

            dialog.resize(body.width() * 0.8, body.height() * 0.7); // eslint-disable-line no-magic-numbers
            $(dialog.getElement().$).addClass('cms-ckeditor-dialog');
            $(dialog.parts.title.$).text(this.options.lang.edit);
            $(dialog.parts.contents.$).find('iframe').attr('src', '../' + id + '/?_popup=1&no_preview')
                .bind('load', function () {
                    var contents = $(this).contents();

                    contents.find('body').addClass('ckeditor-popup');
                    contents.find('.submit-row').hide();
                    contents.find('#container').css({
                        'min-width': 0,
                        'padding': 0
                    });
                });
        },

        addPlugin: function (item, panel) {
            var that = this;

            // hide the panel
            panel.hide();

            this.editor.focus();
            this.editor.fire('saveSnapshot');

            // gather data
            var data = {
                placeholder_id: this.options.placeholder_id,
                plugin_type: item.attr('rel'),
                plugin_parent: this.options.plugin_id,
                plugin_language: this.options.plugin_language
            };

            that.addPluginDialog(item, data);
        },

        addPluginDialog: function (item, data) {
            var body = $(document);
            // open the dialog
            var selected_text = this.editor.getSelection().getSelectedText();

            this.editor.openDialog('cmspluginsDialog');

            // now tweak in dynamic stuff
            var dialog = CKEDITOR.dialog.getCurrent();

            dialog.resize(body.width() * 0.8, body.height() * 0.7); // eslint-disable-line no-magic-numbers
            $(dialog.getElement().$).addClass('cms-ckeditor-dialog');
            $(dialog.parts.title.$).text(this.options.lang.add);
            $(dialog.parts.contents.$).find('iframe').attr('src', this.options.add_plugin_url + '?' + $.param(data))
                .bind('load', function () {
                    $(this).contents().find('.submit-row').hide().end()
                    .find('#container').css('min-width', 0).css('padding', 0)
                    .find('#id_name').val(selected_text);
                });
        },

        insertPlugin: function (data) {
            var that = this;

            $.ajax({
                method: 'GET',
                url: that.options.render_plugin_url,
                data: {
                    token: that.options.action_token,
                    plugin: data.plugin_id
                }
            }).done(function (res) {
                // in case it's a fresh text plugin children don't have to be
                // deleted separately
                if (!that.options.delete_on_cancel) {
                    that.child_plugins.push(data.plugin_id);
                }

                that.editor.insertHtml(res, 'unfiltered_html');
                that.editor.fire('updateSnapshot');
            });
        },

        /**
        * Sets up cleanup requests. If the plugin itself or child plugin was created and then
        * creation was cancelled - we need to clean up created plugins.
        *
        * @method setupCancelCleanupCallback
        * @public
        * @param {Object} data plugin data
        */
        setupCancelCleanupCallback: function setupCancelCleanupCallback() {
            if (!window.parent || !window.parent.CMS || !window.parent.CMS.API || !window.parent.CMS.API.Helpers) {
                return;
            }
            var that = this;
            var CMS = window.parent.CMS;
            var cancelModalCallback = function cancelModalCallback(e, opts) {
                if (!that.options.delete_on_cancel && !that.child_plugins.length) {
                    return;
                }
                e.preventDefault();
                CMS.API.Toolbar.showLoader();
                var data = {
                    token: that.options.action_token
                };

                if (!that.options.delete_on_cancel) {
                    data.child_plugins = that.child_plugins;
                }
                $.ajax({
                    method: 'POST',
                    url: that.options.cancel_plugin_url,
                    data: data,
                    // use 'child_plugins' instead of default 'child_plugins[]'
                    traditional: true
                }).done(function () {
                    CMS.API.Helpers.removeEventListener('modal-close.text-plugin-' + that.options.plugin_id);
                    opts.instance.close();
                }).fail(function (res) {
                    CMS.API.Messages.open({
                        message: res.responseText + ' | ' + res.status + ' ' + res.statusText,
                        delay: 0,
                        error: true
                    });
                });
            };

            CMS.API.Helpers.addEventListener(
                'modal-close.text-plugin-' + that.options.plugin_id,
                cancelModalCallback
            );
        },

        setupDataProcessor: function () {
            // var that = this;

            // this.editor.dataProcessor.dataFilter.addRules(
            //     {
            //         elements: {
            //             span: function (element) {
            //                 if (CKEDITOR.plugins.widget.isParserWidgetWrapper(element)) {
            //                     console.log(that.editor)
            //                     debugger
            //                     element.addClass('cke_widget_wrapper_force_block');
            //                 }
            //                 return element;
            //             }
            //         }
            //     },
            //     {
            //         applyToAll: true
            //     }
            // );

            // this.editor.dataProcessor.htmlFilter.addRules(
            //     {
            //         elements: {
            //             span: function (element) {
            //                 return element;
            //             }
            //         }
            //     },
            //     {
            //         applyToAll: true
            //     }
            // );
        }
    });
})(CMS.$);
