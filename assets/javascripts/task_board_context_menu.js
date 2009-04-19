/* redMine - project management software
   Copyright (C) 2006-2008  Jean-Philippe Lang */

var observingContextMenuClick;

TaskBoardContextMenu = Class.create();
TaskBoardContextMenu.prototype = {
	initialize: function (url) {
		this.url = url;

		// prevent selection when using Ctrl/Shit key
		var tables = $$('table.issues');
		for (i=0; i<tables.length; i++) {
			tables[i].onselectstart = function () { return false; } // ie
			tables[i].onmousedown = function () { return false; } // mozilla
		}

		if (!observingContextMenuClick) {
			Event.observe(document, 'click', this.Click.bindAsEventListener(this));
			Event.observe(document, (window.opera ? 'click' : 'contextmenu'), this.RightClick.bindAsEventListener(this));
			observingContextMenuClick = true;
		}
	},
  
	RightClick: function(e) {
		this.hideMenu();
		// do not show the context menu on links
		if (Event.element(e).tagName == 'A') { return; }
		// right-click simulated by Alt+Click with Opera
		if (window.opera && !e.altKey) { return; }
		var li = Event.findElement(e, 'li');
		if (li == document || li == undefined  || !li.hasClassName('hascontextmenu')) { return; }
		Event.stop(e);
		var issue_id= (li.id.split('_').last()) 
		this.showMenu(e,issue_id);
	},

  Click: function(e) {
  	this.hideMenu();
  },
  
  showMenu: function(e,issue_id) {
    var mouse_x = Event.pointerX(e);
    var mouse_y = Event.pointerY(e);
    var render_x = mouse_x;
    var render_y = mouse_y;
    var dims;
    var menu_width;
    var menu_height;
    var window_width;
    var window_height;
    var max_width;
    var max_height;

    $('context-menu').style['left'] = (render_x + 'px');
    $('context-menu').style['top'] = (render_y + 'px');		
    Element.update('context-menu', '');

    new Ajax.Updater({success:'context-menu'}, this.url, 
      {asynchronous:true,
       evalScripts:true,
	   parameters:{"ids[]": issue_id},
       onComplete:function(request){
				 dims = $('context-menu').getDimensions();
				 menu_width = dims.width;
				 menu_height = dims.height;
				 max_width = mouse_x + 2*menu_width;
				 max_height = mouse_y + menu_height;
			
				 var ws = window_size();
				 window_width = ws.width;
				 window_height = ws.height;
			
				 /* display the menu above and/or to the left of the click if needed */
				 if (max_width > window_width) {
				   render_x -= menu_width;
				   $('context-menu').addClassName('reverse-x');
				 } else {
					 $('context-menu').removeClassName('reverse-x');
				 }
				 if (max_height > window_height) {
				   render_y -= menu_height;
				   $('context-menu').addClassName('reverse-y');
				 } else {
					 $('context-menu').removeClassName('reverse-y');
				 }
				 if (render_x <= 0) render_x = 1;
				 if (render_y <= 0) render_y = 1;
				 $('context-menu').style['left'] = (render_x + 'px');
				 $('context-menu').style['top'] = (render_y + 'px');
				 
         Effect.Appear('context-menu', {duration: 0.20});
         if (window.parseStylesheets) { window.parseStylesheets(); } // IE
      }})
  },
  
  hideMenu: function() {
    Element.hide('context-menu');
  }
}