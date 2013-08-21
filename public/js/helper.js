function sortHeaders() {
  $('thead>tr>th').each(function(index, th){
    if ($(th).hasClass('sorting')) {
      $(th).find('i').removeClass('icon-sort-down').removeClass('icon-sort-up').addClass('icon-sort');
    } else if ($(th).hasClass('sorting_desc')) {
      $(th).find('i').removeClass('icon-sort-up').removeClass('icon-sort').addClass('icon-sort-down');
    } else if ($(th).hasClass('sorting_asc')) {
      $(th).find('i').removeClass('icon-sort-down').removeClass('icon-sort').addClass('icon-sort-up');
    }
  });
}



/* Set the defaults for DataTables initialisation */
$.extend( true, $.fn.dataTable.defaults, {
  "sDom": "<'row'<'col-lg-6'ls><'col-lg-6'<'righttopdt'<'dtbtngroup'>r<'clearfix'>>>>t<'row'<'col-lg-6'i><'col-lg-6'p>>",
  "sPaginationType": "bootstrap",
  "oLanguage": {
    "sLengthMenu": '<select class="selectpicker">'+
      '<option value="10">10 records per page</option>'+
      '<option value="25">25 records per page</option>'+
      '<option value="50">50 records per page</option>'+
      '<option value="100">100 records per page</option>'
  }
} );


/* Default class modification */
$.extend( $.fn.dataTableExt.oStdClasses, {
  "sWrapper": "dataTables_wrapper form-inline"
} );


/* API method to get paging information */
$.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
{
  return {
    "iStart":         oSettings._iDisplayStart,
    "iEnd":           oSettings.fnDisplayEnd(),
    "iLength":        oSettings._iDisplayLength,
    "iTotal":         oSettings.fnRecordsTotal(),
    "iFilteredTotal": oSettings.fnRecordsDisplay(),
    "iPage":          oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
    "iTotalPages":    oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
  };
};

/* Bootstrap style pagination control */
$.extend( $.fn.dataTableExt.oPagination, {
  "bootstrap": {
    "fnInit": function( oSettings, nPaging, fnDraw ) {
      var oLang = oSettings.oLanguage.oPaginate;
      var fnClickHandler = function ( e ) {
        e.preventDefault();
        if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
          fnDraw( oSettings );
        }
      };

      $(nPaging).append(
        '<ul class="pagination pagination-right pull-right">'+
          '<li class="prev disabled"><a href="#">&larr; </a></li>'+
          '<li class="next disabled"><a href="#"> &rarr; </a></li>'+
        '</ul>'
      );
      var els = $('a', nPaging);
      $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
      $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
    },

    "fnUpdate": function ( oSettings, fnDraw ) {
      var iListLength = 5;
      var oPaging = oSettings.oInstance.fnPagingInfo();
      var an = oSettings.aanFeatures.p;
      var i, ien, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

      if ( oPaging.iTotalPages < iListLength) {
        iStart = 1;
        iEnd = oPaging.iTotalPages;
      }
      else if ( oPaging.iPage <= iHalf ) {
        iStart = 1;
        iEnd = iListLength;
      } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
        iStart = oPaging.iTotalPages - iListLength + 1;
        iEnd = oPaging.iTotalPages;
      } else {
        iStart = oPaging.iPage - iHalf + 1;
        iEnd = iStart + iListLength - 1;
      }

      for ( i=0, ien=an.length ; i<ien ; i++ ) {
        // Remove the middle elements
        $('li:gt(0)', an[i]).filter(':not(:last)').remove();

        // Add the new list items and their event handlers
        for ( j=iStart ; j<=iEnd ; j++ ) {
          sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
          $('<li '+sClass+'><a href="#">'+j+'</a></li>')
            .insertBefore( $('li:last', an[i])[0] )
            .bind('click', function (e) {
              e.preventDefault();
              oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
              fnDraw( oSettings );
            } );
        }

        // Add / remove disabled classes from the static elements
        if ( oPaging.iPage === 0 ) {
          $('li:first', an[i]).addClass('disabled');
        } else {
          $('li:first', an[i]).removeClass('disabled');
        }

        if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
          $('li:last', an[i]).addClass('disabled');
        } else {
          $('li:last', an[i]).removeClass('disabled');
        }
      }
    }
  }
} );


/*
 * TableTools Bootstrap compatibility
 * Required TableTools 2.1+
 */
if ( $.fn.DataTable.TableTools ) {
  // Set the classes that TableTools uses to something suitable for Bootstrap
  $.extend( true, $.fn.DataTable.TableTools.classes, {
    "container": "DTTT btn-group",
    "buttons": {
      "normal": "btn",
      "disabled": "disabled"
    },
    "collection": {
      "container": "DTTT_dropdown dropdown-menu",
      "buttons": {
        "normal": "",
        "disabled": "disabled"
      }
    },
    "print": {
      "info": "DTTT_print_info modal"
    },
    "select": {
      "row": "active"
    }
  } );

  // Have the collection use a bootstrap compatible dropdown
  $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
    "collection": {
      "container": "ul",
      "button": "li",
      "liner": "a"
    }
  } );
  
  
}

var spinner;
var showSpinner = function() {
  hideSpinner();
  $('.spinner_parent').append('<div id="spinner_holder"></div>');
  var opts = {
      lines: 15
    , length: 19
    , width: 7
    , radius: 11
    , corners: 1
    , rotate: 0
    , trail: 60
    , speed: 1.2
    , top: 0
    , left: -2
    , color: '#fff'
    
  };
  var target = document.getElementById('spinner_holder');
  spinner = new Spinner(opts).spin(target);
};

var hideSpinner = function() {
  if (spinner) {
    $('#spinner_holder').remove();
    spinner.stop();
  }
};

function addErr(t) {
  $(t).closest('.form-group').addClass('has-error')
}

function rmErr(t) {
  $(t).closest('.form-group').removeClass('has-error')
}