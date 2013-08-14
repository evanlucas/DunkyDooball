var dt;
$(document).ready(function() {
  var socket = io.connect('/')
  dt = $('table').dataTable({
      bProcessing: false
    , bServerSide: true
    , sAjaxSource: '/api/ui/apps'
    , aoColumns: [
        null
      , null
      , null
      , { bSortable: false }
      , null
      , { bSortable: false }
    ]
    , sPaginationType: 'bootstrap'
    , bDeferRender: false
    , fnDrawCallback: function() {
      hideSpinner()
      sortHeaders()
      $('[rel=tooltip]').tooltip()
    }
  })
  
  $('.dtbtngroup').append('<button type="button" class="btn btn-primary btn-create"><i class="icon-plus"></i>   New App</button>')
  
  $('body').on('click', '.btn-stop', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/stop', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 800)
      } else {
        alertify.error('Error stopping app')
        hideSpinner()
      }
    })
    return false;
  })
  
  $('body').on('click', '.btn-install', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/install', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error installing dependencies')
        hideSpinner()
      }
    })
    return false
  })
  
  $('body').on('click', '.btn-update', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/pull', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error updating app')
        hideSpinner()
      }
    })
    return false
  })
  
  $('body').on('click', '.btn-start', function(e) {
    var name = $(this).data('name')
      , self = $(this)
    showSpinner()
    $.post('/api/apps/'+name+'/start', function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error starting app')
        hideSpinner()
      }
    })
    return false
  })
  
  $('body').on('click', '.btn-create', function(e) {
    e.preventDefault()
    $('.createAppModal').modal('show')
  })
  
  $('.btn-save').on('click', function(e) {
    e.preventDefault()
    var url = $('input[name=textUrl]')
    var dir = $('input[name=textDir]')
    var env = $('.selectEnv')
    if (url.val() === "") {
      addErr(url)
      alertify.error('URL is required')
      return false
    }
    rmErr(url)
    
    if (dir.val() === "") {
      addErr(dir)
      alertify.error('Directory is required')
      return false
    }
    rmErr(dir)
    
    if (env.val() === "na") {
      addErr(env)
      alertify.error('Environment is required')
      return false
    }
    rmErr(env)
    showSpinner()
    $.post('/api/apps/create', {
        url: url.val()
      , dir: dir.val()
      , env: env.val()
    }, function(data) {
      if (data.status && data.status === 'success') {
        alertify.success(data.msg)
        setTimeout(function() {
          dt.fnDraw()
        }, 300)
      } else {
        alertify.error('Error creating app')
        hideSpinner()
      }
    })
    
  })
})