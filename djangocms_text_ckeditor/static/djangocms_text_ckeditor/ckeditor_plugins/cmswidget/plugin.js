(function($) {

CKEDITOR.plugins.add('cmswidget', {
    requires: 'widget',

    init: function( editor ) {
        editor.widgets.add( 'cmswidget', {

            button: 'Create a simple box',

            template:
                '<cms-plugin style="unset: all">' +
                '</cms-plugin>',

            allowedContent:
                'cms-plugin',

            requiredContent: 'cms-plugin',

            upcast: function( element ) {
                return element.name == 'cms-plugin';
            }
        } );
    }
});

})(CMS.$);
