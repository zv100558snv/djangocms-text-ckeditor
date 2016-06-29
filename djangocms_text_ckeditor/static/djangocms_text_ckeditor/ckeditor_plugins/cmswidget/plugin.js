(function($) {

CKEDITOR.plugins.add('cmswidget', {
    requires: 'widget',

    init: function( editor ) {
        editor.widgets.add( 'cmswidget', {

            button: 'Create a simple box',

            template:
                '<cms-plugin style="unset: all" class="cms-plugin">' +
                '</cms-plugin>',

            allowedContent:
                'cms-plugin(!cms-plugin)',

            requiredContent: 'cms-plugin(cms-plugin)',

            upcast: function( element ) {
                return element.name == 'cms-plugin' && element.hasClass( 'cms-plugin' );
            }
        } );
    }
});

})(CMS.$);
